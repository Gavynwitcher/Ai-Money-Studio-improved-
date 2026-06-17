"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlaidConnectCard } from "@/components/plaid-connect-card";
import { PageDataState } from "@/components/page-data-state";

type PlaidStatusPayload = {
  configured: boolean;
  configError: string | null;
  connected: boolean;
  connectedItems: number;
  institutions: string[];
  lastSyncedAt: string | null;
  linkedAccounts: number;
  importedTransactions: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  resetRequired?: boolean;
  resetMessage?: string | null;
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

type TransactionsPayload = {
  transactions: PlaidTransactionRow[];
  error?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function transactionBucket(category: string) {
  const value = category.toLowerCase();
  if (value.includes("income") || value.includes("payroll") || value.includes("deposit")) return "Income";
  if (value.includes("transfer")) return "Internal Activity";
  if (value.includes("loan") || value.includes("credit")) return "Credit & Debt";
  if (value.includes("travel")) return "Travel";
  if (value.includes("food") || value.includes("restaurant") || value.includes("grocer")) return "Food & Dining";
  if (value.includes("rent") || value.includes("mortgage") || value.includes("utilities") || value.includes("home"))
    return "Housing & Utilities";
  if (value.includes("software") || value.includes("office") || value.includes("business")) return "Business Ops";
  if (value.includes("shopping") || value.includes("retail")) return "Shopping";
  return "Other";
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function TransactionsWorkspace() {
  const [status, setStatus] = useState<PlaidStatusPayload | null>(null);
  const [transactions, setTransactions] = useState<PlaidTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, txRes] = await Promise.all([
        fetch("/api/plaid/status", { cache: "no-store" }),
        fetch("/api/plaid/transactions", { cache: "no-store" })
      ]);

      const statusPayload = (await statusRes.json()) as PlaidStatusPayload | { error?: string };
      const transactionsPayload = (await txRes.json()) as TransactionsPayload;

      if (!statusRes.ok) {
        throw new Error((statusPayload as { error?: string }).error ?? "Failed to load transaction status");
      }
      if (!txRes.ok) {
        throw new Error(transactionsPayload.error ?? "Failed to load transactions");
      }

      setStatus(statusPayload as PlaidStatusPayload);
      setTransactions(transactionsPayload.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decoratedTransactions = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        bucket: transactionBucket(transaction.category)
      })),
    [transactions]
  );

  const categories = useMemo(() => {
    const values = Array.from(new Set(decoratedTransactions.map((transaction) => transaction.bucket))).sort();
    return ["All", ...values];
  }, [decoratedTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return decoratedTransactions.filter((transaction) => {
      const matchesCategory = selectedCategory === "All" || transaction.bucket === selectedCategory;
      const matchesSearch =
        query.length === 0 ||
        transaction.merchant.toLowerCase().includes(query) ||
        transaction.accountName.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [decoratedTransactions, search, selectedCategory]);

  const metrics = useMemo(() => {
    const inflow = filteredTransactions
      .filter((transaction) => transaction.direction === "inflow")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const outflow = filteredTransactions
      .filter((transaction) => transaction.direction === "outflow")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const topCategories = Object.entries(
      filteredTransactions.reduce<Record<string, number>>((acc, transaction) => {
        if (transaction.direction === "outflow") {
          acc[transaction.bucket] = (acc[transaction.bucket] ?? 0) + transaction.amount;
        }
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      inflow,
      outflow,
      net: inflow - outflow,
      topCategories
    };
  }, [filteredTransactions]);

  if (loading && !status) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading transaction workspace...
      </div>
    );
  }

  if (error) {
    return <PageDataState kind="error" errorCode="TRANSACTIONS_LOAD" errorMessage={error} onRetry={() => void load()} />;
  }

  if (!status?.connected) {
    return (
      <div className="grid gap-5">
        <PlaidConnectCard compact onLinked={() => void load()} />
        <PageDataState kind="plaid_not_connected" onConnect={() => void load()} />
      </div>
    );
  }

  if (status.connected && filteredTransactions.length === 0 && transactions.length === 0) {
    return (
      <div className="grid gap-5">
        <PlaidConnectCard compact onLinked={() => void load()} />
        <PageDataState
          kind="connected_empty"
          emptyMessage="Your institution is connected, but transaction history is still preparing. Run another sync in a minute to refresh categorized activity."
          onSync={() => void load()}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PlaidConnectCard compact onLinked={() => void load()} />

      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#f7fafc_0%,#eef4fb_48%,#ffffff_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Banking activity</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              Categorized transactions across connected institutions
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Review imported activity, search merchants, and understand where cash is moving with category-level rollups
              designed to feel like a real online banking ledger.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Coverage:{" "}
            <span className="font-semibold text-slate-950">
              {status.coverageStart && status.coverageEnd
                ? `${formatDateLabel(status.coverageStart)} to ${formatDateLabel(status.coverageEnd)}`
                : "Awaiting imported range"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cash in</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-700">{formatCurrency(metrics.inflow)}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cash out</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{formatCurrency(metrics.outflow)}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Net flow</p>
            <p className={`mt-3 text-3xl font-semibold ${metrics.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatCurrency(metrics.net)}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Imported rows</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{filteredTransactions.length}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-950">Category rollups</h3>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                Spend analysis
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {metrics.topCategories.length > 0 ? (
                metrics.topCategories.map(([category, amount]) => (
                  <div key={category} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold text-slate-950">{category}</p>
                      <p className="text-base font-semibold text-slate-950">{formatCurrency(amount)}</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#0f2742_0%,#1a8b8d_100%)]"
                        style={{
                          width: `${Math.max(16, Math.min(100, (amount / Math.max(metrics.outflow, 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  Categories will appear here once spending transactions are available.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-950">Transaction ledger</h3>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search merchant, account, or category"
                className="min-w-[220px] flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500"
              />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const active = category === selectedCategory;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-slate-950 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid gap-3 rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-4 md:grid-cols-[1.35fr_0.7fr_0.5fr]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950">{transaction.merchant}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {transaction.bucket} · {transaction.accountName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{formatDateLabel(transaction.date)}</p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">{transaction.category}</p>
                    <p className="mt-1 text-slate-600">{transaction.status}</p>
                  </div>
                  <div
                    className={`flex items-center justify-end text-lg font-semibold ${
                      transaction.direction === "inflow" ? "text-emerald-700" : "text-slate-950"
                    }`}
                  >
                    {transaction.direction === "inflow" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="mt-4 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No transactions match the current filters. Clear the search or choose a different category.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
