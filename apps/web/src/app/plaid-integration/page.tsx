import type { Metadata } from "next";
import { PlaidConnectCard } from "@/components/plaid-connect-card";
import { PlaidConnectFlow } from "@/components/plaid/plaid-connect-flow";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getPlaidConfig, shouldUseMockPlaid } from "@/lib/plaid/config";
import { buildMetadata } from "@/lib/seo";

const trustCards = [
  {
    title: "No bank passwords stored",
    copy: "Your bank login credentials are handled through Plaid. Northline does not store your bank username or password.",
    icon: "shield"
  },
  {
    title: "Permission-based access",
    copy: "You choose which institution to connect and can remove access when needed.",
    icon: "key"
  },
  {
    title: "Encrypted data flow",
    copy: "Bank connection data is transmitted through secure, encrypted systems.",
    icon: "lock"
  },
  {
    title: "Built for visibility first",
    copy: "Northline focuses on balances, transactions, cash flow, and account organization before advanced transfer features.",
    icon: "eye"
  }
] as const;

const userSteps = [
  {
    title: "Choose your bank",
    copy: "Search for your financial institution through Plaid."
  },
  {
    title: "Approve access",
    copy: "Review the information being requested and authorize the connection."
  },
  {
    title: "View your accounts",
    copy: "Northline displays connected balances, transactions, and account details in one workspace."
  }
] as const;

function PlaidIcon({ kind }: { kind: (typeof trustCards)[number]["icon"] }) {
  if (kind === "shield") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[var(--teal)]">
        <path
          d="M12 3l7 3v5c0 4.6-2.7 8.7-7 10-4.3-1.3-7-5.4-7-10V6l7-3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "key") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[var(--teal)]">
        <path
          d="M14 7a5 5 0 1 0 3.6 8.5L21 12v-2h-2V8h-2l-2.1 2.1A5 5 0 0 0 14 7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "lock") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[var(--teal)]">
        <path
          d="M7 11V8a5 5 0 0 1 10 0v3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="5"
          y="11"
          width="14"
          height="10"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[var(--teal)]">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export const metadata: Metadata = buildMetadata({
  title: "Plaid Integration Demo for Bank Account Linking and Transaction Sync",
  description:
    "See how Northline uses Plaid Link for secure bank connection, account syncing, balance visibility, and transaction history.",
  path: "/plaid-integration",
  keywords: [
    "Plaid Link demo",
    "bank account linking with Plaid",
    "Plaid transaction sync",
    "Plaid integration example"
  ]
});

export default function PlaidIntegrationPage() {
  const config = getPlaidConfig();
  const liveMode = !shouldUseMockPlaid();
  const liveConfigured = liveMode && Boolean(config.clientId && config.secret);

  return (
    <>
      <PageHero
        eyebrow="Plaid integration"
        title="Connect your bank securely with Plaid"
        description="Northline uses Plaid so you can securely link accounts, view balances, and organize transactions without sharing your bank password directly with Northline."
        primaryCta={{ href: "#plaid-demo", label: "Connect a bank" }}
        secondaryCta={{ href: "#security-details", label: "View security details" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {trustCards.map((card) => (
              <Card key={card.title} className="rounded-[28px]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(25,106,117,0.08)]">
                  <PlaidIcon kind={card.icon} />
                </div>
                <h2 className="mt-5 font-heading text-2xl font-semibold text-[var(--navy)]">{card.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{card.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">How it works</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                  A simpler way to link accounts
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                  Northline keeps the connection experience straightforward: choose a bank, approve the connection,
                  and review your supported accounts in one place.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {userSteps.map((step, index) => (
                <div key={step.title} className="rounded-[24px] border border-[var(--line)] bg-white/85 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(25,106,117,0.08)] text-sm font-semibold text-[var(--teal)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold text-[var(--navy)]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{step.copy}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <section className="page-section pt-0" id="plaid-demo">
        <Container>
          {liveMode ? <PlaidConnectCard /> : <PlaidConnectFlow />}
        </Container>
      </section>

      {liveMode && !liveConfigured ? (
        <section className="page-section pt-0">
          <Container>
            <Card className="rounded-[28px] border-amber-200 bg-amber-50">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Bank connection is not ready yet</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                This environment still needs the secure bank-linking setup to be completed before customers can connect an institution here.
              </p>
            </Card>
          </Container>
        </section>
      ) : null}

      <section className="page-section">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[32px]">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                What Plaid does
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted)]">
                <p>
                  Plaid acts as the secure connection layer between your financial institution and Northline. Instead of
                  entering bank credentials directly into Northline, users authenticate through Plaid&apos;s secure flow.
                </p>
                <p>
                  Once connected, Northline can show supported account information such as balances, transaction
                  history, institution names, and account types.
                </p>
              </div>
            </Card>

            <div id="security-details">
              <Card className="rounded-[32px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Important note</p>
                <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                  Bank linking has practical limits
                </h2>
                <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted)]">
                  <p>
                    Northline is not a bank. Bank linking availability depends on institution support, Plaid availability,
                    user authorization, and applicable compliance requirements. Transfer-related features may require
                    additional review before becoming available.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px] border-slate-200/80 bg-slate-50/85">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Implementation notes</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Evaluator and implementation detail
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Northline&apos;s production implementation should use server-side link token creation, public token
                exchange, secure item persistence tied to authenticated users, environment-specific API keys,
                access-token encryption, audit logging, and clear account unlinking controls.
              </p>
            </div>
          </Card>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
