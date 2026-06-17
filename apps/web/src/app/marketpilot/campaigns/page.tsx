import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { GeneratorForm } from "@/components/marketpilot/generator-form";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";

export default function MarketPilotCampaignsPage() {
  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Campaign Builder"
        title="Generate a complete campaign"
        description="Pick a goal, offer type, and platform. MarketPilot creates copy and campaign recommendations you can review and adapt."
      />
      <GeneratorForm type="campaign" />
    </MarketPilotAppFrame>
  );
}
