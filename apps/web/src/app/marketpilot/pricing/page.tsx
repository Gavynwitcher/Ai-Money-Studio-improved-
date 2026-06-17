import { MarketPilotAppFrame } from "@/components/marketpilot/app-frame";
import { MarketPilotPageHeader } from "@/components/marketpilot/page-header";
import { marketPilotConfig } from "@/lib/marketpilot/config";

const tiers = [
  { key: "starter", name: "Starter", price: "$29/month", summary: "For solo owners building a consistent weekly marketing rhythm." },
  { key: "growth", name: "Growth", price: "$79/month", summary: "For growing local businesses that want more campaigns and content volume." },
  { key: "pro", name: "Pro", price: "$149/month", summary: "For teams that need deeper strategy, more assets, and faster execution cycles." }
] as const;

export default function MarketPilotPricingPage() {
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <MarketPilotAppFrame>
      <MarketPilotPageHeader
        eyebrow="Pricing"
        title="Choose a lean marketing plan"
        description="Stripe checkout is wired as a placeholder and should only be activated when Stripe environment variables and price IDs are configured."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {tiers.map((tier, index) => {
          const hasPrice = Boolean(marketPilotConfig.stripePrices[tier.key]);
          return (
            <article key={tier.key} className={`rounded-2xl p-6 ${index === 1 ? "bg-[#10231c] text-white" : "border border-[#dfe7dd] bg-white"}`}>
              <h2 className="text-2xl font-black">{tier.name}</h2>
              <p className="mt-3 text-4xl font-black">{tier.price}</p>
              <p className={`mt-3 text-sm leading-6 ${index === 1 ? "text-[#d8e7dd]" : "text-[#647067]"}`}>{tier.summary}</p>
              <button
                disabled={!stripeReady || !hasPrice}
                className={`mt-6 w-full rounded-xl px-5 py-4 font-black ${
                  index === 1 ? "bg-[#8df0b3] text-[#10231c]" : "bg-[#10231c] text-white"
                } disabled:cursor-not-allowed disabled:opacity-55`}
              >
                {stripeReady && hasPrice ? "Start checkout" : "Stripe setup required"}
              </button>
            </article>
          );
        })}
      </div>
    </MarketPilotAppFrame>
  );
}
