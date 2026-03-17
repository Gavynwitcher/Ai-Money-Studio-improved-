import type { OHLCVBar } from "./yahooData";
import { rsi, sma, realizedVolatility } from "./indicators";

export interface TrendFilters {
  smaFast?: number;
  smaSlow?: number;
  rsiMin?: number;
  rsiMax?: number;
  breakoutLookback?: number;
}

export interface VolatilityFilters {
  lookback: number;
  minRealizedVol?: number;
  maxRealizedVol?: number;
}

export interface StrategyTemplateSpec {
  name: string;
  strategyType: string;
  trend: TrendFilters;
  volatility: VolatilityFilters;
  dteTarget: number;
  spreadWidth: number;
  profitTargetPct: number;
  stopLossPct: number;
}

export interface CandidateSignal {
  date: Date;
  symbol: string;
  strategyType: string;
  entryPrice: number;
}

export function generateCandidates(
  symbol: string,
  bars: OHLCVBar[],
  template: StrategyTemplateSpec
): CandidateSignal[] {
  if (bars.length === 0) return [];
  const closes = bars.map((bar) => bar.close);
  const smaFast = template.trend.smaFast ? sma(closes, template.trend.smaFast) : [];
  const smaSlow = template.trend.smaSlow ? sma(closes, template.trend.smaSlow) : [];
  const rsiSeries = template.trend.rsiMin || template.trend.rsiMax ? rsi(closes, 14) : [];
  const volSeries = realizedVolatility(bars, template.volatility.lookback);

  const offset = Math.max(
    template.trend.smaFast ?? 0,
    template.trend.smaSlow ?? 0,
    template.volatility.lookback
  );

  const signals: CandidateSignal[] = [];
  for (let i = offset; i < bars.length; i += 1) {
    const bar = bars[i];
    const volIndex = i - template.volatility.lookback;
    const vol = volSeries[volIndex];
    if (template.volatility.minRealizedVol && vol < template.volatility.minRealizedVol) {
      continue;
    }
    if (template.volatility.maxRealizedVol && vol > template.volatility.maxRealizedVol) {
      continue;
    }

    if (template.trend.smaFast && template.trend.smaSlow) {
      const fast = smaFast[i - template.trend.smaFast];
      const slow = smaSlow[i - template.trend.smaSlow];
      if (fast <= slow) continue;
    }

    if (template.trend.rsiMin || template.trend.rsiMax) {
      const rsiIndex = i - 14;
      const rsiValue = rsiSeries[rsiIndex];
      if (template.trend.rsiMin && rsiValue < template.trend.rsiMin) continue;
      if (template.trend.rsiMax && rsiValue > template.trend.rsiMax) continue;
    }

    if (template.trend.breakoutLookback) {
      const lookback = template.trend.breakoutLookback;
      const window = closes.slice(i - lookback, i);
      const max = Math.max(...window);
      if (bar.close <= max) continue;
    }

    signals.push({
      date: bar.date,
      symbol,
      strategyType: template.strategyType,
      entryPrice: bar.close
    });
  }

  return signals;
}
