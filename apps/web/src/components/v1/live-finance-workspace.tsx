"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";

type View = "dashboard" | "accounts" | "cash-flow" | "insights" | "settings";

type PlaidStatusPayload = {
  connected: boolean;
  connectedItems: number;
  institutions: string[];
  lastSyncedAt: string | null;
  linkedAccounts: number;
  importedTransactions: number;
  coverageStart: string | null;
  coverageEnd: string | null;
};

type PlaidAccount = {
  id: string;
  institutionId: string;
  institutionName: string;
  name: string;
  type?: string;
  subtype: string;
  mask: string;
  currentBalance: number;
  availableBalance: number;
};

type PlaidTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  accountName: string;
  date: string;
  direction: "inflow" | "outflow";
  status: "posted" | "pending" | string;
};

type AccountsPayload = {
  institutions?: Array<{ institutionId: string; institutionName: string; status: string }>;
  accounts?: PlaidAccount[];
  error?: string;
};

type TransactionsPayload = {
  transactions?: PlaidTransaction[];
  error?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function isIncome(transaction: PlaidTransaction) {
  return transaction.direction === "inflow";
}

function byAmountDesc(a: PlaidTransaction, b: PlaidTransaction) {
  return Math.abs(b.amount) - Math.abs(a.amount);
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <Card className="rounded-[30px] border-dashed bg-white/80">
      <Badge tone="teal">Read-only v1</Badge>
      <h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--navy)]">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{copy}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="/plaid-integration">Connect accounts</Button>
        <Button href="/contact" variant="secondary">
          Contact support
        </Button>
      </div>
    </Card>
  );
}

