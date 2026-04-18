import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorJson } from "@/lib/server/http";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();

    const [positions, latestLogs, blockedCandidates] = await Promise.all([
      prisma.paperPosition.findMany({
        where: { userId, outcome: "OPEN" },
        select: { riskDollars: true }
      }),
      prisma.tradeLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { complianceScore: true }
      }),
      prisma.candidateTrade.count({
        where: {
          userId,
          complianceStatus: "BLOCKED",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const openRisk = positions.reduce(
      (sum: number, pos: (typeof positions)[number]) => sum + pos.riskDollars,
      0
    );
    const complianceScore =
      latestLogs.length === 0
        ? null
        : Math.round(
            latestLogs.reduce(
              (sum: number, log: (typeof latestLogs)[number]) => sum + log.complianceScore,
              0
            ) / latestLogs.length
          );

    return NextResponse.json({
      complianceScore,
      openRisk,
      recentViolations: blockedCandidates,
      note: "Research-only approximations. Not trade recommendations."
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        {
          complianceScore: null,
          openRisk: 0,
          recentViolations: 0,
          note: "Database offline. Showing fallback research summary."
        },
        { headers: { "x-data-source": "fallback" } }
      );
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load dashboard", 500);
  }
}
