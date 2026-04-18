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
    const existing = document.querySelector(`script[src=\"${PLAID_SCRIPT_SRC}\"]`) as HTMLScriptElement | null;
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

function toMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function coverageLabel(status: PlaidStatusPayload | null) {
  if (!status?.coverageStart || !status.coverageEnd) return "No imported range yet";
  return `${formatDate(status.coverageStart)} to ${formatDate(status.coverageEnd)}`;
}

type Props = {
  onLinked?: () => void;
  onStatusChange?: (status: PlaidStatusPayload | null) => void;
  onControlsReady?: (controls: { connect: () => void; sync: () => void; retry: () => void }) => void;
  compact?: boolean;
};

export function PlaidConnectCard({ onLinked, onStatusChange, onControlsReady, compact = false }: Props) {
  const [status, setStatus] = useState<PlaidStatusPayload | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
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

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        await loadStatus();
      } catch (err) {
        if (!canceled) {
          const message = toMessage(err, "Failed to load Plaid status");
          setError(message);
          onStatusChange?.(null);
        }
      } finally {
        if (!canceled) setLoadingStatus(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [loadStatus, onStatusChange]);

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
            if (result.transactionsReady === false || (result.pendingItems ?? 0) > 0) {
              setFeedback(
                `Connected successfully. Imported ${result.importedAccounts} accounts. Transactions are still preparing at your institution; retry sync in about a minute.`
              );
            } else {
              setFeedback(
                `Connected successfully. Imported ${result.importedAccounts} accounts and ${result.importedTransactions} transactions.`
              );
            }
            await loadStatus();
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
  }, [loadStatus, onLinked]);

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
            `We cleared older sandbox-linked items so this workspace matches Plaid production. Reconnect your bank to continue.`
        );
        await loadStatus();
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
      await loadStatus();
      onLinked?.();
    } catch (err) {
      setError(toMessage(err, "Failed to sync Plaid data"));
    } finally {
      setSyncing(false);
    }
  }, [loadStatus, onLinked]);

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
      await loadStatus();
      onLinked?.();
    } catch (err) {
      setError(toMessage(err, "Failed to unlink Plaid data"));
    } finally {
      setUnlinking(false);
    }
  }, [loadStatus, onLinked, status?.connected]);

  const primaryAction = useMemo(() => {
    if (!status?.configured) {
      return {
        label: loadingStatus ? "Loading..." : "Retry",
        onClick: () => loadStatus(),
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
        label: launching ? "Opening Plaid..." : "Relink",
        onClick: () => launchPlaid(),
        disabled: loadingStatus || launching || syncing || unlinking
      };
    }
    return {
      label: syncing ? "Syncing..." : "Sync now",
      onClick: () => syncPlaidData(),
      disabled: loadingStatus || launching || syncing || unlinking
    };
  }, [launchPlaid, loadStatus, loadingStatus, status, syncing, launching, syncPlaidData, unlinking]);

  const modeLabel = status?.environment ? status.environment.toUpperCase() : "LIVE";
  const productLabel = status?.products?.length ? status.products.join(", ") : "transactions";
  const treasuryTone = status?.connected ? "bg-emerald-500" : "bg-amber-500";
  const connectionLabel = loadingStatus ? "Loading..." : status?.connected ? "Treasury rail active" : "Awaiting connection";
  const syncLabel = loadingStatus ? "-" : formatRelativeTimestamp(status?.lastSyncedAt ?? null);

  useEffect(() => {
    onControlsReady?.({
      connect: () => {
        void launchPlaid();
      },
      sync: () => {
        void syncPlaidData();
      },
      retry: () => {
        void loadStatus();
      }
    });
  }, [launchPlaid, loadStatus, onControlsReady, syncPlaidData]);

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
                Banking Connection Center
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                {modeLabel}
              </span>
            </div>
            <h2 className={`mt-4 font-heading ${compact ? "text-3xl" : "text-4xl"} font-semibold tracking-[-0.05em]`}>
              Treasury-grade account linking for your banking workspace
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Securely connect institutions, import transaction history, and keep your Unified Banking Hub profile aligned
              with the live Plaid environment.
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
            <button
              type="button"
              onClick={syncPlaidData}
              disabled={
                loadingStatus ||
                launching ||
                syncing ||
                unlinking ||
                !status?.configured ||
                (status?.connectedItems ?? 0) === 0
              }
              className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:text-white/40"
            >
              {syncing ? "Syncing..." : "Manual Sync"}
            </button>
            <button
              type="button"
              onClick={unlinkPlaidData}
              disabled={
                loadingStatus ||
                launching ||
                syncing ||
                unlinking ||
                !status?.configured ||
                (status?.connectedItems ?? 0) === 0
              }
              className="rounded-full border border-rose-300/40 bg-transparent px-5 py-3 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:text-rose-200/40"
            >
              {unlinking ? "Unlinking..." : "Unlink"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Connection rail</p>
            <div className="mt-3 flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${treasuryTone}`} />
              <p className="text-lg font-semibold text-white">{connectionLabel}</p>
            </div>
            <p className="mt-2 text-sm text-slate-300">{status?.institutions?.[0] ?? "No institution linked yet"}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Last ledger sync</p>
            <p className="mt-3 text-2xl font-semibold text-white">{syncLabel}</p>
            <p className="mt-2 text-sm text-slate-300">Coverage {loadingStatus ? "-" : coverageLabel(status)}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Imported accounts</p>
            <p className="mt-3 text-3xl font-semibold text-white">{loadingStatus ? "-" : status?.linkedAccounts ?? 0}</p>
            <p className="mt-2 text-sm text-slate-300">
              {loadingStatus ? "Loading..." : `${status?.connectedItems ?? 0} linked institution${(status?.connectedItems ?? 0) === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Imported transactions</p>
            <p className="mt-3 text-3xl font-semibold text-white">{loadingStatus ? "-" : status?.importedTransactions ?? 0}</p>
            <p className="mt-2 text-sm text-slate-300">Products: {productLabel}</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Institution list</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                {status?.institutions?.length ? status.institutions.join(", ") : "Reconnect to add institutions"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep each linked institution aligned with the current Plaid environment before you run syncs or transfers.
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Verification posture</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                Verified {status?.verifiedBankAccounts ?? 0} · Pending {status?.pendingBankAccounts ?? 0}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tokenized accounts: {status?.tokenizedBankAccounts ?? 0}
                {status?.authMethods?.length ? ` · Auth method: ${status.authMethods.join(", ")}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_15px_45px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Operating guidance</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Connection controls</h3>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[20px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] p-4">
              <p className="text-sm font-semibold text-slate-950">Production environment</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Link tokens are now issued against Plaid production, so previously stored sandbox connections are reset automatically.
              </p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-[linear-gradient(135deg,#fbfcfe_0%,#f4f7fb_100%)] p-4">
              <p className="text-sm font-semibold text-slate-950">Recommended flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Connect institution, complete Plaid Link, then run a sync to refresh balances and transaction history before enabling money movement steps.
              </p>
            </div>
          </div>
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
