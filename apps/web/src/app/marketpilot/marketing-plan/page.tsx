import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";
import { PlanClient } from "@/components/marketpilot/plan-client";

export default function MarketPilotPlanPage() {
  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="30-day plan"
        title="Generate a practical marketing plan"
        description="Create a full 30-day strategy with weekly themes, content ideas, campaign ideas, local SEO topics, and action checklists."
      />
      <PlanClient />
    </MarketPilotAppFrame>
  );
}
