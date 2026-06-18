import type { Metadata } from "next";
import { AccountingWorkspace } from "@/components/accounting/accounting-workspace";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import { getAccountingOverview } from "@/lib/server/accounting";

export const metadata: Metadata = buildMetadata({
  title: "Accounting Workspace for Cash, AR, AP, and Reconciliation",
  description:
    "Run a QuickBooks-style accounting workflow with chart of accounts, receivables, payables, journal activity, and reconciliation tied to connected bank data.",
  path: "/accounting",
  keywords: [
    "accounting workspace",
    "quickbooks alternative",
    "chart of accounts dashboard",
    "accounts receivable and payable app",
    "bank reconciliation workspace"
  ]
});

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const overview = await getAccountingOverview();

  return (
    <>
      <PageHero
        eyebrow="Accounting"
        title="A bookkeeping desk for cash, receivables, payables, and close-ready cleanup."
        description="Northline now includes a QuickBooks-style accounting workspace so operators can track bank-linked cash against books, manage AR and AP, review journal activity, and clear reconciliation items in one surface."
        primaryCta={{ href: "/transactions", label: "Review bank activity" }}
        secondaryCta={{ href: "/dashboard-demo", label: "Open dashboard" }}
      />

      <section className="page-section pt-0">
        <Container>
          <AccountingWorkspace initialOverview={overview} />
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