export function LiveFinanceWorkspace({ view = "dashboard" }: { view?: View }) {
  const [status, setStatus] = useState<PlaidStatusPayload | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reservePercent, setReservePercent] = useState(25);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [statusRes, accountsRes, transactionsRes] = await Promise.all([
          fetch("/api/plaid/status", { cache: "no-store" }),
          fetch("/api/plaid/accounts", { cache: "no-store" }),
          fetch("/api/plaid/transactions", { cache: "no-store" })
        ]);

        const statusPayload = (await statusRes.json().catch(() => ({}))) as PlaidStatusPayload & { error?: string };
        const accountsPayload = (await accountsRes.json().catch(() => ({}))) as AccountsPayload;
        const transactionsPayload = (await transactionsRes.json().catch(() => ({}))) as TransactionsPayload;

        if (!statusRes.ok) throw new Error(statusPayload.error || "Could not load connection status.");
        if (!accountsRes.ok) throw new Error(accountsPayload.error || "Could not load connected accounts.");
        if (!transactionsRes.ok) throw new Error(transactionsPayload.error || "Could not load imported transactions.");

        if (active) {
          setStatus(statusPayload);
          setAccounts(Array.isArray(accountsPayload.accounts) ? accountsPayload.accounts : []);
          setTransactions(Array.isArray(transactionsPayload.transactions) ? transactionsPayload.transactions : []);
        }
      } catch (nextError) {
        if (active) setError(nextError instanceof Error ? nextError.message : "Could not load Northline data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const cutoff = daysAgo(30);
    const recent30 = transactions.filter((transaction) => new Date(transaction.date) >= cutoff);
    const inflow = recent30.filter(isIncome).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const outflow = recent30.filter((transaction) => !isIncome(transaction)).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const categories = new Map<string, number>();
    const merchants = new Map<string, number>();

    for (const transaction of recent30) {
      if (!isIncome(transaction)) {
        categories.set(transaction.category, (categories.get(transaction.category) || 0) + Math.abs(transaction.amount));
      }
      merchants.set(transaction.merchant, (merchants.get(transaction.merchant) || 0) + 1);
    }

    const recurringCandidates = [...merchants.entries()]
      .filter(([, count]) => count > 1)
      .map(([merchant]) => merchant)
      .slice(0, 6);
    const topCategories = [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const largest = [...recent30].sort(byAmountDesc).slice(0, 6);
    const income = transactions.filter(isIncome).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      inflow,
      outflow,
      net: inflow - outflow,
      topCategories,
      largest,
      recurringCandidates,
      taxReserveEstimate: income * (reservePercent / 100)
    };
  }, [reservePercent, transactions]);

  if (loading) {
    return (
      <Card className="rounded-[30px]">
        <p className="text-sm font-semibold text-[var(--navy)]">Loading live Northline data...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-[30px] border-[rgba(178,67,67,0.22)] bg-[rgba(178,67,67,0.06)]">
        <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">We could not load your read-only workspace.</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--danger)]">{error}</p>
      </Card>
    );
  }

  const noConnectedAccounts = !status?.connected || accounts.length === 0;
  const noTransactions = transactions.length === 0;

  if (noConnectedAccounts) {
    return (
      <EmptyState
        title="Connect accounts to activate your read-only command center."
        copy="Northline uses permissioned Plaid connections to show supported account and transaction information. Northline does not hold funds or initiate banking actions."
      />
    );
  }

  if (view === "accounts" || view === "settings") {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <Card className="rounded-[30px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="teal">{accounts.length} accounts</Badge>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Connected institutions
              </h2>
            </div>
            <Button href="/plaid-integration" variant="secondary">
              Manage connections
            </Button>
          </div>
          <div className="mt-6 grid gap-3">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-[24px] border border-[var(--line)] bg-white/85 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{account.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {account.institutionName} · {account.subtype} · •••• {account.mask}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--navy)]">{currency(account.currentBalance)}</p>
                    <p className="text-xs text-[var(--muted)]">Read-only balance</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[30px]">
          <Badge tone="gold">Permissions</Badge>
          <h3 className="mt-4 font-heading text-2xl font-semibold text-[var(--navy)]">Your data controls</h3>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
            <p>Bank login is handled through Plaid. Northline does not store bank usernames or passwords.</p>
            <p>Northline v1 uses account and transaction data for read-only visibility and informational insights.</p>
            <p>Last sync: {formatDate(status?.lastSyncedAt)}</p>
            <p>Data deletion or account deletion requests can be submitted through support.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/plaid-integration" variant="secondary">
              Disconnect or refresh
            </Button>
            <Button href="/contact" variant="secondary">
              Support
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (view === "cash-flow") {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <MetricCard title="30-day inflow" value={currency(metrics.inflow)} />
        <MetricCard title="30-day outflow" value={currency(metrics.outflow)} />
        <MetricCard title="Net cash flow" value={currency(metrics.net)} tone={metrics.net >= 0 ? "positive" : "caution"} />
        <Card className="rounded-[30px] lg:col-span-2">
          <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Top spending categories</h2>
          <div className="mt-5 grid gap-3">
            {metrics.topCategories.length ? metrics.topCategories.map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between rounded-[20px] border border-[var(--line)] bg-white/80 px-4 py-3">
                <span className="font-medium text-[var(--navy)]">{category}</span>
                <span className="font-semibold text-[var(--navy)]">{currency(amount)}</span>
              </div>
            )) : <p className="text-sm text-[var(--muted)]">Spending categories appear after transactions are imported.</p>}
          </div>
        </Card>
        <Card className="rounded-[30px]">
          <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Tax reserve estimate</h2>
          <label className="mt-5 grid gap-2 text-sm font-medium text-[var(--navy)]">
            Reserve percentage
            <input
              value={reservePercent}
              onChange={(event) => setReservePercent(Number(event.target.value) || 0)}
              inputMode="decimal"
              className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3"
            />
          </label>
          <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
            {currency(metrics.taxReserveEstimate)}
          </p>
          <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
            This is not tax advice. Consult a tax professional before making tax decisions.
          </p>
        </Card>
      </div>
    );
  }

  if (view === "insights") {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Card className="rounded-[30px]">
          <Badge tone="teal">What changed</Badge>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">Transaction insight summary</h2>
          {noTransactions ? (
            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">Import transactions to generate read-only insights.</p>
          ) : (
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p><span className="font-semibold text-[var(--navy)]">Summary:</span> Northline reviewed {transactions.length} imported transactions.</p>
              <p><span className="font-semibold text-[var(--navy)]">What changed:</span> Recent 30-day net cash flow is {currency(metrics.net)}.</p>
              <p><span className="font-semibold text-[var(--navy)]">Why it matters:</span> This can help you decide which categories or merchants deserve manual review.</p>
              <p><span className="font-semibold text-[var(--navy)]">Source data used:</span> Imported Plaid transaction rows only.</p>
              <p><span className="font-semibold text-[var(--navy)]">Confidence:</span> Medium, based on available imported transaction history.</p>
              <p><span className="font-semibold text-[var(--navy)]">Suggested next step:</span> Review the largest recent transactions and recurring candidates below.</p>
            </div>
          )}
          <div className="mt-6">
            <Button href="/assistant">Ask Northline AI</Button>
          </div>
        </Card>
        <Card className="rounded-[30px]">
          <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Recurring candidates</h3>
          <div className="mt-5 grid gap-3">
            {metrics.recurringCandidates.length ? metrics.recurringCandidates.map((merchant) => (
              <div key={merchant} className="rounded-[20px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm font-medium text-[var(--navy)]">
                {merchant}
              </div>
            )) : <p className="text-sm text-[var(--muted)]">No recurring candidates detected yet.</p>}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <MetricCard className="lg:col-span-3" title="Connected institutions" value={String(status?.connectedItems ?? 0)} />
      <MetricCard className="lg:col-span-3" title="Connected accounts" value={String(accounts.length)} />
      <MetricCard className="lg:col-span-3" title="30-day inflow" value={currency(metrics.inflow)} />
      <MetricCard className="lg:col-span-3" title="30-day outflow" value={currency(metrics.outflow)} />

      <Card className="rounded-[30px] lg:col-span-7">
        <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Recent imported transactions</h2>
        <div className="mt-5 grid gap-3">
          {noTransactions ? (
            <p className="text-sm leading-7 text-[var(--muted)]">No imported transactions yet. Connect or refresh a bank to populate this read-only workspace.</p>
          ) : metrics.largest.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between rounded-[22px] border border-[var(--line)] bg-white/85 px-4 py-3">
              <div>
                <p className="font-medium text-[var(--navy)]">{transaction.merchant}</p>
                <p className="text-sm text-[var(--muted)]">{transaction.category} · {transaction.accountName} · {formatDate(transaction.date)}</p>
              </div>
              <p className={isIncome(transaction) ? "font-semibold text-[var(--success)]" : "font-semibold text-[var(--navy)]"}>
                {isIncome(transaction) ? "+" : "-"}{currency(Math.abs(transaction.amount))}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-[30px] lg:col-span-5">
        <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Read-only v1 guardrails</h2>
        <div className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
          <p>Northline does not hold funds or execute banking actions.</p>
          <p>AI insights use imported transaction rows only and should be verified before decisions.</p>
          <p>Northline does not provide tax, legal, investment, credit-repair, or lending advice.</p>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone = "neutral",
  className = ""
}: {
  title: string;
  value: string;
  tone?: "neutral" | "positive" | "caution";
  className?: string;
}) {
  const color = tone === "positive" ? "text-[var(--success)]" : tone === "caution" ? "text-amber-700" : "text-[var(--navy)]";
  return (
    <Card className={`rounded-[30px] ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">{title}</p>
      <p className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
    </Card>
  );
}
