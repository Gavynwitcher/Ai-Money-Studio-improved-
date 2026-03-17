"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type RegisterResponse = {
  ok?: boolean;
  error?: string;
};

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password
        })
      });
      const registerPayload = (await registerRes.json()) as RegisterResponse;
      if (!registerRes.ok) {
        throw new Error(registerPayload.error || "Failed to create account.");
      }

      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false
      });
      if (!signInResult || signInResult.error) {
        throw new Error("Account created, but auto sign-in failed. Please sign in manually.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Create account</h2>
        <p className="mt-2 text-sm text-slate-600">Register a new login to keep your own app state and linked data.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-slate-500">Name (optional)</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
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
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-slate-500">Confirm password</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
            />
          </div>
          {error ? <p className="text-xs text-rose-700">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2">
            Sign in
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

