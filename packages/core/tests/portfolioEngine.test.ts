import { describe, expect, it } from "vitest";
import {
  closePosition,
  exposureByStrategy,
  exposureByTicker,
  openPosition
} from "../src/portfolioEngine";
import type { PortfolioSnapshot } from "../src/types";

const snapshot: PortfolioSnapshot = {
  openPositions: [],
  equity: 100000,
  realizedPnL: 0
};

const position = {
  id: "pos-1",
  symbol: "SPY",
  strategyType: "credit_spread",
  riskDollars: 1200,
  openedAt: new Date("2026-02-06T10:00:00Z")
};

describe("portfolioEngine", () => {
  it("opens and closes positions", () => {
    const opened = openPosition(snapshot, position);
    expect(opened.openPositions).toHaveLength(1);

    const closed = closePosition(opened, "pos-1", 250);
    expect(closed.openPositions).toHaveLength(0);
    expect(closed.realizedPnL).toBe(250);
  });

  it("computes exposure by ticker and strategy", () => {
    const opened = openPosition(snapshot, position);
    expect(exposureByTicker(opened.openPositions)).toEqual({ SPY: 1200 });
    expect(exposureByStrategy(opened.openPositions)).toEqual({ credit_spread: 1200 });
  });
});
