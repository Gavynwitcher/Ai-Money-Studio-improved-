import { PlaidConnectCard } from "@/components/plaid-connect-card";
import { PlaidConnectFlow } from "@/components/plaid/plaid-connect-flow";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getPlaidConfig, shouldUseMockPlaid } from "@/lib/plaid/config";

const steps = [
  "POST /link/token/create to create a short-lived link_token",
  "Initialize Plaid Link and launch it from the client",
  "Receive public_token in Link onSuccess",
  "POST /item/public_token/exchange to get access_token and item_id",
  "Store the Item and use access_token for /accounts/get and transaction calls",
  "Layer in transfer flows only when product, cost, and compliance are ready"
];

export default function PlaidIntegrationPage() {
  const config = getPlaidConfig();
  const liveMode = !shouldUseMockPlaid();
  const liveConfigured = liveMode && Boolean(config.clientId && config.secret);

  return (
    <>
      <PageHero
        eyebrow="Plaid integration"
        title={liveMode ? "Live Plaid Link is wired into the platform." : "A polished mock flow with clear Plaid handoff points."}
        description={
          liveMode
            ? "The Plaid page now uses the real Link flow, token exchange, item persistence, transaction sync, and unlink endpoints. Keep Sandbox on while validating credentials and institution coverage."
            : "The UI is already shaped around the API lifecycle needed for a real Plaid integration: link token creation, public token exchange, item storage, account fetches, balance visibility, transactions sync, and transfer initiation."
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
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Plaid credentials still needed</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Live mode is enabled, but this environment still needs `PLAID_CLIENT_ID` and `PLAID_SECRET`.
                Once those are added and the app is restarted, the Connect button will launch a real Plaid Sandbox session.
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
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                MVP guardrails
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
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">What Plaid calls an Item</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                The quickstart defines an Item as a login at a financial institution, not a single account.
                One Item can contain multiple accounts like checking and savings under the same bank login.
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
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Client and server roles</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                The docs split responsibility clearly: the server creates the link token and exchanges the public token,
                while the client launches Link and handles callbacks like `onSuccess`, `onExit`, and `onEvent`.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
