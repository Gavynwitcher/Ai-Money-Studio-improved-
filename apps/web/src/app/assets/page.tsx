import type { Metadata } from "next";
import { AssetsWorkspace } from "@/components/plaid/assets-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import { getAssetReport } from "@/lib/plaid/service";

export const metadata: Metadata = buildMetadata({
  title: "Plaid Assets for Underwriting and Asset Verification",
  description:
    "Review how Northline can support Plaid Assets workflows for underwriting, borrower asset verification, report retrieval, refresh cycles, and audit-copy handoffs.",
  path: "/assets",
  keywords: [
    "Plaid Assets",
    "asset verification workflow",
    "loan underwriting data",
    "asset report integration",
    "plaid asset report"
  ]
});

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const report = await getAssetReport();

  return (
    <>
      <PageHero
        eyebrow="Plaid Assets"
        title="A borrower asset desk for report review, balances, ownership evidence, and underwriting support."
        description="Northline uses Plaid Assets as an operating workspace for lending and verification teams. Instead of a marketing page, this module shows the report state, institutions, covered accounts, and handoff points needed for real underwriting workflows."
        primaryCta={{ href: "/assets#assets-workspace", label: "Open assets desk" }}
        secondaryCta={{ href: "/plaid-integration", label: "Open connection rail" }}
      />

      <section className="page-section pt-0" id="assets-workspace">
        <Container>
          <AssetsWorkspace report={report} />
        </Container>
      </section>
    </>
  );
}
