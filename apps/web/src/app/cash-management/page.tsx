"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { PageDataState } from "@/components/page-data-state";

type AuthStatus = {
  authenticated: boolean;
  signInPath: string;
};

type OverviewResponse = {
  status: {
    configured: boolean;
    connected: boolean;
    environment: string;
    merchantId: string | null;
    merchantName: string | null;
    scopes: string[];
    lastSyncedAt: string | null;
    locations: number;
    bankAccounts: number;
    payments: number;
    configError?: string | null;
  };
  summary: {
    grossVolume: number;
    refunds: number;
    fees: number;
    netCaptured: number;
    payoutsSettled: number;
    pendingSettlement: number;
    transferPending: number;
  };
  locations: Array<{
    id: string;
    name: string;
    status: string | null;
    currency: string;
    timezone: string | null;
    country: string | null;
  }>;
  linkedBankAccounts: Array<{
    id: string;
    bankName: string;
    accountType: string | null;
    routingSuffix: string | null;
    accountSuffix: string | null;
    status: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    kind: string;
    title: string;
    amount: number;
    grossAmount: number;
    subtitle: string;
    occurredAt: string;
    status: string;
  }>;
  transferRequests: Array<{
    id: string;
    fromSource: string;
    toSource: string;
    amount: number;
    currency: string;
    purpose: string;
    status: string;
    executionRail: string;
    squareReferenceId: string | null;
    scheduledFor: string | null;
    executedAt: string | null;
    createdAt: string;
  }>;
};

type TransferDraft = {
  fromSource: string;
  toSource: string;
  amount: string;
  purpose: string;
  scheduledFor: string;
};

const EMPTY_DRAFT: TransferDraft = {
  fromSource: "Square Balance",
  toSource: "",
  amount: "",
  purpose: "",
  scheduledFor: ""
};

function inferErrorCode(message: string) {
  if (message.includes("P1001") || message.includes("ECONNREFUSED") || message.includes("database")) return "DB_UNAVAILABLE";
  if (message.includes("Square")) return "SQUARE_ERROR";
  return "UNKNOWN";
}

