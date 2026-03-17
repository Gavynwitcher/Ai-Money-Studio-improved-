export function parseDateRange(searchParams: URLSearchParams) {
  const end = searchParams.get("end") ? new Date(searchParams.get("end") as string) : new Date();
  const lookbackDays = Number(searchParams.get("lookbackDays") ?? 30);
  const start = searchParams.get("start")
    ? new Date(searchParams.get("start") as string)
    : new Date(end.getTime() - Math.max(1, lookbackDays) * 24 * 60 * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error("Invalid date range.");
  }

  return { start, end };
}
