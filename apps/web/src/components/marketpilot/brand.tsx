import Link from "next/link";

export function MarketPilotLogo() {
  return (
    <Link href="/marketpilot" className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#10231c] text-sm font-black text-[#8df0b3]">
        MP
      </span>
      <span>
        <span className="block text-sm font-black uppercase tracking-[0.16em] text-[#10231c]">MarketPilot AI</span>
        <span className="block text-xs text-[#647067]">AI Marketing CEO</span>
      </span>
    </Link>
  );
}
