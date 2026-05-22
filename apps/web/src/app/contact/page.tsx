import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { faqs } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Northline Support and Product Team",
  description:
    "Contact Northline for onboarding help, support questions, product walkthroughs, and connected-account setup guidance.",
  path: "/contact",
  keywords: [
    "northline support",
    "banking dashboard support",
    "contact fintech product team",
    "multi bank setup help"
  ]
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact and support"
        title="Talk to the team, get setup help, and keep account questions moving."
        description="Northline uses this page for product support, onboarding conversations, and guided walkthrough requests so users can get help with connections, workflows, and account visibility."
        primaryCta={{ href: "/signup", label: "Create account" }}
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
                Schedule a guided look at account linking, dashboard visibility, transaction categorization, and banking workflows.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Operational questions</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Reach the team about rollout requirements, Plaid-linked workflows, support needs, or institution coverage questions.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Product fit</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Tell the team whether you care most about aggregation, transaction review, accounting, debt visibility, or credit tools.
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
