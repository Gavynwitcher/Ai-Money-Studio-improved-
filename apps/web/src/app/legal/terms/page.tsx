import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms of service"
        title="Launch-ready placeholder terms for an MVP."
        description="These terms frame the product as a software platform providing account visibility and staged financial tooling, not a chartered bank."
      />
      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px] space-y-6 text-sm leading-7 text-[var(--muted)]">
            <p>
              Northline is provided on an as-available basis for demonstration, pilot, or subscription use subject to future service terms, pricing, and partner availability.
            </p>
            <p>
              Users are responsible for providing accurate information during account linking, safeguarding their login credentials, and using the service only for lawful purposes.
            </p>
            <p>
              Additional commercial terms, billing conditions, and product-specific rules may apply to premium features, transfer workflows, or future financial wellness services.
            </p>
          </Card>
        </Container>
      </section>
    </>
  );
}
