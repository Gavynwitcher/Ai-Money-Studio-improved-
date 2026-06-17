import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";
import { openAiIsConfigured, supabaseIsConfigured } from "@/lib/marketpilot/config";

export default function MarketPilotSettingsPage() {
  const checks = [
    ["Supabase", supabaseIsConfigured(), "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    ["OpenAI", openAiIsConfigured(), "OPENAI_API_KEY"],
    ["Stripe", Boolean(process.env.STRIPE_SECRET_KEY), "STRIPE_SECRET_KEY and MarketPilot price IDs"]
  ] as const;

  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Settings"
        title="Environment and integration status"
        description="Use this page during setup to confirm which integrations are ready."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {checks.map(([name, ready, detail]) => (
          <article key={name} className="rounded-2xl border border-[#dfe7dd] bg-white p-5">
            <p className={`text-sm font-black ${ready ? "text-[#255f3d]" : "text-[#7a5418]"}`}>{ready ? "Configured" : "Needs setup"}</p>
            <h2 className="mt-2 text-2xl font-black">{name}</h2>
            <p className="mt-3 text-sm leading-6 text-[#647067]">{detail}</p>
          </article>
        ))}
      </div>
    </MarketPilotAppFrame>
  );
}
