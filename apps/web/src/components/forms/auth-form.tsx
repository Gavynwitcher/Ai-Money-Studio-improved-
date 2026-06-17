"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BillingPlanKey } from "@/lib/stripe/config";

type AuthMode = "signin" | "signup" | "forgot" | "verify";
type CheckoutPlanKey = Exclude<BillingPlanKey, "starter">;

type SignupOptions = {
  defaultPlan?: BillingPlanKey;
  stripeConfigured: boolean;
  checkoutReadyPlans: BillingPlanKey[];
};

const signupPlanCards: Array<{
  key: BillingPlanKey;
  title: string;
  price: string;
  description: string;
  badge: string;
}> = [
  {
    key: "starter",
    title: "Starter",
    price: "$0",
    description: "Create your account and enter the workspace with free access to core visibility tools.",
    badge: "Free"
  },
  {
    key: "hub_plus",
    title: "Hub Plus",
    price: "$19/mo",
    description: "Create your account and continue directly into Stripe Checkout for the monthly subscription.",
    badge: "Subscription"
  },
  {
    key: "transfer_flex",
    title: "Transfer Flex",
    price: "From $2",
    description: "Create your account and continue into Stripe Checkout for the pay-as-you-go transfer path.",
    badge: "Usage-based"
  }
];

function isBillingPlanKey(value: string | null): value is BillingPlanKey {
  return value === "starter" || value === "hub_plus" || value === "transfer_flex";
}

function isPaidPlan(plan: BillingPlanKey): plan is CheckoutPlanKey {
  return plan === "hub_plus" || plan === "transfer_flex";
}

export function AuthForm({ mode, signupOptions }: { mode: AuthMode; signupOptions?: SignupOptions }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const defaultPlan = signupOptions?.defaultPlan && isBillingPlanKey(signupOptions.defaultPlan) ? signupOptions.defaultPlan : "starter";
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanKey>(defaultPlan);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [serverError, setServerError] = useState("");
  const checkoutReadyPlans = useMemo(() => new Set(signupOptions?.checkoutReadyPlans ?? []), [signupOptions?.checkoutReadyPlans]);

  const error = useMemo(() => {
    if (mode !== "verify" && !/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if ((mode === "signin" || mode === "signup") && password.length < 8) {
      return "Passwords should be at least 8 characters for this demo.";
    }
    if (mode === "signup" && name.trim().length < 2) return "Enter your full name.";
    if (mode === "signup" && !acceptedTerms) {
      return "Accept the Terms of Service and Privacy Policy to create an account.";
    }
    if (mode === "verify" && code.trim().length < 6) return "Enter the 6-digit verification code.";
    if (mode === "signup" && isPaidPlan(selectedPlan) && (!signupOptions?.stripeConfigured || !checkoutReadyPlans.has(selectedPlan))) {
      return "This payment option is not ready yet. Choose Starter or finish Stripe setup first.";
    }
    return "";
  }, [acceptedTerms, checkoutReadyPlans, code, email, mode, name, password, selectedPlan, signupOptions?.stripeConfigured]);

  const titles: Record<AuthMode, { title: string; body: string; button: string }> = {
    signin: {
      title: "Welcome back",
      body: "Access balances, linked institutions, and transfer activity in one place.",
      button: "Sign in"
    },
    signup: {
      title: "Create your account",
      body: "Start your Northline account, choose how you want to begin, and move into Stripe Checkout if you want a paid plan on day one.",
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

  const submitLabel =
    mode === "signup"
      ? selectedPlan === "starter"
        ? "Create account"
        : `Create account and continue to ${selectedPlan === "hub_plus" ? "Stripe subscription" : "Stripe payment"}`
      : titles[mode].button;

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
          ? new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard-demo"
          : "/dashboard-demo";

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
          body: JSON.stringify({ email, password, name, acceptedTerms })
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
        if (isPaidPlan(selectedPlan)) {
          window.location.href = `/billing/launch?plan=${selectedPlan}`;
          return;
        }

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
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--navy)]">Choose how you want to start</p>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Payment handled by Stripe
              </span>
            </div>
            <div className="grid gap-3">
              {signupPlanCards.map((plan) => {
                const planReady = plan.key === "starter" || (signupOptions?.stripeConfigured && checkoutReadyPlans.has(plan.key));
                const active = selectedPlan === plan.key;

                return (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => setSelectedPlan(plan.key)}
                    disabled={!planReady}
                    className={`rounded-[24px] border p-4 text-left transition ${
                      active
                        ? "border-[var(--teal)] bg-[rgba(64,181,183,0.08)] shadow-[0_18px_36px_rgba(11,31,51,0.06)]"
                        : "border-[var(--line)] bg-white hover:border-[var(--ocean)]"
                    } ${!planReady ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[var(--navy)]">{plan.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-[var(--navy)]">{plan.price}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                          {planReady ? plan.badge : "Setup required"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs leading-6 text-[var(--muted)]">
              Northline creates your account first. If you choose a paid option, you&apos;ll move into Stripe Checkout immediately after signup.
            </p>
          </div>
        ) : null}

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

        {mode === "signup" ? (
          <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white/80 p-4 text-sm leading-6 text-[var(--muted)]">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--line)] accent-[var(--teal)]"
            />
            <span>
              I agree to Northline&apos;s{" "}
              <Link href="/legal/terms" className="font-semibold text-[var(--navy)] underline-offset-4 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="font-semibold text-[var(--navy)] underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              . I understand Northline is a private-beta financial visibility platform, not a bank, lender,
              credit repair organization, investment adviser, or money transmitter.
            </span>
          </label>
        ) : null}

        {status === "error" && error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {serverError ? <p className="text-sm text-[var(--danger)]">{serverError}</p> : null}
        {status === "success" ? (
          <p className="rounded-2xl bg-[rgba(30,142,99,0.12)] px-4 py-3 text-sm text-[var(--success)]">
            {mode === "signin" || mode === "signup"
              ? mode === "signup" && isPaidPlan(selectedPlan)
                ? "Account created. Redirecting you into secure Stripe Checkout."
                : "Success. Redirecting you to the protected workspace."
              : "Demo state complete. In production, this form would call your auth provider and persist session state."}
          </p>
        ) : null}

        <Button>{status === "loading" ? "Working..." : submitLabel}</Button>
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
