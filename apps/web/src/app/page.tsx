import type { Metadata } from "next";
import Link from "next/link";
import { StatusChip } from "@/components/marketing/status-chip";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  audienceCards,
  comparisonRows,
  faqs,
  featureCategories,
  howItWorks,
  pricingPlans,
  testimonials,
  trustPillars
} from "@/data/site";
import { buildMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { currency } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Multi-Bank Account Dashboard for Consumers and Small Businesses",
  description:
    "Manage bank accounts from multiple institutions in one dashboard with Plaid-powered connectivity, transaction visibility, and transfer workflow previews.",
  path: "/",
  keywords: [
    "multi bank account dashboard",
    "plaid powered banking app",
    "bank account aggregation for small business",
    "consumer financial dashboard",
    "bank transaction dashboard"
  ]
});

export default function HomePage() {
  const homeSchema = [organizationJsonLd(), websiteJsonLd()];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <section className="page-section overflow-hidden pt-14 sm:pt-18">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="reveal">
              <Badge tone="gold">Affordable alternative to enterprise treasury tools</Badge>
              <h1 className="mt-6 max-w-3xl font-heading text-5xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-6xl lg:text-[4.4rem]">
                Manage all your bank accounts in one place.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                Connect accounts across institutions, monitor balances and transactions, and
                simplify transfers with an affordable platform built for consumers and small business owners.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/plaid-integration">Connect your bank</Button>
                <Button href="/dashboard-demo" variant="secondary">
                  Explore the dashboard
                </Button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="bank-stat rounded-[22px] p-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">Target users</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">Consumers + SMBs</p>
                </div>
                <div className="bank-stat rounded-[22px] p-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">Core MVP scope</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">Aggregation + transfers</p>
                </div>
                <div className="bank-stat rounded-[22px] p-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">Pricing posture</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">Premium feel, lower cost</p>
                </div>
              </div>
            </div>

            <div className="bank-shell reveal relative overflow-hidden rounded-[34px] p-5 text-white sm:p-6">
              <div className="hero-orb -left-2 top-14 h-24 w-24 bg-[rgba(25,106,117,0.18)]" />
              <div className="hero-orb right-6 top-6 h-20 w-20 bg-[rgba(200,164,90,0.16)]" />
              <div className="grid gap-5">
                <div className="bank-stat-dark rounded-[28px] p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/80">Unified balance</p>
                  <p className="mt-3 font-heading text-5xl font-semibold tracking-[-0.05em]">{currency(259370)}</p>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="bank-stat-dark rounded-[20px] p-3">
                      <p className="text-cyan-100/80">Institutions</p>
                      <p className="mt-2 font-semibold">3 linked</p>
                    </div>
                    <div className="bank-stat-dark rounded-[20px] p-3">
                      <p className="text-cyan-100/80">Transfers</p>
                      <p className="mt-2 font-semibold">1 in review</p>
                    </div>
                    <div className="bank-stat-dark rounded-[20px] p-3">
                      <p className="text-cyan-100/80">Monitoring</p>
                      <p className="mt-2 font-semibold">Credit soon</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bank-stat rounded-[24px] p-5 text-[var(--navy)]">
                    <p className="text-sm font-semibold text-[var(--navy)]">Transfer workflow</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      Review routing, fee visibility, and status steps before initiating supported movement.
                    </p>
                    <div className="bank-panel-muted mt-4 rounded-[18px] p-4 text-sm text-[var(--navy)]">
                      Reserve to Operating · {currency(2500)} · fee preview {currency(2)}
                    </div>
                  </div>
                  <div className="bank-stat rounded-[24px] p-5 text-[var(--navy)]">
                    <p className="text-sm font-semibold text-[var(--navy)]">Roadmap signals</p>
                    <div className="mt-4 space-y-3">
                      <StatusChip status="available-now" />
                      <StatusChip status="mvp" />
                      <StatusChip status="coming-soon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px] p-8 sm:p-10">
            <SectionHeading
              eyebrow="Core problem"
              title="Too many users still manage money by bank login roulette."
              description="Consumers and small business owners often spread funds across multiple institutions, but most tools either feel fragmented, too expensive, or built for much larger finance teams."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {audienceCards.map((card) => (
                <div key={card.title} className="rounded-[26px] border border-[var(--line)] bg-white/70 p-5">
                  <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{card.copy}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <section className="page-section">
        <Container>
            <SectionHeading
              eyebrow="How it works"
              title="A simple path from fragmented banking to one connected operating view."
              description="The platform is organized around a short, understandable flow: connect institutions, review cash and transactions, then move into the workflows that matter."
            />
          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <Card key={item.step} className="rounded-[28px]">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">{item.step}</p>
                <h3 className="mt-4 font-heading text-2xl font-semibold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
            <SectionHeading
              eyebrow="Feature preview"
              title="Built for visibility first, then action."
              description="The product stays focused on the core day-to-day banking workflows first, with more advanced tools clearly staged for later."
            />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {featureCategories.slice(0, 4).map((feature) => (
              <Card key={feature.title} className="rounded-[28px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">{feature.title}</h3>
                  <StatusChip status={feature.status} />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{feature.description}</p>
                <div className="mt-5 grid gap-2 text-sm text-[var(--navy)]">
                  {feature.bullets.map((bullet) => (
                    <p key={bullet}>• {bullet}</p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Button href="/features" variant="secondary">
              View all platform features
            </Button>
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <SectionHeading
            eyebrow="Dashboard demo"
            title="A premium dashboard that still feels approachable."
            description="The mock product experience is styled as a real operating workspace, with realistic cards, alerts, cash flow summaries, and staged wellness widgets."
          />
          <div className="mt-10">
            <DashboardWidgets />
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <SectionHeading
            eyebrow="Trust and security"
            title="Clear enough for customers, careful enough for compliance review."
            description="Messaging emphasizes secure third-party integrations, honest staging of capabilities, and realistic language around transfer approvals and regulated services."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {trustPillars.map((pillar) => (
              <Card key={pillar.title} className="rounded-[28px]">
                <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">{pillar.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{pillar.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[32px]">
              <SectionHeading
                eyebrow="Pricing preview"
                title="Flexible enough for cost-sensitive users."
                description="Northline keeps the plan structure simple so users can start with visibility and grow into richer workflows when they need them."
              />
              <div className="mt-8 grid gap-4">
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-[26px] border p-5 ${
                      plan.accent
                        ? "border-[rgba(10,37,64,0.12)] bg-[var(--navy)] text-white"
                        : "border-[var(--line)] bg-white/75"
                    }`}
                  >
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${plan.accent ? "text-cyan-100/80" : "text-[var(--teal)]"}`}>
                          {plan.name}
                        </p>
                        <p className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">{plan.price}</p>
                      </div>
                      <Link href="/pricing" className={`text-sm font-semibold ${plan.accent ? "text-white" : "text-[var(--navy)]"}`}>
                        {plan.cta}
                      </Link>
                    </div>
                    <p className={`mt-3 text-sm leading-7 ${plan.accent ? "text-cyan-50/85" : "text-[var(--muted)]"}`}>
                      {plan.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[32px]">
              <SectionHeading
                eyebrow="Included now"
                title="Start with the essentials and keep the workflow focused."
                description="The platform is easiest to use when it emphasizes a few clear tasks: connect accounts, review transactions, understand balances, and get help when you need it."
              />
              <div className="mt-8 grid gap-3">
                {[
                  "One connected view for balances across institutions",
                  "Categorized transaction review with cash flow context",
                  "A guided Plaid connection flow with live handoff points",
                  "Clear pricing and support paths without enterprise complexity"
                ].map((item) => (
                  <div key={item} className="ledger-row rounded-[22px] px-4 py-4 text-sm font-medium text-[var(--navy)]">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/pricing" variant="secondary">
                  Compare plans
                </Button>
                <Button href="/contact" variant="secondary">
                  Talk to the team
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <SectionHeading
            eyebrow="Customer voice"
            title="Clear enough for everyday users and disciplined enough for operators."
            description="The interface is intentionally designed to feel calm, understandable, and useful across both consumer and small-business use cases."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="rounded-[28px]">
                <p className="text-base leading-8 text-[var(--navy)]">“{testimonial.quote}”</p>
                <p className="mt-6 font-semibold text-[var(--navy)]">{testimonial.name}</p>
                <p className="text-sm text-[var(--muted)]">{testimonial.role}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <SectionHeading
              eyebrow="Quick FAQ"
              title="Short answers to the most common questions."
              description="The full FAQ page covers security, pricing, feature staging, and how account linking works."
            />
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {faqs.slice(0, 3).map((faq) => (
                <div key={faq.question} className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
                  <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
