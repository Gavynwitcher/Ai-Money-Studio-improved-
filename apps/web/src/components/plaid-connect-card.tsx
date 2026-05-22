"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/format";

export type PlaidStatusPayload = {
  configured: boolean;
  configError: string | null;
  mockMode?: boolean;
  environment?: string;
  products?: string[];
  resetRequired?: boolean;
  resetMessage?: string | null;
  connected: boolean;
  connectedItems: number;
  institutions: string[];
  lastSyncedAt: string | null;
  linkedAccounts: number;
  importedTransactions: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  verifiedBankAccounts: number;
  pendingBankAccounts: number;
  tokenizedBankAccounts: number;
  authMethods: string[];
};

type PlaidInstitution = {
  institutionId: string;
  institutionName: string;
  status: "connected" | "syncing";
};

type PlaidAccount = {
  id: string;
  institutionId: string;
  institutionName: string;
  name: string;
  officialName?: string;
  type?: string;
  subtype: string;
  mask: string;
  currentBalance: number;
  availableBalance: number;
};

type PlaidItem = {
  itemId: string;
  institutionId: string;
  institutionName: string;
  billedProducts: string[];
  availableProducts: string[];
  webhook: string | null;
  accessTokenStatus: "stored" | "mock";
};

type PlaidTransactionRow = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  accountName: string;
  date: string;
  direction: "inflow" | "outflow";
  status: "posted" | "pending";
};

type PlaidCreateTokenPayload = {
  linkToken: string;
};

type PlaidExchangePayload = {
  importedAccounts: number;
  importedTransactions: number;
  transactionsReady?: boolean;
  pendingItems?: number;
};

type PlaidSyncPayload = {
  syncedItems: number;
  importedAccounts: number;
  importedTransactions: number;
  transactionsReady?: boolean;
  pendingItems?: number;
  resetRequired?: boolean;
  removedStaleItems?: number;
  message?: string;
};

type PlaidUnlinkPayload = {
  removedItems: number;
  removedAccounts: number;
  removedTransactions: number;
};

type PlaidAccountsPayload = {
  institutions: PlaidInstitution[];
  accounts: PlaidAccount[];
  item: PlaidItem | null;
  error?: string;
};

type PlaidTransactionsPayload = {
  transactions: PlaidTransactionRow[];
  error?: string;
};

type PlaidPublicMetadata = {
  institution?: {
    name?: string | null;
  } | null;
};

type PlaidHandler = {
  open: () => void;
  exit?: () => void;
  destroy?: () => void;
};

type PlaidConfig = {
  token: string;
  onSuccess: (publicToken: string, metadata: PlaidPublicMetadata) => void;
  onExit?: (error: unknown) => void;
};

declare global {
  interface Window {
    Plaid?: {
      create: (config: PlaidConfig) => PlaidHandler;
    };
  }
}

const PLAID_SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

let plaidScriptPromise: Promise<void> | null = null;

function ensurePlaidScriptLoaded() {
  if (typeof window === "undefined") return Promise.reject(new Error("Window is unavailable"));
  if (window.Plaid) return Promise.resolve();
  if (plaidScriptPromise) return plaidScriptPromise;

  plaidScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PLAID_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Plaid script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PLAID_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Plaid script"));
    document.body.appendChild(script);
  });

  return plaidScriptPromise;
}

function formatRelativeTimestamp(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function toMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function coverageLabel(status: PlaidStatusPayload | null) {
  if (!status?.coverageStart || !status?.coverageEnd) return "No imported range yet";
  return `${formatDate(status.coverageStart)} to ${formatDate(status.coverageEnd)}`;
}

function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}

type Props = {
  onLinked?: () => void;
  onStatusChange?: (status: PlaidStatusPayload | null) => void;
  onControlsReady?: (controls: { connect: () => void; sync: () => void; retry: () => void }) => void;
  compact?: boolean;
};

