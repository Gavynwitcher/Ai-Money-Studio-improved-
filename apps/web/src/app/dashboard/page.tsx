import type { Metadata } from "next";
import { LiveFinanceWorkspace } from "@/components/v1/live-finance-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Read-Only Financial Dashboard",
  description: "Monitor connected institutions, imported transactions, cash flow, and read-only Northline insights.",
  path: "/dashboard"
});

export default function DashboardPage() {
  return (
    <>
      <PageHero
        eyebrow="Dashboard"
        title="Your read-only financial command center."
        description="Connect accounts, monitor imported transactions, understand cash flow, and review informational insights. Northline does not move money, hold funds, or execute banking actions."
        primaryCta={{ href: "/plaid-integration", label: "Connect accounts" }}
        secondaryCta={{ href: "/assistant", label: "Ask Northline AI" }}
      />
      <section className="page-section pt-0">
        <Container>
          <LiveFinanceWorkspace view="dashboard" />
        </Container>
      </section>
    </>
  );
}