function formatDateTime(value: string | null) {
  if (!value) return "Not synced yet";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function amountClass(value: number) {
  return value >= 0 ? "text-emerald-700" : "text-rose-700";
}

export default function CashManagementPage() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dbFallback, setDbFallback] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [draft, setDraft] = useState<TransferDraft>(EMPTY_DRAFT);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("square");
    if (state === "connected") setBanner("Square connected. Run a sync to refresh merchant balances, payouts, and payments.");
    if (state === "denied") setBanner("Square authorization was cancelled before connection completed.");
    if (state === "state-error") setBanner("Square OAuth validation failed. Start the connection flow again.");
    if (state === "exchange-error") setBanner("Square returned to the app, but token exchange failed.");
    if (state === "config-error") setBanner("Square is not configured yet. Add the required app credentials first.");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cancelled) {
        setLoading(true);
        setError(null);
        setErrorCode(null);
      }

      try {
        const [authRes, overviewRes] = await Promise.all([
          fetch("/api/auth/status", { cache: "no-store" }),
          fetch("/api/square/overview", { cache: "no-store" })
        ]);
        const authPayload = (await authRes.json()) as AuthStatus;
        const overviewPayload = (await overviewRes.json()) as OverviewResponse | { error?: string };

        if (!authRes.ok) {
          throw new Error("Failed to resolve auth status");
        }

        if (!overviewRes.ok) {
          const overviewError = (overviewPayload as { error?: string }).error;
          throw new Error(overviewError || "Failed to load Square overview");
        }

        if (!cancelled) {
          setAuth(authPayload);
          setData(overviewPayload as OverviewResponse);
          setDbFallback(overviewRes.headers.get("x-data-source") === "fallback");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load Square overview";
          setError(message);
          setErrorCode(inferErrorCode(message));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshNonce]);

  const pageState = useMemo(() => {
    if (loading) return null;
    if (auth && !auth.authenticated) return "unauthed" as const;
    if (error) return "error" as const;
    if (dbFallback) return "db_unavailable" as const;
    return null;
  }, [auth, dbFallback, error, loading]);

  const sourceOptions = useMemo(() => {
    const bankOptions = (data?.linkedBankAccounts || []).map((account) => ({
      value: `${account.bankName}${account.accountSuffix ? ` • ${account.accountSuffix}` : ""}`,
      label: `${account.bankName}${account.accountSuffix ? ` ending ${account.accountSuffix}` : ""}`
    }));
    return [
      { value: "Square Balance", label: "Square Balance" },
      ...bankOptions
    ];
  }, [data?.linkedBankAccounts]);

  async function syncNow() {
    setSyncing(true);
    setBanner(null);
    try {
      const response = await fetch("/api/square/sync", {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Square sync failed");
      }
      setBanner("Square sync completed.");
      setRefreshNonce((value) => value + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Square sync failed";
      setError(message);
      setErrorCode(inferErrorCode(message));
    } finally {
      setSyncing(false);
    }
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingTransfer(true);
    setBanner(null);

    try {
      const response = await fetch("/api/square/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fromSource: draft.fromSource,
          toSource: draft.toSource,
          amount: Number(draft.amount),
          purpose: draft.purpose,
          scheduledFor: draft.scheduledFor || null
        })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save transfer request");
      }

      setDraft({
        ...EMPTY_DRAFT,
        toSource: sourceOptions.find((option) => option.value !== "Square Balance")?.value || ""
      });
      setBanner("Transfer request recorded. Execution remains approval-gated and should be reconciled against actual Square payouts.");
      setRefreshNonce((value) => value + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save transfer request";
      setError(message);
      setErrorCode(inferErrorCode(message));
    } finally {
      setSavingTransfer(false);
    }
  }

  useEffect(() => {
    if (!draft.toSource && sourceOptions.length > 1) {
      setDraft((current) => ({
        ...current,
        toSource: sourceOptions[1].value
      }));
    }
  }, [draft.toSource, sourceOptions]);

  return (
    <div className="space-y-8">
      <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Central Cash Management</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Square Cash Hub</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          Seller payments, payout settlement tracking, linked bank destinations, and an approval-first transfer ledger in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/square/connect";
            }}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {data?.status.connected ? "Reconnect Square" : "Connect Square"}
          </button>
          <button
            type="button"
            onClick={syncNow}
            disabled={!data?.status.connected || syncing}
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync cash data"}
          </button>
        </div>
      </section>

      {banner ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{banner}</section>
      ) : null}

      {loading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading Square cash management data...</section>
      ) : null}

      {pageState ? (
        <PageDataState
          kind={pageState}
          signInPath={auth?.signInPath}
          errorCode={errorCode}
          errorMessage={error}
          onRetry={() => setRefreshNonce((value) => value + 1)}
        />
      ) : null}

      {!loading && !pageState && data ? (
        <>
          {!data.status.configured ? (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              <p className="text-base font-semibold">Square credentials are required before connection can start</p>
              <p className="mt-2">Set `SQUARE_APPLICATION_ID`, `SQUARE_APPLICATION_SECRET`, and `SQUARE_REDIRECT_URI` in the app environment.</p>
              {data.status.configError ? <p className="mt-2 font-semibold">Current issue: {data.status.configError}</p> : null}
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Gross Volume", value: data.summary.grossVolume },
              { label: "Net Captured", value: data.summary.netCaptured },
              { label: "Payouts Settled", value: data.summary.payoutsSettled },
              { label: "Pending Settlement", value: data.summary.pendingSettlement },
              { label: "Refunds", value: data.summary.refunds },
              { label: "Fees", value: data.summary.fees },
              { label: "Transfer Queue", value: data.summary.transferPending },
              { label: "Tracked Payments", value: data.status.payments }
            ].map((item, idx) => (
              <article
                key={item.label}
                className="reveal-up rounded-3xl border border-slate-200 bg-white p-5"
                style={{ animationDelay: `${idx * 60 + 70}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                <p className="mt-3 font-heading text-4xl text-slate-900">
                  {typeof item.value === "number" && item.label === "Tracked Payments" ? item.value : formatCurrency(Number(item.value))}
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Connection</p>
                  <h2 className="mt-2 font-heading text-3xl text-slate-900">
                    {data.status.connected ? data.status.merchantName || "Connected Square seller" : "No seller connected"}
                  </h2>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
                  {data.status.environment}
                </span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Merchant ID</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{data.status.merchantId || "Not connected"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Last Sync</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(data.status.lastSyncedAt)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Square exposes payout, payment, bank-account, and merchant reconciliation data here. Generic bank-to-bank transfer execution is not exposed by Square, so transfer actions in this hub are stored as approval-gated requests and must be reconciled against actual Square payouts or external bank movement.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.status.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-3xl text-slate-900">Transfer Desk</h2>
              <p className="mt-2 text-sm text-slate-600">
                Record planned moves between Square balance and designated bank accounts so approvals and accounting stay centralized.
              </p>
              <form className="mt-5 space-y-3" onSubmit={submitTransfer}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-semibold">From</span>
                    <select
                      value={draft.fromSource}
                      onChange={(event) => setDraft((current) => ({ ...current, fromSource: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                    >
                      {sourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-semibold">To</span>
                    <select
                      value={draft.toSource}
                      onChange={(event) => setDraft((current) => ({ ...current, toSource: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                    >
                      <option value="">Select destination</option>
                      {sourceOptions
                        .filter((option) => option.value !== draft.fromSource)
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-semibold">Amount</span>
                    <input
                      value={draft.amount}
                      onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      inputMode="decimal"
                      placeholder="1500"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-semibold">Purpose</span>
                    <input
                      value={draft.purpose}
                      onChange={(event) => setDraft((current) => ({ ...current, purpose: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      placeholder="Move weekend sales to operating account"
                    />
                  </label>
                </div>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-semibold">Scheduled date</span>
                  <input
                    type="datetime-local"
                    value={draft.scheduledFor}
                    onChange={(event) => setDraft((current) => ({ ...current, scheduledFor: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!data.status.connected || savingTransfer}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingTransfer ? "Saving..." : "Create transfer request"}
                </button>
              </form>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-3xl text-slate-900">Locations</h2>
              <div className="mt-5 space-y-3">
                {data.locations.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No Square locations synced yet.</p>
                ) : (
                  data.locations.map((location) => (
                    <div key={location.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{location.name}</p>
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{location.status || "UNKNOWN"}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {location.currency}
                        {location.country ? ` • ${location.country}` : ""}
                        {location.timezone ? ` • ${location.timezone}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-3xl text-slate-900">Linked Bank Accounts</h2>
              <div className="mt-5 space-y-3">
                {data.linkedBankAccounts.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No bank destinations synced yet.</p>
                ) : (
                  data.linkedBankAccounts.map((account) => (
                    <div key={account.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{account.bankName}</p>
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{account.status || "UNKNOWN"}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {account.accountType || "Bank account"}
                        {account.accountSuffix ? ` • ending ${account.accountSuffix}` : ""}
                        {account.routingSuffix ? ` • routing ${account.routingSuffix}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-3xl text-slate-900">Recent Activity</h2>
              <div className="mt-5 space-y-3">
                {data.recentActivity.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Sync Square to populate the ledger timeline.</p>
                ) : (
                  data.recentActivity.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${amountClass(item.amount)}`}>{formatCurrency(item.amount)}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">{item.status}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.08em] text-slate-500">{formatDateTime(item.occurredAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-3xl text-slate-900">Transfer Requests</h2>
              <div className="mt-5 space-y-3">
                {data.transferRequests.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No transfer requests yet. Create one to centralize approvals and reconciliation notes.
                  </p>
                ) : (
                  data.transferRequests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {request.fromSource} {"->"} {request.toSource}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{request.purpose}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatCurrency(request.amount)}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">{request.status}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.08em] text-slate-500">
                        {request.executionRail} • created {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
