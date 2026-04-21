"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BillingPlanKey } from "@/lib/stripe/config";

type PricingActionsProps = {
  authenticated: boolean;
  currentPlan: BillingPlanKey;
  billingStatus: string;
  portalAvailable: boolean;
  checkoutReadyPlans: BillingPlanKey[];
  activeSubscription: {
    planKey: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

type ActionState = {
  loadingPlan: BillingPlanKey | null;
  portalLoading: boolean;
  error: string;
};

function formatDate(value: string | null) {
  if (!value) return "No renewal date available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function PricingActions(props: PricingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({
    loadingPlan: null,
    portalLoading: false,
    error: ""
  });

  const checkoutReady = useMemo(
    () => new Set(props.checkoutReadyPlans),
    [props.checkoutReadyPlans]
  );

  async function launchCheckout(planKey: BillingPlanKey) {
    if (!props.authenticated) {
      router.push("/signin?callbackUrl=/pricing");
      return;
    }

    setState({ loadingPlan: planKey, portalLoading: false, error: "" });
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planKey })
      });
      const payload = (await response.json()) as { error?: string; url?: string; signInPath?: string };
      if (response.status === 401 && payload.signInPath) {
        router.push(payload.signInPath);
        return;
      }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setState({
        loadingPlan: null,
        portalLoading: false,
        error: error instanceof Error ? error.message : "Unable to start checkout."
      });
    }
  }

  async function openPortal() {
    if (!props.authenticated) {
      router.push("/signin?callbackUrl=/pricing");
      return;
    }

    setState({ loadingPlan: null, portalLoading: true, error: "" });
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string; url?: string; signInPath?: string };
      if (response.status === 401 && payload.signInPath) {
        router.push(payload.signInPath);
        return;
      }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to open billing portal.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setState({
        loadingPlan: null,
        portalLoading: false,
        error: error instanceof Error ? error.message : "Unable to open billing portal."
      });
    }
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-[32px] border border-[var(--line)] bg-white/75 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
              Billing workspace
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Subscription controls
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Launch Stripe Checkout for paid plans and send active customers into the Stripe Billing Portal for plan changes, payment updates, and cancellation controls.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            {props.authenticated ? `${props.currentPlan.replace(/_/g, " ")} · ${props.billingStatus}` : "Sign in to subscribe"}
          </div>
        </div>

        {props.activeSubscription ? (
          <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">
              Active Stripe subscription: {props.activeSubscription.planKey.replace(/_/g, " ")}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Status: {props.activeSubscription.status.replace(/_/g, " ")} · Renewal {formatDate(props.activeSubscription.currentPeriodEnd)}
              {props.activeSubscription.cancelAtPeriodEnd ? " · set to cancel at period end" : ""}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => startTransition(() => launchCheckout("hub_plus"))}
            disabled={isPending || state.loadingPlan !== null || !checkoutReady.has("hub_plus")}
            className="inline-flex items-center justify-center rounded-2xl border border-[rgba(11,31,51,0.18)] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(11,31,51,0.18)] transition hover:bg-[#122c46] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.loadingPlan === "hub_plus" ? "Redirecting..." : checkoutReady.has("hub_plus") ? "Subscribe to Hub Plus" : "Hub Plus not configured"}
          </button>

          <button
            type="button"
            onClick={() => startTransition(() => launchCheckout("transfer_flex"))}
            disabled={isPending || state.loadingPlan !== null || !checkoutReady.has("transfer_flex")}
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--ocean)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.loadingPlan === "transfer_flex"
              ? "Redirecting..."
              : checkoutReady.has("transfer_flex")
                ? "Buy transfer credits"
                : "Transfer Flex not configured"}
          </button>

          <button
            type="button"
            onClick={() => startTransition(openPortal)}
            disabled={isPending || state.portalLoading || !props.portalAvailable}
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--ocean)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.portalLoading ? "Opening portal..." : props.portalAvailable ? "Manage billing" : "Portal available after first checkout"}
          </button>
        </div>

        {state.error ? (
          <p className="mt-4 rounded-[20px] bg-[rgba(178,67,67,0.12)] px-4 py-3 text-sm text-[var(--danger)]">
            {state.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
