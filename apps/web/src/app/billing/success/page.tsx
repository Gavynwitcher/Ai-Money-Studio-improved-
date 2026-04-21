import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "Billing Success",
  robots: {
    index: false,
    follow: false
  }
};

export default function BillingSuccessPage() {
  return (
    <>
      <PageHero
        eyebrow="Billing"
        title="Stripe checkout completed."
        description="Your payment was submitted successfully. Stripe will confirm the subscription or purchase, and the platform will update billing access through the webhook flow."
        primaryCta={{ href: "/pricing", label: "Return to pricing" }}
        secondaryCta={{ href: "/dashboard-demo", label: "Open dashboard demo" }}
      />

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              What happens next
            </h2>
            <div className="mt-6 grid gap-3 text-sm leading-7 text-[var(--muted)]">
              <p>Stripe sends a `checkout.session.completed` event to the webhook endpoint.</p>
              <p>The app creates or updates the customer and subscription record in Prisma.</p>
              <p>Your paid plan or billing status becomes visible on the pricing page and in future gated features.</p>
            </div>
            <p className="mt-6 text-sm text-[var(--muted)]">
              Need to review invoices or payment methods later? Use the{" "}
              <Link href="/pricing" className="font-semibold text-[var(--navy)] hover:underline">
                manage billing
              </Link>{" "}
              control once the customer portal is enabled.
            </p>
          </Card>
        </Container>
      </section>
    </>
  );
}
