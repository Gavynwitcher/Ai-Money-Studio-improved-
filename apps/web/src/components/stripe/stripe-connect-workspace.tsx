"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type ConnectedAccountWorkspace = {
  id: string;
  stripeAccountId: string;
  onboardingStatus: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDueCount: number;
  eventuallyDueCount: number;
  pendingVerificationCount: number;
  disabledReason: string | null;
  lastSyncedAt: string | null;
  dashboardAccess: "express";
};

type StripeConnectWorkspacePayload = {
  authenticated: boolean;
  userEmail: string | null;
  platformConfigured: boolean;
  hasConnectedAccount: boolean;
  connectedAccount: ConnectedAccountWorkspace | null;
  error?: string;
};

function toneForStatus(status: string) {
  if (status === "active") return "success";
  if (status === "under_review") return "teal";
  return "warning";
}

function humanizeStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatTimestamp(value: string | null) {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function StripeConnectWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [workspace, setWorkspace] = useState<StripeConnectWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryState = searchParams.get("stripeConnect");
  const notice = useMemo(() => {
    if (queryState === "return") {
      return "Stripe returned to Northline. We refreshed the connected account status below.";
    }
    if (queryState === "refresh-error") {
      return "The onboarding link expired before completion. Start onboarding again to continue.";
    }
    if (queryState === "missing-account") {
      return "We could not identify the connected account that needed a new onboarding link.";
    }
    return "";
  }, [queryState]);

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/connect/status", { cache: "no-store" });
      const payload = (await res.json()) as StripeConnectWorkspacePayload;
      if (!res.ok) {
        throw new Error(payload.error ?? "Unable to load Stripe Connect workspace.");
      }
      setWorkspace(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load Stripe Connect workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function startOnboarding() {
    setError("");
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST"
      });
      const payload = (await res.json()) as { error?: string; url?: string; signInPath?: string };
      if (res.status === 401 && payload.signInPath) {
        router.push(payload.signInPath);
        return;
      }

      if (!res.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to create a Stripe onboarding link.");
      }

      window.location.href = payload.url;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create a Stripe onboarding link.");
    }
  }

  if (loading) {
    return (
      <Card className="rounded-[32px]">
        <p className="text-sm font-medium text-[var(--muted)]">Loading Stripe Connect workspace...</p>
      </Card>
    );
  }

  const connected = workspace?.connectedAccount ?? null;

  return (
    <Card className="rounded-[32px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
            Stripe platform onboarding
          </p>
          <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
            Turn capability checks into a real connected account
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            This flow creates a Stripe connected account for the signed-in business owner, opens Stripe-hosted onboarding, and tracks whether the account is ready for payouts, payments, and future capital eligibility.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => startTransition(startOnboarding)}
            disabled={isPending || !workspace?.platformConfigured}
            className="inline-flex items-center justify-center rounded-2xl border border-[rgba(11,31,51,0.18)] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(11,31,51,0.18)] transition hover:bg-[#122c46] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Opening Stripe..."
              : connected
                ? "Resume Stripe onboarding"
                : "Create connected account"}
          </button>
          <button
            type="button"
            onClick={() => startTransition(loadWorkspace)}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--ocean)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh status
          </button>
        </div>
      </div>

      {notice ? (
        <p className="mt-5 rounded-[22px] border border-[rgba(25,106,117,0.12)] bg-[rgba(25,106,117,0.08)] px-4 py-3 text-sm text-[var(--ocean)]">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-[22px] bg-[rgba(178,67,67,0.12)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {!workspace?.platformConfigured ? (
        <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
          <p className="text-sm font-semibold text-[var(--navy)]">Stripe is not configured in this environment yet.</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Add the Stripe secret key and connected-account settings before launching platform onboarding.
          </p>
        </div>
      ) : null}

      {workspace?.platformConfigured && !workspace.authenticated ? (
        <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
          <p className="text-sm font-semibold text-[var(--navy)]">Sign in to create a connected account.</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Stripe onboarding is tied to the signed-in business owner so we can keep one connected account per operator and sync requirement changes over time.
          </p>
        </div>
      ) : null}

      {workspace?.authenticated && connected ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3">
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Account status</p>
              <Badge tone={toneForStatus(connected.onboardingStatus)}>
                {humanizeStatus(connected.onboardingStatus)}
              </Badge>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Connected account ID</p>
              <p className="text-sm font-semibold text-[var(--navy)]">{connected.stripeAccountId}</p>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Requirements due now</p>
              <p className="text-sm font-semibold text-[var(--navy)]">{connected.currentlyDueCount}</p>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Pending verification</p>
              <p className="text-sm font-semibold text-[var(--navy)]">{connected.pendingVerificationCount}</p>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Last sync</p>
              <p className="text-sm font-semibold text-[var(--navy)]">{formatTimestamp(connected.lastSyncedAt)}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={connected.detailsSubmitted ? "success" : "warning"}>
                {connected.detailsSubmitted ? "Details submitted" : "Details needed"}
              </Badge>
              <Badge tone={connected.chargesEnabled ? "success" : "warning"}>
                {connected.chargesEnabled ? "Payments enabled" : "Payments pending"}
              </Badge>
              <Badge tone={connected.payoutsEnabled ? "success" : "warning"}>
                {connected.payoutsEnabled ? "Payouts enabled" : "Payouts pending"}
              </Badge>
            </div>

            <p className="mt-4 text-sm font-semibold text-[var(--navy)]">
              {connected.chargesEnabled && connected.payoutsEnabled
                ? "This connected account is operational for Stripe-hosted payouts and payment activity."
                : "Finish Stripe onboarding to unlock payouts and create the payment activity needed for future Capital eligibility."}
            </p>

            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {connected.disabledReason
                ? `Stripe is still blocking capabilities because: ${connected.disabledReason.replace(/_/g, " ")}.`
                : "Northline will keep refreshing this status panel after Stripe onboarding so you can see when the account is ready for the next treasury or capital step."}
            </p>
          </div>
        </div>
      ) : null}

      {workspace?.authenticated && !connected ? (
        <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
          <p className="text-sm font-semibold text-[var(--navy)]">No connected account has been created for this user yet.</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Create the first Stripe connected account to begin hosted onboarding. Once Stripe collects the business details, this workspace will show live requirement counts and readiness states.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
