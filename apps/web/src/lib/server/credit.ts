import { prisma } from "@/lib/prisma";
import type {
  CreditAlertPayload,
  CreditFactor,
  CreditOverview,
  CreditReportSummary
} from "@/lib/credit/types";
import { resolveActiveUserId } from "@/lib/server/user";

export type CreditEnrollmentInput = {
  monitoringEnabled?: boolean;
  reportsEnabled?: boolean;
  scoreAccessEnabled?: boolean;
  bureauScope?: string;
};

const DEFAULT_PROVIDER = process.env.CREDIT_PROVIDER_NAME?.trim() || "equifax";
const PROVIDER_MODE = process.env.CREDIT_PROVIDER_MODE?.trim() || "mock";

function providerConfigured() {
  if (PROVIDER_MODE === "mock") return true;
  // Live providers typically require either an API key or client credentials
  // depending on the bureau or bureau-backed partner you onboard.
  return Boolean(process.env.CREDIT_PROVIDER_API_KEY || process.env.CREDIT_PROVIDER_CLIENT_ID);
}

function scoreBand(score: number | null) {
  if (score == null) return null;
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Needs attention";
}

function jsonParse<T>(value: string): T {
  return JSON.parse(value) as T;
}

async function seedCreditWorkspace(userId: string) {
  const existing = await prisma.creditProfile.findFirst({
    where: { userId, provider: DEFAULT_PROVIDER },
    select: { id: true }
  });

  if (existing) return;

  // Demo seed data keeps the credit workspace useful before a real bureau
  // enrollment flow is connected. Replace this with provider enrollment +
  // report retrieval calls when the credit partner is approved.

  const now = new Date();
  const refreshedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const nextRefreshAt = new Date(now.getTime() + 22 * 60 * 60 * 1000);

  const factors: CreditFactor[] = [
    {
      label: "On-time payments",
      impact: "positive",
      detail: "Payment history remains the strongest positive signal across the last 24 months."
    },
    {
      label: "Card utilization",
      impact: "negative",
      detail: "Two revolving accounts are above the preferred 30% utilization threshold."
    },
    {
      label: "Average age of accounts",
      impact: "positive",
      detail: "The account mix shows stable tenure and no recent closures."
    }
  ];

  const reportSummary = {
    totalOpenAccounts: 9,
    averageAccountAgeMo: 74,
    utilizationPct: 31,
    hardInquiries: 2,
    derogatoryAccounts: 0
  };

  await prisma.creditConsent.create({
    data: {
      userId,
      provider: DEFAULT_PROVIDER,
      monitoringEnabled: true,
      reportsEnabled: true,
      scoreAccessEnabled: true,
      permissiblePurpose: "consumer_direct_access",
      consentVersion: "v1-demo"
    }
  });

  await prisma.creditProfile.create({
    data: {
      userId,
      provider: DEFAULT_PROVIDER,
      bureauScope: "single_bureau",
      monitoringStatus: PROVIDER_MODE === "mock" ? "active" : "pending_provider_setup",
      scoreModel: "VantageScore 3.0",
      scoreValue: 742,
      scoreBand: scoreBand(742),
      scoreDelta: 14,
      utilizationPct: reportSummary.utilizationPct,
      totalOpenAccounts: reportSummary.totalOpenAccounts,
      averageAccountAgeMo: reportSummary.averageAccountAgeMo,
      hardInquiries: reportSummary.hardInquiries,
      derogatoryAccounts: reportSummary.derogatoryAccounts,
      alertsLast30Days: 3,
      reportRefreshedAt: refreshedAt,
      nextRefreshAt
    }
  });

  await prisma.creditReportSnapshot.create({
    data: {
      userId,
      provider: DEFAULT_PROVIDER,
      reportType: "summary",
      bureau: "equifax",
      reportDate: refreshedAt,
      scoreValue: 742,
      scoreModel: "VantageScore 3.0",
      summaryJson: JSON.stringify(reportSummary),
      factorsJson: JSON.stringify(factors),
      disputesUrl: "https://www.annualcreditreport.com/index.action",
      providerReferenceId: "demo_report_summary_001"
    }
  });

  await prisma.creditReportSnapshot.create({
    data: {
      userId,
      provider: DEFAULT_PROVIDER,
      reportType: "monitoring_snapshot",
      bureau: "equifax",
      reportDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      scoreValue: 728,
      scoreModel: "VantageScore 3.0",
      summaryJson: JSON.stringify({
        ...reportSummary,
        utilizationPct: 36,
        hardInquiries: 3
      }),
      factorsJson: JSON.stringify(factors),
      disputesUrl: "https://www.annualcreditreport.com/index.action",
      providerReferenceId: "demo_report_summary_000"
    }
  });

  await prisma.creditAlert.createMany({
    data: [
      {
        userId,
        provider: DEFAULT_PROVIDER,
        bureau: "equifax",
        alertType: "balance_change",
        severity: "medium",
        title: "Revolving balance increased",
        description:
          "One revolving account reported a higher balance this month, which pushed utilization above your target range.",
        occurredAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
        metadataJson: JSON.stringify({ category: "utilization" }),
        providerReferenceId: "demo_alert_001"
      },
      {
        userId,
        provider: DEFAULT_PROVIDER,
        bureau: "equifax",
        alertType: "inquiry",
        severity: "info",
        title: "New inquiry detected",
        description:
          "A recent credit inquiry was added to the file. Review it to confirm it matches an expected application or account review.",
        occurredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        metadataJson: JSON.stringify({ category: "inquiry" }),
        providerReferenceId: "demo_alert_002"
      },
      {
        userId,
        provider: DEFAULT_PROVIDER,
        bureau: "equifax",
        alertType: "score_change",
        severity: "positive",
        title: "Score moved up 14 points",
        description:
          "Lower utilization and aging accounts contributed to a positive score movement in the latest monitoring cycle.",
        occurredAt: refreshedAt,
        metadataJson: JSON.stringify({ category: "score" }),
        providerReferenceId: "demo_alert_003"
      }
    ]
  });
}

