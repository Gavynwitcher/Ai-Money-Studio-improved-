import type { OpenPosition, PortfolioSnapshot } from "./types";

export function openPosition(snapshot: PortfolioSnapshot, position: OpenPosition): PortfolioSnapshot {
  return {
    ...snapshot,
    openPositions: [...snapshot.openPositions, position]
  };
}

export function closePosition(
  snapshot: PortfolioSnapshot,
  positionId: string,
  realizedPnL: number
): PortfolioSnapshot {
  return {
    ...snapshot,
    openPositions: snapshot.openPositions.filter((pos) => pos.id !== positionId),
    realizedPnL: snapshot.realizedPnL + realizedPnL
  };
}

export function exposureByTicker(positions: OpenPosition[]) {
  return positions.reduce<Record<string, number>>((acc, pos) => {
    acc[pos.symbol] = (acc[pos.symbol] ?? 0) + pos.riskDollars;
    return acc;
  }, {});
}

export function exposureByStrategy(positions: OpenPosition[]) {
  return positions.reduce<Record<string, number>>((acc, pos) => {
    acc[pos.strategyType] = (acc[pos.strategyType] ?? 0) + pos.riskDollars;
    return acc;
  }, {});
}

export interface ExpirationPosition extends OpenPosition {
  expiration?: Date;
}

export function expirationClustering(positions: ExpirationPosition[]) {
  return positions.reduce<Record<string, number>>((acc, pos) => {
    if (!pos.expiration) return acc;
    const key = pos.expiration.toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
