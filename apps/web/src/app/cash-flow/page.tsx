import type { Metadata } from "next";
import { LiveFinanceWorkspace } from "@/components/v1/live-finance-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cash Flow",
  description: "Understand inflow, outflow, category pressure, and tax reserve estimates from imported transactions.",
  path: "/cash-flow"
});

export default function CashFlowPage() {
  return (
    <>
      <PageHero
        eyebrow="Cash flow"
        title="Understand cash flow from imported transactions."
        description="Northline summarizes inflow, outflow, category pressure, and simple reserve estimates from read-only Plaid transaction data."
        primaryCta={{ href: "/plaid-integration", label: "Refresh bank data" }}
        secondaryCta={{ href: "/insights", label: "View insights" }}
      />
      <section className="page-section pt-0">
        <Container>
          <LiveFinanceWorkspace view="cash-flow" />
        </Container>
      </section>
    </>
  );
}
