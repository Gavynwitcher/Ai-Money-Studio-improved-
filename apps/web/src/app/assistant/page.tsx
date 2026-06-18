import type { Metadata } from "next";
import { NorthlineAssistant } from "@/components/assistant/northline-assistant";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Northline AI Assistant",
  description:
    "Ask Northline AI about live imported Plaid transactions, merchant activity, categories, amounts, dates, and posting status.",
  path: "/assistant",
  keywords: [
    "Northline AI assistant",
    "AI banking assistant",
    "financial operations AI",
    "OpenAI transaction assistant"
  ]
});

export default function AssistantPage() {
  return (
    <>
      <PageHero
        eyebrow="Northline AI"
        title="Ask practical questions about your connected banking picture."
        description="Northline AI uses OpenAI to interpret live imported Plaid transaction records only. Demo dashboard data, balances, and account totals are excluded from assistant context."
        primaryCta={{ href: "#assistant-workspace", label: "Open assistant" }}
        secondaryCta={{ href: "/security", label: "Review guardrails" }}
      />

      <section className="page-section pt-0" id="assistant-workspace">
        <Container>
          <NorthlineAssistant />
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
