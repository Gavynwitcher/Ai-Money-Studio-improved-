import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { DashboardClient } from "@/components/marketpilot/dashboard-client";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";

export default function MarketPilotDashboardPage() {
  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Dashboard"
        title="Your AI Marketing CEO"
        description="See the next best marketing move, generate assets, and keep your small business growth work organized."
      />
      <DashboardClient />
    </MarketPilotAppFrame>
  );
}
