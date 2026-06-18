import type { Metadata } from "next";
import { LiveFinanceWorkspace } from "@/components/v1/live-finance-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Connected Accounts",
  description: "Review connected institutions and read-only account details in Northline.",
  path: "/accounts"
});

export default function AccountsPage() {
  return (
    <>
      <PageHero
        eyebrow="Accounts"
        title="Connected accounts and institutions."
        description="Review linked institutions, masked account identifiers, and read-only account information imported through Plaid."
        primaryCta={{ href: "/plaid-integration", label: "Manage connections" }}
        secondaryCta={{ href: "/transactions", label: "View transactions" }}
      />
      <section className="page-section pt-0">
        <Container>
          <LiveFinanceWorkspace view="accounts" />
        </Container>
      </section>
    </>
  );
}
