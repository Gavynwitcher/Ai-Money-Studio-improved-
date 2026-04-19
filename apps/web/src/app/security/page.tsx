import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

const sections = [
  {
    title: "Data privacy overview",
    copy:
      "Northline is positioned to collect only the information needed to deliver account visibility, transaction summaries, and approved transfer workflows, while relying on secure third-party connectivity for institution-level linking."
  },
  {
    title: "Plaid-powered secure connection",
    copy:
      "The site explains Plaid as the secure connectivity layer for linking supported institutions. Real production implementations would use server-side link token creation, public token exchange, and item persistence tied to authenticated users."
  },
  {
    title: "Encryption and account protection",
    copy:
      "Sensitive operations should be protected with transport encryption, secure secret management, access controls, audit logging, and environment-specific keys across sandbox, development, and production."
  },
  {
    title: "Compliance disclaimer",
    copy:
      "The MVP intentionally avoids claiming regulated status, guaranteed approvals, or instant transfer capabilities. Advanced movement and regulated services may require additional reviews, approvals, partner configuration, and legal oversight."
  }
];

export const metadata: Metadata = buildMetadata({
  title: "Security, Privacy, and Compliance Positioning",
  description:
    "Review Northline security messaging, Plaid-powered connectivity details, encryption expectations, and MVP compliance disclaimers.",
  path: "/security",
  keywords: [
    "banking app security",
    "Plaid security",
    "financial app compliance",
    "bank account privacy"
  ]
});

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security and compliance"
        title="Trustworthy language for customers, investors, and compliance stakeholders."
        description="The site copy is designed to feel secure and credible without making unsupported claims about regulated services or transfer speed."
        primaryCta={{ href: "/legal/disclaimer", label: "Read disclaimer" }}
        secondaryCta={{ href: "/plaid-integration", label: "See integration flow" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.title} className="rounded-[30px]">
                <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">{section.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{section.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
