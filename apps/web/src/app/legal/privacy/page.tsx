import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy policy"
        title="Demo privacy language for a Plaid-powered financial platform."
        description="This policy page is written as launch-ready placeholder copy and should be reviewed by legal counsel before production use."
      />
      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px] space-y-6 text-sm leading-7 text-[var(--muted)]">
            <p>
              Northline may collect account connection metadata, profile information, product usage events, and account-profile or contact form submissions needed to operate the platform and improve the service.
            </p>
            <p>
              Secure third-party integrations may be used to connect supported financial institutions. Sensitive financial credentials should never be stored directly by the application if a third-party connection workflow is used for linking.
            </p>
            <p>
              Production deployments should document data retention, deletion handling, user rights, subprocessors, analytics tooling, and security controls in greater detail.
            </p>
          </Card>
        </Container>
      </section>
    </>
  );
}
