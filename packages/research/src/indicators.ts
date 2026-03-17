import type { OHLCVBar } from "./yahooData";

export function sma(values: number[], length: number) {
  if (values.length < length) return [];
  const result: number[] = [];
  for (let i = length - 1; i < values.length; i += 1) {
    const window = values.slice(i - length + 1, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / length;
    result.push(avg);
  }
  return result;
}

export function rsi(values: number[], length: number) {
  if (values.length <= length) return [];
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const result: number[] = [];
  let avgGain = gains / length;
  let avgLoss = losses / length;
  result.push(100 - 100 / (1 + avgGain / Math.max(avgLoss, 1e-9)));

  for (let i = length + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (length - 1) + gain) / length;
    avgLoss = (avgLoss * (length - 1) + loss) / length;
    result.push(100 - 100 / (1 + avgGain / Math.max(avgLoss, 1e-9)));
  }
  return result;
}

export function realizedVolatility(bars: OHLCVBar[], length: number) {
  if (bars.length <= length) return [];
  const returns = bars.slice(1).map((bar, idx) => Math.log(bar.close / bars[idx].close));
  const result: number[] = [];
  for (let i = length - 1; i < returns.length; i += 1) {
    const window = returns.slice(i - length + 1, i + 1);
    const mean = window.reduce((sum, val) => sum + val, 0) / length;
    const variance =
      window.reduce((sum, val) => sum + (val - mean) ** 2, 0) / length;
    result.push(Math.sqrt(variance) * Math.sqrt(252));
  }
  return result;
}
