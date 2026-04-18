import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "navy" | "teal" | "gold" | "muted" | "success" | "warning";
  className?: string;
};

const tones = {
  navy: "border border-[rgba(11,31,51,0.1)] bg-[rgba(11,31,51,0.06)] text-[var(--navy)]",
  teal: "border border-[rgba(25,106,117,0.12)] bg-[rgba(25,106,117,0.08)] text-[var(--ocean)]",
  gold: "border border-[rgba(200,164,90,0.16)] bg-[rgba(200,164,90,0.14)] text-[#75551c]",
  muted: "border border-slate-200 bg-slate-100/80 text-slate-600",
  success: "border border-[rgba(30,142,99,0.14)] bg-[rgba(30,142,99,0.1)] text-[var(--success)]",
  warning: "border border-[rgba(185,111,25,0.16)] bg-[rgba(185,111,25,0.12)] text-[var(--warning)]"
};

export function Badge({ children, tone = "navy", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
