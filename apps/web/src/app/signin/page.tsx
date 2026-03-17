"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Invalid credentials.");
      return;
    }

    const callbackUrl =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("callbackUrl") : null;
    const destination = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
    router.push(destination);
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
        <p className="mt-2 text-sm text-slate-600">Access your account to load your linked finance data.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-slate-500">Email</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-slate-500">Password</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="text-xs text-rose-700">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/signup" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2">
            Create one
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
