import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    badge: "Best for individuals",
    subtitle: "Individuals or early users testing connected account visibility.",
    bullets: [
      "Connect limited accounts",
      "View balances in one dashboard",
      "Basic transaction visibility",
      "Basic account organization",
      "Security and Plaid education",
      "Access to product updates"
    ],
    cta: "Start free",
    note: "Good for testing whether Northline fits your workflow.",
    href: "/signup",
    accent: false
  },
  {
    name: "Northline Plus",
    price: "$19/month",
    badge: "Recommended",
    subtitle: "Small business owners managing operating, payroll, tax, reserve, or multiple bank accounts.",
    bullets: [
      "Connect multiple institutions",
      "Unified balance dashboard",
      "Transaction review workspace",
      "Cash flow visibility",
      "Spending category insights",
      "Account grouping for business use",
      "CSV export for accountant-ready review",
      "Priority beta access to new tools",
      "Enhanced alerts and workflow features"
    ],
    cta: "Upgrade to Plus",
    note: "Best for small business owners who need more than a basic personal finance app.",
    href: "/signup",
    accent: true
  },
  {
    name: "Transfer Flex",
    price: "From $2",
    badge: "Usage-based",
    subtitle: "Users who need guided transfer workflows when supported.",
    bullets: [
      "Transfer route review",
      "Same-day transfer option when eligible",
      "Clear timing and fee visibility",
      "Transfer status tracking",
      "Compliance and institution availability checks",
      "Support for future transfer workflow expansion"
    ],
    cta: "Request transfer access",
    note: "Transfer features may not be available to all users and may require additional review.",
    href: "/contact",
    accent: false
  }
] as const;

const valueCards = [
  {
    title: "Save time checking accounts",
    copy: "Reduce the need to jump between separate bank portals just to confirm balances and recent activity."
  },
  {
    title: "Understand cash position faster",
    copy: "See operating, reserve, payroll, and tax cash with less manual cross-checking."
  },
  {
    title: "Prepare cleaner financial records",
    copy: "Give accountants and internal reviewers a more organized view of account activity and exported records."
  },
  {
    title: "Reduce manual spreadsheet work",
    copy: "Spend less time copying balances and transaction data into ad hoc spreadsheets."
  }
] as const;

const comparisonRows = [
  {
    label: "Multi-bank visibility",
    bank: "Limited to one institution at a time",
    personal: "Often built for personal account aggregation",
    treasury: "Strong, but designed for larger teams",
    northline: "Designed to bring supported institutions into one practical workspace"
  },
  {
    label: "Small business account grouping",
    bank: "Usually manual",
    personal: "Often limited",
    treasury: "Common",
    northline: "Built for operating, tax, reserve, and payroll-style account organization"
  },
  {
    label: "Cash flow organization",
    bank: "Basic",
    personal: "Consumer-first",
    treasury: "Advanced",
    northline: "Focused on practical visibility for small businesses and multi-account users"
  },
  {
    label: "Transaction review",
    bank: "Institution-specific only",
    personal: "Personal finance oriented",
    treasury: "Robust but more complex",
    northline: "Designed for cleaner review across connected accounts"
  },
  {
    label: "Accountant-ready export",
    bank: "Varies by bank",
    personal: "Not always business-friendly",
    treasury: "Usually supported",
    northline: "Planned around simple exportable review workflows"
  },
  {
    label: "Affordable monthly pricing",
    bank: "Bundled with the bank",
    personal: "Varies",
    treasury: "Often expensive",
    northline: "Positioned as a simpler, more affordable workspace than enterprise treasury software"
  },
  {
    label: "Simple setup",
    bank: "Simple, but single-bank",
    personal: "Simple for consumers",
    treasury: "Can require longer implementation",
    northline: "Built to feel lightweight and practical for early adoption"
  }
] as const;

const faqs = [
  {
    question: "Is Northline free to start?",
    answer: "Yes. The Starter plan gives users a way to test basic connected account visibility before upgrading."
  },
  {
    question: "Who is Northline Plus for?",
    answer:
      "Northline Plus is designed for small business owners, operators, and users who manage multiple financial institutions or business-related accounts."
  },
  {
    question: "Are transfers included?",
    answer:
      "Transfer-related features may be usage-based and subject to institution support, user authorization, timing, route availability, and compliance review."
  },
  {
    question: "Is Northline a bank?",
    answer:
      "No. Northline is not a bank. It is a financial workspace that helps users organize supported account information from connected institutions."
  },
  {
    question: "Does Northline store my bank password?",
    answer:
      "No. Secure bank linking is handled through Plaid. Northline should not store bank usernames or passwords."
  }
] as const;

