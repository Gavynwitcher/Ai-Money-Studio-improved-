import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export default function DisclaimerPage() {
  return (
    <>
      <PageHero
        eyebrow="Disclaimer"
        title="Careful wording for compliance-sensitive functionality."
        description="The MVP clearly distinguishes between currently demonstrated software experiences and future regulated or approval-dependent capabilities."
      />
      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px] space-y-6 text-sm leading-7 text-[var(--muted)]">
            <p>
              Northline is not a bank, lender, or credit bureau. The platform is presented as a software product that may use secure third-party integrations to help users view account information and navigate financial workflows.
            </p>
            <p>
              Any transfer-related, credit-related, debt-assistance, or other regulated features described on this website are planned or subject to compliance review, partner support, legal approval, and future product releases.
            </p>
            <p>
              The dashboard, forms, alerts, and score-related widgets on this MVP are illustrative. They should not be interpreted as guarantees, approvals, financial advice, or regulated account services.
            </p>
          </Card>
        </Container>
      </section>
    </>
  );
}
