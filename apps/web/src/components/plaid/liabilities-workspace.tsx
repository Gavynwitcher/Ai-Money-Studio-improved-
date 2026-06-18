import type { LiabilitiesSummary } from "@/lib/plaid/types";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  overview: LiabilitiesSummary;
};

function formatOptionalDate(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function totalRequiredPayments(overview: LiabilitiesSummary) {
  const credit = overview.credit.reduce((sum, account) => sum + (account.minimumPaymentAmount ?? 0), 0);
  const student = overview.student.reduce((sum, account) => sum + (account.minimumPaymentAmount ?? 0), 0);
  const mortgage = overview.mortgage.reduce((sum, account) => sum + (account.nextMonthlyPayment ?? 0), 0);
  return credit + student + mortgage;
}

function overdueCount(overview: LiabilitiesSummary) {
  return (
    overview.credit.filter((account) => account.isOverdue).length +
    overview.student.filter((account) => account.isOverdue).length +
    overview.mortgage.filter((account) => (account.pastDueAmount ?? 0) > 0).length
  );
}

function nextDueDate(overview: LiabilitiesSummary) {
  const values = [
    ...overview.credit.map((account) => account.nextPaymentDueDate).filter(Boolean),
    ...overview.student.map((account) => account.nextPaymentDueDate).filter(Boolean),
    ...overview.mortgage.map((account) => account.nextPaymentDueDate).filter(Boolean)
  ] as string[];

  return values.sort()[0] ?? null;
}

export function LiabilitiesWorkspace({ overview }: Props) {
  const totalPayments = totalRequiredPayments(overview);
  const dueDate = nextDueDate(overview);
  const liabilitiesCount = overview.credit.length + overview.student.length + overview.mortgage.length;

  return (
    <div className="grid gap-5">
      <Card className="rounded-[34px] p-7 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="gold">Debt desk</Badge>
              <Badge tone={overview.mockMode ? "warning" : "success"}>
                {overview.mockMode ? "Demo liability mode" : "Live liability mode"}
              </Badge>
              <Badge tone="muted">{overview.institutionName}</Badge>
            </div>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Verify debt posture, upcoming obligations, and loan terms inside the banking workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              This module is built for refinance prep, debt coaching, and payment monitoring. It brings together
              revolving credit, student loans, and mortgages so users can compare due dates, rates, payoff posture,
              and required payments without relying on manual uploads.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href="/credit" variant="secondary">
              Open credit desk
            </Button>
            <Button href="/transactions" variant="secondary">
              View bank activity
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="bank-shell rounded-[32px] p-6 text-white lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Debt service view</p>
          <p className="mt-4 font-heading text-5xl font-semibold tracking-[-0.06em]">{formatCurrency(totalPayments)}</p>
          <p className="mt-2 text-sm text-cyan-100/80">Estimated scheduled payments across connected liabilities</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Next due date</p>
              <p className="mt-2 text-base font-semibold">{dueDate ? formatOptionalDate(dueDate) : "Not available"}</p>
            </div>
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Refreshed</p>
              <p className="mt-2 text-base font-semibold">{formatOptionalDate(overview.refreshedAt.slice(0, 10))}</p>
            </div>
          </div>
        </div>

        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Debt monitoring rail</h3>
            <Badge tone="muted">{overview.itemId}</Badge>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Liability accounts</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{liabilitiesCount}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Credit cards</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{overview.credit.length}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Student loans</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{overview.student.length}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Mortgages</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{overview.mortgage.length}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Overdue accounts</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{overdueCount(overview)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Refresh cadence</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">Approximately daily with webhook updates</p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Credit cards</h3>
            <Badge tone="muted">{overview.credit.length} accounts</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.credit.map((account) => (
              <div key={account.accountId} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{account.accountId}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Due {formatOptionalDate(account.nextPaymentDueDate)}
                    </p>
                  </div>
                  <Badge tone={account.isOverdue ? "warning" : "success"}>
                    {account.isOverdue ? "Overdue" : "Current"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                  <div className="flex items-center justify-between">
                    <span>Statement balance</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {account.lastStatementBalance == null ? "--" : formatCurrency(account.lastStatementBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Minimum payment</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {account.minimumPaymentAmount == null ? "--" : formatCurrency(account.minimumPaymentAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last payment</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {account.lastPaymentAmount == null ? "--" : formatCurrency(account.lastPaymentAmount)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {account.aprs.map((apr) => (
                    <div
                      key={`${account.accountId}-${apr.aprType}`}
                      className="flex items-center justify-between rounded-[16px] border border-[var(--line)] bg-white px-3 py-2 text-sm"
                    >
                      <span className="text-[var(--muted)]">{apr.aprType.split("_").join(" ")}</span>
                      <span className="font-semibold text-[var(--navy)]">{formatPercent(apr.aprPercentage)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Student loans</h3>
            <Badge tone="muted">{overview.student.length} loans</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.student.map((loan) => (
              <div key={loan.accountId} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{loan.loanName ?? "Student loan"}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Payoff {formatOptionalDate(loan.expectedPayoffDate)}
                    </p>
                  </div>
                  <Badge tone={loan.isOverdue ? "warning" : "success"}>
                    {loan.isOverdue ? "Overdue" : "Current"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                  <div className="flex items-center justify-between">
                    <span>Minimum payment</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {loan.minimumPaymentAmount == null ? "--" : formatCurrency(loan.minimumPaymentAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rate</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {loan.interestRatePercentage == null ? "--" : formatPercent(loan.interestRatePercentage)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Principal</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {loan.originationPrincipalAmount == null ? "--" : formatCurrency(loan.originationPrincipalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Plan</span>
                    <span className="font-semibold text-[var(--navy)]">{loan.repaymentPlanDescription ?? "--"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Mortgages</h3>
            <Badge tone="muted">{overview.mortgage.length} loans</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.mortgage.map((loan) => (
              <div key={loan.accountId} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{loan.loanTypeDescription ?? "Mortgage"}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Due {formatOptionalDate(loan.nextPaymentDueDate)}
                    </p>
                  </div>
                  <Badge tone={(loan.pastDueAmount ?? 0) > 0 ? "warning" : "success"}>
                    {(loan.pastDueAmount ?? 0) > 0 ? "Past due" : "Current"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                  <div className="flex items-center justify-between">
                    <span>Monthly payment</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {loan.nextMonthlyPayment == null ? "--" : formatCurrency(loan.nextMonthlyPayment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rate</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {loan.interestRatePercentage == null ? "--" : formatPercent(loan.interestRatePercentage)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Escrow</span>
                    <span className="font-semibold text-[var(--navy)]">
                      {loan.escrowBalance == null ? "--" : formatCurrency(loan.escrowBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Term</span>
                    <span className="font-semibold text-[var(--navy)]">{loan.loanTerm ?? "--"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Debt-verification handoff</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Liabilities is positioned here as an operating feed, not a brochure. It should be paired with
                Transactions when users need payment-history depth and with Credit when the platform is preparing
                refinance or credit-readiness workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/api/plaid/liabilities" variant="secondary">
                View liabilities API
              </Button>
              <Button href="/plaid-integration" variant="secondary">
                Open Plaid desk
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
