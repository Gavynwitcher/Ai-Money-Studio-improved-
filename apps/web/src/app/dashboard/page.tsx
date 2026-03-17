"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, toneClass } from "@/lib/format";
import { PlaidConnectCard, PlaidStatusPayload } from "@/components/plaid-connect-card";
import { PageDataState } from "@/components/page-data-state";

type DashboardKpi = {
  label: string;
  value: number;
  change: string;
  tone: "positive" | "neutral" | "warning";
};

type UpcomingBill = {
  name: string;
  dueInDays: number;
  amount: number;
  autopay: boolean;
};

type Recommendation = {
  title: string;
  impactMonthly: number;
  confidence: "High" | "Medium" | "Low";
  reason: string;
};

type DashboardResponse = {
  kpis: DashboardKpi[];
  upcomingBills: UpcomingBill[];
  recommendations: Recommendation[];
};

type AuthStatus = {
  authenticated: boolean;
  signInPath: string;
};

type PlaidControls = {
  connect: () => void;
  sync: () => void;
  retry: () => void;
};

function inferErrorCode(message: string) {
  if (message.includes("P1001") || message.includes("ECONNREFUSED") || message.includes("database")) return "DB_UNAVAILABLE";
  if (message.includes("Plaid")) return "PLAID_ERROR";
  return "UNKNOWN";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [dbFallback, setDbFallback] = useState(false);
  const [plaidStatus, setPlaidStatus] = useState<PlaidStatusPayload | null>(null);
  const [plaidControls, setPlaidControls] = useState<PlaidControls | null>(null);
  const handlePlaidLinked = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load() {
      if (!canceled) {
        setLoading(true);
        setError(null);
        setErrorCode(null);
      }

      try {
        const [authRes, dashboardRes] = await Promise.all([
          fetch("/api/auth/status", { cache: "no-store" }),
          fetch("/api/money-copilot/dashboard", { cache: "no-store" })
        ]);
        const authPayload = (await authRes.json()) as AuthStatus;
        const dashboardPayload = await dashboardRes.json();

        if (!authRes.ok) {
          throw new Error("Failed to resolve auth status");
        }

        if (!canceled) {
          setAuth(authPayload);
          setDbFallback(dashboardRes.headers.get("x-data-source") === "fallback");
        }

        if (!dashboardRes.ok) {
          throw new Error((dashboardPayload as { error?: string })?.error ?? "Failed to load dashboard");
        }

        if (!canceled) {
          setData(dashboardPayload as DashboardResponse);
        }
      } catch (err) {
        if (!canceled) {
          const message = err instanceof Error ? err.message : "Failed to load dashboard";
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

  const pageState = useMemo(() => {
    if (loading) return null;
    if (auth && !auth.authenticated) return "unauthed" as const;
    if (error) return "error" as const;
    if (dbFallback) return "db_unavailable" as const;
    if (plaidStatus?.configured && !plaidStatus.connected) return "plaid_not_connected" as const;
    if (plaidStatus?.connected && plaidStatus.importedTransactions === 0) return "connected_empty" as const;
    return null;
  }, [auth, dbFallback, error, loading, plaidStatus]);

  return (
    <div className="space-y-8">
      <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Unified Financial Hub</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          Snapshot of safe-to-spend, near-term obligations, and high-impact recommendations.
        </p>
      </section>

      <PlaidConnectCard
        onLinked={handlePlaidLinked}
        onStatusChange={setPlaidStatus}
        onControlsReady={setPlaidControls}
      />

      {loading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading dashboard data...</section>
      ) : null}

      {pageState ? (
        <PageDataState
          kind={pageState}
          signInPath={auth?.signInPath}
          emptyMessage="No transactions yet. Sync now to generate fresh dashboard insights."
          errorCode={errorCode}
          errorMessage={error}
          onConnect={plaidControls?.connect}
          onSync={plaidControls?.sync}
          onRetry={() => {
            if (pageState === "db_unavailable") {
              setRefreshNonce((value) => value + 1);
              return;
            }
            plaidControls?.retry();
          }}
        />
      ) : null}

      {!loading && !error && data && pageState !== "unauthed" ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.kpis.map((kpi, idx) => (
              <article
                key={kpi.label}
                className="reveal-up rounded-3xl border border-slate-200 bg-white p-5"
                style={{ animationDelay: `${idx * 70 + 80}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{kpi.label}</p>
                <p className="mt-3 font-heading text-4xl text-slate-900">
                  {kpi.label === "Debt Utilization" ? `${kpi.value}%` : formatCurrency(kpi.value)}
                </p>
                <p className={`mt-2 text-sm font-semibold ${toneClass(kpi.tone)}`}>{kpi.change}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-3xl text-slate-900">Upcoming Bills</h2>
              <div className="mt-5 space-y-3">
                {data.upcomingBills.map((bill) => (
                  <div key={bill.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{bill.name}</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(bill.amount)}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <span>Due in {bill.dueInDays} days</span>
                      <span>{bill.autopay ? "Autopay on" : "Manual payment"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-3xl text-slate-900">Priority Recommendations</h2>
              <div className="mt-5 space-y-3">
                {data.recommendations.map((rec) => (
                  <div key={rec.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900">{rec.title}</p>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                        {rec.confidence}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{rec.reason}</p>
                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                      Estimated monthly impact: {formatCurrency(rec.impactMonthly)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
