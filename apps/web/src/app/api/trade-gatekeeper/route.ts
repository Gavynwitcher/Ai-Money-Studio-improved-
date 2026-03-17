import { NextRequest, NextResponse } from "next/server";
import { evaluateTrade, type CandidateTrade, type RuleContext, type RuleSettings } from "@options/core";
import { prisma } from "@/lib/prisma";
import { errorJson } from "@/lib/server/http";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

const defaultRules: RuleSettings = {
  maxRiskPerTradePct: 2,
  maxOpenPositions: 6,
  maxDailyLossPct: 3,
  maxTradesPerDay: 5,
  cooldownMinutes: 30,
  tickerConcentrationPct: 10,
  strategyConcentrationPct: 20
};

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const body = await req.json();

    if (!body.symbol || !body.strategyType) {
      return errorJson("symbol and strategyType are required.");
    }

    const [settings, openPositions, todayLogs, latestLog] = await Promise.all([
      prisma.ruleSettings.findUnique({ where: { userId } }),
      prisma.paperPosition.findMany({
        where: { userId, outcome: "OPEN" },
        select: {
          id: true,
          symbol: true,
          strategyType: true,
          riskDollars: true,
          openedAt: true
        }
      }),
      prisma.tradeLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        select: { complianceStatus: true }
      }),
      prisma.tradeLog.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true }
      })
    ]);

    const rules: RuleSettings = settings
      ? {
          maxRiskPerTradePct: settings.maxRiskPerTradePct,
          maxOpenPositions: settings.maxOpenPositions,
          maxDailyLossPct: settings.maxDailyLossPct,
          maxTradesPerDay: settings.maxTradesPerDay,
          cooldownMinutes: settings.cooldownMinutes,
          tickerConcentrationPct: settings.tickerConcentrationPct,
          strategyConcentrationPct: settings.strategyConcentrationPct
        }
      : defaultRules;

    const riskDollars = Number(body.riskDollars ?? 0);
    const riskPct = Number(body.riskPct ?? 0);
    const now = body.openedAt ? new Date(body.openedAt) : new Date();

    const candidate: CandidateTrade = {
      symbol: String(body.symbol),
      strategyType: String(body.strategyType),
      riskDollars,
      riskPct,
      openedAt: now
    };

    const context: RuleContext = {
      accountEquity: Number(body.accountEquity ?? 100000),
      dailyPnL: Number(body.dailyPnL ?? 0),
      tradesToday: Number(body.tradesToday ?? todayLogs.length),
      lastTradeAt: latestLog?.createdAt ?? null,
      openPositions
    };

    const compliance = evaluateTrade(rules, context, candidate, now);

    const createdCandidate = await prisma.candidateTrade.create({
      data: {
        userId,
        strategyTemplateId: body.strategyTemplateId ? String(body.strategyTemplateId) : null,
        symbol: candidate.symbol,
        strategyType: candidate.strategyType,
        riskDollars: candidate.riskDollars,
        riskPct: candidate.riskPct,
        complianceStatus: compliance.status,
        complianceScore: compliance.complianceScore,
        violationReasons: JSON.stringify(compliance.reasons),
        warningReasons: JSON.stringify(compliance.warnings),
        notes: body.notes ? String(body.notes) : null
      }
    });

    await prisma.tradeLog.create({
      data: {
        userId,
        candidateTradeId: createdCandidate.id,
        symbol: candidate.symbol,
        strategyType: candidate.strategyType,
        riskDollars: candidate.riskDollars,
        riskPct: candidate.riskPct,
        complianceStatus: compliance.status,
        complianceScore: compliance.complianceScore,
        violationReasons: JSON.stringify(compliance.reasons),
        warningReasons: JSON.stringify(compliance.warnings),
        action: "GATEKEEPER_EVALUATION"
      }
    });

    return NextResponse.json({
      candidateTradeId: createdCandidate.id,
      compliance,
      note: "Research-only approximation. Never a trade recommendation."
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return errorJson("Database offline. Gatekeeper write operations are temporarily unavailable.", 503);
    }
    return errorJson(error instanceof Error ? error.message : "Gatekeeper evaluation failed", 500);
  }
}

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const [allowed, warnings, blocked] = await Promise.all([
      prisma.candidateTrade.count({ where: { userId, complianceStatus: "ALLOWED" } }),
      prisma.candidateTrade.count({ where: { userId, complianceStatus: "WARNINGS" } }),
      prisma.candidateTrade.count({ where: { userId, complianceStatus: "BLOCKED" } })
    ]);

    return NextResponse.json({ allowed, warnings, blocked });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        { allowed: 0, warnings: 0, blocked: 0, note: "Database offline. Showing fallback counts." },
        { headers: { "x-data-source": "fallback" } }
      );
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load gatekeeper summary", 500);
  }
}
