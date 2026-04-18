import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "navy" | "teal" | "gold" | "muted" | "success" | "warning";
  className?: string;
};

const tones = {
  navy: "bg-[rgba(10,37,64,0.08)] text-[var(--navy)]",
  teal: "bg-[rgba(26,139,141,0.1)] text-[var(--ocean)]",
  gold: "bg-[rgba(243,201,106,0.18)] text-[#7a5710]",
  muted: "bg-slate-900/5 text-slate-600",
  success: "bg-[rgba(30,142,99,0.12)] text-[var(--success)]",
  warning: "bg-[rgba(185,111,25,0.12)] text-[var(--warning)]"
};

export function Badge({ children, tone = "navy", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
