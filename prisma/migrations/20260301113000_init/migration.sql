-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seededAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyCopilotProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxRiskPerTradePct" DOUBLE PRECISION NOT NULL,
    "maxOpenPositions" INTEGER NOT NULL,
    "maxDailyLossPct" DOUBLE PRECISION NOT NULL,
    "maxTradesPerDay" INTEGER NOT NULL,
    "cooldownMinutes" INTEGER NOT NULL,
    "tickerConcentrationPct" DOUBLE PRECISION NOT NULL,
    "strategyConcentrationPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strategyType" TEXT NOT NULL,
    "trendFilters" TEXT NOT NULL,
    "volatilityFilters" TEXT NOT NULL,
    "dteTarget" INTEGER NOT NULL,
    "spreadWidth" DOUBLE PRECISION NOT NULL,
    "profitTargetPct" DOUBLE PRECISION NOT NULL,
    "stopLossPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyTemplateId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "equityCurve" TEXT NOT NULL,
    "maxDrawdown" DOUBLE PRECISION NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "lossStreaks" TEXT NOT NULL,
    "violationPressure" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BacktestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyTemplateId" TEXT,
    "symbol" TEXT NOT NULL,
    "strategyType" TEXT NOT NULL,
    "riskDollars" DOUBLE PRECISION NOT NULL,
    "riskPct" DOUBLE PRECISION NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "complianceScore" INTEGER NOT NULL,
    "violationReasons" TEXT NOT NULL,
    "warningReasons" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategyType" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "riskDollars" DOUBLE PRECISION NOT NULL,
    "riskPct" DOUBLE PRECISION NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "complianceScore" INTEGER NOT NULL,
    "violationReasons" TEXT NOT NULL,
    "warningReasons" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateTradeId" TEXT,
    "paperPositionId" TEXT,
    "symbol" TEXT NOT NULL,
    "strategyType" TEXT NOT NULL,
    "riskDollars" DOUBLE PRECISION NOT NULL,
    "riskPct" DOUBLE PRECISION NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "complianceScore" INTEGER NOT NULL,
    "violationReasons" TEXT NOT NULL,
    "warningReasons" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "availableBalance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyCopilotAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "merchantRaw" TEXT NOT NULL,
    "merchantNormalized" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyCopilotTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "monthlyContribution" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyCopilotGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotDebt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "minimumPayment" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "creditLimit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyCopilotDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotRecurringSeries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "cadence" TEXT NOT NULL,
    "nextExpectedDate" TIMESTAMP(3) NOT NULL,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "autopay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyCopilotRecurringSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotSafeToSpendSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horizon" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "assumptionsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyCopilotSafeToSpendSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "estimatedImpact" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyCopilotRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyCopilotAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "expectedOutcome" TEXT NOT NULL,
    "downside" TEXT NOT NULL,
    "requiresStepUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyCopilotAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyCopilotProfile_userId_key" ON "MoneyCopilotProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleSettings_userId_key" ON "RuleSettings"("userId");

-- CreateIndex
CREATE INDEX "MoneyCopilotAccount_userId_type_idx" ON "MoneyCopilotAccount"("userId", "type");

-- CreateIndex
CREATE INDEX "MoneyCopilotTransaction_userId_postedAt_idx" ON "MoneyCopilotTransaction"("userId", "postedAt");

-- CreateIndex
CREATE INDEX "MoneyCopilotGoal_userId_targetDate_idx" ON "MoneyCopilotGoal"("userId", "targetDate");

-- CreateIndex
CREATE INDEX "MoneyCopilotDebt_userId_dueDate_idx" ON "MoneyCopilotDebt"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "MoneyCopilotRecurringSeries_userId_type_nextExpectedDate_idx" ON "MoneyCopilotRecurringSeries"("userId", "type", "nextExpectedDate");

-- CreateIndex
CREATE INDEX "MoneyCopilotSafeToSpendSnapshot_userId_horizon_timestamp_idx" ON "MoneyCopilotSafeToSpendSnapshot"("userId", "horizon", "timestamp");

-- CreateIndex
CREATE INDEX "MoneyCopilotRecommendation_userId_status_createdAt_idx" ON "MoneyCopilotRecommendation"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MoneyCopilotAction_userId_status_createdAt_idx" ON "MoneyCopilotAction"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "MoneyCopilotProfile" ADD CONSTRAINT "MoneyCopilotProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleSettings" ADD CONSTRAINT "RuleSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyTemplate" ADD CONSTRAINT "StrategyTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestRun" ADD CONSTRAINT "BacktestRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestRun" ADD CONSTRAINT "BacktestRun_strategyTemplateId_fkey" FOREIGN KEY ("strategyTemplateId") REFERENCES "StrategyTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTrade" ADD CONSTRAINT "CandidateTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTrade" ADD CONSTRAINT "CandidateTrade_strategyTemplateId_fkey" FOREIGN KEY ("strategyTemplateId") REFERENCES "StrategyTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperPosition" ADD CONSTRAINT "PaperPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeLog" ADD CONSTRAINT "TradeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeLog" ADD CONSTRAINT "TradeLog_candidateTradeId_fkey" FOREIGN KEY ("candidateTradeId") REFERENCES "CandidateTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeLog" ADD CONSTRAINT "TradeLog_paperPositionId_fkey" FOREIGN KEY ("paperPositionId") REFERENCES "PaperPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotAccount" ADD CONSTRAINT "MoneyCopilotAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotTransaction" ADD CONSTRAINT "MoneyCopilotTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotTransaction" ADD CONSTRAINT "MoneyCopilotTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MoneyCopilotAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotGoal" ADD CONSTRAINT "MoneyCopilotGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotDebt" ADD CONSTRAINT "MoneyCopilotDebt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotRecurringSeries" ADD CONSTRAINT "MoneyCopilotRecurringSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotSafeToSpendSnapshot" ADD CONSTRAINT "MoneyCopilotSafeToSpendSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotRecommendation" ADD CONSTRAINT "MoneyCopilotRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyCopilotAction" ADD CONSTRAINT "MoneyCopilotAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

