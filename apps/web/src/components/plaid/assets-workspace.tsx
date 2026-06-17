import type { AssetReportSummary } from "@/lib/plaid/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  report: AssetReportSummary;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function countAccounts(report: AssetReportSummary) {
  return report.items.reduce((sum, item) => sum + item.accounts.length, 0);
}

function countTransactions(report: AssetReportSummary) {
  return report.items.reduce(
    (sum, item) => sum + item.accounts.reduce((accountSum, account) => accountSum + account.transactionsCount, 0),
    0
  );
}

function totalCurrentBalance(report: AssetReportSummary) {
  return report.items.reduce(
    (sum, item) =>
      sum +
      item.accounts.reduce((accountSum, account) => accountSum + (account.currentBalance ?? 0), 0),
    0
  );
}

export function AssetsWorkspace({ report }: Props) {
  const accountCount = countAccounts(report);
  const transactionCount = countTransactions(report);
  const totalBalance = totalCurrentBalance(report);

  return (
    <div className="grid gap-5">
      <Card className="rounded-[34px] p-7 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="gold">Assets desk</Badge>
              <Badge tone={report.mockMode ? "warning" : "success"}>
                {report.mockMode ? "Demo report mode" : "Live report mode"}
              </Badge>
              <Badge tone="muted">{report.reportType === "fast" ? "Fast assets" : "Full assets report"}</Badge>
            </div>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Review borrower balances, ownership details, and report evidence in one underwriting workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              This module is designed for asset verification and lending review. It organizes report timing, connected
              institutions, covered accounts, and ownership evidence into a format that can support underwriting,
              refresh cycles, and audit-copy workflows.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href="/plaid-integration" variant="secondary">
              Open connection desk
            </Button>
            <Button href="/heloc-application" variant="secondary">
              Open lending flow
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="bank-shell rounded-[32px] p-6 text-white lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Report snapshot</p>
          <p className="mt-4 font-heading text-5xl font-semibold tracking-[-0.06em]">{formatCurrency(totalBalance)}</p>
          <p className="mt-2 text-sm text-cyan-100/80">Current balances captured across included report accounts</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Generated</p>
              <p className="mt-2 text-base font-semibold">{formatDateTime(report.dateGenerated)}</p>
            </div>
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">History window</p>
              <p className="mt-2 text-base font-semibold">{report.daysRequested} days</p>
            </div>
          </div>
        </div>

        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Report control rail</h3>
            <Badge tone="muted">{report.assetReportId}</Badge>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Institutions</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{report.items.length}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Accounts</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{accountCount}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Transactions</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{transactionCount}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Warnings</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{report.warnings.length}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Borrower</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">
                {[report.user.firstName, report.user.lastName].filter(Boolean).join(" ") || "User not provided"}
              </p>
            </div>
            <div className="ledger-row rounded-[22px] p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Client user ID</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{report.user.clientUserId ?? "Not stored"}</p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Institution coverage</h3>
            <Badge tone="muted">{accountCount} linked accounts</Badge>
          </div>
          <div className="mt-5 grid gap-4">
            {report.items.map((item) => (
              <div key={item.itemId} className="rounded-[24px] border border-[var(--line)] bg-white/75 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{item.institutionName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Item {item.itemId} · Updated {formatDateTime(item.dateLastUpdated)}
                    </p>
                  </div>
                  <Badge tone="teal">{item.accounts.length} accounts</Badge>
                </div>

                <div className="mt-4 grid gap-3">
                  {item.accounts.map((account) => (
                    <div key={account.accountId} className="ledger-row rounded-[20px] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-[var(--navy)]">
                            {account.name} · {account.mask}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {account.type} · {account.subtype} · {account.ownerNames.join(", ")}
                          </p>
                        </div>
                        <div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-3 sm:text-right">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em]">Current</p>
                            <p className="mt-1 font-semibold text-[var(--navy)]">
                              {account.currentBalance == null ? "--" : formatCurrency(account.currentBalance)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em]">Available</p>
                            <p className="mt-1 font-semibold text-[var(--navy)]">
                              {account.availableBalance == null ? "--" : formatCurrency(account.availableBalance)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em]">Activity</p>
                            <p className="mt-1 font-semibold text-[var(--navy)]">{account.transactionsCount} rows</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Operational next steps</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Create Asset Report once all required Items are connected with assets consent enabled.",
              "Wait for PRODUCT_READY before presenting report contents to lending or operations users.",
              "Retrieve JSON for internal workflows and PDF when a formal report package is needed.",
              "Use refresh to generate a new snapshot instead of editing the existing report in place.",
              "Issue audit copies only through approved auditor workflows."
            ].map((note) => (
              <div key={note} className="ledger-row rounded-[20px] p-4 text-sm leading-7 text-[var(--muted)]">
                {note}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-[rgba(247,250,252,0.9)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Report outputs</p>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 text-sm">
                <span className="text-[var(--muted)]">JSON payload</span>
                <span className="font-semibold text-[var(--navy)]">Ready through API</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 text-sm">
                <span className="text-[var(--muted)]">PDF package</span>
                <span className="font-semibold text-[var(--navy)]">Available on request</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 text-sm">
                <span className="text-[var(--muted)]">Audit copy</span>
                <span className="font-semibold text-[var(--navy)]">Approved auditors only</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Assets API handoff</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                The banking app is already scaffolded around the real Asset Report lifecycle, so engineering can swap
                demo-safe responses for live Plaid calls without changing the operating surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/api/plaid/assets/report" variant="secondary">
                View JSON route
              </Button>
              <Button href="/api/plaid/assets/pdf" variant="secondary">
                View PDF metadata
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
