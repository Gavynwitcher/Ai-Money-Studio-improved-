"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { PlaidConnectCard, PlaidStatusPayload } from "@/components/plaid-connect-card";
import { PageDataState } from "@/components/page-data-state";
import { getKillSwitchState, KILL_SWITCH_EVENT } from "@/lib/client/killSwitch";

type ActionRow = {
  id: string;
  type: string;
  status: string;
  expectedOutcome: string;
  downside: string;
  requiresStepUp: boolean;
  impactMonthly: number;
  risk: "Low" | "Medium" | "High";
  steps: string[];
  requiredApprovals: string[];
  receipt: string | null;
  rollback: string | null;
};

type ActionsResponse = {
  actions: ActionRow[];
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

const safeguards = [
  "Every external action requires explicit user approval.",
  "Step-up auth gates all money movement and recurring automations.",
  "Each action includes expected outcome, downside, and rollback posture.",
  "Kill switch can pause all automations globally."
];

function statusClass(status: string): string {
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "Scheduled") return "bg-sky-100 text-sky-700";
  if (status === "Awaiting Approval") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function riskClass(risk: ActionRow["risk"]): string {
  if (risk === "High") return "bg-rose-100 text-rose-700";
  if (risk === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function inferErrorCode(message: string) {
  if (message.includes("P1001") || message.includes("ECONNREFUSED") || message.includes("database")) return "DB_UNAVAILABLE";
  if (message.includes("Plaid")) return "PLAID_ERROR";
  return "UNKNOWN";
}

export default function ActionsPage() {
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dbFallback, setDbFallback] = useState(false);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [plaidStatus, setPlaidStatus] = useState<PlaidStatusPayload | null>(null);
  const [plaidControls, setPlaidControls] = useState<PlaidControls | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [killSwitchPaused, setKillSwitchPaused] = useState(false);
  const handlePlaidLinked = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const [authRes, actionRes, paused] = await Promise.all([
          fetch("/api/auth/status", { cache: "no-store" }),
          fetch("/api/money-copilot/actions", { cache: "no-store" }),
          getKillSwitchState().catch(() => false)
        ]);
        const authPayload = (await authRes.json()) as AuthStatus;
        const actionPayload = await actionRes.json();

        if (!authRes.ok) {
          throw new Error("Failed to resolve auth status");
        }

        if (!canceled) {
          setAuth(authPayload);
          setDbFallback(actionRes.headers.get("x-data-source") === "fallback");
          setKillSwitchPaused(paused);
        }

        if (!actionRes.ok) {
          throw new Error((actionPayload as { error?: string })?.error ?? "Failed to load actions");
        }
        if (!canceled) setRows((actionPayload as ActionsResponse).actions);
      } catch (err) {
        if (!canceled) {
          const message = err instanceof Error ? err.message : "Failed to load actions";
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

  const pageState = useMemo(() => {
    if (loading) return null;
    if (auth && !auth.authenticated) return "unauthed" as const;
    if (error) return "error" as const;
    if (dbFallback) return "db_unavailable" as const;
    if (plaidStatus?.configured && !plaidStatus.connected) return "plaid_not_connected" as const;
    if (plaidStatus?.connected && rows.length === 0) return "connected_empty" as const;
    return null;
  }, [auth, dbFallback, error, loading, plaidStatus, rows.length]);

  return (
    <div className="space-y-8">
      <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Agentic Action Center</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Agent Actions</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          Approval-first execution queue with impact, risk, required approvals, receipts, and rollback posture.
        </p>
      </section>

      <PlaidConnectCard
        compact
        onStatusChange={setPlaidStatus}
        onControlsReady={setPlaidControls}
        onLinked={handlePlaidLinked}
      />

      {loading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading action queue...</section>
      ) : null}

      {pageState ? (
        <PageDataState
          kind={pageState}
          signInPath={auth?.signInPath}
          emptyMessage="No actions queued yet. Ask the AI Agent to propose one based on your spending summary."
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

      {killSwitchPaused ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Kill switch is paused. New automated actions and AI proposals are blocked.
        </section>
      ) : null}

      {pageState !== "unauthed" ? (
        <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-3xl text-slate-900">Action Queue</h2>
          <div className="mt-5 space-y-3">
            {!loading && !error && rows.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No actions yet. Approve a recommendation or ask AI Agent for a proposal.
              </p>
            ) : null}

            {!loading && !error
              ? rows.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900">{item.type}</p>
                      <div className="flex gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${riskClass(item.risk)}`}>
                          {item.risk} risk
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">Expected outcome: {item.expectedOutcome}</p>
                    <p className="mt-1 text-sm text-slate-600">Downside: {item.downside}</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-700">
                      Estimated impact: {formatCurrency(item.impactMonthly)}/month
                    </p>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Required approvals</p>
                        <ul className="mt-1 space-y-1 text-sm text-slate-700">
                          {item.requiredApprovals.map((approval) => (
                            <li key={approval}>• {approval}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Execution steps</p>
                        <ul className="mt-1 space-y-1 text-sm text-slate-700">
                          {item.steps.map((step) => (
                            <li key={step}>• {step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {item.receipt || item.rollback ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        {item.receipt ? <p>{item.receipt}</p> : null}
                        {item.rollback ? <p>{item.rollback}</p> : null}
                      </div>
                    ) : null}
                  </div>
                ))
              : null}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-3xl text-slate-900">Safety Guardrails</h2>
          <ul className="mt-5 space-y-3">
            {safeguards.map((point) => (
              <li key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            Global kill switch is available in the app header. Use it to pause all automations immediately.
          </div>
        </article>
        </section>
      ) : null}
    </div>
  );
}
