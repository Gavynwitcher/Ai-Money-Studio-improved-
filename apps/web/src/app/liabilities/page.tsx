import type { Metadata } from "next";
import { LiabilitiesWorkspace } from "@/components/plaid/liabilities-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import { getLiabilities } from "@/lib/plaid/service";

export const metadata: Metadata = buildMetadata({
  title: "Plaid Liabilities for Debt Verification and Loan Visibility",
  description:
    "Review how Northline can use Plaid Liabilities to surface mortgage, credit card, and student loan details for debt verification, refinance reviews, and payment monitoring.",
  path: "/liabilities",
  keywords: [
    "Plaid Liabilities",
    "debt verification workflow",
    "mortgage liability data",
    "student loan visibility",
    "credit card liabilities integration"
  ]
});

export const dynamic = "force-dynamic";

export default async function LiabilitiesPage() {
  const overview = await getLiabilities();

  return (
    <>
      <PageHero
        eyebrow="Plaid Liabilities"
        title="A debt-verification workspace for credit cards, student loans, mortgages, and refinance prep."
        description="Northline uses Plaid Liabilities as an operating desk, not a brochure. This module is built to surface due dates, payment obligations, APR detail, and loan terms in a format the user can act on."
        primaryCta={{ href: "/liabilities#liabilities-workspace", label: "Open debt desk" }}
        secondaryCta={{ href: "/plaid-integration", label: "Open connection rail" }}
      />

      <section className="page-section pt-0" id="liabilities-workspace">
        <Container>
          <LiabilitiesWorkspace overview={overview} />
        </Container>
      </section>
    </>
  );
}
