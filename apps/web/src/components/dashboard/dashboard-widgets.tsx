import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryChart } from "@/components/charts/category-chart";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import {
  accounts,
  alerts,
  creditSnapshot,
  debtProgress,
  institutions,
  transactions
} from "@/data/mock-finance";
import { currency, percentage } from "@/lib/utils";

function MiniTrend({ values }: { values: number[] }) {
  const max = Math.max(...values);

  return (
    <div className="flex items-end gap-1">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="w-2 rounded-full bg-[var(--teal)]/80"
          style={{ height: `${18 + (value / max) * 28}px` }}
        />
      ))}
    </div>
  );
}

function TransferReviewCard() {
  const fromAccount = accounts[1] ?? accounts[0];
  const toAccount = accounts[0] ?? accounts[1];

  return (
    <Card className="lg:col-span-3 rounded-[28px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
            Transfer review
          </p>
          <h3 className="mt-3 font-heading text-xl font-semibold text-[var(--navy)]">
            Plan money movement before you send
          </h3>
        </div>
        <Badge tone="warning">Review</Badge>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        Northline helps preview source, destination, timing, and estimated fees before advanced transfer workflows are enabled.
      </p>

      <div className="bank-panel-muted mt-5 rounded-[24px] p-4">
        <p className="text-sm font-semibold text-[var(--navy)]">Suggested route</p>
        <div className="mt-4 grid gap-3">
          {[
            ["From", `${fromAccount.institutionName} · ${fromAccount.name}`],
            ["To", `${toAccount.institutionName} · ${toAccount.name}`],
            ["Amount", "$2,500"],
            ["Fee preview", "$2 same-day option"],
            ["Status", "Ready for team review"]
          ].map(([label, value]) => (
            <div key={label} className="ledger-row flex items-center justify-between rounded-[18px] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
              <p className="text-right text-sm font-semibold text-[var(--navy)]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-4">
        <p className="text-sm font-semibold text-[var(--navy)]">Compliance-aware demo mode</p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Live transfers are planned and subject to banking partner, Stripe/Plaid availability, and compliance review.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button href="/plaid-integration" className="px-4 py-3">
          Connect another bank
        </Button>
        <Button href="/pricing" variant="secondary">
          View transfer pricing
        </Button>
      </div>
    </Card>
  );
}

export function DashboardWidgets() {
  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const availableBalance = accounts.reduce((sum, account) => sum + account.availableBalance, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="bank-shell rounded-[28px] p-6 lg:col-span-8 text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="gold">Unified balance</Badge>
            <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.05em] text-white">
              {currency(totalBalance)}
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              Available cash {currency(availableBalance)} across {institutions.length} institutions
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bank-stat-dark rounded-[24px] p-4">
              <p className="text-cyan-100/70">30-day inflow</p>
              <p className="mt-2 text-xl font-semibold text-white">{currency(61200)}</p>
              <p className="mt-1 text-emerald-200">{percentage(6.2)}</p>
            </div>
            <div className="bank-stat-dark rounded-[24px] p-4">
              <p className="text-cyan-100/70">30-day outflow</p>
              <p className="mt-2 text-xl font-semibold text-white">{currency(42100)}</p>
              <p className="mt-1 text-amber-200">{percentage(-2.8)}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="lg:col-span-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Alerts</h3>
          <Badge tone="warning">3 active</Badge>
        </div>
        <div className="mt-5 grid gap-3">
          {alerts.map((alert) => (
            <div key={alert.title} className="ledger-row rounded-[22px] p-4">
              <p className="text-sm font-medium text-[var(--navy)]">{alert.title}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Linked accounts</h3>
          <Badge tone="success">{accounts.length} active</Badge>
        </div>
        <div className="mt-5 grid gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="ledger-row flex items-center justify-between rounded-[24px] p-4"
            >
              <div>
                <p className="font-semibold text-[var(--navy)]">
                  {account.institutionName} · {account.name}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {account.subtype} · •••• {account.mask}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <MiniTrend values={account.trend} />
                <div className="text-right">
                  <p className="font-semibold text-[var(--navy)]">{currency(account.currentBalance)}</p>
                  <p className="text-xs text-[var(--muted)]">Available {currency(account.availableBalance)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-4">
        <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Cash flow summary</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">Six-month snapshot of inflow versus outflow.</p>
        <div className="mt-6">
          <CashFlowChart />
        </div>
        <div className="mt-5">
          <Button href="/accounting" variant="secondary">
            Open accounting desk
          </Button>
        </div>
      </Card>

      <TransferReviewCard />

      <Card className="lg:col-span-6">
        <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Recent transactions</h3>
        <div className="mt-5 grid gap-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3"
            >
              <div>
                <p className="font-medium text-[var(--navy)]">{transaction.merchant}</p>
                <p className="text-sm text-[var(--muted)]">
                  {transaction.category} · {transaction.accountName} · {transaction.date}
                </p>
              </div>
              <div className="text-right">
                <p className={transaction.amount >= 0 ? "font-semibold text-[var(--success)]" : "font-semibold text-[var(--navy)]"}>
                  {currency(transaction.amount)}
                </p>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Spending categories</h3>
        <div className="mt-5">
          <CategoryChart />
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Credit snapshot</h3>
        <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--navy)]">{creditSnapshot.score}</p>
        <p className="mt-2 text-sm text-[var(--success)]">{creditSnapshot.trend}</p>
        <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
          <p>Utilization: {creditSnapshot.utilization}</p>
          <p>{creditSnapshot.nextBestAction}</p>
        </div>
        <div className="mt-5">
          <Button href="/credit" variant="secondary">
            Open credit workspace
          </Button>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">Debt progress</h3>
        <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--navy)]">{currency(debtProgress.remaining)}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">Remaining balance target</p>
        <div className="mt-5 h-3 rounded-full bg-[rgba(11,31,51,0.08)]">
          <div className="h-full rounded-full bg-[var(--teal)]" style={{ width: "26%" }} />
        </div>
        <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
          <p>Paid down: {currency(debtProgress.paidDown)}</p>
          <p>Target date: {debtProgress.targetDate}</p>
          <p>{debtProgress.action}</p>
        </div>
      </Card>
    </div>
  );
}
