import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateRange } from "@/lib/server/dateRange";
import { errorJson } from "@/lib/server/http";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const searchParams = req.nextUrl.searchParams;
    const { start, end } = parseDateRange(searchParams);
    const action = searchParams.get("action");

    const logs = await prisma.tradeLog.findMany({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
        action: action || undefined
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    return NextResponse.json({ logs });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        { logs: [], note: "Database offline. Trade journal is unavailable in live mode." },
        { headers: { "x-data-source": "fallback" } }
      );
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load trade journal", 500);
  }
}
