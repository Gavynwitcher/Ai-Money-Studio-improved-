export type ComplianceStatus = "ALLOWED" | "WARNINGS" | "BLOCKED";
export type RuleOutcome = "PASS" | "WARN" | "BLOCK";
export type RuleCategory = "RISK" | "PORTFOLIO" | "DISCIPLINE" | "STRATEGY";

export interface RuleSettings {
  maxRiskPerTradePct: number;
  maxOpenPositions: number;
  maxDailyLossPct: number;
  maxTradesPerDay: number;
  cooldownMinutes: number;
  tickerConcentrationPct: number;
  strategyConcentrationPct: number;
}

export interface CandidateTrade {
  symbol: string;
  strategyType: string;
  riskDollars: number;
  riskPct: number;
  openedAt: Date;
}

export interface OpenPosition {
  id: string;
  symbol: string;
  strategyType: string;
  riskDollars: number;
  openedAt: Date;
}

export interface RuleContext {
  accountEquity: number;
  dailyPnL: number;
  tradesToday: number;
  lastTradeAt?: Date | null;
  openPositions: OpenPosition[];
}

export interface ComplianceResult {
  status: ComplianceStatus;
  reasons: string[];
  warnings: string[];
  complianceScore: number;
  evaluations?: RuleEvaluationResult[];
}

export interface RuleEvaluationResult {
  ruleId: string;
  category: RuleCategory;
  outcome: RuleOutcome;
  message?: string;
  weight: number;
}

export interface RuleEvaluationInput {
  rules: RuleSettings;
  context: RuleContext;
  candidate: CandidateTrade;
  now: Date;
}

export interface TradeRule {
  id: string;
  category: RuleCategory;
  weight: number;
  evaluate: (input: RuleEvaluationInput) => { outcome: RuleOutcome; message?: string };
}

export interface PortfolioSnapshot {
  openPositions: OpenPosition[];
  equity: number;
  realizedPnL: number;
}
