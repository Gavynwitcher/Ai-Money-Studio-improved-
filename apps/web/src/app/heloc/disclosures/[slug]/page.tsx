import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";

const disclosurePages = {
  "heloc-brochure": {
    title: "HELOC brochure",
    description:
      "Overview of how a home equity line of credit works, how funds can be drawn, and how repayment may change over time.",
    bullets: [
      "Line access and draw-period overview",
      "Variable-rate and payment-change summary",
      "Examples of how repayment may work after the draw period"
    ]
  },
  "early-disclosures": {
    title: "Early disclosures",
    description:
      "High-level disclosure summary for fees, appraisal timing, property eligibility, and underwriting assumptions.",
    bullets: [
      "Potential fees and third-party costs",
      "Property and occupancy assumptions",
      "Underwriting and verification expectations"
    ]
  },
  "privacy-notice": {
    title: "Privacy notice",
    description:
      "Summary of how borrower information may be collected, used, shared, and protected during the application process.",
    bullets: [
      "Information categories collected",
      "Permitted uses and sharing practices",
      "Contact path for privacy questions"
    ]
  },
  "e-sign-consent": {
    title: "E-SIGN consent",
    description:
      "Summary of electronic delivery and signature consent for the online HELOC application experience.",
    bullets: [
      "Electronic delivery requirements",
      "Hardware and software expectations",
      "How a borrower may withdraw consent"
    ]
  }
} as const;

type DisclosureSlug = keyof typeof disclosurePages;

export function generateMetadata({ params }: { params: { slug: DisclosureSlug } }): Metadata {
  const page = disclosurePages[params.slug];
  if (!page) {
    return {};
  }

  return buildMetadata({
    title: page.title,
    description: page.description,
    path: `/heloc/disclosures/${params.slug}`
  });
}
export default function HelocDisclosurePlaceholderPage({
  params
}: {
  params: { slug: DisclosureSlug };
}) {
  const page = disclosurePages[params.slug];
  if (!page) {
    notFound();
  }

  return (
    <section className="page-section pt-16 sm:pt-20">
      <Container className="max-w-4xl">
        <Card className="rounded-[34px] p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
            Disclosure placeholder
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
            {page.title}
          </h1>
          <p className="mt-4 text-base leading-8 text-[var(--muted)]">{page.description}</p>

          <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-slate-50/90 p-6">
            <p className="text-sm font-semibold text-[var(--navy)]">What this placeholder represents</p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
              {page.bullets.map((bullet) => (
                <p key={bullet}>• {bullet}</p>
              ))}
            </div>
          </div>

          <p className="mt-8 text-sm leading-7 text-[var(--muted)]">
            This page is a fallback placeholder for local and demo environments. In production, replace it with the
            institution-approved disclosure document URL in environment configuration.
          </p>
        </Card>
      </Container>
    </section>
  );
}
