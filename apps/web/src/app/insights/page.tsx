import type { Metadata } from "next";
import { LiveFinanceWorkspace } from "@/components/v1/live-finance-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Read-Only Financial Insights",
  description: "Review informational insights generated from imported Plaid transaction rows.",
  path: "/insights"
});

export default function InsightsPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="See what changed across imported transactions."
        description="Northline highlights transaction patterns, recurring candidates, and review prompts without providing tax, legal, investment, credit, or lending advice."
        primaryCta={{ href: "/assistant", label: "Ask Northline AI" }}
        secondaryCta={{ href: "/transactions", label: "Review transactions" }}
      />
      <section className="page-section pt-0">
        <Container>
          <LiveFinanceWorkspace view="insights" />
        </Container>
      </section>
    </>
  );
}
