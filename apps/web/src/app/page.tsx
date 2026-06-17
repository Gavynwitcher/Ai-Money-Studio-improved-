import type { Metadata } from "next";
import Link from "next/link";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { alerts, accounts, monthlyCashFlow, spendingCategories, transactions } from "@/data/mock-finance";
import { featureCategories, faqs, testimonials, trustPillars } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Multi-Bank Account Dashboard for Consumers and Small Businesses",
  description:
    "Manage all your bank accounts in one place with Northline. Connect institutions, monitor balances and transactions, and simplify transfers with an affordable platform built for consumers and small businesses.",
  path: "/",
  keywords: [
    "northline banking platform",
    "multi-bank dashboard",
    "plaid banking app",
    "small business treasury dashboard",
    "connected account management"
  ]
});

const heroStats = [
  ["Target users", "Consumers + SMBs"],
  ["Core MVP scope", "Aggregation + transfers"],
  ["Pricing posture", "Premium feel, lower cost"]
];

const roadmapSignals = ["Available now", "MVP", "Coming soon"];

const featurePreview = featureCategories.slice(0, 4);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatSignedCurrency(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
}

function StatusBadge({ children }: { children: string }) {
  const normalized = children.toLowerCase().replace(/-/g, " ");
  return (
    <span className="rounded-full bg-[rgba(30,142,99,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--success)]">
      {normalized}
    </span>
  );
}

