import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { faqs } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact and Support",
  description:
    "Contact Northline for product questions, onboarding help, connected-account support, or a guided walkthrough of the banking workspace.",
  path: "/contact",
  keywords: [
    "northline support",
    "banking dashboard help",
    "contact banking platform",
    "plaid onboarding help"
  ]
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact and support"
        title="Get help with onboarding, linked accounts, and product setup."
        description="Use this page to contact Northline, request a walkthrough of the banking workspace, or ask for help with connected institutions, pricing, or product availability."
        primaryCta={{ href: "/plaid-integration", label: "Open connection workspace" }}
        secondaryCta={{ href: "/pricing", label: "Review pricing" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-2">
            <ContactForm />
            <WaitlistForm />
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Guided walkthrough</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Request a guided walkthrough of account linking, dashboard visibility, transaction review, and cash-flow summaries.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Support requests</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Use submissions to track onboarding blockers, account-linking questions, and requests for operational help.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Usage signals</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Track whether customers are asking most about aggregation, transaction review, cash-flow visibility, AI insights, or pricing.
              </p>
            </Card>
          </div>

          <Card className="mt-5 rounded-[32px]">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">FAQ snippet</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {faqs.slice(0, 4).map((faq) => (
                <div key={faq.question} className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
                  <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
