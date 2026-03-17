import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateRange } from "@/lib/server/dateRange";
import { errorJson } from "@/lib/server/http";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";
import { jsonStringArray } from "@/lib/json";

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const { start, end } = parseDateRange(req.nextUrl.searchParams);

    const logs = await prisma.tradeLog.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" }
    });

    let overtradingDays = 0;
    const violationsByRule = new Map<string, number>();
    let escalationCount = 0;
    const byDay = new Map<string, { count: number; scoreSum: number; logs: number }>();

    for (const log of logs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      const dayData = byDay.get(day) ?? { count: 0, scoreSum: 0, logs: 0 };
      dayData.count += 1;
      dayData.scoreSum += log.complianceScore;
      dayData.logs += 1;
      byDay.set(day, dayData);

      for (const reason of jsonStringArray(log.violationReasons)) {
        violationsByRule.set(reason, (violationsByRule.get(reason) ?? 0) + 1);
      }

      if (log.complianceStatus === "BLOCKED") escalationCount += 1;
    }

    for (const dayData of byDay.values()) {
      if (dayData.count > 5) overtradingDays += 1;
    }

    const disciplineSeries = Array.from(byDay.entries()).map(([date, val]) => ({
      date,
      score: val.logs === 0 ? 0 : Math.round(val.scoreSum / val.logs)
    }));

    const topViolations = Array.from(violationsByRule.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    return NextResponse.json({
      overtradingDays,
      topViolations,
      riskEscalationEvents: escalationCount,
      disciplineSeries,
      note: "Behavior analytics are heuristic approximations for review and reflection."
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        {
          overtradingDays: 0,
          topViolations: [],
          riskEscalationEvents: 0,
          disciplineSeries: [],
          note: "Database offline. Behavior analytics unavailable."
        },
        { headers: { "x-data-source": "fallback" } }
      );
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load behavior insights", 500);
  }
}
