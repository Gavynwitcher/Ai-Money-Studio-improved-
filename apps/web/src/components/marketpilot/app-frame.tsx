import { requireMarketPilotUser } from "@/lib/marketpilot/supabase-server";
import { MarketPilotNav } from "./nav";

export async function MarketPilotAppFrame({ children }: { children: React.ReactNode }) {
  const user = await requireMarketPilotUser();

  return (
    <div className="min-h-screen bg-[#f6f8f3] text-[#10231c] lg:flex">
      <MarketPilotNav email={user.email} />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
