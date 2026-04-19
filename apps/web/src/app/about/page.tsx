import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Unified Banking Hub",
  description:
    "Learn why Unified Banking Hub was created to simplify multi-bank account management for consumers and small business owners.",
  path: "/about",
  keywords: [
    "about unified banking hub",
    "multi bank management platform",
    "small business banking visibility"
  ]
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Why Unified Banking Hub exists."
        description="The product is built around a simple observation: smaller businesses and everyday users face multi-bank complexity too, but they are rarely the audience most finance software is optimized for."
        primaryCta={{ href: "/contact", label: "Talk to the team" }}
        secondaryCta={{ href: "/features", label: "See the roadmap" }}
      />

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
                Start with account visibility and transfer workflow validation, then expand thoughtfully into debt support, credit guidance, and additional financial wellness tools.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
