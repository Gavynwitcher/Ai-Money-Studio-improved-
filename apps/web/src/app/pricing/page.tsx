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
        title="Simple pricing built for connected banking, not enterprise overhead."
        description="Northline keeps the launch model straightforward: free visibility to get started, a full workspace tier for active users, and transfer pricing that stays transparent before review."
        primaryCta={{ href: "/signup", label: "Start free" }}
        secondaryCta={{ href: "/contact", label: "Request custom demo" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[32px] border p-6 ${
                  plan.accent
                    ? "border-[#163c8d] bg-gradient-to-b from-[#163c8d] via-[#102b72] to-[#0b1e55] text-white shadow-[0_28px_70px_rgba(16,43,114,0.24)]"
                    : "bank-panel shadow-[0_18px_42px_rgba(11,31,51,0.08)]"
                }`}
              >
                <div className="flex min-h-[35rem] flex-col">
                <div className="flex items-center justify-between gap-3">
                  {plan.accent ? (
                    <Badge className="border border-white/12 bg-white/12 text-white shadow-none">{plan.badge}</Badge>
                  ) : (
                    <Badge tone="teal">{plan.badge}</Badge>
                  )}
                  {plan.name === "Transfer Flex" ? (
                    <span className="rounded-full border border-[var(--line)] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Same-day
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em]">{plan.name}</h2>
                <p className={`mt-4 text-5xl font-semibold tracking-[-0.05em] ${plan.accent ? "text-white" : "text-[var(--navy)]"}`}>
                  {plan.price}
                </p>
                <p className={`mt-4 text-sm leading-7 ${plan.accent ? "text-slate-100" : "text-[var(--muted)]"}`}>{plan.subtitle}</p>
                {"detail" in plan && plan.detail ? (
                  <div
                    className={`mt-5 rounded-[22px] border px-4 py-4 text-sm leading-6 ${
                      plan.accent
                        ? "border-white/14 bg-[#eff6ff] text-[#17345f] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                        : "border-[var(--line)] bg-[var(--sky)] text-[var(--navy)]"
                    }`}
                  >
                    {plan.detail}
                  </div>
                ) : null}
                <div className="mt-6 grid gap-3">
                  {plan.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className={`rounded-[20px] border px-4 py-3 text-sm ${
                        plan.accent
                          ? "border-white/12 bg-white/8 text-slate-50"
                          : "border-[var(--line)] bg-white/75 text-[var(--navy)]"
                      }`}
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-7">
                  <Button
                    href="/signup"
                    variant={plan.accent ? "secondary" : "primary"}
                    className={plan.accent ? "w-full" : "w-full"}
                  >
                    {plan.cta}
                  </Button>
                  {plan.name === "Transfer Flex" ? (
                    <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
                      Final per-transfer fee may vary by route, bank coverage, timing, and compliance requirements.
                    </p>
                  ) : null}
                </div>
                </div>
              </div>
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
                Structured to compare the free workspace, the premium Northline Plus tier, and same-day transfer pricing.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/75 text-left text-sm">
                <thead className="bg-slate-900/5 text-[var(--navy)]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Capability</th>
                    <th className="px-6 py-4 font-semibold">Starter</th>
                    <th className="px-6 py-4 font-semibold">Northline Plus</th>
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
