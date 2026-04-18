import { NextRequest, NextResponse } from "next/server";
import {
  generateCandidates,
  getHistoricalOHLCV,
  runBacktest,
  type StrategyTemplateSpec
} from "@options/research";
import type { RuleSettings } from "@options/core";
import { prisma } from "@/lib/prisma";
import { errorJson } from "@/lib/server/http";
import { resolveActiveUserId } from "@/lib/server/user";
import { jsonObject } from "@/lib/json";

const defaultRules: RuleSettings = {
  maxRiskPerTradePct: 2,
  maxOpenPositions: 6,
  maxDailyLossPct: 3,
  maxTradesPerDay: 5,
  cooldownMinutes: 30,
  tickerConcentrationPct: 10,
  strategyConcentrationPct: 20
};

function toTemplateSpec(strategy: {
  name: string;
  strategyType: string;
  trendFilters: unknown;
  volatilityFilters: unknown;
  dteTarget: number;
  spreadWidth: number;
  profitTargetPct: number;
  stopLossPct: number;
}): StrategyTemplateSpec {
  const trend = jsonObject(strategy.trendFilters);
  const volatilityRaw = jsonObject(strategy.volatilityFilters);
  const volatility = { lookback: 20, ...volatilityRaw };

  return {
    name: strategy.name,
    strategyType: strategy.strategyType,
    trend: trend as StrategyTemplateSpec["trend"],
    volatility: volatility as StrategyTemplateSpec["volatility"],
    dteTarget: strategy.dteTarget,
    spreadWidth: strategy.spreadWidth,
    profitTargetPct: strategy.profitTargetPct,
    stopLossPct: strategy.stopLossPct
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const searchParams = req.nextUrl.searchParams;
    const take = Math.min(Number(searchParams.get("take") ?? 20), 100);

    const runs = await prisma.backtestRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        strategy: {
          select: { name: true, strategyType: true }
        }
      }
    });

    return NextResponse.json({ runs });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load backtests", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const body = await req.json();

    if (!body.symbol || !body.strategyTemplateId) {
      return errorJson("symbol and strategyTemplateId are required.");
    }

    const strategy = await prisma.strategyTemplate.findFirst({
      where: { id: String(body.strategyTemplateId), userId }
    });

    if (!strategy) {
      return errorJson("Strategy template not found.", 404);
    }

    const start = body.start ? new Date(body.start) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = body.end ? new Date(body.end) : new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return errorJson("Invalid start/end dates.");
    }

    const bars = await getHistoricalOHLCV(String(body.symbol), start, end);
    if (bars.length === 0) {
      return errorJson("No market bars returned for that symbol/date range.", 422);
    }

    const rulesRow = await prisma.ruleSettings.findUnique({ where: { userId } });
    const rules: RuleSettings = rulesRow
      ? {
          maxRiskPerTradePct: rulesRow.maxRiskPerTradePct,
          maxOpenPositions: rulesRow.maxOpenPositions,
          maxDailyLossPct: rulesRow.maxDailyLossPct,
          maxTradesPerDay: rulesRow.maxTradesPerDay,
          cooldownMinutes: rulesRow.cooldownMinutes,
          tickerConcentrationPct: rulesRow.tickerConcentrationPct,
          strategyConcentrationPct: rulesRow.strategyConcentrationPct
        }
      : defaultRules;

    const template = toTemplateSpec(strategy);
    const signals = generateCandidates(String(body.symbol), bars, template);
    const result = runBacktest(String(body.symbol), bars, signals, template, rules, {
      initialEquity: Number(body.initialEquity ?? 100000),
      riskPctPerTrade: Number(body.riskPctPerTrade ?? rules.maxRiskPerTradePct)
    });

    const run = await prisma.backtestRun.create({
      data: {
        userId,
        strategyTemplateId: strategy.id,
        symbol: String(body.symbol),
        startDate: start,
        endDate: end,
        equityCurve: JSON.stringify(result.equityCurve),
        maxDrawdown: result.maxDrawdown,
        winRate: result.winRate,
        lossStreaks: JSON.stringify(result.lossStreaks),
        violationPressure: JSON.stringify(result.violationPressure)
      }
    });

    return NextResponse.json({
      run,
      trades: result.trades,
      note: "Backtests are simplified approximations for research-only discipline review."
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Backtest run failed", 500);
  }
}
