"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { PlaidConnectCard, PlaidStatusPayload } from "@/components/plaid-connect-card";
import { PageDataState } from "@/components/page-data-state";
import { getKillSwitchState, KILL_SWITCH_EVENT } from "@/lib/client/killSwitch";

type TransactionSource = "plaid";

type TransactionRow = {
  id: string;
  postedAt: string;
  merchant: string;
  source: TransactionSource;
  category: string;
  amount: number;
  confidence: number;
  recurring: boolean;
  accountName: string;
  accountType: string;
  explanation: string;
  reviewed: boolean;
};

type ApiTransactionRow = Omit<TransactionRow, "source" | "reviewed"> & {
  source?: string;
};

type TransactionsResponse = {
  transactions: ApiTransactionRow[];
};

type TransactionExplainResponse = {
  explanation: string;
};

type AuthStatus = {
  authenticated: boolean;
  signInPath: string;
};

type InboxTab = "Inbox" | "Low confidence" | "Potential transfers" | "Potential duplicates" | "Reviewed";

type PlaidControls = {
  connect: () => void;
  sync: () => void;
  retry: () => void;
};

const INBOX_TABS: InboxTab[] = ["Inbox", "Low confidence", "Potential transfers", "Potential duplicates", "Reviewed"];

function inferErrorCode(message: string) {
  if (message.includes("P1001") || message.includes("ECONNREFUSED") || message.includes("database")) return "DB_UNAVAILABLE";
  if (message.includes("Plaid")) return "PLAID_ERROR";
  return "UNKNOWN";
}

function isUncategorized(category: string) {
  const normalized = category.toLowerCase();
  return normalized.includes("uncategorized") || normalized.includes("unknown") || normalized.includes("general");
}

function isPotentialTransfer(merchant: string, category: string) {
  return /(transfer|payment|venmo|zelle|cash app|paypal|ach)/i.test(`${merchant} ${category}`);
}

function accountGroupMeta(accountType: string) {
  const normalized = accountType.toUpperCase();
  if (normalized.includes("CHECKING")) return { key: "checking", order: 1, label: "Checking" };
  if (normalized.includes("SAVINGS")) return { key: "savings", order: 2, label: "Savings" };
  if (normalized.includes("CREDIT")) return { key: "credit", order: 3, label: "Credit Card" };
  if (normalized.includes("LOAN")) return { key: "loan", order: 4, label: "Loan" };
  if (normalized.includes("INVEST")) return { key: "investment", order: 5, label: "Investment" };
  return { key: "other", order: 6, label: "Other" };
}

function describeTransaction(row: Pick<TransactionRow, "amount" | "category" | "recurring" | "confidence" | "accountName" | "accountType">) {
  const direction = row.amount < 0 ? "Spend" : "Income";
  const classification =
    row.confidence < 0.85 ? "low confidence, review suggested" : row.confidence < 0.95 ? "medium confidence" : "high confidence";
  const cadence = row.recurring
    ? "recurring pattern detected"
    : row.amount < 0
      ? "one-time payment (not recurring)"
      : "one-time deposit (not recurring)";
  return `${direction} in ${row.category} on ${row.accountName} (${accountGroupMeta(row.accountType).label}); ${classification}; ${cadence}.`;
}

