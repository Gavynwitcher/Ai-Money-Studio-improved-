import { CtaBanner } from "@/components/marketing/cta-banner";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export default function DashboardDemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Dashboard demo"
        title="A demo-only product surface for balances, transactions, and cash-flow review."
        description="This page uses sample data for presentation only. The signed-in dashboard uses imported Plaid data when accounts are connected."
        primaryCta={{ href: "/plaid-integration", label: "Try the Plaid demo flow" }}
        secondaryCta={{ href: "/transactions", label: "Open transactions" }}
      />

      <section className="page-section pt-0">
        <Container>
          <DashboardWidgets />
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
