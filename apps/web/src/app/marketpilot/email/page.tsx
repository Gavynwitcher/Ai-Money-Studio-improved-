import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { GeneratorForm } from "@/components/marketpilot/generator-form";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";

export default function MarketPilotEmailPage() {
  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Email Generator"
        title="Generate email copy and follow-up"
        description="Create subject lines, preview text, an email body, CTA, and follow-up email from your business profile."
      />
      <GeneratorForm type="email" />
    </MarketPilotAppFrame>
  );
}
