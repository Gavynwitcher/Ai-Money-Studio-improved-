import { NextRequest, NextResponse } from "next/server";
import { exposureByStrategy, exposureByTicker, expirationClustering } from "@options/core";
import { prisma } from "@/lib/prisma";
import { errorJson } from "@/lib/server/http";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";
import { jsonObject } from "@/lib/json";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const openPositions = await prisma.paperPosition.findMany({
      where: { userId, outcome: "OPEN" },
      orderBy: { openedAt: "desc" }
    });

    const exposuresByTicker = exposureByTicker(openPositions);
    const exposuresByStrategy = exposureByStrategy(openPositions);
    const expirations = expirationClustering(
      openPositions.map((position) => {
        const metadata = jsonObject(position.metadata) as { expiration?: string };
        return {
          id: position.id,
          symbol: position.symbol,
          strategyType: position.strategyType,
          riskDollars: position.riskDollars,
          openedAt: position.openedAt,
          expiration: metadata?.expiration ? new Date(metadata.expiration) : undefined
        };
      })
    );

    return NextResponse.json({
      openPositions,
      exposuresByTicker,
      exposuresByStrategy,
      expirations,
      note: "Simulated positions only. No broker connectivity."
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        {
          openPositions: [],
          exposuresByTicker: {},
          exposuresByStrategy: {},
          expirations: {},
          note: "Database offline. Portfolio data unavailable."
        },
        { headers: { "x-data-source": "fallback" } }
      );
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load portfolio", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const body = await req.json();

    if (body.action === "CLOSE") {
      if (!body.positionId) return errorJson("positionId is required for CLOSE action.");

      const existing = await prisma.paperPosition.findFirst({
        where: { id: String(body.positionId), userId }
      });
      if (!existing) return errorJson("Position not found.", 404);

      const closed = await prisma.paperPosition.update({
        where: { id: existing.id },
        data: {
          outcome: "CLOSED",
          closedAt: new Date(),
          metadata: JSON.stringify({
            ...jsonObject(existing.metadata),
            ...(body.metadata ?? {}),
            closeReason: body.closeReason ?? "MANUAL_CLOSE"
          })
        }
      });

      await prisma.tradeLog.create({
        data: {
          userId,
          paperPositionId: closed.id,
          symbol: closed.symbol,
          strategyType: closed.strategyType,
          riskDollars: closed.riskDollars,
          riskPct: closed.riskPct,
          complianceStatus: closed.complianceStatus,
          complianceScore: closed.complianceScore,
          violationReasons: closed.violationReasons,
          warningReasons: closed.warningReasons,
          action: "PAPER_POSITION_CLOSED"
        }
      });

      return NextResponse.json({ position: closed });
    }

    if (!body.symbol || !body.strategyType) {
      return errorJson("symbol and strategyType are required.");
    }

    const position = await prisma.paperPosition.create({
      data: {
        userId,
        symbol: String(body.symbol),
        strategyType: String(body.strategyType),
        openedAt: body.openedAt ? new Date(body.openedAt) : new Date(),
        riskDollars: Number(body.riskDollars ?? 0),
        riskPct: Number(body.riskPct ?? 0),
        complianceStatus: body.complianceStatus ?? "WARNINGS",
        complianceScore: Number(body.complianceScore ?? 50),
        violationReasons: JSON.stringify(body.violationReasons ?? []),
        warningReasons: JSON.stringify(body.warningReasons ?? []),
        outcome: "OPEN",
        metadata: JSON.stringify(body.metadata ?? {})
      }
    });

    await prisma.tradeLog.create({
      data: {
        userId,
        paperPositionId: position.id,
        symbol: position.symbol,
        strategyType: position.strategyType,
        riskDollars: position.riskDollars,
        riskPct: position.riskPct,
        complianceStatus: position.complianceStatus,
        complianceScore: position.complianceScore,
        violationReasons: position.violationReasons,
        warningReasons: position.warningReasons,
        action: "PAPER_POSITION_OPENED"
      }
    });

    return NextResponse.json({ position }, { status: 201 });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return errorJson("Database offline. Portfolio mutations are temporarily unavailable.", 503);
    }
    return errorJson(error instanceof Error ? error.message : "Failed to mutate portfolio", 500);
  }
}