export default function TransactionsPage() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dbFallback, setDbFallback] = useState(false);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [tab, setTab] = useState<InboxTab>("Inbox");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [ruleDrafts, setRuleDrafts] = useState<string[]>([]);
  const [plaidStatus, setPlaidStatus] = useState<PlaidStatusPayload | null>(null);
  const [plaidControls, setPlaidControls] = useState<PlaidControls | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [killSwitchPaused, setKillSwitchPaused] = useState(false);
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const handlePlaidLinked = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const [authRes, txRes, paused] = await Promise.all([
          fetch("/api/auth/status", { cache: "no-store" }),
          fetch("/api/money-copilot/transactions?limit=300", { cache: "no-store" }),
          getKillSwitchState().catch(() => false)
        ]);
        const authPayload = (await authRes.json()) as AuthStatus;
        const txPayload = await txRes.json();

        if (!authRes.ok) {
          throw new Error("Failed to resolve auth status");
        }
        if (!canceled) {
          setAuth(authPayload);
          setDbFallback(txRes.headers.get("x-data-source") === "fallback");
          setKillSwitchPaused(paused);
        }

        if (!txRes.ok) {
          throw new Error((txPayload as { error?: string })?.error ?? "Failed to load transactions");
        }

        if (!canceled) {
          const normalizedRows: TransactionRow[] = (txPayload as TransactionsResponse).transactions
            .filter((txn) => txn.source === "plaid")
            .map((txn) => ({
              id: txn.id,
              postedAt: txn.postedAt,
              merchant: txn.merchant,
              source: "plaid",
              category: txn.category,
              amount: txn.amount,
              confidence: txn.confidence,
              recurring: txn.recurring,
              accountName: txn.accountName || "Unknown account",
              accountType: txn.accountType || "OTHER",
              explanation:
                typeof txn.explanation === "string" && txn.explanation.trim().length > 0
                  ? txn.explanation
                  : describeTransaction({
                      amount: txn.amount,
                      category: txn.category,
                      recurring: txn.recurring,
                      confidence: txn.confidence,
                      accountName: txn.accountName || "Unknown account",
                      accountType: txn.accountType || "OTHER"
                    }),
              reviewed: false
            }));
          setRows(normalizedRows);
          setActionError(null);
        }
      } catch (err) {
        if (!canceled) {
          const message = err instanceof Error ? err.message : "Failed to load transactions";
          setError(message);
          setErrorCode(inferErrorCode(message));
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [refreshNonce]);

  useEffect(() => {
    function onKillSwitchChanged(event: Event) {
      const payload = (event as CustomEvent<{ paused?: boolean }>).detail;
      if (payload && typeof payload.paused === "boolean") {
        setKillSwitchPaused(payload.paused);
      }
    }

    window.addEventListener(KILL_SWITCH_EVENT, onKillSwitchChanged as EventListener);
    return () => window.removeEventListener(KILL_SWITCH_EVENT, onKillSwitchChanged as EventListener);
  }, []);

  const duplicateIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = `${row.postedAt}-${row.merchant.toLowerCase()}-${row.amount}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const duplicates = new Set<string>();
    for (const row of rows) {
      const key = `${row.postedAt}-${row.merchant.toLowerCase()}-${row.amount}`;
      if ((counts.get(key) || 0) > 1) {
        duplicates.add(row.id);
      }
    }
    return duplicates;
  }, [rows]);

  const queueRows = useMemo(() => {
    if (tab === "Inbox") {
      return rows.filter((row) => !row.reviewed && isUncategorized(row.category));
    }
    if (tab === "Low confidence") {
      return rows.filter((row) => !row.reviewed && row.confidence < 0.85);
    }
    if (tab === "Potential transfers") {
      return rows.filter((row) => !row.reviewed && isPotentialTransfer(row.merchant, row.category));
    }
    if (tab === "Potential duplicates") {
      return rows.filter((row) => !row.reviewed && duplicateIds.has(row.id));
    }
    return rows.filter((row) => row.reviewed);
  }, [duplicateIds, rows, tab]);

  const accountTypeOptions = useMemo(() => {
    const optionMap = new Map<string, { key: string; label: string; order: number }>();
    for (const row of rows) {
      const meta = accountGroupMeta(row.accountType);
      optionMap.set(meta.key, meta);
    }
    return [
      { key: "all", label: "All account types", order: 0 },
      ...Array.from(optionMap.values()).sort((a, b) => a.order - b.order)
    ];
  }, [rows]);

  const accountOptions = useMemo(() => {
    const filteredByType =
      accountTypeFilter === "all"
        ? queueRows
        : queueRows.filter((row) => accountGroupMeta(row.accountType).key === accountTypeFilter);
    const names = Array.from(new Set(filteredByType.map((row) => row.accountName))).sort((a, b) => a.localeCompare(b));
    return ["all", ...names];
  }, [accountTypeFilter, queueRows]);

  useEffect(() => {
    if (accountFilter === "all") return;
    if (!accountOptions.includes(accountFilter)) {
      setAccountFilter("all");
    }
  }, [accountFilter, accountOptions]);

  const filteredRows = useMemo(() => {
    return queueRows.filter((row) => {
      if (accountTypeFilter !== "all" && accountGroupMeta(row.accountType).key !== accountTypeFilter) {
        return false;
      }
      if (accountFilter !== "all" && row.accountName !== accountFilter) {
        return false;
      }
      return true;
    });
  }, [accountFilter, accountTypeFilter, queueRows]);

  const groupedRows = useMemo(() => {
    const sorted = [...filteredRows].sort((a, b) => {
      const aMeta = accountGroupMeta(a.accountType);
      const bMeta = accountGroupMeta(b.accountType);
      if (aMeta.order !== bMeta.order) return aMeta.order - bMeta.order;

      const nameCompare = a.accountName.localeCompare(b.accountName);
      if (nameCompare !== 0) return nameCompare;

      return b.postedAt.localeCompare(a.postedAt);
    });

    const groups = new Map<string, { label: string; order: number; accountName: string; rows: TransactionRow[] }>();
    for (const row of sorted) {
      const meta = accountGroupMeta(row.accountType);
      const key = `${meta.order}:${row.accountName}:${meta.label}`;
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(key, {
          label: `${meta.label} - ${row.accountName}`,
          order: meta.order,
          accountName: row.accountName,
          rows: [row]
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.accountName.localeCompare(b.accountName);
    });
  }, [filteredRows]);

  useEffect(() => {
    clearSelection();
  }, [accountFilter, accountTypeFilter, tab]);

  const pageState = useMemo(() => {
    if (loading) return null;
    if (auth && !auth.authenticated) return "unauthed" as const;
    if (error) return "error" as const;
    if (dbFallback) return "db_unavailable" as const;
    if (plaidStatus?.configured && !plaidStatus.connected) return "plaid_not_connected" as const;
    if (plaidStatus?.connected && rows.length === 0) return "connected_empty" as const;
    return null;
  }, [auth, dbFallback, error, loading, plaidStatus, rows.length]);

  function clearSelection() {
    setSelectedIds([]);
  }

  function updateSelectedRows(updater: (row: TransactionRow) => TransactionRow | null, message: string) {
    if (selectedIds.length === 0) return;
    setActionError(null);
    setRows((current) =>
      current
        .map((row) => {
          if (!selectedIds.includes(row.id)) return row;
          const updated = updater(row);
          if (!updated) return null;
          return {
            ...updated,
            explanation: describeTransaction(updated)
          };
        })
        .filter((row): row is TransactionRow => Boolean(row))
    );
    setFeedback(message);
    clearSelection();
  }

  async function explainTransactionWithAi(txn: TransactionRow) {
    const contextPrompt = txn.recurring
      ? "Optional context for this transaction explanation:"
      : "Optional context for why this is one-time (example: annual insurance, travel, event):";
    const userContext = typeof window !== "undefined" ? window.prompt(contextPrompt, "") : "";
    if (userContext === null) return;

    try {
      setExplainingId(txn.id);
      setActionError(null);
      setFeedback(null);

      const res = await fetch("/api/ollama/transaction-explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transaction: {
            postedAt: txn.postedAt,
            merchant: txn.merchant,
            category: txn.category,
            amount: txn.amount,
            recurring: txn.recurring,
            confidence: txn.confidence,
            accountName: txn.accountName,
            accountType: txn.accountType
          },
          userContext: userContext.trim() || undefined
        })
      });
      const payload = (await res.json()) as TransactionExplainResponse | { error?: string };
      if (!res.ok) {
        throw new Error((payload as { error?: string }).error ?? "Failed to explain transaction");
      }

      const result = payload as TransactionExplainResponse;
      setRows((current) =>
        current.map((row) => (row.id === txn.id ? { ...row, explanation: result.explanation } : row))
      );
      setFeedback(`AI explanation updated for ${txn.merchant}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to explain transaction");
    } finally {
      setExplainingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Transaction Intelligence</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Transactions Inbox</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          Review imported Plaid transactions, resolve low-confidence rows, and convert noisy feeds into trusted data.
        </p>
      </section>

      <PlaidConnectCard
        compact
        onStatusChange={setPlaidStatus}
        onControlsReady={setPlaidControls}
        onLinked={handlePlaidLinked}
      />

      {loading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading transactions...</section>
      ) : null}

      {pageState ? (
        <PageDataState
          kind={pageState}
          signInPath={auth?.signInPath}
          emptyMessage="No transactions yet. Run Sync now to import your connected account feed."
          errorCode={errorCode}
          errorMessage={error}
          onConnect={plaidControls?.connect}
          onSync={plaidControls?.sync}
          onRetry={() => {
            plaidControls?.retry();
            setRefreshNonce((value) => value + 1);
          }}
        />
      ) : null}

      {feedback ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{feedback}</section>
      ) : null}

      {actionError ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{actionError}</section>
      ) : null}

      {killSwitchPaused ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Kill switch is paused. Bulk transaction automation actions are disabled.
        </section>
      ) : null}

      {!loading && !error && pageState !== "unauthed" ? (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
                {INBOX_TABS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setTab(name);
                      clearSelection();
                    }}
                    className={`rounded-full px-3 py-1.5 ${
                      tab === name ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Selected: {selectedIds.length} | Visible: {filteredRows.length}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Account type:</span>
              {accountTypeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setAccountTypeFilter(option.key);
                    clearSelection();
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${
                    accountTypeFilter === option.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <label className="ml-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="account-filter">
                Account:
              </label>
              <select
                id="account-filter"
                value={accountFilter}
                onChange={(event) => {
                  setAccountFilter(event.target.value);
                  clearSelection();
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All accounts</option>
                {accountOptions
                  .filter((name) => name !== "all")
                  .map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={selectedIds.length === 0 || killSwitchPaused}
                onClick={() => {
                  const category = window.prompt("Category for selected transactions:", "Needs Review");
                  if (!category) return;
                  updateSelectedRows(
                    (row) => ({
                      ...row,
                      category: category.trim(),
                      confidence: Math.max(row.confidence, 0.92),
                      reviewed: true
                    }),
                    `Categorized ${selectedIds.length} transaction(s) as "${category.trim()}".`
                  );
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Categorize
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || killSwitchPaused}
                onClick={() => {
                  updateSelectedRows(
                    (row) => ({
                      ...row,
                      merchant: `${row.merchant} (split)`,
                      reviewed: true
                    }),
                    `Split marker applied to ${selectedIds.length} transaction(s).`
                  );
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Split
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || killSwitchPaused}
                onClick={() => {
                  updateSelectedRows(
                    (row) => ({
                      ...row,
                      category: "Transfer",
                      confidence: Math.max(row.confidence, 0.95),
                      reviewed: true
                    }),
                    `Marked ${selectedIds.length} transaction(s) as transfer.`
                  );
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Mark transfer
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || killSwitchPaused}
                onClick={() => {
                  updateSelectedRows(() => null, `Excluded ${selectedIds.length} transaction(s) from workflow.`);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Exclude
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || killSwitchPaused}
                onClick={() => {
                  const selectedRows = rows.filter((row) => selectedIds.includes(row.id));
                  const drafts = selectedRows.map((row) => `If merchant contains "${row.merchant}", categorize as "${row.category}".`);
                  setRuleDrafts((current) => [...drafts, ...current].slice(0, 8));
                  updateSelectedRows(
                    (row) => ({
                      ...row,
                      reviewed: true
                    }),
                    `Created ${drafts.length} rule draft(s) for review.`
                  );
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Create rule
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all visible rows"
                        checked={
                          filteredRows.length > 0 &&
                          filteredRows.every((row) => selectedIds.includes(row.id))
                        }
                        onChange={(event) => {
                          const visibleIds = filteredRows.map((row) => row.id);
                          setSelectedIds((current) => {
                            if (event.target.checked) {
                              return Array.from(new Set([...current, ...visibleIds]));
                            }
                            const visibleSet = new Set(visibleIds);
                            return current.filter((id) => !visibleSet.has(id));
                          });
                        }}
                      />
                    </th>
                    <th className="px-3 py-3">Posted</th>
                    <th className="px-3 py-3">Account</th>
                    <th className="px-3 py-3">Merchant</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3 text-right">Confidence</th>
                    <th className="px-3 py-3">Recurring</th>
                    <th className="px-3 py-3">Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map((group) => (
                    <Fragment key={`group-${group.label}`}>
                      <tr key={`group-${group.label}`} className="border-t border-slate-200 bg-slate-50">
                        <td colSpan={9} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                          {group.label} ({group.rows.length})
                        </td>
                      </tr>
                      {group.rows.map((txn) => (
                        <tr key={txn.id} className="border-t border-slate-200">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              aria-label={`Select ${txn.merchant}`}
                              checked={selectedIds.includes(txn.id)}
                              onChange={(event) => {
                                setSelectedIds((current) =>
                                  event.target.checked ? [...current, txn.id] : current.filter((id) => id !== txn.id)
                                );
                              }}
                            />
                          </td>
                          <td className="px-3 py-3 text-slate-600">{formatDate(txn.postedAt)}</td>
                          <td className="px-3 py-3 text-slate-700">
                            <p className="font-semibold text-slate-900">{txn.accountName}</p>
                            <p className="text-xs text-slate-500">{accountGroupMeta(txn.accountType).label}</p>
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{txn.merchant}</td>
                          <td className="px-3 py-3 text-slate-700">{txn.category}</td>
                          <td
                            className={`px-3 py-3 text-right font-semibold ${txn.amount < 0 ? "text-rose-700" : "text-emerald-700"}`}
                          >
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700">{formatPercent(txn.confidence * 100)}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                                txn.recurring ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {txn.recurring ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="min-w-[18rem] px-3 py-3 text-xs text-slate-600">
                            <p>{txn.explanation}</p>
                            <button
                              type="button"
                              onClick={() => {
                                void explainTransactionWithAi(txn);
                              }}
                              disabled={explainingId === txn.id}
                              className="mt-2 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              {explainingId === txn.id
                                ? "Explaining..."
                                : txn.recurring
                                  ? "AI explain"
                                  : "AI explain one-off"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  {filteredRows.length === 0 ? (
                    <tr className="border-t border-slate-200">
                      <td colSpan={9} className="px-3 py-8 text-center text-sm text-slate-500">
                        No rows in this queue.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-amber-200 bg-amber-50/90 p-5 text-sm text-amber-900 md:p-6">
              Confidence below 85% should trigger user clarification before applying automation rules.
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
              <h2 className="font-heading text-2xl text-slate-900">Rule Drafts</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {ruleDrafts.length === 0 ? <p>No drafts yet. Use bulk “Create rule” from any queue.</p> : null}
                {ruleDrafts.map((draft, idx) => (
                  <p key={`${draft}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {draft}
                  </p>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
