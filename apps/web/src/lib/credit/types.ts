export type CreditFactor = {
  label: string;
  impact: "positive" | "neutral" | "negative";
  detail: string;
};

export type CreditReportSummary = {
  id: string;
  bureau: string;
  reportType: string;
  reportDate: string;
  scoreValue: number | null;
  scoreModel: string | null;
  summary: {
    totalOpenAccounts: number;
    averageAccountAgeMo: number;
    utilizationPct: number;
    hardInquiries: number;
    derogatoryAccounts: number;
  };
  factors: CreditFactor[];
  disputesUrl: string | null;
  providerReferenceId: string | null;
};

export type CreditAlertPayload = {
  id: string;
  bureau: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  occurredAt: string;
  acknowledgedAt: string | null;
};

export type CreditOverview = {
  provider: string;
  providerMode: string;
  configured: boolean;
  enrollment: {
    monitoringEnabled: boolean;
    reportsEnabled: boolean;
    scoreAccessEnabled: boolean;
    monitoringStatus: string;
    bureauScope: string;
    permissiblePurpose: string;
    consentedAt: string | null;
    reportRefreshedAt: string | null;
    nextRefreshAt: string | null;
  };
  score: {
    value: number | null;
    model: string | null;
    band: string | null;
    delta: number;
  };
  summary: {
    utilizationPct: number | null;
    totalOpenAccounts: number | null;
    averageAccountAgeMo: number | null;
    hardInquiries: number | null;
    derogatoryAccounts: number | null;
    alertsLast30Days: number;
  };
  reports: CreditReportSummary[];
  alerts: CreditAlertPayload[];
};
