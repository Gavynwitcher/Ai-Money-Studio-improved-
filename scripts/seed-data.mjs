import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("base64")}`;
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  const email = "demo@research.local";
  const password = "demo12345!";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Demo Research User",
      passwordHash: hashPassword(password)
    },
    create: {
      email,
      name: "Demo Research User",
      passwordHash: hashPassword(password)
    }
  });

  await prisma.$transaction([
    prisma.tradeLog.deleteMany({ where: { userId: user.id } }),
    prisma.paperPosition.deleteMany({ where: { userId: user.id } }),
    prisma.candidateTrade.deleteMany({ where: { userId: user.id } }),
    prisma.backtestRun.deleteMany({ where: { userId: user.id } }),
    prisma.strategyTemplate.deleteMany({ where: { userId: user.id } }),
    prisma.ruleSettings.deleteMany({ where: { userId: user.id } })
  ]);

  await prisma.ruleSettings.create({
    data: {
      userId: user.id,
      maxRiskPerTradePct: 2,
      maxOpenPositions: 5,
      maxDailyLossPct: 3,
      maxTradesPerDay: 4,
      cooldownMinutes: 30,
      tickerConcentrationPct: 12,
      strategyConcentrationPct: 25
    }
  });

  const trendMomentum = {
    smaFast: 20,
    smaSlow: 50,
    rsiMin: 45,
    breakoutLookback: 20
  };
  const volModerate = {
    lookback: 20,
    minRealizedVol: 0.15,
    maxRealizedVol: 0.45
  };

  const trendMeanRevert = {
    smaFast: 10,
    smaSlow: 30,
    rsiMax: 70
  };
  const volCalm = {
    lookback: 20,
    maxRealizedVol: 0.35
  };

  const [strategyA, strategyB] = await Promise.all([
    prisma.strategyTemplate.create({
      data: {
        userId: user.id,
        name: "Bull Put Trend Filter",
        description: "Momentum-biased short put spread template",
        strategyType: "bull_put_spread",
        trendFilters: JSON.stringify(trendMomentum),
        volatilityFilters: JSON.stringify(volModerate),
        dteTarget: 21,
        spreadWidth: 5,
        profitTargetPct: 40,
        stopLossPct: 60,
        createdAt: daysAgo(10)
      }
    }),
    prisma.strategyTemplate.create({
      data: {
        userId: user.id,
        name: "Iron Condor Mean Reversion",
        description: "Range-bound premium-selling template",
        strategyType: "iron_condor",
        trendFilters: JSON.stringify(trendMeanRevert),
        volatilityFilters: JSON.stringify(volCalm),
        dteTarget: 30,
        spreadWidth: 10,
        profitTargetPct: 35,
        stopLossPct: 70,
        createdAt: daysAgo(9)
      }
    })
  ]);

  const candidate1 = await prisma.candidateTrade.create({
    data: {
      userId: user.id,
      strategyTemplateId: strategyA.id,
      symbol: "SPY",
      strategyType: "bull_put_spread",
      riskDollars: 900,
      riskPct: 0.9,
      complianceStatus: "ALLOWED",
      complianceScore: 100,
      violationReasons: JSON.stringify([]),
      warningReasons: JSON.stringify([]),
      notes: "Passed all discipline gates",
      createdAt: daysAgo(3)
    }
  });

  const candidate2 = await prisma.candidateTrade.create({
    data: {
      userId: user.id,
      strategyTemplateId: strategyB.id,
      symbol: "QQQ",
      strategyType: "iron_condor",
      riskDollars: 1800,
      riskPct: 1.8,
      complianceStatus: "WARNINGS",
      complianceScore: 95,
      violationReasons: JSON.stringify([]),
      warningReasons: JSON.stringify(["Risk per trade approaching limit"]),
      notes: "Allowed with warning",
      createdAt: daysAgo(2)
    }
  });

  const candidate3 = await prisma.candidateTrade.create({
    data: {
      userId: user.id,
      strategyTemplateId: strategyA.id,
      symbol: "NVDA",
      strategyType: "bull_put_spread",
      riskDollars: 3000,
      riskPct: 3,
      complianceStatus: "BLOCKED",
      complianceScore: 40,
      violationReasons: JSON.stringify(["Risk per trade exceeds maxRiskPerTradePct"]),
      warningReasons: JSON.stringify([]),
      notes: "Blocked by risk policy",
      createdAt: daysAgo(1)
    }
  });

  const openPosition = await prisma.paperPosition.create({
    data: {
      userId: user.id,
      symbol: "SPY",
      strategyType: "bull_put_spread",
      openedAt: daysAgo(3),
      riskDollars: 900,
      riskPct: 0.9,
      complianceStatus: "ALLOWED",
      complianceScore: 100,
      violationReasons: JSON.stringify([]),
      warningReasons: JSON.stringify([]),
      outcome: "OPEN",
      metadata: JSON.stringify({ expiration: daysAgo(-18).toISOString(), contracts: 3 })
    }
  });

  const closedPosition = await prisma.paperPosition.create({
    data: {
      userId: user.id,
      symbol: "IWM",
      strategyType: "iron_condor",
      openedAt: daysAgo(12),
      closedAt: daysAgo(4),
      riskDollars: 1200,
      riskPct: 1.2,
      complianceStatus: "WARNINGS",
      complianceScore: 90,
      violationReasons: JSON.stringify([]),
      warningReasons: JSON.stringify(["Risk per trade approaching limit"]),
      outcome: "CLOSED",
      metadata: JSON.stringify({ expiration: daysAgo(-2).toISOString(), pnl: 310 })
    }
  });

  await prisma.backtestRun.createMany({
    data: [
      {
        userId: user.id,
        strategyTemplateId: strategyA.id,
        symbol: "SPY",
        startDate: daysAgo(180),
        endDate: daysAgo(5),
        equityCurve: JSON.stringify([
          { date: daysAgo(180).toISOString(), equity: 100000 },
          { date: daysAgo(120).toISOString(), equity: 103200 },
          { date: daysAgo(60).toISOString(), equity: 108100 },
          { date: daysAgo(5).toISOString(), equity: 111400 }
        ]),
        maxDrawdown: 0.082,
        winRate: 0.61,
        lossStreaks: JSON.stringify([2, 3, 1]),
        violationPressure: JSON.stringify(4),
        createdAt: daysAgo(5)
      },
      {
        userId: user.id,
        strategyTemplateId: strategyB.id,
        symbol: "QQQ",
        startDate: daysAgo(210),
        endDate: daysAgo(7),
        equityCurve: JSON.stringify([
          { date: daysAgo(210).toISOString(), equity: 100000 },
          { date: daysAgo(150).toISOString(), equity: 101500 },
          { date: daysAgo(90).toISOString(), equity: 104900 },
          { date: daysAgo(7).toISOString(), equity: 106300 }
        ]),
        maxDrawdown: 0.097,
        winRate: 0.56,
        lossStreaks: JSON.stringify([4, 2]),
        violationPressure: JSON.stringify(7),
        createdAt: daysAgo(4)
      }
    ]
  });

  await prisma.tradeLog.createMany({
    data: [
      {
        userId: user.id,
        candidateTradeId: candidate1.id,
        paperPositionId: openPosition.id,
        symbol: "SPY",
        strategyType: "bull_put_spread",
        riskDollars: 900,
        riskPct: 0.9,
        complianceStatus: "ALLOWED",
        complianceScore: 100,
        violationReasons: JSON.stringify([]),
        warningReasons: JSON.stringify([]),
        action: "PAPER_POSITION_OPENED",
        createdAt: daysAgo(3)
      },
      {
        userId: user.id,
        candidateTradeId: candidate2.id,
        symbol: "QQQ",
        strategyType: "iron_condor",
        riskDollars: 1800,
        riskPct: 1.8,
        complianceStatus: "WARNINGS",
        complianceScore: 95,
        violationReasons: JSON.stringify([]),
        warningReasons: JSON.stringify(["Risk per trade approaching limit"]),
        action: "GATEKEEPER_EVALUATION",
        createdAt: daysAgo(2)
      },
      {
        userId: user.id,
        candidateTradeId: candidate3.id,
        symbol: "NVDA",
        strategyType: "bull_put_spread",
        riskDollars: 3000,
        riskPct: 3,
        complianceStatus: "BLOCKED",
        complianceScore: 40,
        violationReasons: JSON.stringify(["Risk per trade exceeds maxRiskPerTradePct"]),
        warningReasons: JSON.stringify([]),
        action: "GATEKEEPER_EVALUATION",
        createdAt: daysAgo(1)
      },
      {
        userId: user.id,
        paperPositionId: closedPosition.id,
        symbol: "IWM",
        strategyType: "iron_condor",
        riskDollars: 1200,
        riskPct: 1.2,
        complianceStatus: "WARNINGS",
        complianceScore: 90,
        violationReasons: JSON.stringify([]),
        warningReasons: JSON.stringify(["Risk per trade approaching limit"]),
        action: "PAPER_POSITION_CLOSED",
        createdAt: daysAgo(4)
      }
    ]
  });

  console.log("Seed complete");
  console.log("Demo login:");
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
