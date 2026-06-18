"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { accounts } from "@/data/mock-finance";
import { currency } from "@/lib/utils";

type StripePlatformStatus = {
  configured: boolean;
  accountId: string | null;
  country: string | null;
  accountType: string | null;
  connectedAccountsCount: number;
  transfers: {
    connectTransfersCapability: string;
    treasuryCapability: string;
    treasuryReady: boolean;
    summary: string;
    nextStep: string;
  };
  credit: {
    capitalForPlatformsReady: boolean;
    issuingCreditReady: boolean;
    summary: string;
    nextStep: string;
  };
};

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

type StripeConnectWorkspace = {
  authenticated: boolean;
  userEmail: string | null;
  platformConfigured: boolean;
  hasConnectedAccount: boolean;
  connectedAccount: ConnectedAccountWorkspace | null;
};

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

export function StripeTransferWorkspace() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [platform, setPlatform] = useState<StripePlatformStatus | null>(null);
  const [connect, setConnect] = useState<StripeConnectWorkspace | null>(null);
  const [amount, setAmount] = useState("2500");
  const [fromAccountId, setFromAccountId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(accounts[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fromAccount = useMemo(
    () => accounts.find((account) => account.id === fromAccountId) ?? accounts[0],
    [fromAccountId]
  );
  const toAccount = useMemo(
    () => accounts.find((account) => account.id === toAccountId) ?? accounts[1] ?? accounts[0],
    [toAccountId]
  );
  const parsedAmount = Number(amount) || 0;

  const transferReady =
    Boolean(platform?.configured) &&
    platform?.transfers.connectTransfersCapability === "active" &&
    platform?.transfers.treasuryReady &&
    Boolean(connect?.connectedAccount?.chargesEnabled) &&
    Boolean(connect?.connectedAccount?.payoutsEnabled);

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [platformRes, connectRes] = await Promise.all([
        fetch("/api/stripe/platform-status", { cache: "no-store" }),
        fetch("/api/stripe/connect/status", { cache: "no-store" })
      ]);

      const platformPayload = (await platformRes.json()) as StripePlatformStatus & { error?: string };
      const connectPayload = (await connectRes.json()) as StripeConnectWorkspace & { error?: string };

      if (!platformRes.ok) {
        throw new Error(platformPayload.error ?? "Unable to load Stripe platform status.");
      }
      if (!connectRes.ok) {
        throw new Error(connectPayload.error ?? "Unable to load Stripe Connect workspace.");
      }

      setPlatform(platformPayload);
      setConnect(connectPayload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load transfer workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function beginOnboarding() {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const payload = (await res.json()) as { url?: string; error?: string; signInPath?: string };
      if (res.status === 401 && payload.signInPath) {
        router.push(payload.signInPath);
        return;
      }
      if (!res.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to open Stripe onboarding.");
      }
      window.location.href = payload.url;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to open Stripe onboarding.");
    }
  }

  function prepareTransfer() {
    setError("");

    if (!connect?.authenticated) {
      router.push("/signin?callbackUrl=/dashboard-demo");
      return;
    }

    if (!connect.hasConnectedAccount || !connect.connectedAccount) {
      setMessage("Create a connected account first so Northline has a transfer destination to work with.");
      return;
    }

    if (!connect.connectedAccount.chargesEnabled || !connect.connectedAccount.payoutsEnabled) {
      setMessage("Finish Stripe onboarding first. Stripe still needs to enable payments and payouts on the connected account.");
      return;
    }

    if (!platform?.transfers.treasuryReady) {
      setMessage("Transfer instruction saved as a preview. Stripe Treasury is still unavailable on this account, so live bank-rail execution remains blocked.");
      return;
    }

    setMessage(`Transfer prepared: ${currency(parsedAmount)} from ${fromAccount.name} to ${toAccount.name}.`);
  }

  const readinessLabel = transferReady
    ? "Transfer-ready"
    : connect?.hasConnectedAccount
      ? "Setup required"
      : "Not started";

  return (
    <Card className="lg:col-span-3 rounded-[28px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
            Transfer workspace
          </p>
          <h3 className="mt-3 font-heading text-xl font-semibold text-[var(--navy)]">
            Move funds with live Stripe readiness
          </h3>
        </div>
        <Badge tone={transferReady ? "success" : "warning"}>{readinessLabel}</Badge>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-[var(--muted)]">Loading transfer controls...</p>
      ) : (
        <>
          <div className="mt-5 grid gap-3">
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Platform transfers</p>
              <Badge tone={platform?.transfers.connectTransfersCapability === "active" ? "success" : "warning"}>
                {humanize(platform?.transfers.connectTransfersCapability ?? "unknown")}
              </Badge>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Treasury banking rail</p>
              <Badge tone={platform?.transfers.treasuryReady ? "success" : "warning"}>
                {platform?.transfers.treasuryReady ? "enabled" : humanize(platform?.transfers.treasuryCapability ?? "blocked")}
              </Badge>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
              <p className="text-sm font-medium text-[var(--navy)]">Connected payout account</p>
              <Badge tone={connect?.hasConnectedAccount ? "teal" : "warning"}>
                {connect?.hasConnectedAccount ? "created" : "missing"}
              </Badge>
            </div>
          </div>

          <div className="bank-panel-muted mt-5 rounded-[24px] p-4">
            <p className="text-sm font-semibold text-[var(--navy)]">Transfer route preview</p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm text-[var(--muted)]">
                From account
                <select
                  value={fromAccountId}
                  onChange={(event) => setFromAccountId(event.target.value)}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy)] outline-none"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.institutionName} · {account.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                To account
                <select
                  value={toAccountId}
                  onChange={(event) => setToAccountId(event.target.value)}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy)] outline-none"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.institutionName} · {account.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                Amount
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy)] outline-none"
                  placeholder="2500"
                />
              </label>
            </div>

            <div className="mt-4 rounded-[20px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm text-[var(--muted)]">
              {currency(parsedAmount)} from {fromAccount.name} to {toAccount.name}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startTransition(prepareTransfer)}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-2xl border border-[rgba(11,31,51,0.18)] bg-[var(--navy)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#122c46] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {transferReady ? "Prepare transfer" : "Review transfer setup"}
              </button>
              <button
                type="button"
                onClick={() => startTransition(beginOnboarding)}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--ocean)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connect?.hasConnectedAccount ? "Resume onboarding" : "Create payout account"}
              </button>
              <button
                type="button"
                onClick={() => startTransition(loadWorkspace)}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--ocean)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-[var(--navy)]">
              {platform?.transfers.summary ?? "Transfer readiness is still loading."}
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {connect?.hasConnectedAccount && connect.connectedAccount
                ? connect.connectedAccount.chargesEnabled && connect.connectedAccount.payoutsEnabled
                  ? platform?.transfers.nextStep
                  : "Your connected account exists, but Stripe has not finished enabling it for payments and payouts yet."
                : "Create the first connected payout account to turn this from a static status check into an operational transfer workspace."}
            </p>
          </div>

          {message ? (
            <p className="mt-4 rounded-[20px] border border-[rgba(25,106,117,0.12)] bg-[rgba(25,106,117,0.08)] px-4 py-3 text-sm text-[var(--ocean)]">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-[20px] bg-[rgba(178,67,67,0.12)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}
