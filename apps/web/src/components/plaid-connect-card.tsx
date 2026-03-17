"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/format";

export type PlaidStatusPayload = {
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
  return `${formatDate(status.coverageStart)}-${formatDate(status.coverageEnd)}`;
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
    <section className={`rounded-3xl border border-slate-200 bg-white ${compact ? "p-5 md:p-6" : "p-6 md:p-7"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Connection & Data Coverage</p>
          <h2 className={`mt-2 font-heading text-slate-900 ${compact ? "text-2xl" : "text-3xl"}`}>Connect with Plaid</h2>
          <p className="mt-2 text-sm text-slate-600">Link accounts for live balances and transaction imports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
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
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
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
            className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:text-rose-300"
          >
            {unlinking ? "Unlinking..." : "Unlink"}
          </button>
        </div>
      </div>

      <div className={`mt-5 grid gap-3 text-sm text-slate-700 ${compact ? "md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-5"}`}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Connection</p>
          <p className="mt-1 font-semibold text-slate-900">
            {loadingStatus ? "Loading..." : status?.connected ? "Connected" : "Not connected"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Last Successful Sync</p>
          <p className="mt-1 font-semibold text-slate-900">{loadingStatus ? "-" : formatRelativeTimestamp(status?.lastSyncedAt ?? null)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Linked Accounts</p>
          <p className="mt-1 font-semibold text-slate-900">{loadingStatus ? "-" : status?.linkedAccounts ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Imported Transactions</p>
          <p className="mt-1 font-semibold text-slate-900">{loadingStatus ? "-" : status?.importedTransactions ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Data Coverage</p>
          <p className="mt-1 font-semibold text-slate-900">{loadingStatus ? "-" : coverageLabel(status)}</p>
        </div>
      </div>

      {status?.institutions?.length ? (
        <p className="mt-4 text-sm text-slate-600">Institutions: {status.institutions.join(", ")}</p>
      ) : null}

      {!loadingStatus && !status?.configured && status?.configError ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Plaid setup needed: {status.configError}. Add `PLAID_CLIENT_ID` and `PLAID_SECRET` in your environment.
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}
    </section>
  );
}
