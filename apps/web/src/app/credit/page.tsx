import type { Metadata } from "next";
import { CreditMonitoringWorkspace } from "@/components/credit/credit-monitoring-workspace";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import { getCreditOverview } from "@/lib/server/credit";

export const metadata: Metadata = buildMetadata({
  title: "Credit Monitoring and Report Workspace",
  description:
    "Track score movement, monitor report changes, review bureau alerts, and prepare a provider-ready credit experience for consumers and small businesses.",
  path: "/credit",
  keywords: [
    "credit monitoring app",
    "credit report dashboard",
    "consumer credit alerts",
    "credit score workspace",
    "small business financial wellness"
  ]
});

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const overview = await getCreditOverview();

  return (
    <>
      <PageHero
        eyebrow="Credit workspace"
        title="See report health, score movement, and monitoring alerts in one banking-grade surface."
        description="Northline’s credit module is structured for direct-to-consumer credit access: permission-aware enrollment, alert timelines, report summaries, and clean provider handoff points for bureau-backed integrations."
        primaryCta={{ href: "/signup", label: "Create account" }}
        secondaryCta={{ href: "/contact", label: "Discuss compliance rollout" }}
      />

      <section className="page-section pt-0">
        <Container>
          <CreditMonitoringWorkspace initialOverview={overview} />
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