function serializeReport(
  report: {
    id: string;
    bureau: string;
    reportType: string;
    reportDate: Date;
    scoreValue: number | null;
    scoreModel: string | null;
    summaryJson: string;
    factorsJson: string;
    disputesUrl: string | null;
    providerReferenceId: string | null;
  }
): CreditReportSummary {
  return {
    id: report.id,
    bureau: report.bureau,
    reportType: report.reportType,
    reportDate: report.reportDate.toISOString(),
    scoreValue: report.scoreValue,
    scoreModel: report.scoreModel,
    summary: jsonParse(report.summaryJson),
    factors: jsonParse(report.factorsJson),
    disputesUrl: report.disputesUrl,
    providerReferenceId: report.providerReferenceId
  };
}

function serializeAlert(
  alert: {
    id: string;
    bureau: string;
    alertType: string;
    severity: string;
    title: string;
    description: string;
    occurredAt: Date;
    acknowledgedAt: Date | null;
  }
): CreditAlertPayload {
  return {
    id: alert.id,
    bureau: alert.bureau,
    alertType: alert.alertType,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    occurredAt: alert.occurredAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null
  };
}

export async function getCreditOverview() {
  const userId = await resolveActiveUserId();
  await seedCreditWorkspace(userId);

  const [consent, profile, reports, alerts] = await Promise.all([
    prisma.creditConsent.findFirst({
      where: { userId, provider: DEFAULT_PROVIDER }
    }),
    prisma.creditProfile.findFirst({
      where: { userId, provider: DEFAULT_PROVIDER }
    }),
    prisma.creditReportSnapshot.findMany({
      where: { userId, provider: DEFAULT_PROVIDER },
      orderBy: { reportDate: "desc" },
      take: 6
    }),
    prisma.creditAlert.findMany({
      where: { userId, provider: DEFAULT_PROVIDER },
      orderBy: { occurredAt: "desc" },
      take: 12
    })
  ]);

  return {
    provider: DEFAULT_PROVIDER,
    providerMode: PROVIDER_MODE,
    configured: providerConfigured(),
    enrollment: {
      monitoringEnabled: consent?.monitoringEnabled ?? false,
      reportsEnabled: consent?.reportsEnabled ?? false,
      scoreAccessEnabled: consent?.scoreAccessEnabled ?? false,
      monitoringStatus: profile?.monitoringStatus ?? "inactive",
      bureauScope: profile?.bureauScope ?? "single_bureau",
      permissiblePurpose: consent?.permissiblePurpose ?? "consumer_direct_access",
      consentedAt: consent?.consentedAt.toISOString() ?? null,
      reportRefreshedAt: profile?.reportRefreshedAt?.toISOString() ?? null,
      nextRefreshAt: profile?.nextRefreshAt?.toISOString() ?? null
    },
    score: {
      value: profile?.scoreValue ?? null,
      model: profile?.scoreModel ?? null,
      band: profile?.scoreBand ?? null,
      delta: profile?.scoreDelta ?? 0
    },
    summary: {
      utilizationPct: profile?.utilizationPct ?? null,
      totalOpenAccounts: profile?.totalOpenAccounts ?? null,
      averageAccountAgeMo: profile?.averageAccountAgeMo ?? null,
      hardInquiries: profile?.hardInquiries ?? null,
      derogatoryAccounts: profile?.derogatoryAccounts ?? null,
      alertsLast30Days: profile?.alertsLast30Days ?? 0
    },
    reports: reports.map(serializeReport),
    alerts: alerts.map(serializeAlert)
  } satisfies CreditOverview;
}

export async function enrollInCreditMonitoring(input: CreditEnrollmentInput) {
  const userId = await resolveActiveUserId();
  await seedCreditWorkspace(userId);

  const monitoringEnabled = input.monitoringEnabled ?? true;
  const reportsEnabled = input.reportsEnabled ?? true;
  const scoreAccessEnabled = input.scoreAccessEnabled ?? true;
  const bureauScope = input.bureauScope ?? "single_bureau";

  await prisma.creditConsent.upsert({
    where: {
      userId_provider: {
        userId,
        provider: DEFAULT_PROVIDER
      }
    },
    create: {
      userId,
      provider: DEFAULT_PROVIDER,
      monitoringEnabled,
      reportsEnabled,
      scoreAccessEnabled,
      permissiblePurpose: "consumer_direct_access",
      consentVersion: "v1"
    },
    update: {
      monitoringEnabled,
      reportsEnabled,
      scoreAccessEnabled,
      permissiblePurpose: "consumer_direct_access",
      revokedAt: null
    }
  });

  await prisma.creditProfile.updateMany({
    where: { userId, provider: DEFAULT_PROVIDER },
    data: {
      bureauScope,
      monitoringStatus: providerConfigured() ? "active" : "pending_provider_setup",
      nextRefreshAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  return getCreditOverview();
}

export async function getCreditReports() {
  const overview = await getCreditOverview();
  return overview.reports;
}

export async function getCreditAlerts() {
  const overview = await getCreditOverview();
  return overview.alerts;
}
