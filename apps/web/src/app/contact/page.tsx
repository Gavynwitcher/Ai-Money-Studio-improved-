import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { faqs } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact, Waitlist, and Demo Requests",
  description:
    "Contact Unified Banking Hub, join the waitlist, request a product demo, or express investor interest in the multi-bank banking platform.",
  path: "/contact",
  keywords: [
    "banking app waitlist",
    "request banking dashboard demo",
    "contact fintech startup",
    "investor demo fintech"
  ]
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact and waitlist"
        title="Capture customers, demo requests, and investor interest in one place."
        description="This page is built to support launch demand collection, inbound product conversations, and lightweight investor outreach before a production backend is connected."
        primaryCta={{ href: "/signup", label: "Create early access account" }}
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
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Demo request</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Invite early customers to a guided walkthrough of account linking, dashboard visibility, and transfer reviews.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Investor interest</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Frame the product as an MVP for demand validation, pricing exploration, and Plaid-driven architecture planning.
              </p>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Segment signals</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Use form submissions to understand whether consumers or small businesses show stronger interest in aggregation, transfer tools, or credit features.
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
