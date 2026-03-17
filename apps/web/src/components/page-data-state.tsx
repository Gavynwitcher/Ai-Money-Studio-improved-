"use client";

import Link from "next/link";

type PageDataStateKind =
  | "unauthed"
  | "db_unavailable"
  | "plaid_not_connected"
  | "connected_empty"
  | "error";

type Props = {
  kind: PageDataStateKind;
  signInPath?: string;
  emptyMessage?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  onConnect?: () => void;
  onSync?: () => void;
  onRetry?: () => void;
};

export function PageDataState({
  kind,
  signInPath = "/signin",
  emptyMessage,
  errorCode,
  errorMessage,
  onConnect,
  onSync,
  onRetry
}: Props) {
  if (kind === "unauthed") {
    return (
      <section className="rounded-3xl border border-slate-300 bg-white p-6 text-sm text-slate-700">
        <p className="text-base font-semibold text-slate-900">Sign in to view your data</p>
        <p className="mt-1">Authentication is required before loading personal financial data.</p>
        <Link
          href={signInPath}
          className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white"
        >
          Sign in
        </Link>
      </section>
    );
  }

  if (kind === "db_unavailable") {
    return (
      <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="text-base font-semibold">Database not reachable (dev mode)</p>
        <p className="mt-1">Read-only scaffold is shown until PostgreSQL is available at localhost:5432.</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-full border border-amber-400 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900"
          >
            Retry
          </button>
        ) : null}
      </section>
    );
  }

  if (kind === "plaid_not_connected") {
    return (
      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 text-sm text-sky-900">
        <p className="text-base font-semibold">Connect accounts to import transactions</p>
        <p className="mt-1">No Plaid items are linked for this user yet.</p>
        {onConnect ? (
          <button
            type="button"
            onClick={onConnect}
            className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white"
          >
            Connect account
          </button>
        ) : null}
      </section>
    );
  }

  if (kind === "connected_empty") {
    return (
      <section className="rounded-3xl border border-slate-300 bg-white p-6 text-sm text-slate-700">
        <p className="text-base font-semibold text-slate-900">No transactions yet</p>
        <p className="mt-1">{emptyMessage || "Sync to import your latest transactions."}</p>
        {onSync ? (
          <button
            type="button"
            onClick={onSync}
            className="mt-4 rounded-full border border-slate-400 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800"
          >
            Sync now
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
      <p className="text-base font-semibold">Something went wrong</p>
      <p className="mt-1">
        Error code: <span className="font-semibold">{errorCode || "UNKNOWN"}</span>
      </p>
      {errorMessage ? <p className="mt-1">{errorMessage}</p> : null}
      <p className="mt-2">Fix: relink if credentials expired, otherwise retry after checking server configuration.</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-rose-800"
        >
          Retry
        </button>
      ) : null}
    </section>
  );
}
