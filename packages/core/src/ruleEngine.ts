import type {
  CandidateTrade,
  ComplianceResult,
  RuleContext,
  RuleEvaluationInput,
  RuleEvaluationResult,
  RuleSettings,
  TradeRule
} from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function minutesBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

function finiteOrZero(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function createDefaultRuleRegistry(): TradeRule[] {
  return [
    {
      id: "risk.max-risk-pct",
      category: "RISK",
      weight: 30,
      evaluate: ({ candidate, rules }) =>
        candidate.riskPct > rules.maxRiskPerTradePct
          ? { outcome: "BLOCK", message: "Risk per trade exceeds maxRiskPerTradePct" }
          : { outcome: "PASS" }
    },
    {
      id: "portfolio.max-open-positions",
      category: "PORTFOLIO",
      weight: 20,
      evaluate: ({ context, rules }) =>
        context.openPositions.length >= rules.maxOpenPositions
          ? { outcome: "BLOCK", message: "Max open positions reached" }
          : { outcome: "PASS" }
    },
    {
      id: "risk.daily-loss-limit",
      category: "RISK",
      weight: 25,
      evaluate: ({ context, rules }) => {
        const dailyLossLimit = -1 * (rules.maxDailyLossPct / 100) * context.accountEquity;
        return context.dailyPnL <= dailyLossLimit
          ? { outcome: "BLOCK", message: "Daily loss limit breached" }
          : { outcome: "PASS" };
      }
    },
    {
      id: "discipline.max-trades-per-day",
      category: "DISCIPLINE",
      weight: 15,
      evaluate: ({ context, rules }) =>
        context.tradesToday >= rules.maxTradesPerDay
          ? { outcome: "BLOCK", message: "Max trades per day exceeded" }
          : { outcome: "PASS" }
    },
    {
      id: "discipline.cooldown",
      category: "DISCIPLINE",
      weight: 15,
      evaluate: ({ context, rules, now }) => {
        if (!context.lastTradeAt) return { outcome: "PASS" };
        const minutesSinceLast = minutesBetween(now, context.lastTradeAt);
        return minutesSinceLast < rules.cooldownMinutes
          ? { outcome: "BLOCK", message: "Cooldown period not met" }
          : { outcome: "PASS" };
      }
    },
    {
      id: "portfolio.ticker-concentration",
      category: "PORTFOLIO",
      weight: 18,
      evaluate: ({ context, candidate, rules }) => {
        const tickerRisk = context.openPositions
          .filter((pos) => pos.symbol === candidate.symbol)
          .reduce((sum, pos) => sum + pos.riskDollars, 0);

        const projectedTickerRiskPct =
          ((tickerRisk + candidate.riskDollars) / Math.max(context.accountEquity, 1e-9)) * 100;

        return projectedTickerRiskPct > rules.tickerConcentrationPct
          ? { outcome: "BLOCK", message: "Ticker concentration limit exceeded" }
          : { outcome: "PASS" };
      }
    },
    {
      id: "portfolio.strategy-concentration",
      category: "PORTFOLIO",
      weight: 18,
      evaluate: ({ context, candidate, rules }) => {
        const strategyRisk = context.openPositions
          .filter((pos) => pos.strategyType === candidate.strategyType)
          .reduce((sum, pos) => sum + pos.riskDollars, 0);

        const projectedStrategyRiskPct =
          ((strategyRisk + candidate.riskDollars) / Math.max(context.accountEquity, 1e-9)) * 100;

        return projectedStrategyRiskPct > rules.strategyConcentrationPct
          ? { outcome: "BLOCK", message: "Strategy concentration limit exceeded" }
          : { outcome: "PASS" };
      }
    },
    {
      id: "risk.approaching-max-risk-pct",
      category: "RISK",
      weight: 10,
      evaluate: ({ candidate, rules }) =>
        candidate.riskPct > rules.maxRiskPerTradePct * 0.8
          ? { outcome: "WARN", message: "Risk per trade approaching limit" }
          : { outcome: "PASS" }
    }
  ];
}

function validateInput(input: RuleEvaluationInput): RuleEvaluationResult[] {
  const invalid: RuleEvaluationResult[] = [];
  const numericChecks: Array<{ key: string; value: number }> = [
    { key: "accountEquity", value: input.context.accountEquity },
    { key: "candidate.riskDollars", value: input.candidate.riskDollars },
    { key: "candidate.riskPct", value: input.candidate.riskPct }
  ];

  for (const check of numericChecks) {
    if (!Number.isFinite(check.value)) {
      invalid.push({
        ruleId: `input.${check.key}.finite`,
        category: "RISK",
        outcome: "BLOCK",
        message: `${check.key} must be a finite number`,
        weight: 100
      });
    }
  }

  if (input.context.accountEquity <= 0) {
    invalid.push({
      ruleId: "input.accountEquity.positive",
      category: "RISK",
      outcome: "BLOCK",
      message: "accountEquity must be greater than zero",
      weight: 100
    });
  }

  return invalid;
}

function scoreFromEvaluations(evaluations: RuleEvaluationResult[]) {
  const blockPenalty = evaluations
    .filter((item) => item.outcome === "BLOCK")
    .reduce((sum, item) => sum + finiteOrZero(item.weight), 0);

  const warnPenalty = evaluations
    .filter((item) => item.outcome === "WARN")
    .reduce((sum, item) => sum + Math.ceil(finiteOrZero(item.weight) / 2), 0);

  return clamp(100 - blockPenalty - warnPenalty, 0, 100);
}

export function evaluateTradeWithRegistry(
  rules: RuleSettings,
  context: RuleContext,
  candidate: CandidateTrade,
  now: Date = new Date(),
  registry: TradeRule[] = createDefaultRuleRegistry()
): ComplianceResult {
  const input: RuleEvaluationInput = { rules, context, candidate, now };
  const validations = validateInput(input);

  const evaluations: RuleEvaluationResult[] = registry.map((rule) => {
    const result = rule.evaluate(input);
    return {
      ruleId: rule.id,
      category: rule.category,
      outcome: result.outcome,
      message: result.message,
      weight: rule.weight
    };
  });

  const allEvaluations = [...validations, ...evaluations];

  const reasons = allEvaluations
    .filter((item) => item.outcome === "BLOCK" && item.message)
    .map((item) => item.message as string);

  const warnings = allEvaluations
    .filter((item) => item.outcome === "WARN" && item.message)
    .map((item) => item.message as string);

  const hasRiskBlock = allEvaluations.some((item) => item.category === "RISK" && item.outcome === "BLOCK");
  const hasBlock = allEvaluations.some((item) => item.outcome === "BLOCK");
  const hasWarn = allEvaluations.some((item) => item.outcome === "WARN");

  const status: ComplianceResult["status"] =
    hasRiskBlock || hasBlock ? "BLOCKED" : hasWarn ? "WARNINGS" : "ALLOWED";

  return {
    status,
    reasons,
    warnings,
    complianceScore: scoreFromEvaluations(allEvaluations),
    evaluations: allEvaluations
  };
}

export function evaluateTrade(
  rules: RuleSettings,
  context: RuleContext,
  candidate: CandidateTrade,
  now: Date = new Date()
): ComplianceResult {
  return evaluateTradeWithRegistry(rules, context, candidate, now);
}
