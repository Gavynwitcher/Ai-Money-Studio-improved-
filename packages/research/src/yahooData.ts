export interface OHLCVBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getHistoricalOHLCV(
  symbol: string,
  start: Date,
  end: Date
): Promise<OHLCVBar[]> {
  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(end.getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed: ${res.status}`);
  }
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  return timestamps.map((ts, idx) => ({
    date: new Date(ts * 1000),
    open: quote.open?.[idx] ?? 0,
    high: quote.high?.[idx] ?? 0,
    low: quote.low?.[idx] ?? 0,
    close: quote.close?.[idx] ?? 0,
    volume: quote.volume?.[idx] ?? 0
  }));
}
