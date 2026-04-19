"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AuthMode = "signin" | "signup" | "forgot" | "verify";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [serverError, setServerError] = useState("");

  const error = useMemo(() => {
    if (mode !== "verify" && !/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if ((mode === "signin" || mode === "signup") && password.length < 8) {
      return "Passwords should be at least 8 characters for this demo.";
    }
    if (mode === "signup" && name.trim().length < 2) return "Enter your full name.";
    if (mode === "verify" && code.trim().length < 6) return "Enter the 6-digit verification code.";
    return "";
  }, [code, email, mode, name, password]);

  const titles: Record<AuthMode, { title: string; body: string; button: string }> = {
    signin: {
      title: "Welcome back",
      body: "Access balances, linked institutions, and transfer activity in one place.",
      button: "Sign in"
    },
    signup: {
      title: "Create your account",
      body: "Start the early access flow for consumers and small businesses evaluating multi-bank visibility.",
      button: "Create account"
    },
    forgot: {
      title: "Reset your password",
      body: "Send a recovery email so users can regain access to their dashboard.",
      button: "Send reset link"
    },
    verify: {
      title: "Verify your email",
      body: "Confirm ownership before enabling account linking and sensitive workflows.",
      button: "Verify email"
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (error) {
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setServerError("");
      const callbackUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("callbackUrl") || "/contact-inbox"
          : "/contact-inbox";

      if (mode === "signin") {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl
        });

        if (!result?.ok) {
          throw new Error("Email or password is incorrect.");
        }

        setStatus("success");
        router.push(result.url || callbackUrl);
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name })
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to create account.");
        }

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl
        });
        if (!result?.ok) {
          throw new Error("Account created, but automatic sign-in failed.");
        }

        setStatus("success");
        router.push(result.url || callbackUrl);
        router.refresh();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setServerError(submissionError instanceof Error ? submissionError.message : "Unable to complete the request.");
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl rounded-[32px] p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--teal)]">
        {mode === "signin" || mode === "signup" ? "Secure account access" : "Frontend auth mock"}
      </p>
      <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
        {titles[mode].title}
      </h1>
      <p className="mt-4 text-base leading-7 text-[var(--muted)]">{titles[mode].body}</p>

      <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              placeholder="Taylor Brooks"
            />
          </label>
        ) : null}

        {mode === "verify" ? (
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Verification code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              placeholder="123456"
            />
          </label>
        ) : (
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              placeholder="name@example.com"
            />
          </label>
        )}

        {mode === "signin" || mode === "signup" ? (
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              placeholder="********"
            />
          </label>
        ) : null}

        {status === "error" && error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {serverError ? <p className="text-sm text-[var(--danger)]">{serverError}</p> : null}
        {status === "success" ? (
          <p className="rounded-2xl bg-[rgba(30,142,99,0.12)] px-4 py-3 text-sm text-[var(--success)]">
            {mode === "signin" || mode === "signup"
              ? "Success. Redirecting you to the protected workspace."
              : "Demo state complete. In production, this form would call your auth provider and persist session state."}
          </p>
        ) : null}

        <Button>{status === "loading" ? "Working..." : titles[mode].button}</Button>
      </form>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
        <Link href="/signin" className="hover:text-[var(--navy)]">
          Sign in
        </Link>
        <Link href="/signup" className="hover:text-[var(--navy)]">
          Sign up
        </Link>
        <Link href="/forgot-password" className="hover:text-[var(--navy)]">
          Forgot password
        </Link>
        <Link href="/verify-email" className="hover:text-[var(--navy)]">
          Verify email
        </Link>
      </div>
    </Card>
  );
}
