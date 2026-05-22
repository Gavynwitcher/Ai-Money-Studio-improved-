"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlaidConnectCard } from "@/components/plaid-connect-card";
import { Button } from "@/components/ui/button";

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

type DashboardWorkspaceProps = {
  userName: string;
  userEmail: string;
};

function formatRelativeTimestamp(value: string | null) {
  if (!value) return "No sync yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No sync yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function coverageSummary(status: PlaidStatusPayload | null) {
  if (!status?.coverageStart || !status?.coverageEnd) return "Awaiting imported transaction range";
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${formatter.format(new Date(status.coverageStart))} to ${formatter.format(new Date(status.coverageEnd))}`;
}

export function ClientWorkspace({ userName, userEmail }: DashboardWorkspaceProps) {
  const [status, setStatus] = useState<PlaidStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/plaid/status", { cache: "no-store" });
      const payload = (await response.json()) as PlaidStatusPayload | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Failed to load workspace status");
      }
      setStatus(payload as PlaidStatusPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load workspace status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = userName.trim().split(/\s+/)[0] || "there";
  const institutionLabel = useMemo(() => {
    if (!status?.institutions?.length) return "No bank connected yet";
    if (status.institutions.length === 1) return status.institutions[0];
    return `${status.institutions[0]} + ${status.institutions.length - 1} more`;
  }, [status]);

  const nextStepLabel = useMemo(() => {
    if (!status?.connected) return "Connect your first bank to unlock balances and transaction sync.";
    if ((status.importedTransactions ?? 0) === 0) return "Run a sync to finish importing activity from your linked institutions.";
    return "Your workspace is live. Review transactions or connect another institution when you need broader visibility.";
  }, [status]);

  return (
    <div className="grid gap-6">
      <section className="bank-shell rounded-[32px] px-6 py-6 text-white md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">Client workspace</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em] text-white">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              This is your private Northline space for connected-bank visibility, activity review, and day-to-day money
              management across institutions.
            </p>
          </div>
          <div className="bank-stat-dark min-w-[220px] rounded-[24px] px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Account owner</p>
            <p className="mt-3 text-lg font-semibold text-white">{userName}</p>
            <p className="mt-1 text-sm text-slate-300">{userEmail}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          <div className="bank-stat-dark rounded-[24px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Connection status</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {loading ? "Loading..." : status?.connected ? "Connected" : "Not connected"}
            </p>
            <p className="mt-2 text-sm text-slate-300">{institutionLabel}</p>
          </div>
          <div className="bank-stat-dark rounded-[24px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Linked institutions</p>
            <p className="mt-3 text-3xl font-semibold text-white">{loading ? "..." : status?.connectedItems ?? 0}</p>
            <p className="mt-2 text-sm text-slate-300">{loading ? "Checking status..." : nextStepLabel}</p>
          </div>
          <div className="bank-stat-dark rounded-[24px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Imported accounts</p>
            <p className="mt-3 text-3xl font-semibold text-white">{loading ? "..." : status?.linkedAccounts ?? 0}</p>
            <p className="mt-2 text-sm text-slate-300">Last sync {loading ? "-" : formatRelativeTimestamp(status?.lastSyncedAt ?? null)}</p>
          </div>
          <div className="bank-stat-dark rounded-[24px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Imported activity</p>
            <p className="mt-3 text-3xl font-semibold text-white">{loading ? "..." : status?.importedTransactions ?? 0}</p>
            <p className="mt-2 text-sm text-slate-300">{loading ? "Preparing range..." : coverageSummary(status)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="bank-panel rounded-[28px] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Recommended next step</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
            Keep your connected banking profile current
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{nextStepLabel}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/plaid-integration">Manage connections</Button>
            <Button href="/transactions" variant="secondary">
              Review transactions
            </Button>
          </div>
          {error ? (
            <div className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div className="bank-panel rounded-[28px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace shortcuts</p>
            <div className="mt-4 grid gap-3">
              <Link href="/plaid-integration" className="ledger-row rounded-[22px] px-4 py-4">
                <p className="text-base font-semibold text-[var(--navy)]">Bank connections</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Link another institution, refresh balances, or manage sync.</p>
              </Link>
              <Link href="/transactions" className="ledger-row rounded-[22px] px-4 py-4">
                <p className="text-base font-semibold text-[var(--navy)]">Transaction review</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Search imported activity and review categorized movement.</p>
              </Link>
              <Link href="/contact" className="ledger-row rounded-[22px] px-4 py-4">
                <p className="text-base font-semibold text-[var(--navy)]">Support and onboarding</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Ask questions, request setup help, or leave product feedback.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PlaidConnectCard onLinked={() => void load()} />
    </div>
  );
}