export const metadata: Metadata = buildMetadata({
  title: "Simple Pricing for Multi-Account Money Management",
  description:
    "Review Starter, Northline Plus, and Transfer Flex pricing for connected account visibility, transaction review, cash flow organization, and future transfer workflows.",
  path: "/pricing",
  keywords: [
    "northline pricing",
    "small business multi bank pricing",
    "cash flow workspace pricing",
    "plaid linked account pricing"
  ]
});

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple pricing for multi-account money management"
        description="Start with basic account visibility for free, then upgrade when you need stronger cash flow tools, transaction organization, and small business account management features."
        primaryCta={{ href: "/signup", label: "Start free" }}
        secondaryCta={{ href: "/contact", label: "Request transfer access" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm leading-7 text-[var(--muted)]">
            Northline is not a bank. Bank linking and transfer-related features depend on institution support, Plaid
            availability, user authorization, and compliance review.
          </div>
        </Container>
      </section>

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
                <div className="flex min-h-[39rem] flex-col">
                  <div className="flex items-center justify-between gap-3">
                    {plan.accent ? (
                      <Badge className="border border-white/12 bg-white/12 text-white shadow-none">{plan.badge}</Badge>
                    ) : (
                      <Badge tone="teal">{plan.badge}</Badge>
                    )}
                    {plan.name === "Transfer Flex" ? (
                      <span className="rounded-full border border-[var(--line)] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        Same-day eligible
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em]">{plan.name}</h2>
                  <p className={`mt-4 text-5xl font-semibold tracking-[-0.05em] ${plan.accent ? "text-white" : "text-[var(--navy)]"}`}>
                    {plan.price}
                  </p>
                  <p className={`mt-4 text-sm leading-7 ${plan.accent ? "text-slate-100" : "text-[var(--muted)]"}`}>
                    {plan.subtitle}
                  </p>

                  <div
                    className={`mt-5 rounded-[22px] border px-4 py-4 text-sm leading-6 ${
                      plan.accent
                        ? "border-white/14 bg-[#eff6ff] text-[#17345f] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                        : "border-[var(--line)] bg-[var(--sky)] text-[var(--navy)]"
                    }`}
                  >
                    {plan.note}
                  </div>

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
                    <Button href={plan.href} variant={plan.accent ? "secondary" : "primary"} className="w-full">
                      {plan.cta}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <Card className="rounded-[32px]">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Which plan is right for you?
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] border border-[var(--line)] bg-white/85 p-5">
                <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Use Starter if:</h3>
                <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  <li>You want to test Northline</li>
                  <li>You only need basic balance visibility</li>
                  <li>You are managing a small number of accounts</li>
                  <li>You are not ready for paid features</li>
                </ul>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--sky)] p-5">
                <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Use Northline Plus if:</h3>
                <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  <li>You manage several accounts across institutions</li>
                  <li>You own or operate a small business</li>
                  <li>You track payroll, tax, reserve, or operating cash</li>
                  <li>You want cleaner transaction review and cash flow visibility</li>
                  <li>You want exportable records for your accountant or internal review</li>
                </ul>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-white/85 p-5">
                <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Use Transfer Flex if:</h3>
                <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  <li>You need transfer workflow support</li>
                  <li>You want clearer visibility into transfer timing and fees</li>
                  <li>You understand that transfer availability depends on institution support and compliance review</li>
                </ul>
              </div>
            </div>
          </Card>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[32px]">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Why pay for Northline Plus?
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Northline Plus is designed for users who spend too much time checking separate bank portals, downloading
                transactions, tracking balances manually, or preparing information for accountants and business decisions.
                Instead of replacing your bank, Northline helps organize the financial information you already have across
                institutions.
              </p>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {valueCards.map((card) => (
                <Card key={card.title} className="rounded-[26px]">
                  <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{card.copy}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="overflow-hidden rounded-[32px] p-0">
            <div className="border-b border-[var(--line)] px-6 py-6 sm:px-8">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Built for users who outgrow basic banking portals
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Northline is positioned as a simpler, more affordable workspace than enterprise treasury tools, not as a
                replacement for high-end treasury infrastructure.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/75 text-left text-sm">
                <thead className="bg-slate-900/5 text-[var(--navy)]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Capability</th>
                    <th className="px-6 py-4 font-semibold">Bank portals</th>
                    <th className="px-6 py-4 font-semibold">Personal finance apps</th>
                    <th className="px-6 py-4 font-semibold">Enterprise treasury tools</th>
                    <th className="px-6 py-4 font-semibold">Northline</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-t border-[var(--line)] align-top">
                      <td className="px-6 py-4 font-medium text-[var(--navy)]">{row.label}</td>
                      <td className="px-6 py-4 text-[var(--muted)]">{row.bank}</td>
                      <td className="px-6 py-4 text-[var(--muted)]">{row.personal}</td>
                      <td className="px-6 py-4 text-[var(--muted)]">{row.treasury}</td>
                      <td className="px-6 py-4 text-[var(--muted)]">{row.northline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">Pricing FAQ</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {faqs.map((faq) => (
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
