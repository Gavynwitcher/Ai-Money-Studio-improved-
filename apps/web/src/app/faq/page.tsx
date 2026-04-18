import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { faqs } from "@/data/site";

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Answers that help users evaluate the product quickly."
        description="The FAQ keeps the product story clear around account linking, security, pricing, business fit, and the difference between the MVP and future roadmap features."
        primaryCta={{ href: "/plaid-integration", label: "See account linking demo" }}
        secondaryCta={{ href: "/contact", label: "Ask a question" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.question} className="rounded-[30px]">
                <h2 className="font-heading text-2xl font-semibold text-[var(--navy)]">{faq.question}</h2>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
