import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { jsonStringArray } from "@/lib/json";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import DatabaseOfflineNotice from "@/components/database-offline-notice";

export default async function BehaviorInsightsPage() {
  try {
    const userId = await resolveActiveUserId();
    const logs = await prisma.tradeLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });

    const dayCounts = new Map<string, number>();
    const violationCounts = new Map<string, number>();
    let blockedCount = 0;
    let scoreSum = 0;

    for (const log of logs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
      if (log.complianceStatus === "BLOCKED") blockedCount += 1;
      scoreSum += log.complianceScore;

      for (const reason of jsonStringArray(log.violationReasons)) {
        violationCounts.set(reason, (violationCounts.get(reason) ?? 0) + 1);
      }
    }

    const overtradingDays = Array.from(dayCounts.values()).filter((count) => count > 5).length;
    const topViolation = Array.from(violationCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const avgDiscipline = logs.length === 0 ? "--" : Math.round(scoreSum / logs.length);

    const insights = [
      { label: "Overtrading detection", value: `${overtradingDays} day(s)` },
      {
        label: "Most common rule violation",
        value: topViolation ? `${topViolation[0]} (${topViolation[1]})` : "none"
      },
      { label: "Risk escalation patterns", value: `${blockedCount} blocked events` },
      { label: "Discipline score", value: avgDiscipline }
    ];

    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Behavior & Discipline Insights</h2>
          <p className="mt-3 text-sm text-steel">
            Heuristic behavior analytics to review discipline drift and rule pressure over time.
            Research-only process data.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-steel/10 bg-white p-5">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-2 text-xs text-steel">Signal: {item.value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Behavior Insights" />;
    }
    throw error;
  }
}
