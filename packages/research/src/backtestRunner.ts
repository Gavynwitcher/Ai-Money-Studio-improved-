import type { CandidateTrade, RuleContext, RuleSettings } from "@options/core";
import { evaluateTrade } from "@options/core";
import type { OHLCVBar } from "./yahooData";
import type { CandidateSignal, StrategyTemplateSpec } from "./strategyTemplates";

export interface BacktestConfig {
  initialEquity: number;
  riskPctPerTrade: number;
}

export interface BacktestTrade {
  entryDate: Date;
  exitDate: Date;
  symbol: string;
  strategyType: string;
  pnl: number;
  complianceStatus: string;
  complianceScore: number;
  reasons: string[];
}

export interface BacktestResult {
  equityCurve: { date: Date; equity: number }[];
  maxDrawdown: number;
  winRate: number;
  lossStreaks: number[];
  violationPressure: number;
  trades: BacktestTrade[];
}

interface OpenSimPosition {
  symbol: string;
  strategyType: string;
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  riskDollars: number;
  entryDate: Date;
}

function cappedPnL(
  entry: number,
  exit: number,
  riskDollars: number,
  profitTargetPct: number,
  stopLossPct: number
) {
  const returnPct = (exit - entry) / entry;
  const capped = Math.min(profitTargetPct / 100, Math.max(-stopLossPct / 100, returnPct));
  return riskDollars * capped;
}

export function runBacktest(
  symbol: string,
  bars: OHLCVBar[],
  signals: CandidateSignal[],
  template: StrategyTemplateSpec,
  rules: RuleSettings,
  config: BacktestConfig
): BacktestResult {
  let equity = config.initialEquity;
  let peakEquity = equity;
  let maxDrawdown = 0;
  let tradesToday = 0;
  let lastTradeAt: Date | null = null;
  let dailyPnL = 0;

  const openPositions: OpenSimPosition[] = [];
  const equityCurve: { date: Date; equity: number }[] = [];
  const trades: BacktestTrade[] = [];
  const lossStreaks: number[] = [];
  let currentLossStreak = 0;
  let violationPressure = 0;

  const signalMap = new Map<string, CandidateSignal[]>();
  signals.forEach((signal) => {
    const key = signal.date.toISOString().slice(0, 10);
    const list = signalMap.get(key) ?? [];
    list.push(signal);
    signalMap.set(key, list);
  });

  for (let i = 0; i < bars.length; i += 1) {
    const bar = bars[i];
    const dayKey = bar.date.toISOString().slice(0, 10);

    // reset day counters when a new day begins
    if (equityCurve.length > 0) {
      const prevDay = equityCurve[equityCurve.length - 1].date.toISOString().slice(0, 10);
      if (prevDay !== dayKey) {
        tradesToday = 0;
        dailyPnL = 0;
      }
    }

    // close positions that reach exit
    const remaining: OpenSimPosition[] = [];
    for (const pos of openPositions) {
      if (pos.exitIndex <= i) {
        const exitPrice = bar.close;
        const pnl = cappedPnL(
          pos.entryPrice,
          exitPrice,
          pos.riskDollars,
          template.profitTargetPct,
          template.stopLossPct
        );
        equity += pnl;
        dailyPnL += pnl;
        trades.push({
          entryDate: pos.entryDate,
          exitDate: bar.date,
          symbol,
          strategyType: pos.strategyType,
          pnl,
          complianceStatus: "FILLED",
          complianceScore: 100,
          reasons: []
        });
        if (pnl < 0) {
          currentLossStreak += 1;
        } else if (currentLossStreak > 0) {
          lossStreaks.push(currentLossStreak);
          currentLossStreak = 0;
        }
      } else {
        remaining.push(pos);
      }
    }
    openPositions.length = 0;
    openPositions.push(...remaining);

    const candidates = signalMap.get(dayKey) ?? [];
    for (const signal of candidates) {
      const riskDollars = equity * (config.riskPctPerTrade / 100);
      const candidate: CandidateTrade = {
        symbol: signal.symbol,
        strategyType: signal.strategyType,
        riskDollars,
        riskPct: config.riskPctPerTrade,
        openedAt: signal.date
      };

      const context: RuleContext = {
        accountEquity: equity,
        dailyPnL,
        tradesToday,
        lastTradeAt,
        openPositions: openPositions.map((pos) => ({
          id: `${pos.symbol}-${pos.entryIndex}`,
          symbol: pos.symbol,
          strategyType: pos.strategyType,
          riskDollars: pos.riskDollars,
          openedAt: pos.entryDate
        }))
      };

      const compliance = evaluateTrade(rules, context, candidate, signal.date);
      if (compliance.status === "BLOCKED") {
        violationPressure += 1;
        trades.push({
          entryDate: signal.date,
          exitDate: signal.date,
          symbol,
          strategyType: signal.strategyType,
          pnl: 0,
          complianceStatus: compliance.status,
          complianceScore: compliance.complianceScore,
          reasons: compliance.reasons
        });
        continue;
      }

      openPositions.push({
        symbol,
        strategyType: signal.strategyType,
        entryIndex: i,
        exitIndex: Math.min(i + template.dteTarget, bars.length - 1),
        entryPrice: signal.entryPrice,
        riskDollars,
        entryDate: signal.date
      });
      tradesToday += 1;
      lastTradeAt = signal.date;
    }

    peakEquity = Math.max(peakEquity, equity);
    const drawdown = (peakEquity - equity) / peakEquity;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    equityCurve.push({ date: bar.date, equity });
  }

  if (currentLossStreak > 0) lossStreaks.push(currentLossStreak);
  const completedTrades = trades.filter((trade) => trade.complianceStatus === "FILLED");
  const wins = completedTrades.filter((trade) => trade.pnl > 0).length;
  const winRate = completedTrades.length ? wins / completedTrades.length : 0;

  return {
    equityCurve,
    maxDrawdown,
    winRate,
    lossStreaks,
    violationPressure,
    trades
  };
}
