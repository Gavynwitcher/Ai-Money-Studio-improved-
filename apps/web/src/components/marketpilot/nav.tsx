"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createMarketPilotBrowserClient } from "@/lib/marketpilot/supabase-browser";
import { MarketPilotLogo } from "./brand";

const items = [
  ["/marketpilot/dashboard", "Dashboard"],
  ["/marketpilot/profile", "Business Profile"],
  ["/marketpilot/marketing-plan", "Marketing Plan"],
  ["/marketpilot/campaigns", "Campaign Builder"],
  ["/marketpilot/social", "Social Content"],
  ["/marketpilot/email", "Email Generator"],
  ["/marketpilot/assets", "Asset Library"],
  ["/marketpilot/pricing", "Pricing"],
  ["/marketpilot/settings", "Settings"]
] as const;

export function MarketPilotNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createMarketPilotBrowserClient();
      await supabase.auth.signOut();
    } catch {
      await fetch("/api/marketpilot/demo-auth", { method: "DELETE" });
    }
    await fetch("/api/marketpilot/demo-auth", { method: "DELETE" });
    router.push("/marketpilot/login");
    router.refresh();
  }

  return (
    <aside className="border-b border-[#dfe7dd] bg-white/95 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:block lg:px-5">
        <MarketPilotLogo />
        <div className="hidden lg:mt-8 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7c887f]">Workspace</p>
          <nav className="mt-3 grid gap-1">
            {items.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-3 py-3 text-sm font-bold ${
                  pathname === href ? "bg-[#10231c] text-white" : "text-[#38443d] hover:bg-[#f1f5ef]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:block">
          <p className="truncate text-xs text-[#647067]">{email}</p>
          <button onClick={signOut} className="mt-3 w-full rounded-xl border border-[#d8e1d7] px-4 py-3 text-sm font-black">
            Log out
          </button>
        </div>
        <Link href="/marketpilot/dashboard" className="rounded-xl bg-[#10231c] px-4 py-3 text-sm font-black text-white lg:hidden">
          App
        </Link>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:hidden">
        {items.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold ${
              pathname === href ? "bg-[#10231c] text-white" : "bg-white text-[#38443d]"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
