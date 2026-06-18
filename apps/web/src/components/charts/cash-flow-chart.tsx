import { monthlyCashFlow } from "@/data/mock-finance";

export function CashFlowChart() {
  const max = Math.max(...monthlyCashFlow.flatMap((item) => [item.inflow, item.outflow]));

  return (
    <div className="grid gap-4">
      {monthlyCashFlow.map((item) => (
        <div key={item.label} className="grid grid-cols-[48px_1fr] items-center gap-3">
          <span className="text-sm font-medium text-[var(--muted)]">{item.label}</span>
          <div className="grid gap-2">
            <div className="h-3 rounded-full bg-[rgba(26,139,141,0.14)]">
              <div
                className="h-full rounded-full bg-[var(--teal)]"
                style={{ width: `${(item.inflow / max) * 100}%` }}
              />
            </div>
            <div className="h-3 rounded-full bg-[rgba(10,37,64,0.08)]">
              <div
                className="h-full rounded-full bg-[var(--navy)]"
                style={{ width: `${(item.outflow / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
