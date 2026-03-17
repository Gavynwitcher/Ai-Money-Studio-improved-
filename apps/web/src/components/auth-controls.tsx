"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

function initials(nameOrEmail: string) {
  const value = nameOrEmail.trim();
  if (!value) return "U";
  const emailPrefix = value.includes("@") ? value.split("@")[0] : value;
  const parts = emailPrefix.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return emailPrefix.slice(0, 2).toUpperCase();
}

export function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        Auth...
      </span>
    );
  }

  if (!session?.user?.email) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/signin"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white"
        >
          Create account
        </Link>
      </div>
    );
  }

  const label = session.user.name?.trim() || session.user.email;

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold uppercase text-white">
        {initials(label)}
      </span>
      <span className="hidden max-w-[170px] truncate text-xs font-semibold text-slate-600 xl:inline">{label}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800"
      >
        Sign out
      </button>
    </div>
  );
}

