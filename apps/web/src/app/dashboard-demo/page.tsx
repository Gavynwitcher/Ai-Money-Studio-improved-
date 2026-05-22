import { CtaBanner } from "@/components/marketing/cta-banner";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export default function DashboardDemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Dashboard demo"
        title="A realistic product surface for balances, transactions, transfers, and future wellness tools."
        description="This page models the day-one customer experience: total balances, linked accounts, recent transactions, cash flow, transfer reviews, alerts, and staged credit and debt widgets."
        primaryCta={{ href: "/plaid-integration", label: "Try the Plaid demo flow" }}
        secondaryCta={{ href: "/signup", label: "Create account" }}
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
