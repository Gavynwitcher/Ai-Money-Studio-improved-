import type { Metadata } from "next";
import Image from "next/image";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { BrandLogo } from "@/components/site/brand-logo";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Northline",
  description:
    "Learn why Northline was created to simplify multi-bank account management for consumers and small business owners.",
  path: "/about",
  keywords: [
    "about northline",
    "multi bank management platform",
    "small business banking visibility"
  ]
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Why Northline exists."
        description="Northline is building a cleaner way to connect institutions, pull balances, and turn scattered bank activity into a banking workspace that business owners and everyday users can actually use."
        primaryCta={{ href: "/contact", label: "Talk to the team" }}
        secondaryCta={{ href: "/features", label: "See the roadmap" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[32px] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">About the build</p>
                  <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                    What we&apos;re doing with Northline and Plaid
                  </h2>
                </div>
                <BrandLogo showTagline={false} />
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
                Northline is focused on streamlining multi-bank visibility. We&apos;re using Plaid to help customers
                securely link institutions, import real-time balances from checking, savings, and credit lines, and
                sync transaction history into one operating view.
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                The current product direction is intentionally practical: start with account connection, balance
                visibility, and historical activity, then layer in transfer workflows and richer financial operations
                only after compliance, cost, and operational guardrails are ready.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] border border-[var(--line)] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--teal)]">Step 1</p>
                  <p className="mt-2 font-semibold text-[var(--navy)]">Link your institution</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Launch a secure Plaid Link session so customers can authenticate with their bank.
                  </p>
                </div>
                <div className="rounded-[22px] border border-[var(--line)] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--teal)]">Step 2</p>
                  <p className="mt-2 font-semibold text-[var(--navy)]">Import balances</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Pull in real-time account data so cash position is visible without logging into multiple portals.
                  </p>
                </div>
                <div className="rounded-[22px] border border-[var(--line)] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--teal)]">Step 3</p>
                  <p className="mt-2 font-semibold text-[var(--navy)]">Sync activity</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Bring historical transactions into one feed so owners can review movement across institutions.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[32px] overflow-hidden p-3">
              <div className="rounded-[26px] border border-[var(--line)] bg-white p-3">
                <Image
                  src="/northline-plaid-workflow.png"
                  alt="Northline and Plaid workflow showing institution linking, balance imports, transaction sync, and guardrails."
                  width={1560}
                  height={1012}
                  className="h-auto w-full rounded-[20px] object-cover"
                  priority
                />
              </div>
              <p className="px-2 pt-4 text-sm leading-7 text-[var(--muted)]">
                This workflow reflects the current Northline-Plaid integration: a 3-step customer experience on the
                surface, with secure token exchange, account normalization, and rollout guardrails supporting it in
                the background.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Observed pain point</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Customers still piece together balances and transactions by logging into separate bank portals, downloading files,
                or relying on tools priced for much larger operations.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Mission</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Make multi-bank money management more accessible, understandable, and affordable without sacrificing a premium product feel.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Approach</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Start with secure connectivity, balances, and transaction history, then expand thoughtfully into
                transfer workflows, debt support, credit guidance, and additional financial wellness tools.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
