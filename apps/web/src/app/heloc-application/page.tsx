import type { Metadata } from "next";
import { HelocApplicationForm } from "@/components/forms/heloc-application-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import { getHelocPublicConfig } from "@/lib/heloc/config";

export const metadata: Metadata = buildMetadata({
  title: "Kitsap Bank HELOC Application",
  description:
    "Apply for a Kitsap Bank home equity line of credit through a disclosure-aware online application flow modeled on the current MeridianLink borrower experience.",
  path: "/heloc-application",
  keywords: [
    "heloc application",
    "home equity line of credit",
    "online lending application",
    "meridianlink integration"
  ]
});

const highlights = [
  {
    title: "Current Kitsap-style intake",
    copy: "Borrower, contact, address, identification, property, and loan details are organized to mirror the current Kitsap Bank application flow."
  },
  {
    title: "Checklist before continue",
    copy: "Applicants see the identification and credit-unfreeze reminders, plus the third-party site notice, before starting the full application."
  },
  {
    title: "MeridianLink adapter ready",
    copy: "Server-side normalization, audit logging, mock payload previews, and a dedicated field-map handoff layer."
  },
  {
    title: "Plaid Assets ready path",
    copy: "The platform now includes a dedicated Assets section for borrower asset verification and underwriting-oriented report workflows."
  }
];

export default function HelocApplicationPage() {
  const config = getHelocPublicConfig();

  return (
    <>
      <PageHero
        eyebrow="Kitsap Bank"
        title="Home Equity Line of Credit application"
        description="This page uses Kitsap Bank's current-style MeridianLink intake, including a continue gate, identification reminders, disclosure links, and a backend submission adapter."
        primaryCta={{ href: "#application", label: "Continue to application" }}
        secondaryCta={{ href: config.disclosures.helocBrochureUrl, label: "Home equity information" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
            <div id="application">
              <HelocApplicationForm lenderName={config.lenderName} disclosures={config.disclosures} />
            </div>

            <div className="grid gap-5">
              <Card className="rounded-[30px] p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">What to expect</p>
                <h2 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                  Structured like the current Kitsap Bank borrower flow.
                </h2>
                <div className="mt-5 grid gap-4">
                  {highlights.map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-[var(--line)] bg-white/85 p-4">
                      <p className="text-sm font-semibold text-[var(--navy)]">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[30px] p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Disclosure links</p>
                <div className="mt-4 grid gap-3 text-sm">
                  <a
                    href={config.disclosures.helocBrochureUrl}
                    target="_blank"
                    className="rounded-[22px] border border-[var(--line)] bg-slate-50/85 px-4 py-4 text-[var(--navy)] transition hover:border-[var(--teal)]"
                    rel="noreferrer"
                  >
                    Home Equity Loan Information
                  </a>
                  <a
                    href={config.disclosures.earlyDisclosureUrl}
                    target="_blank"
                    className="rounded-[22px] border border-[var(--line)] bg-slate-50/85 px-4 py-4 text-[var(--navy)] transition hover:border-[var(--teal)]"
                    rel="noreferrer"
                  >
                    Applicant information
                  </a>
                  <a
                    href={config.disclosures.privacyUrl}
                    target="_blank"
                    className="rounded-[22px] border border-[var(--line)] bg-slate-50/85 px-4 py-4 text-[var(--navy)] transition hover:border-[var(--teal)]"
                    rel="noreferrer"
                  >
                    Privacy notice
                  </a>
                  <a
                    href={config.disclosures.eSignUrl}
                    target="_blank"
                    className="rounded-[22px] border border-[var(--line)] bg-slate-50/85 px-4 py-4 text-[var(--navy)] transition hover:border-[var(--teal)]"
                    rel="noreferrer"
                  >
                    E-SIGN consent
                  </a>
                </div>
              </Card>

              <Card className="rounded-[30px] p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Operational note</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  This application stores borrower acknowledgements, timestamps, identification metadata, and request
                  details in an internal audit log. In mock mode, a MeridianLink preview payload is also saved locally
                  for internal review.
                </p>
                <a
                  href="/assets"
                  className="mt-5 inline-flex items-center rounded-[18px] border border-[var(--line)] bg-white/90 px-4 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--teal)]"
                >
                  View Assets underwriting section
                </a>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
