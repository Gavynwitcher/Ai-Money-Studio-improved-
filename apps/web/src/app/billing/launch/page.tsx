import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { createCheckoutSession, requireBillingUser } from "@/lib/server/billing";
import type { BillingPlanKey } from "@/lib/stripe/config";

export const metadata: Metadata = {
  title: "Launch Billing",
  robots: {
    index: false,
    follow: false
  }
};

function isBillingPlanKey(value: string | undefined): value is Exclude<BillingPlanKey, "starter"> {
  return value === "hub_plus" || value === "transfer_flex";
}

export default async function BillingLaunchPage({
  searchParams
}: {
  searchParams?: { plan?: string };
}) {
  const plan = searchParams?.plan;

  if (!isBillingPlanKey(plan)) {
    redirect("/pricing");
  }

  try {
    const user = await requireBillingUser();
    const session = await createCheckoutSession({
      user,
      planKey: plan
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    redirect(session.url);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message === "AUTH_REQUIRED"
          ? "Sign in again to continue into Stripe Checkout."
          : error.message === "PLAN_NOT_CONFIGURED"
            ? "This pricing path is not connected to Stripe yet."
            : error.message
        : "Unable to start the billing flow.";

    return (
      <section className="page-section pt-16">
        <Container>
          <Card className="mx-auto max-w-2xl rounded-[32px] p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--teal)]">Billing handoff</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
              We couldn&apos;t open Stripe Checkout
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              {message} Return to pricing or sign in again before retrying the billing flow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-[rgba(11,31,51,0.18)] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(11,31,51,0.18)] transition hover:bg-[#122c46]"
              >
                Back to pricing
              </a>
              <a
                href={`/signin?callbackUrl=${encodeURIComponent(`/billing/launch?plan=${plan}`)}`}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--ocean)]"
              >
                Sign in
              </a>
            </div>
          </Card>
        </Container>
      </section>
    );
  }
}
