import { cn, titleCase } from "@/lib/utils";

const styles = {
  "available-now": "bg-[rgba(30,142,99,0.12)] text-[var(--success)]",
  mvp: "bg-[rgba(10,37,64,0.08)] text-[var(--navy)]",
  "coming-soon": "bg-[rgba(243,201,106,0.2)] text-[#7a5710]"
};

export function StatusChip({ status }: { status: keyof typeof styles }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]", styles[status])}>
      {titleCase(status.replace("-", " "))}
    </span>
  );
}
