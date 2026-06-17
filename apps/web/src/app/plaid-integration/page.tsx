import type { Metadata } from "next";
import { PlaidConnectCard } from "@/components/plaid-connect-card";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { buildMetadata } from "@/lib/seo";

const steps = [
  "Choose your financial institution through Plaid",
  "Review and approve the information being requested",
  "View connected balances and transactions in Northline"
];

const trustCards = [
  {
    title: "No bank passwords stored",
    copy: "Your bank login credentials are handled through Plaid. Northline does not store your bank username or password."
  },
  {
    title: "Permission-based access",
    copy: "You choose which institution to connect and can remove access when needed."
  },
  {
    title: "Encrypted data flow",
    copy: "Bank connection data is transmitted through secure, encrypted systems."
  },
  {
    title: "Built for visibility first",
    copy: "Northline focuses on balances, transactions, cash flow, and account organization in a read-only v1 workspace."
  }
];

export const metadata: Metadata = buildMetadata({
  title: "Plaid Integration Demo for Bank Account Linking and Transaction Sync",
  description:
    "See how Northline uses Plaid Link for bank account connection, public token exchange, account syncing, balance visibility, and transaction imports.",
  path: "/plaid-integration",
  keywords: [
    "Plaid Link demo",
    "bank account linking with Plaid",
    "Plaid transaction sync",
    "Plaid integration example"
  ]
});

export default function PlaidIntegrationPage() {
  return (
    <>
      <PageHero
        eyebrow="Plaid integration"
        title="Connect your bank securely with Plaid"
        description="Northline uses Plaid so you can securely link accounts, view balances, and organize transactions without sharing your bank password directly with Northline."
        primaryCta={{ href: "#plaid-demo", label: "Connect a bank" }}
        secondaryCta={{ href: "/security", label: "View security details" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustCards.map((card) => (
              <Card key={card.title} className="rounded-[28px]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(64,181,183,0.12)] text-lg font-semibold text-[var(--teal)]">
                  ✓
                </div>
                <h2 className="mt-5 font-heading text-xl font-semibold text-[var(--navy)]">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{card.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <Card className="rounded-[32px]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">How it works</p>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                A simpler way to link accounts
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Northline keeps the connection experience straightforward: choose a bank, approve the connection, and
                review your supported accounts in one place.
              </p>
            </Card>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["1", "Choose your bank", "Search for your financial institution through Plaid."],
                ["2", "Approve access", "Review the information being requested and authorize the connection."],
                ["3", "View your accounts", "Northline displays connected balances, transactions, and account details in one workspace."]
              ].map(([step, title, copy]) => (
                <Card key={step} className="rounded-[28px]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(64,181,183,0.14)] text-sm font-bold text-[var(--teal)]">
                    {step}
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-semibold text-[var(--navy)]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{copy}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0" id="plaid-demo">
        <Container>
          <PlaidConnectCard />
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[32px]">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Integration flow staging
              </h2>
              <div className="mt-6 grid gap-3">
                {steps.map((step, index) => (
                  <div key={step} className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Step {index + 1}</p>
                    <p className="mt-2 text-sm font-medium text-[var(--navy)]">{step}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[32px]">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">What Plaid does</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted)]">
                <p>
                  Plaid acts as the secure connection layer between your financial institution and Northline. Instead of
                  entering bank credentials directly into Northline, users authenticate through Plaid&apos;s secure flow.
                </p>
                <p>
                  Once connected, Northline can show supported account information such as balances, transaction history,
                  institution names, and account types.
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Implementation notes</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Northline&apos;s production implementation should use server-side link token creation, public token
                exchange, secure item persistence tied to authenticated users, environment-specific API keys,
                access-token encryption, audit logging, and clear account unlinking controls.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Production connection path</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Northline now requests Plaid production link tokens for live institution connections. Users should only
                connect accounts they are authorized to access, and availability depends on Plaid and institution support.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Important note</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Northline is not a bank. Bank linking availability depends on institution support, Plaid availability,
                user authorization, and applicable compliance requirements. Transfer-related features may require
                additional review before becoming available.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
