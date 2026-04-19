import type { Metadata } from "next";
import { TransactionsWorkspace } from "@/components/transactions/transactions-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Categorized Bank Transactions and Cash Flow Dashboard",
  description:
    "View categorized bank transactions, search merchants, and understand cash flow across connected accounts in Northline.",
  path: "/transactions",
  keywords: [
    "categorized bank transactions",
    "cash flow dashboard",
    "transaction categorization app",
    "bank ledger dashboard"
  ]
});

export default function TransactionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Transactions"
        title="A categorized banking ledger for every connected account."
        description="See imported Plaid activity in one place, filter by category, search merchants, and understand cash flow the way a modern banking application should."
        primaryCta={{ href: "/plaid-integration", label: "Manage Plaid connection" }}
        secondaryCta={{ href: "/dashboard-demo", label: "View dashboard" }}
      />

      <section className="page-section pt-0">
        <Container>
          <TransactionsWorkspace />
        </Container>
      </section>
    </>
  );
}
