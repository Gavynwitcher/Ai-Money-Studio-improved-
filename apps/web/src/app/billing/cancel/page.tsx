import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "Billing Cancelled",
  robots: {
    index: false,
    follow: false
  }
};

export default function BillingCancelPage() {
  return (
    <>
      <PageHero
        eyebrow="Billing"
        title="Checkout was cancelled."
        description="No charge was completed. You can return to pricing at any time and restart Stripe Checkout when you are ready."
        primaryCta={{ href: "/pricing", label: "Back to pricing" }}
        secondaryCta={{ href: "/contact", label: "Talk to sales" }}
      />

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              No changes were made to your plan
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              This page is the safe return point after a canceled Stripe Checkout session. Your current access remains unchanged until a completed checkout reaches the webhook flow.
            </p>
          </Card>
        </Container>
      </section>
    </>
  );
}
