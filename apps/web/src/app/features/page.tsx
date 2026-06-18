import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { StatusChip } from "@/components/marketing/status-chip";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { featureCategories } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Bank Account Aggregation and Transaction Intelligence Features",
  description:
    "Explore Northline features for multi-bank account aggregation, balance visibility, transaction summaries, cash-flow review, and AI transaction insights.",
  path: "/features",
  keywords: [
    "bank account aggregation features",
    "plaid integration features",
    "transaction intelligence app",
    "cash flow visibility tools"
  ]
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform features"
        title="Read-only visibility for connected accounts and imported transactions."
        description="Northline v1 focuses on account aggregation, linked-institution management, transaction summaries, cash-flow review, and AI insights based only on imported transaction rows."
        primaryCta={{ href: "/dashboard", label: "Open dashboard" }}
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
