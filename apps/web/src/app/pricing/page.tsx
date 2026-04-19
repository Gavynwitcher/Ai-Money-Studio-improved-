import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { comparisonRows, pricingPlans } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pricing for Multi-Bank Account Aggregation and Plaid-Powered Banking Tools",
  description:
    "Review pricing for Northline, including free and paid options for connected bank accounts, transaction visibility, and future transfer workflows.",
  path: "/pricing",
  keywords: [
    "bank account aggregation pricing",
    "plaid app pricing",
    "small business banking software pricing",
    "consumer banking dashboard pricing"
  ]
});

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="A premium fintech experience without enterprise-tool pricing."
        description="The MVP pricing model is designed to test cost sensitivity, subscription appetite, and transfer-fee tolerance across consumers and small businesses."
        primaryCta={{ href: "/signup", label: "Start free" }}
        secondaryCta={{ href: "/contact", label: "Request custom demo" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`rounded-[32px] ${plan.accent ? "bg-[var(--navy)] text-white" : ""}`}
              >
                {plan.accent ? <Badge className="bg-white/15 text-white">Most flexible</Badge> : <Badge tone="teal">Launch plan</Badge>}
                <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em]">{plan.name}</h2>
                <p className={`mt-3 text-5xl font-semibold tracking-[-0.05em] ${plan.accent ? "text-white" : "text-[var(--navy)]"}`}>
                  {plan.price}
                </p>
                <p className={`mt-4 text-sm leading-7 ${plan.accent ? "text-cyan-50/85" : "text-[var(--muted)]"}`}>{plan.subtitle}</p>
                <div className="mt-6 grid gap-3">
                  {plan.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className={`rounded-[20px] border px-4 py-3 text-sm ${
                        plan.accent ? "border-white/10 bg-white/10 text-white" : "border-[var(--line)] bg-white/75 text-[var(--navy)]"
                      }`}
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button href="/signup" variant={plan.accent ? "secondary" : "primary"}>
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <Card className="overflow-hidden rounded-[32px] p-0">
            <div className="border-b border-[var(--line)] px-6 py-6 sm:px-8">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">Plan comparison</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Structured for experimentation across free, subscription, and pay-as-you-go pricing models.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/75 text-left text-sm">
                <thead className="bg-slate-900/5 text-[var(--navy)]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Capability</th>
                    <th className="px-6 py-4 font-semibold">Starter</th>
                    <th className="px-6 py-4 font-semibold">Hub Plus</th>
                    <th className="px-6 py-4 font-semibold">Transfer Flex</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-t border-[var(--line)]">
                      <td className="px-6 py-4 font-medium text-[var(--navy)]">{row.label}</td>
                      <td className="px-6 py-4 text-[var(--muted)]">{row.starter}</td>
                      <td className="px-6 py-4 text-[var(--muted)]">{row.plus}</td>
                      <td className="px-6 py-4 text-[var(--muted)]">{row.flex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
