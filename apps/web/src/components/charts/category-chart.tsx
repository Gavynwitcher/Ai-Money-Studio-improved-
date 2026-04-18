import { spendingCategories } from "@/data/mock-finance";

export function CategoryChart() {
  return (
    <div className="grid gap-4">
      {spendingCategories.map((item) => (
        <div key={item.label} className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--navy)]">{item.label}</span>
            <span className="text-[var(--muted)]">{item.value}%</span>
          </div>
          <div className="h-3 rounded-full bg-[rgba(10,37,64,0.06)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-[var(--gold)]"
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