function HeroProductMockup() {
  return (
    <div className="rounded-[34px] bg-[linear-gradient(145deg,#0c2238_0%,#173f62_100%)] p-6 text-white shadow-[0_30px_80px_rgba(8,23,41,0.22)]">
      <div className="rounded-[28px] border border-white/12 bg-white/10 p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.32em] text-cyan-100/80">Unified balance</p>
        <p className="mt-4 font-heading text-5xl font-semibold tracking-[-0.05em]">$259,370</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Institutions", "3 linked"],
            ["Transfers", "1 in review"],
            ["Monitoring", "Credit soon"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[18px] border border-white/12 bg-white/8 p-4">
              <p className="text-sm text-slate-200">{label}</p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[0.95fr_1fr]">
        <div className="rounded-[24px] bg-white p-5 text-[var(--navy)]">
          <h3 className="font-heading text-lg font-semibold">Transfer workflow</h3>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Review routing, fee visibility, and status steps before initiating supported movement.
          </p>
          <div className="mt-5 rounded-[20px] border border-[var(--line)] bg-slate-50 px-4 py-4 text-sm">
            Reserve to Operating · $2,500 · fee preview $2
          </div>
        </div>
        <div className="rounded-[24px] bg-white p-5 text-[var(--navy)]">
          <h3 className="font-heading text-lg font-semibold">Roadmap signals</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {roadmapSignals.map((signal, index) => (
              <span
                key={signal}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  index === 0
                    ? "bg-[rgba(30,142,99,0.14)] text-[var(--success)]"
                    : index === 1
                      ? "bg-slate-100 text-slate-600"
                      : "bg-[rgba(216,166,53,0.18)] text-[var(--gold)]"
                }`}
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-[34px] border border-[var(--line)] bg-white p-5 shadow-[0_24px_70px_rgba(8,23,41,0.08)]">
      <div className="rounded-[26px] bg-[linear-gradient(135deg,#082044_0%,#103d67_100%)] p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Unified balance</p>
            <p className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em]">$259,370</p>
            <p className="mt-3 text-sm text-slate-200">Available cash $257,920 across 3 institutions</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-xs text-slate-200">30-day inflow</p>
              <p className="mt-2 text-xl font-semibold">$61,200</p>
              <p className="mt-2 text-sm text-emerald-300">+6.2%</p>
            </div>
            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-xs text-slate-200">30-day outflow</p>
              <p className="mt-2 text-xl font-semibold">$42,100</p>
              <p className="mt-2 text-sm text-orange-300">-2.8%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr_0.8fr]">
        <div className="rounded-[24px] border border-[var(--line)] p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Linked accounts</h3>
            <StatusBadge>3 active</StatusBadge>
          </div>
          <div className="mt-4 grid gap-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-start justify-between gap-4 rounded-[18px] bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--navy)]">
                    {account.institutionName} · {account.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {account.subtype} · •••• {account.mask}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--navy)]">{formatCurrency(account.currentBalance)}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Available {formatCurrency(account.availableBalance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--line)] p-5">
          <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Cash flow summary</h3>
          <p className="mt-2 text-xs text-[var(--muted)]">Six-month snapshot of inflow versus outflow.</p>
          <div className="mt-5 grid gap-3">
            {monthlyCashFlow.map((month) => (
              <div key={month.label} className="grid grid-cols-[36px_1fr] items-center gap-3">
                <span className="text-xs text-[var(--muted)]">{month.label}</span>
                <div className="grid gap-1">
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[var(--teal)]" style={{ width: `${month.inflow}%` }} />
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[var(--navy)]" style={{ width: `${month.outflow}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--line)] p-5">
          <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Transfer panel</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Guided movement between approved linked institutions with transparent review.
          </p>
          <div className="mt-4 rounded-[20px] border border-[var(--line)] bg-slate-50 p-4 text-sm text-[var(--navy)]">
            <p className="font-semibold">Ready for review</p>
            <p className="mt-2">$5,000 from Reserve to Operating</p>
            <p className="mt-2 text-[var(--muted)]">Transfer fee: $2</p>
            <p className="text-[var(--muted)]">Status: review</p>
            <p className="text-[var(--muted)]">ETA: Same day review, subject to bank timing</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-[24px] border border-[var(--line)] p-5 lg:col-span-2">
          <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Recent transactions</h3>
          <div className="mt-4 grid gap-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-[18px] bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-[var(--navy)]">{transaction.merchant}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {transaction.category} · {transaction.accountName} · {transaction.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className={transaction.direction === "inflow" ? "font-semibold text-[var(--success)]" : "font-semibold text-[var(--navy)]"}>
                    {formatSignedCurrency(transaction.direction === "inflow" ? transaction.amount : -transaction.amount)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{transaction.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--line)] p-5">
          <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Spending categories</h3>
          <div className="mt-4 grid gap-3">
            {spendingCategories.map((category) => (
              <div key={category.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--navy)]">{category.label}</span>
                  <span className="text-[var(--muted)]">{category.value}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-[var(--teal)]" style={{ width: `${category.value}%` }} />
                </div>
              </div>
            ))}
          </div>
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
              <Badge tone="gold">Affordable alternative to enterprise treasury tools</Badge>
              <h1 className="mt-6 max-w-3xl font-heading text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                Manage all your bank accounts in one place.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-9 text-[var(--muted)]">
                Connect accounts across institutions, monitor balances and transactions, and simplify transfers with an
                affordable platform built for consumers and small business owners.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/plaid-integration"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--navy)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(11,31,51,0.18)]"
                >
                  Connect your bank
                </Link>
                <Link
                  href="/dashboard-demo"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-white/90 px-6 py-3 text-sm font-semibold text-[var(--navy)]"
                >
                  Explore the dashboard
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroStats.map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-[var(--line)] bg-white/85 p-5 shadow-[0_18px_40px_rgba(8,23,41,0.04)]">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
                    <p className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroProductMockup />
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[34px]">
            <Badge tone="teal">Core problem</Badge>
            <h2 className="mt-5 max-w-4xl font-heading text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              Too many users still manage money by bank login roulette.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--muted)]">
              Consumers and small business owners often spread funds across multiple institutions, but most tools either
              feel fragmented, too expensive, or built for much larger finance teams.
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                ["Small business owners", "Track operating cash across payroll, reserve, and tax accounts without paying for enterprise treasury tooling."],
                ["Everyday consumers", "Monitor checking, savings, and spending accounts from multiple banks without piecing together separate logins."],
                ["Cost-sensitive users", "Choose a lightweight free or starter path first, then upgrade only when premium insights or transfer features matter."]
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
                A simple path from fragmented banking to one connected operating view.
              </h2>
              <p className="mt-5 text-base leading-8 text-[var(--muted)]">
                The platform is organized around a short, understandable flow: connect institutions, review cash and
                transactions, then move into the workflows that matter.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["01", "Connect institutions securely", "Users launch a Plaid-powered linking flow, pick their bank, and authorize the account connections they want included."],
                ["02", "See balances and transactions in one place", "Northline consolidates balances, account health, and transaction activity into one dashboard built for clarity."],
                ["03", "Take action with guided money movement", "Users can review a transfer path, expected timing, and fees before initiating supported movement between linked institutions."],
                ["04", "Grow into financial wellness tools", "As the product expands, users unlock debt support, credit insight tools, and additional online banking assistance."]
              ].map(([step, title, copy]) => (
                <Card key={step} className="rounded-[28px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">{step}</p>
                  <h3 className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{copy}</p>
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
              <Badge tone="gold">Feature preview</Badge>
              <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
                Built for visibility first, then action.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
                The product stays focused on the core day-to-day banking workflows first, with more advanced tools clearly
                staged for later.
              </p>
            </div>
            <Link href="/features" className="text-sm font-semibold text-[var(--navy)] underline-offset-4 hover:underline">
              View all platform features
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {featurePreview.map((feature) => (
              <Card key={feature.title} className="rounded-[30px]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">{feature.title}</h3>
                  <StatusBadge>{feature.status}</StatusBadge>
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
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="mb-8">
            <Badge tone="teal">Dashboard demo</Badge>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
              A premium dashboard that still feels approachable.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
              The mock product experience is styled as a real operating workspace, with realistic cards, alerts, cash flow
              summaries, and staged wellness widgets.
            </p>
          </div>
          <DashboardPreview />
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-[32px]">
              <Badge tone="gold">Trust and security</Badge>
              <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
                Clear enough for customers, careful enough for compliance review.
              </h2>
              <p className="mt-5 text-base leading-8 text-[var(--muted)]">
                Messaging emphasizes secure third-party integrations, honest staging of capabilities, and realistic
                language around transfer approvals and regulated services.
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
              Flexible enough for cost-sensitive users.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
              Northline keeps the plan structure simple so users can start with visibility and grow into richer workflows
              when they need them.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ["Starter", "$0", "Start free", "Entry plan for users who want linked-account visibility and a clean daily workspace."],
              ["Northline Plus", "$19/mo", "Choose Northline Plus", "Full workspace plan for multi-account households and small businesses."],
              ["Transfer Flex", "$2 same-day", "View transfer pricing", "Pay-as-you-go path for users who want guided same-day transfer access without a full subscription."]
            ].map(([name, price, cta, copy]) => (
              <Card key={name} className="rounded-[30px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">{name}</p>
                <h3 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">{price}</h3>
                <p className="mt-3 text-sm font-semibold text-[var(--navy)]">{cta}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <Badge tone="gold">Included now</Badge>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
              Start with the essentials and keep the workflow focused.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
              The platform is easiest to use when it emphasizes a few clear tasks: connect accounts, review transactions,
              understand balances, and get help when you need it.
            </p>
            <div className="mt-7 grid gap-3 lg:grid-cols-2">
              {[
                "One connected view for balances across institutions",
                "Categorized transaction review with cash flow context",
                "A guided Plaid connection flow with live handoff points",
                "Clear pricing and support paths without enterprise complexity"
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-[var(--line)] bg-white/80 px-5 py-4 text-sm font-medium text-[var(--navy)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/pricing" className="rounded-2xl bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white">
                Compare plans
              </Link>
              <Link href="/contact" className="rounded-2xl border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]">
                Talk to the team
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
              Clear enough for everyday users and disciplined enough for operators.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
              The interface is intentionally designed to feel calm, understandable, and useful across both consumer and
              small-business use cases.
            </p>
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
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
              The full FAQ page covers security, pricing, feature staging, and how account linking works.
            </p>
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
