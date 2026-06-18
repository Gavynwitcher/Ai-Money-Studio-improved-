import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { AssetsClient } from "@/components/marketpilot/assets-client";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";

export default function MarketPilotAssetsPage() {
  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Asset Library"
        title="Your generated marketing assets"
        description="Review saved marketing plans, campaigns, social assets, and email assets. AI-generated content should be reviewed before publishing."
      />
      <AssetsClient />
    </MarketPilotAppFrame>
  );
}
