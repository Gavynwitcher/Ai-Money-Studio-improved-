import { describe, expect, it } from "vitest";
import { createDefaultRuleRegistry, evaluateTrade, evaluateTradeWithRegistry } from "../src/ruleEngine";
import type { CandidateTrade, RuleContext, RuleSettings } from "../src/types";

const rules: RuleSettings = {
  maxRiskPerTradePct: 2,
  maxOpenPositions: 3,
  maxDailyLossPct: 4,
  maxTradesPerDay: 5,
  cooldownMinutes: 30,
  tickerConcentrationPct: 6,
  strategyConcentrationPct: 8
};

const context: RuleContext = {
  accountEquity: 100000,
  dailyPnL: -1000,
  tradesToday: 2,
  lastTradeAt: null,
  openPositions: []
};

const candidate: CandidateTrade = {
  symbol: "SPY",
  strategyType: "credit_spread",
  riskDollars: 1500,
  riskPct: 1.5,
  openedAt: new Date("2026-02-06T10:00:00Z")
};

describe("evaluateTrade", () => {
  it("allows a trade within limits", () => {
    const result = evaluateTrade(rules, context, candidate, new Date("2026-02-06T10:05:00Z"));
    expect(result.status).toBe("ALLOWED");
    expect(result.reasons).toHaveLength(0);
    expect(result.complianceScore).toBe(100);
  });

  it("blocks trades over risk limit", () => {
    const result = evaluateTrade(
      rules,
      context,
      { ...candidate, riskPct: 3 },
      new Date("2026-02-06T10:05:00Z")
    );
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons).toContain("Risk per trade exceeds maxRiskPerTradePct");
  });

  it("blocks when cooldown not met", () => {
    const result = evaluateTrade(
      rules,
      { ...context, lastTradeAt: new Date("2026-02-06T10:00:00Z") },
      candidate,
      new Date("2026-02-06T10:10:00Z")
    );
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons).toContain("Cooldown period not met");
  });

  it("warns when risk approaches threshold", () => {
    const result = evaluateTrade(
      rules,
      context,
      { ...candidate, riskPct: 1.7 },
      new Date("2026-02-06T10:05:00Z")
    );
    expect(result.status).toBe("WARNINGS");
    expect(result.warnings).toContain("Risk per trade approaching limit");
    expect(result.complianceScore).toBe(95);
  });

  it("blocks invalid numeric input deterministically", () => {
    const result = evaluateTrade(
      rules,
      { ...context, accountEquity: Number.NaN },
      candidate,
      new Date("2026-02-06T10:05:00Z")
    );
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons).toContain("accountEquity must be a finite number");
    expect(result.complianceScore).toBe(0);
  });

  it("supports extensible registry overrides", () => {
    const registry = [
      ...createDefaultRuleRegistry(),
      {
        id: "strategy.block-symbol",
        category: "STRATEGY" as const,
        weight: 50,
        evaluate: () => ({ outcome: "BLOCK" as const, message: "Symbol blocked by custom policy" })
      }
    ];
    const result = evaluateTradeWithRegistry(
      rules,
      context,
      candidate,
      new Date("2026-02-06T10:05:00Z"),
      registry
    );
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons).toContain("Symbol blocked by custom policy");
  });
});
