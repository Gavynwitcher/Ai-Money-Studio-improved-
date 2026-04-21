"use client";

import { useState } from "react";
import type { CreditOverview, CreditReportSummary } from "@/lib/credit/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  initialOverview: CreditOverview;
};

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function humanizeLabel(value: string) {
  return value.split("_").join(" ");
}

function severityTone(severity: string) {
  if (severity === "positive") return "success";
  if (severity === "medium") return "warning";
  if (severity === "high") return "warning";
  return "muted";
}

function factorTone(impact: CreditReportSummary["factors"][number]["impact"]) {
  if (impact === "positive") return "success";
  if (impact === "negative") return "warning";
  return "muted";
}

export function CreditMonitoringWorkspace({ initialOverview }: Props) {
  const [overview, setOverview] = useState(initialOverview);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshOverview() {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/credit", { cache: "no-store" });
      const data = (await response.json()) as CreditOverview | { error?: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Failed to refresh credit workspace.");
      }
      setOverview(data as CreditOverview);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh credit workspace.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleEnroll() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/credit/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monitoringEnabled: true,
          reportsEnabled: true,
          scoreAccessEnabled: true,
          bureauScope: "single_bureau"
        })
      });

      const data = (await response.json()) as CreditOverview | { error?: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Failed to enable credit monitoring.");
      }

      setOverview(data as CreditOverview);
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : "Failed to enable credit monitoring.");
    } finally {
      setSubmitting(false);
    }
  }

  const latestReport = overview.reports[0];

  return (
    <div className="grid gap-5">
      <Card className="rounded-[32px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="gold">Credit monitoring</Badge>
              <Badge tone={overview.configured ? "success" : "warning"}>
                {overview.providerMode === "mock" ? "Demo provider" : "Live provider"}
              </Badge>
              <Badge tone="muted">{overview.provider.toUpperCase()}</Badge>
            </div>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Monitor report changes, surface score movement, and keep a clean audit trail for consent.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              This workspace is designed for direct-to-consumer credit access. It tracks enrollment,
              bureau refresh timing, recent alerts, and report summaries while keeping the provider
              boundary clean for Equifax, Experian, or another approved partner.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href={latestReport?.disputesUrl ?? "/contact"} variant="secondary">
              View dispute path
            </Button>
            <Button onClick={refreshOverview} variant="secondary" disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh workspace"}
            </Button>
            <Button onClick={handleEnroll} disabled={submitting}>
              {submitting ? "Enabling..." : "Enable monitoring"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[22px] border border-[rgba(191,65,65,0.2)] bg-[rgba(191,65,65,0.06)] px-4 py-3 text-sm text-[rgb(157,47,47)]">
            {error}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="bank-shell rounded-[30px] p-6 text-white lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">
            Credit health
          </p>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-heading text-6xl font-semibold tracking-[-0.06em]">
                {overview.score.value ?? "--"}
              </p>
              <p className="mt-2 text-sm text-cyan-100/80">
                {overview.score.model ?? "Score pending"} · {overview.score.band ?? "Monitoring not active"}
              </p>
            </div>
            <div className="rounded-[22px] bg-white/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">30-day move</p>
              <p className="mt-2 text-2xl font-semibold">
                {overview.score.delta > 0 ? "+" : ""}
                {overview.score.delta}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Status</p>
              <p className="mt-2 text-base font-semibold capitalize">{humanizeLabel(overview.enrollment.monitoringStatus)}</p>
            </div>
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Provider mode</p>
              <p className="mt-2 text-base font-semibold capitalize">{humanizeLabel(overview.providerMode)}</p>
            </div>
          </div>
        </div>

        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Monitoring rail</h3>
            <Badge tone={overview.enrollment.monitoringEnabled ? "success" : "warning"}>
              {overview.enrollment.monitoringEnabled ? "Active" : "Not enabled"}
            </Badge>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Consent captured</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{formatDate(overview.enrollment.consentedAt)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Last report refresh</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{formatDate(overview.enrollment.reportRefreshedAt)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Next refresh</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{formatDate(overview.enrollment.nextRefreshAt)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Bureau scope</p>
              <p className="mt-2 font-semibold capitalize text-[var(--navy)]">{humanizeLabel(overview.enrollment.bureauScope)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Permissible purpose</p>
              <p className="mt-2 font-semibold capitalize text-[var(--navy)]">{humanizeLabel(overview.enrollment.permissiblePurpose)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Alert volume</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{overview.summary.alertsLast30Days} in 30 days</p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Credit summary</h3>
          <div className="mt-5 grid gap-3">
            <div className="ledger-row flex items-center justify-between rounded-[22px] p-4">
              <span className="text-sm text-[var(--muted)]">Utilization</span>
              <span className="font-semibold text-[var(--navy)]">
                {overview.summary.utilizationPct == null ? "--" : `${overview.summary.utilizationPct}%`}
              </span>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] p-4">
              <span className="text-sm text-[var(--muted)]">Open accounts</span>
              <span className="font-semibold text-[var(--navy)]">{overview.summary.totalOpenAccounts ?? "--"}</span>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] p-4">
              <span className="text-sm text-[var(--muted)]">Average age</span>
              <span className="font-semibold text-[var(--navy)]">
                {overview.summary.averageAccountAgeMo == null ? "--" : `${overview.summary.averageAccountAgeMo} mo`}
              </span>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] p-4">
              <span className="text-sm text-[var(--muted)]">Hard inquiries</span>
              <span className="font-semibold text-[var(--navy)]">{overview.summary.hardInquiries ?? "--"}</span>
            </div>
            <div className="ledger-row flex items-center justify-between rounded-[22px] p-4">
              <span className="text-sm text-[var(--muted)]">Derogatory accounts</span>
              <span className="font-semibold text-[var(--navy)]">{overview.summary.derogatoryAccounts ?? "--"}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Recent monitoring alerts</h3>
            <Badge tone="muted">{overview.alerts.length} events</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.alerts.map((alert) => (
              <div key={alert.id} className="ledger-row rounded-[22px] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--navy)]">{alert.title}</p>
                      <Badge tone={severityTone(alert.severity) as "muted" | "success" | "warning"}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{alert.description}</p>
                  </div>
                  <div className="text-right text-sm text-[var(--muted)]">
                    <p className="uppercase tracking-[0.16em]">{humanizeLabel(alert.alertType)}</p>
                    <p className="mt-2">{formatDate(alert.occurredAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-12">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Report snapshots</h3>
            <Badge tone="muted">{overview.reports.length} stored</Badge>
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {overview.reports.map((report) => (
              <div key={report.id} className="rounded-[24px] border border-[var(--line)] bg-white/75 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {report.bureau} · {humanizeLabel(report.reportType)}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--navy)]">
                      {report.scoreValue ?? "--"} {report.scoreModel ? `· ${report.scoreModel}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{formatDate(report.reportDate)}</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="ledger-row rounded-[18px] p-3 text-sm text-[var(--navy)]">
                    Open accounts: {report.summary.totalOpenAccounts}
                  </div>
                  <div className="ledger-row rounded-[18px] p-3 text-sm text-[var(--navy)]">
                    Utilization: {report.summary.utilizationPct}%
                  </div>
                  <div className="ledger-row rounded-[18px] p-3 text-sm text-[var(--navy)]">
                    Avg age: {report.summary.averageAccountAgeMo} months
                  </div>
                  <div className="ledger-row rounded-[18px] p-3 text-sm text-[var(--navy)]">
                    Hard inquiries: {report.summary.hardInquiries}
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {report.factors.map((factor) => (
                    <div
                      key={`${report.id}-${factor.label}`}
                      className="flex items-start justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-[rgba(247,250,252,0.85)] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[var(--navy)]">{factor.label}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{factor.detail}</p>
                      </div>
                      <Badge tone={factorTone(factor.impact) as "muted" | "success" | "warning"}>
                        {factor.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {report.disputesUrl ? (
                    <Button href={report.disputesUrl} variant="secondary">
                      Review dispute options
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
