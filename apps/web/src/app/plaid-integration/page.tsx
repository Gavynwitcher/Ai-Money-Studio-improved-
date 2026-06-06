import type { Metadata } from "next";
import { PlaidConnectCard } from "@/components/plaid-connect-card";
import { PlaidConnectFlow } from "@/components/plaid/plaid-connect-flow";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getPlaidConfig, shouldUseMockPlaid } from "@/lib/plaid/config";
import { buildMetadata } from "@/lib/seo";

const steps = [
  "Launch secure bank linking from the Northline workspace",
  "Choose a bank and confirm the accounts you want to share",
  "Northline verifies the connection and saves the bank login",
  "Balances and account details are brought into the workspace",
  "Transaction history is refreshed so owners can review activity in one place",
  "Transfer workflows are enabled only when product, cost, and compliance checks are ready"
];

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
        title={liveMode ? "Secure bank linking is live in Northline." : "A polished mock flow with clear Plaid handoff points."}
        description={
          liveMode
            ? "Connect your bank, bring balances and transaction history into one workspace, and keep your Northline profile refreshed through secure Plaid connectivity."
            : "The UI is already shaped around the bank-linking lifecycle needed for a real Plaid integration: connection launch, bank login storage, account imports, balance visibility, transaction sync, and transfer readiness."
        }
        primaryCta={{ href: "#plaid-demo", label: liveMode ? "Open Plaid Link" : "Launch mock connect flow" }}
        secondaryCta={{ href: "/security", label: "Review security notes" }}
      />

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
                How the bank connection works
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
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Product guardrails
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted)]">
                <p>
                  Account linking and balance visibility can be shown early, while transfer capabilities should be
                  communicated carefully and rolled out only after product, compliance, and cost considerations are aligned.
                </p>
                <p>
                  Instant movement or Venmo-style functionality is not implied in this MVP. The copy intentionally frames
                  advanced movement features as planned or subject to review.
                </p>
                <p>
                  The code comments in the service layer and API routes identify exactly where sandbox, development, and
                  production settings belong so engineers can move from mock mode to real Plaid calls incrementally.
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
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Connected bank login</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                One connected bank login can include multiple accounts, such as checking, savings, or credit, under the
                same financial institution.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Sandbox-first testing</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                The quickstart starts in Plaid Sandbox using test credentials such as `user_good`,
                `pass_good`, and `1234` for simulated MFA. This page now mirrors that setup explicitly.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">What happens behind the scenes</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Northline opens the bank-linking flow in the browser while the secure server side handles connection
                setup, account retrieval, and ongoing data refresh.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
