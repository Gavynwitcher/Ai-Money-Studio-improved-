import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorJson } from "@/lib/server/http";
import { resolveActiveUserId } from "@/lib/server/user";

const defaultRules = {
  maxRiskPerTradePct: 2,
  maxOpenPositions: 6,
  maxDailyLossPct: 3,
  maxTradesPerDay: 5,
  cooldownMinutes: 30,
  tickerConcentrationPct: 10,
  strategyConcentrationPct: 20
};

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const rules = await prisma.ruleSettings.findUnique({ where: { userId } });
    return NextResponse.json({
      rules: rules
        ? {
            maxRiskPerTradePct: rules.maxRiskPerTradePct,
            maxOpenPositions: rules.maxOpenPositions,
            maxDailyLossPct: rules.maxDailyLossPct,
            maxTradesPerDay: rules.maxTradesPerDay,
            cooldownMinutes: rules.cooldownMinutes,
            tickerConcentrationPct: rules.tickerConcentrationPct,
            strategyConcentrationPct: rules.strategyConcentrationPct
          }
        : defaultRules
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load rules", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const body = await req.json();

    const payload = {
      maxRiskPerTradePct: Number(body.maxRiskPerTradePct),
      maxOpenPositions: Number(body.maxOpenPositions),
      maxDailyLossPct: Number(body.maxDailyLossPct),
      maxTradesPerDay: Number(body.maxTradesPerDay),
      cooldownMinutes: Number(body.cooldownMinutes),
      tickerConcentrationPct: Number(body.tickerConcentrationPct),
      strategyConcentrationPct: Number(body.strategyConcentrationPct)
    };

    if (Object.values(payload).some((value) => !Number.isFinite(value) || value < 0)) {
      return errorJson("All rule values must be non-negative numbers.");
    }

    const rules = await prisma.ruleSettings.upsert({
      where: { userId },
      create: { userId, ...payload },
      update: payload
    });

    return NextResponse.json({ rules });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to save rules", 500);
  }
}
