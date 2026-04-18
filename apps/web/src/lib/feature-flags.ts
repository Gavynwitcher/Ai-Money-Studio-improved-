export const featureFlags = {
  aggregation: "available-now",
  balances: "available-now",
  transactions: "mvp",
  transfers: "mvp",
  debtAssistance: "coming-soon",
  creditRepair: "coming-soon",
  creditMonitoring: "coming-soon",
  creditSimulation: "coming-soon"
} as const;

export type FeatureFlagStatus = (typeof featureFlags)[keyof typeof featureFlags];
