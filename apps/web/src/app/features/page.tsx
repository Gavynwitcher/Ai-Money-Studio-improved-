import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { StatusChip } from "@/components/marketing/status-chip";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { featureCategories } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Bank Account Aggregation, Transfers, and Financial Wellness Features",
  description:
    "Explore Unified Banking Hub features for multi-bank account aggregation, balance visibility, transaction summaries, transfer workflows, and future credit and debt support tools.",
  path: "/features",
  keywords: [
    "bank account aggregation features",
    "plaid integration features",
    "bank transfer workflow app",
    "financial wellness tools"
  ]
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform features"
        title="Everything the MVP needs today, with a roadmap users can trust."
        description="Unified Banking Hub is structured to validate account visibility, linked-institution management, transaction summaries, transfer workflow interest, and future demand for financial wellness tools."
        primaryCta={{ href: "/dashboard-demo", label: "View dashboard demo" }}
        secondaryCta={{ href: "/pricing", label: "Explore pricing" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {featureCategories.map((feature) => (
              <Card key={feature.title} className="rounded-[30px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">{feature.title}</h2>
                  <StatusChip status={feature.status} />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{feature.description}</p>
                <div className="mt-5 grid gap-3">
                  {feature.bullets.map((bullet) => (
                    <div key={bullet} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm text-[var(--navy)]">
                      {bullet}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
