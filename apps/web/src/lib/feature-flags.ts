function enabled(name: string, fallback = false) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export const v1FeatureFlags = {
  transfers: enabled("FEATURE_TRANSFERS"),
  credit: enabled("FEATURE_CREDIT"),
  lending: enabled("FEATURE_LENDING"),
  treasury: enabled("FEATURE_TREASURY"),
  accounting: enabled("FEATURE_ACCOUNTING"),
  marketpilot: enabled("FEATURE_MARKETPILOT"),
  assets: enabled("FEATURE_ASSETS"),
  liabilities: enabled("FEATURE_LIABILITIES")
} as const;

export const featureFlags = {
  aggregation: "available-now",
  balances: "available-now",
  transactions: "available-now",
  aiInsights: "available-now",
  cashFlow: "available-now",
  transfers: v1FeatureFlags.transfers ? "available-now" : "disabled",
  debtAssistance: "disabled",
  creditRepair: "disabled",
  creditMonitoring: v1FeatureFlags.credit ? "available-now" : "disabled",
  creditSimulation: "disabled",
  accounting: v1FeatureFlags.accounting ? "available-now" : "disabled",
  assets: v1FeatureFlags.assets ? "available-now" : "disabled",
  liabilities: v1FeatureFlags.liabilities ? "available-now" : "disabled"
} as const;

export type FeatureFlagStatus = (typeof featureFlags)[keyof typeof featureFlags];
