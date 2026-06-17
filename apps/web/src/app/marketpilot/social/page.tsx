import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { GeneratorForm } from "@/components/marketpilot/generator-form";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";

export default function MarketPilotSocialPage() {
  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Social Content"
        title="Generate posts, hooks, scripts, and schedules"
        description="Create captions, hashtags, video ideas, carousel ideas, image prompts, and a posting schedule for your business."
      />
      <GeneratorForm type="social" />
    </MarketPilotAppFrame>
  );
}
