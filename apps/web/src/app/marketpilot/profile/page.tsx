import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";
import { ProfileForm } from "@/components/marketpilot/profile-form";

export default function MarketPilotProfilePage() {
  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Onboarding"
        title="Business profile"
        description="MarketPilot uses this profile to shape plans, campaigns, content, email copy, and local SEO recommendations."
      />
      <ProfileForm />
    </MarketPilotAppFrame>
  );
}
