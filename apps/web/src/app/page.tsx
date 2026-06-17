import type { Metadata } from "next";
import Link from "next/link";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { faqs, testimonials, trustPillars } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Read-Only Financial Command Center",
  description:
    "Northline helps users connect bank accounts, monitor imported transactions, understand cash flow, and review read-only financial insights from one secure workspace.",
  path: "/",
  keywords: [
    "northline finance workspace",
    "multi-bank dashboard",
    "plaid account aggregation",
    "transaction intelligence",
    "cash flow visibility"
  ]
});

const heroStats = [
  ["Core v1 scope", "Account aggregation + transaction intelligence"],
  ["Data posture", "Permissioned bank connections"],
  ["Product stance", "Read-only financial overview"]
];

const workflow = [
  {
    step: "01",
    title: "Connect accounts securely",
    copy: "Use Plaid to link supported institutions without sharing bank passwords directly with Northline."
  },
  {
    step: "02",
    title: "Import transactions",
    copy: "Northline organizes supported transaction rows, account names, categories, dates, and cash-flow direction."
  },
  {
    step: "03",
    title: "Understand cash flow",
    copy: "Review recent inflow, outflow, net cash flow, top categories, recurring activity, and large changes."
  },
  {
    step: "04",
    title: "Ask for read-only insights",
    copy: "Northline AI summarizes imported transaction records only and keeps suggestions informational."
  }
];

const v1Features = [
  {
    title: "Connected institutions",
    copy: "See which banks are linked, when they last refreshed, and which accounts were imported."
  },
  {
    title: "Transaction review",
    copy: "Filter and review imported activity by merchant, category, account, status, and direction."
  },
  {
    title: "Cash-flow visibility",
    copy: "Track 30-day inflow, outflow, net position, spending categories, and recurring candidates."
  },
  {
    title: "AI transaction insights",
    copy: "Ask questions that are answered from live imported Plaid transaction rows for the signed-in user."
  }
];

