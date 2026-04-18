import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorJson } from "@/lib/server/http";
import { resolveActiveUserId } from "@/lib/server/user";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const strategies = await prisma.strategyTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ strategies });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load strategies", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const body = await req.json();

    if (!body.name || !body.strategyType) {
      return errorJson("name and strategyType are required.");
    }

    const strategy = await prisma.strategyTemplate.create({
      data: {
        userId,
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        strategyType: String(body.strategyType),
        trendFilters: JSON.stringify(body.trendFilters ?? {}),
        volatilityFilters: JSON.stringify(body.volatilityFilters ?? { lookback: 20 }),
        dteTarget: Number(body.dteTarget ?? 7),
        spreadWidth: Number(body.spreadWidth ?? 1),
        profitTargetPct: Number(body.profitTargetPct ?? 40),
        stopLossPct: Number(body.stopLossPct ?? 50)
      }
    });

    return NextResponse.json({ strategy }, { status: 201 });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to create strategy", 500);
  }
}
