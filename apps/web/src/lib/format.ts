export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function toneClass(tone: "positive" | "neutral" | "warning"): string {
  if (tone === "positive") return "text-emerald-700";
  if (tone === "warning") return "text-amber-700";
  return "text-slate-600";
}