export function PlaidConnectCard({ onLinked, onStatusChange, onControlsReady, compact = false }: Props) {
  const [status, setStatus] = useState<PlaidStatusPayload | null>(null);
  const [institutions, setInstitutions] = useState<PlaidInstitution[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransactionRow[]>([]);
  const [item, setItem] = useState<PlaidItem | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/plaid/status", { cache: "no-store" });
    const payload = (await res.json()) as PlaidStatusPayload | { error?: string };
    if (!res.ok) {
      throw new Error((payload as { error?: string }).error ?? "Failed to load Plaid status");
    }
    const typed = payload as PlaidStatusPayload;
    setStatus(typed);
    onStatusChange?.(typed);
    return typed;
  }, [onStatusChange]);

  const loadDetails = useCallback(async () => {
    setLoadingDetails(true);
    const [accountsRes, transactionsRes] = await Promise.all([
      fetch("/api/plaid/accounts", { cache: "no-store" }),
      fetch("/api/plaid/transactions", { cache: "no-store" })
    ]);

    const accountsPayload = (await accountsRes.json()) as PlaidAccountsPayload;
    const transactionsPayload = (await transactionsRes.json()) as PlaidTransactionsPayload;

    if (!accountsRes.ok) {
      throw new Error(accountsPayload.error ?? "Failed to load Plaid accounts");
    }
    if (!transactionsRes.ok) {
      throw new Error(transactionsPayload.error ?? "Failed to load Plaid transactions");
    }

    setInstitutions(accountsPayload.institutions);
    setAccounts(accountsPayload.accounts);
    setItem(accountsPayload.item);
    setTransactions(transactionsPayload.transactions);
    setLoadingDetails(false);
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        await Promise.all([loadStatus(), loadDetails()]);
      } catch (err) {
        if (!canceled) {
          const message = toMessage(err, "Failed to load Plaid status");
          setError(message);
          onStatusChange?.(null);
        }
      } finally {
        if (!canceled) {
          setLoadingStatus(false);
          setLoadingDetails(false);
        }
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [loadDetails, loadStatus, onStatusChange]);

  const refreshAll = useCallback(async () => {
    const [nextStatus] = await Promise.all([loadStatus(), loadDetails()]);
    return nextStatus;
  }, [loadDetails, loadStatus]);

  const launchPlaid = useCallback(async () => {
    try {
      setLaunching(true);
      setError(null);
      setFeedback(null);

      const tokenRes = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const tokenPayload = (await tokenRes.json()) as PlaidCreateTokenPayload | { error?: string };
      if (!tokenRes.ok) {
        throw new Error((tokenPayload as { error?: string }).error ?? "Failed to create link token");
      }

      await ensurePlaidScriptLoaded();
      if (!window.Plaid) {
        throw new Error("Plaid Link is not available in this browser session");
      }

      const handler = window.Plaid.create({
        token: (tokenPayload as PlaidCreateTokenPayload).linkToken,
        onSuccess: async (publicToken, metadata) => {
          try {
            setLaunching(true);
            const exchangeRes = await fetch("/api/plaid/exchange-public-token", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                publicToken,
                institutionName: metadata.institution?.name ?? null
              })
            });
            const exchangePayload = (await exchangeRes.json()) as PlaidExchangePayload | { error?: string };
            if (!exchangeRes.ok) {
              throw new Error((exchangePayload as { error?: string }).error ?? "Failed to exchange public token");
            }

            const result = exchangePayload as PlaidExchangePayload;
            const nextStatus = await refreshAll();
            const connectedInstitutionCount = nextStatus.connectedItems ?? 0;
            const institutionLabel = `${connectedInstitutionCount} institution${connectedInstitutionCount === 1 ? "" : "s"}`;
            if (result.transactionsReady === false || (result.pendingItems ?? 0) > 0) {
              setFeedback(
                `Connected successfully. Imported ${result.importedAccounts} accounts across ${institutionLabel}. Transactions are still preparing at the newest institution; retry sync in about a minute.`
              );
            } else {
              setFeedback(
                `Connected successfully. Imported ${result.importedAccounts} accounts and ${result.importedTransactions} transactions across ${institutionLabel}.`
              );
            }
            onLinked?.();
          } catch (err) {
            setError(toMessage(err, "Failed to finish bank connection"));
          } finally {
            setLaunching(false);
          }
        },
        onExit: (plaidError) => {
          setLaunching(false);
          if (!plaidError) return;
          if (
            typeof plaidError === "object" &&
            plaidError !== null &&
            "error_message" in plaidError &&
            typeof (plaidError as { error_message?: unknown }).error_message === "string"
          ) {
            setFeedback((plaidError as { error_message: string }).error_message);
          }
        }
      });

      handler.open();
    } catch (err) {
      setError(toMessage(err, "Failed to launch Plaid Link"));
      setLaunching(false);
    }
  }, [onLinked, refreshAll]);

  const syncPlaidData = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      setFeedback(null);

      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const payload = (await res.json()) as PlaidSyncPayload | { error?: string };
      if (!res.ok) {
        throw new Error((payload as { error?: string }).error ?? "Failed to sync Plaid data");
      }

      const result = payload as PlaidSyncPayload;
      if (result.resetRequired) {
        setFeedback(
          result.message ??
            "We cleared older sandbox-linked items so this workspace matches Plaid production. Reconnect your bank to continue."
        );
        await refreshAll();
        onLinked?.();
        return;
      }
      if (result.transactionsReady === false || (result.pendingItems ?? 0) > 0) {
        setFeedback(
          `Sync started. ${result.pendingItems ?? 1} connected item is still preparing transactions; retry in about a minute.`
        );
      } else {
        setFeedback(
          `Sync complete. Updated ${result.syncedItems} items, ${result.importedAccounts} accounts, and ${result.importedTransactions} transactions.`
        );
      }
      await refreshAll();
      onLinked?.();
    } catch (err) {
      setError(toMessage(err, "Failed to sync Plaid data"));
    } finally {
      setSyncing(false);
    }
  }, [onLinked, refreshAll]);

  const unlinkPlaidData = useCallback(async () => {
    if (!status?.connected) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Unlink all connected Plaid items? This will remove imported Plaid accounts and transactions from this app."
      );
      if (!ok) return;
    }

    try {
      setUnlinking(true);
      setError(null);
      setFeedback(null);

      const res = await fetch("/api/plaid/unlink", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const payload = (await res.json()) as PlaidUnlinkPayload | { error?: string };
      if (!res.ok) {
        throw new Error((payload as { error?: string }).error ?? "Failed to unlink Plaid data");
      }

      const result = payload as PlaidUnlinkPayload;
      setFeedback(
        `Unlinked successfully. Removed ${result.removedItems} items, ${result.removedAccounts} accounts, and ${result.removedTransactions} transactions.`
      );
      await refreshAll();
      onLinked?.();
    } catch (err) {
      setError(toMessage(err, "Failed to unlink Plaid data"));
    } finally {
      setUnlinking(false);
    }
  }, [onLinked, refreshAll, status?.connected]);

  const primaryAction = useMemo(() => {
    if (!status?.configured) {
      return {
        label: loadingStatus ? "Loading..." : "Retry",
        onClick: () => refreshAll(),
        disabled: loadingStatus || launching || syncing || unlinking
      };
    }
    if ((status.connectedItems ?? 0) === 0) {
      return {
        label: launching ? "Opening Plaid..." : "Connect",
        onClick: () => launchPlaid(),
        disabled: loadingStatus || launching || syncing || unlinking
      };
    }
    if ((status.importedTransactions ?? 0) === 0) {
      return {
        label: launching ? "Opening Plaid..." : "Refresh Link",
        onClick: () => launchPlaid(),
        disabled: loadingStatus || launching || syncing || unlinking
      };
    }
    return {
      label: syncing ? "Syncing..." : "Sync now",
      onClick: () => syncPlaidData(),
      disabled: loadingStatus || launching || syncing || unlinking
    };
  }, [launchPlaid, loadingStatus, status, syncing, launching, syncPlaidData, unlinking, refreshAll]);

  const modeLabel = status?.environment ? status.environment.toUpperCase() : "LIVE";
  const productLabel = status?.products?.length ? status.products.join(", ") : "transactions";
  const connectionLabel = loadingStatus
    ? "Loading..."
    : !status?.connected
      ? "Ready to connect"
      : (status.importedTransactions ?? 0) > 0
        ? "Accounts connected"
        : "Syncing activity";
  const syncLabel = loadingStatus ? "-" : formatRelativeTimestamp(status?.lastSyncedAt ?? null);
  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const availableBalance = accounts.reduce((sum, account) => sum + account.availableBalance, 0);
  const primaryInstitution = institutions[0]?.institutionName ?? status?.institutions?.[0] ?? "No institution linked yet";
  const connectedInstitutionCount = status?.connectedItems ?? 0;
  const canManageConnections =
    !loadingStatus && !launching && !syncing && !unlinking && Boolean(status?.configured);
  const addInstitutionLabel = connectedInstitutionCount === 0 ? "Connect first bank" : "Add another bank";
  const transactionsImported = transactions.length || status?.importedTransactions || 0;
  const linkedAccountCount = accounts.length || status?.linkedAccounts || 0;
  const activeProducts = status?.products?.length ?? 0;
  const connectionStage = !status?.connected ? 1 : transactionsImported > 0 ? 3 : 2;
  const nextActionLabel = !status?.connected
    ? "Connect your first institution to begin importing balances and activity."
    : transactionsImported > 0
      ? "Your connected institutions are live. Add another bank or refresh balances anytime."
      : "Your institution is linked. Run a sync to pull balances and historical activity into Northline.";
  const actionPills = [
    {
      step: "01",
      label: "Link bank",
      detail:
        connectedInstitutionCount > 0
          ? `${pluralize(connectedInstitutionCount, "institution")} connected`
          : "Start a new Plaid Link session"
    },
    {
      step: "02",
      label: "Import balances",
      detail:
        linkedAccountCount > 0 ? `${pluralize(linkedAccountCount, "account")} imported` : "Bring in checking, savings, and credit lines"
    },
    {
      step: "03",
      label: "Review activity",
      detail:
        transactionsImported > 0
          ? `${pluralize(transactionsImported, "transaction")} ready`
          : "Historical transactions will appear after sync"
    }
  ];

  useEffect(() => {
    onControlsReady?.({
      connect: () => {
        void launchPlaid();
      },
      sync: () => {
        void syncPlaidData();
      },
      retry: () => {
        void refreshAll();
      }
    });
  }, [launchPlaid, onControlsReady, refreshAll, syncPlaidData]);

  return (
    <section
      className={`overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(180deg,#f7fafc_0%,#eef4fb_48%,#ffffff_100%)] shadow-[0_30px_90px_rgba(15,23,42,0.08)] ${
        compact ? "p-5 md:p-6" : "p-6 md:p-7"
      }`}
    >
      <div className="rounded-[28px] bg-[linear-gradient(135deg,#081628_0%,#0f2742_58%,#163d63_100%)] px-6 py-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                Bank Interconnectivity
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                {modeLabel}
              </span>
            </div>
            <h2 className={`mt-4 font-heading ${compact ? "text-3xl" : "text-4xl"} font-semibold tracking-[-0.05em]`}>
              Connect institutions once and manage them from one banking workspace
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Northline keeps account linking, balance imports, and transaction sync in one guided flow so moving from
              first connection to multi-bank visibility feels fast and predictable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(8,22,40,0.18)] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {primaryAction.label}
            </button>
            {connectedInstitutionCount > 0 ? (
              <button
                type="button"
                onClick={() => launchPlaid()}
                disabled={!canManageConnections}
                className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:text-white/40"
              >
                {launching ? "Opening Plaid..." : addInstitutionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={syncPlaidData}
              disabled={!canManageConnections || connectedInstitutionCount === 0}
              className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:text-white/40"
            >
              {syncing ? "Syncing..." : "Refresh balances"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Connection status</p>
                <p className="mt-3 text-2xl font-semibold text-white">{connectionLabel}</p>
                <p className="mt-2 max-w-xl text-sm text-slate-300">{nextActionLabel}</p>
              </div>
              <div className="rounded-[20px] border border-white/12 bg-white/8 px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Last sync</p>
                <p className="mt-2 text-lg font-semibold text-white">{syncLabel}</p>
                <p className="mt-1 text-xs text-slate-300">Coverage {loadingStatus ? "-" : coverageLabel(status)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {actionPills.map((pill, index) => {
                const active = connectionStage >= index + 1;
                return (
                  <div
                    key={pill.step}
                    className={`rounded-[22px] border p-4 ${
                      active ? "border-emerald-300/35 bg-emerald-400/10" : "border-white/10 bg-white/6"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          active ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-white/70"
                        }`}
                      >
                        {pill.step}
                      </span>
                      <p className="text-sm font-semibold text-white">{pill.label}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{pill.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Institutions</p>
              <p className="mt-3 text-3xl font-semibold text-white">{loadingStatus ? "..." : connectedInstitutionCount}</p>
              <p className="mt-2 text-sm text-slate-300">{primaryInstitution}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Linked accounts</p>
              <p className="mt-3 text-3xl font-semibold text-white">{loadingDetails ? "..." : linkedAccountCount}</p>
              <p className="mt-2 text-sm text-slate-300">Available cash {loadingDetails ? "..." : formatCurrency(availableBalance)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Activity imported</p>
              <p className="mt-3 text-3xl font-semibold text-white">{loadingDetails ? "..." : transactionsImported}</p>
              <p className="mt-2 text-sm text-slate-300">Products: {productLabel} · {activeProducts || 1} active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_15px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Institution snapshot</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Connected banking relationships</h3>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              {status?.configured ? "Server configured" : "Setup needed"}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Connected banks</p>
                {connectedInstitutionCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => launchPlaid()}
                    disabled={!canManageConnections}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {addInstitutionLabel}
                  </button>
                ) : null}
              </div>
              {institutions.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {institutions.map((entry) => (
                    <span
                      key={entry.institutionId}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          entry.status === "connected" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      {entry.institutionName}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-lg font-semibold text-slate-950">Use Plaid Link to connect your first institution</p>
              )}
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each Plaid Link session adds another institution without interrupting the banks that are already connected.
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Connection health</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                Verified {status?.verifiedBankAccounts ?? 0} · Pending {status?.pendingBankAccounts ?? 0}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tokenized accounts: {status?.tokenizedBankAccounts ?? 0}
                {status?.authMethods?.length ? ` · Auth method: ${status.authMethods.join(", ")}` : ""}
              </p>
              {connectedInstitutionCount > 0 ? (
                <button
                  type="button"
                  onClick={unlinkPlaidData}
                  disabled={!canManageConnections}
                  className="mt-4 rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 disabled:cursor-not-allowed disabled:text-rose-300"
                >
                  {unlinking ? "Unlinking..." : "Disconnect all"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_15px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Banking snapshot</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Linked account balances</h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {loadingDetails ? "Loading ledger" : `${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total balance</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{loadingDetails ? "..." : formatCurrency(totalBalance)}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Available cash</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{loadingDetails ? "..." : formatCurrency(availableBalance)}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Primary item</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{loadingDetails ? "..." : item?.institutionName ?? "No item linked"}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {loadingDetails ? (
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading connected accounts...
              </div>
            ) : accounts.length > 0 ? (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-950">{account.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {account.institutionName} · {account.subtype.replace(/_/g, " ")} · •••• {account.mask}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-950">{formatCurrency(account.currentBalance)}</p>
                    <p className="mt-1 text-sm text-slate-600">Available {formatCurrency(account.availableBalance)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Your institution is connected. Once account data is imported, linked balances will appear here automatically.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_15px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Activity feed</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Recent transactions</h3>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              {loadingDetails ? "Loading" : `${transactions.length} imported`}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {loadingDetails ? (
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading transaction activity...
              </div>
            ) : transactions.length > 0 ? (
              transactions.slice(0, 8).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950">{transaction.merchant}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {transaction.category} · {transaction.accountName} · {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 text-right text-base font-semibold ${
                      transaction.direction === "inflow" ? "text-emerald-700" : "text-slate-950"
                    }`}
                  >
                    {transaction.direction === "inflow" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                The bank connection is active, but transaction history has not populated yet. That usually means the institution
                is still preparing historical data. Try <span className="font-semibold text-slate-950">Manual Sync</span> again in a minute.
              </div>
            )}
          </div>

          {item ? (
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#fcfdff_0%,#f6f8fb_100%)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Link metadata</p>
              <p className="mt-2 text-sm text-slate-700">
                Item: <span className="font-semibold text-slate-950">{item.institutionName}</span> · Products:{" "}
                <span className="font-semibold text-slate-950">{item.availableProducts.join(", ")}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">Access token status: {item.accessTokenStatus}</p>
            </div>
          ) : null}
        </div>
      </div>

      {!loadingStatus && status?.resetRequired && status?.resetMessage ? (
        <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          {status.resetMessage}
        </div>
      ) : null}

      {!loadingStatus && !status?.configured && status?.configError ? (
        <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          Plaid setup needed: {status.configError}. Add `PLAID_CLIENT_ID` and `PLAID_SECRET` in your environment.
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">{error}</div>
      ) : null}
    </section>
  );
}