function ProductPreview() {
  return (
    <div className="rounded-[34px] bg-[linear-gradient(145deg,#081628_0%,#123a5f_100%)] p-6 text-white shadow-[0_30px_80px_rgba(8,23,41,0.22)]">
      <div className="rounded-[28px] border border-white/12 bg-white/10 p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.32em] text-cyan-100/80">Read-only workspace</p>
        <p className="mt-4 font-heading text-5xl font-semibold tracking-[-0.05em]">Cash flow, clearly organized</p>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
          Connect accounts, import supported transaction history, and review what changed across your financial activity.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Institutions", "Linked"],
            ["Transactions", "Categorized"],
            ["AI", "Source-limited"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[18px] border border-white/12 bg-white/8 p-4">
              <p className="text-sm text-slate-200">{label}</p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] bg-white p-5 text-[var(--navy)]">
          <h3 className="font-heading text-lg font-semibold">Transaction intelligence</h3>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Review categories, recurring vendors, larger expenses, and recent income activity from imported rows.
          </p>
        </div>
        <div className="rounded-[24px] bg-white p-5 text-[var(--navy)]">
          <h3 className="font-heading text-lg font-semibold">V1 guardrails</h3>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Northline does not hold funds, initiate bank actions, or provide tax, legal, investment, credit, or lending advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="page-section pt-16 sm:pt-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge tone="gold">Read-only Plaid-connected command center</Badge>
              <h1 className="mt-6 max-w-3xl font-heading text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                See what changed across your money.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-9 text-[var(--muted)]">
                Northline is a read-only financial command center that helps you connect accounts, monitor imported
                transactions, understand cash flow, and review informational AI insights in one secure workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/plaid-integration"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--navy)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(11,31,51,0.18)]"
                >
                  Connect an account
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white/90 px-6 py-3 text-sm font-semibold text-[var(--navy)]"
                >
                  Open dashboard
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroStats.map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-[var(--line)] bg-white/85 p-5 shadow-[0_18px_40px_rgba(8,23,41,0.04)]">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
                    <p className="mt-3 font-heading text-xl font-semibold text-[var(--navy)]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <ProductPreview />
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[34px]">
            <Badge tone="teal">Core problem</Badge>
            <h2 className="mt-5 max-w-4xl font-heading text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              Financial visibility gets messy when accounts live across multiple institutions.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--muted)]">
              Consumers and small business owners often check several bank portals just to understand balances,
              transaction activity, reserves, and recent cash-flow changes. Northline brings the visibility layer into
              one calmer workspace.
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                ["Small business owners", "Monitor operating, payroll, reserve, and tax-related accounts without juggling separate portals."],
                ["Everyday consumers", "Review checking, savings, and spending activity across supported institutions in one place."],
                ["Cost-sensitive users", "Start with a lightweight visibility layer, then upgrade for richer summaries and AI-assisted review."]
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
                  <p className="font-semibold text-[var(--navy)]">{title}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{copy}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge tone="teal">How it works</Badge>
              <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
                From scattered accounts to one read-only operating view.
              </h2>
              <p className="mt-5 text-base leading-8 text-[var(--muted)]">
                V1 stays intentionally focused: permissioned account connections, imported transaction history,
                cash-flow summaries, and safe informational insights.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {workflow.map((item) => (
                <Card key={item.step} className="rounded-[28px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">{item.step}</p>
                  <h3 className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.copy}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="gold">V1 product scope</Badge>
              <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
                Built for visibility first.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
                Northline v1 does not execute financial actions. It helps users understand imported data and decide what
                to verify next in their own bank or accounting systems.
              </p>
            </div>
            <Link href="/features" className="text-sm font-semibold text-[var(--navy)] underline-offset-4 hover:underline">
              View feature details
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {v1Features.map((feature) => (
              <Card key={feature.title} className="rounded-[30px]">
                <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">{feature.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{feature.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-[32px]">
              <Badge tone="gold">Trust and security</Badge>
              <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
                Clear for users, careful for evaluators.
              </h2>
              <p className="mt-5 text-base leading-8 text-[var(--muted)]">
                Northline uses permissioned connectivity, separates product capabilities from future roadmap items, and
                keeps regulated guidance outside the v1 experience.
              </p>
            </Card>
            <div className="grid gap-5 lg:grid-cols-3">
              {trustPillars.map((pillar) => (
                <Card key={pillar.title} className="rounded-[28px]">
                  <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">{pillar.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{pillar.copy}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="mb-8">
            <Badge tone="teal">Pricing preview</Badge>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
              Simple read-only plans.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
              Start with basic account visibility, then upgrade for deeper cash-flow summaries, AI insights, exports,
              tax reserve tracking, and recurring expense detection.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ["Free", "$0", "Limited connected accounts and a basic transaction view."],
              ["Northline Plus", "$19/mo", "Unlimited connected institutions, cash-flow summaries, and AI insights."],
              ["Pro", "$39/mo", "Advanced insights, exports, tax reserve tracking, and recurring expense detection."]
            ].map(([name, price, copy]) => (
              <Card key={name} className="rounded-[30px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">{name}</p>
                <h3 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">{price}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <Badge tone="gold">Important guardrails</Badge>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
              Northline is not a bank and does not execute financial actions.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
              Northline does not hold funds, initiate bank actions, or provide tax, legal, investment, credit-repair, or
              lending advice. Insights are informational and should be verified before decisions are made.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/pricing" className="rounded-2xl bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white">
                Compare plans
              </Link>
              <Link href="/security" className="rounded-2xl border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]">
                Review security
              </Link>
            </div>
          </Card>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="mb-8">
            <Badge tone="teal">Customer voice</Badge>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
              Calm enough for daily use, structured enough for operators.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="rounded-[30px]">
                <p className="text-base leading-8 text-[var(--navy)]">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-[var(--navy)]">{testimonial.name}</p>
                  <p className="text-sm text-[var(--muted)]">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <Badge tone="gold">Quick FAQ</Badge>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
              Short answers to the most common questions.
            </h2>
            <div className="mt-7 grid gap-4 lg:grid-cols-3">
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

      <CtaBanner />
    </>
  );
}
