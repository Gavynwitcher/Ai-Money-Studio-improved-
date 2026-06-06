import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Northline Walkthrough, Beta Access, and Product Fit",
  description:
    "Tell Northline how you manage accounts today, request a walkthrough, join the beta, and help the team understand your workflow fit.",
  path: "/contact",
  keywords: [
    "northline walkthrough",
    "northline beta access",
    "multi bank workflow onboarding",
    "cash flow visibility contact"
  ]
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact and onboarding"
        title="Let’s find out if Northline fits your workflow"
        description="Tell us how you manage accounts today, and we’ll help you understand whether Northline can simplify your balances, transactions, cash flow visibility, and future transfer workflows."
        primaryCta={{ href: "#fit-form", label: "Request a walkthrough" }}
        secondaryCta={{ href: "#beta-access", label: "Join the beta" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Request a walkthrough</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                See how Northline can help you organize balances, transactions, and accounts across multiple institutions.
              </p>
              <div className="mt-6">
                <Button href="#fit-form">Schedule walkthrough</Button>
              </div>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Join the beta</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Get early access as Northline continues building account linking, cash flow tools, and transfer review workflows.
              </p>
              <div className="mt-6">
                <Button href="#beta-access">Join beta list</Button>
              </div>
            </Card>
            <Card className="rounded-[30px]">
              <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">Ask a support question</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Have a question about setup, security, Plaid linking, pricing, or your account? Send us a message.
              </p>
              <div className="mt-6">
                <Button href="#fit-form" variant="secondary">
                  Contact support
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <ContactForm />
            <Card className="rounded-[32px]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Trust</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Your information stays private
              </h2>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[var(--muted)]">
                <li className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  Northline does not sell your contact information.
                </li>
                <li className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  Bank login credentials are not collected through this contact form.
                </li>
                <li className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  Secure bank linking is handled separately through Plaid.
                </li>
                <li className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  You can request deletion of your contact information at any time.
                </li>
              </ul>
            </Card>
          </div>
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <WaitlistForm />
        </Container>
      </section>

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[34px]">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Built for multi-account money management</p>
                <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
                  Built for multi-account money management
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                  Northline is especially useful for small business owners, operators, and finance teams who manage
                  operating accounts, payroll accounts, reserve accounts, tax accounts, or accounts across multiple banks.
                </p>
              </div>
              <div className="rounded-[26px] border border-[var(--line)] bg-white/80 p-6">
                <p className="text-sm leading-7 text-[var(--muted)]">
                  If your team currently checks balances across several institutions, reviews transactions in separate bank
                  portals, or keeps mental notes around reserve, tax, and operating cash, Northline is the kind of workflow
                  we want to validate with you first.
                </p>
                <div className="mt-6">
                  <Button href="#fit-form">Tell us about your setup</Button>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
