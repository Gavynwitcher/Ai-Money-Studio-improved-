import Link from "next/link";
import rawData from "@/data/operations-dashboard.json";

type MonthlyPoint = {
  month: string;
  income: number;
  expense: number;
  adjustment: number;
  transfer: number;
  other: number;
  netIncomeMinusExpense: number;
};

type BucketTotal = {
  name: string;
  rowCount: number;
  amount: number;
};

type ExpenseLine = {
  description: string;
  rowCount: number;
  amount: number;
};

type DashboardData = {
  period: string;
  generatedFrom: string;
  kpis: {
    incomeSales: number;
    expenseCandidate: number;
    operatingSpread: number;
    adjustments: number;
    transfers: number;
    estimatedAR: number;
    checkingBalanceDec31: number;
    cardLiabilitiesDec31: number;
  };
  monthly: MonthlyPoint[];
  bucketTotals: BucketTotal[];
  topExpenses: ExpenseLine[];
  balanceSnapshot: {
    checking: number;
    accountsReceivable: number;
    cardLiabilities: Record<string, number>;
    cardLiabilitiesTotal: number;
  };
  notes: string[];
};

const data = rawData as DashboardData;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatShortMonth(value: string): string {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
}

function toBarHeight(value: number, maxValue: number): string {
  if (maxValue <= 0) return "2%";
  return `${Math.max(4, Math.round((Math.abs(value) / maxValue) * 100))}%`;
}

export default function OperationsDashboardPage() {
  const monthlyMax = Math.max(
    ...data.monthly.map((month) => Math.max(month.income, Math.abs(month.expense), Math.abs(month.netIncomeMinusExpense))),
    1
  );
  const topExpenseMax = Math.max(...data.topExpenses.map((expense) => expense.amount), 1);
  const liquidityCoverage =
    data.balanceSnapshot.cardLiabilitiesTotal > 0
      ? ((data.balanceSnapshot.checking + data.balanceSnapshot.accountsReceivable) /
          data.balanceSnapshot.cardLiabilitiesTotal) *
        100
      : 0;

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-bark-line bg-foam p-7 shadow-[0_28px_70px_-52px_rgba(11,58,135,0.6)] md:p-10">
        <div className="spark spark-left" aria-hidden="true" />
        <div className="spark spark-right" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-bark-muted">Operations Dashboard</p>
            <h1 className="mt-3 font-heading text-4xl leading-tight text-bark-ink md:text-5xl">Year-End Operating Pulse</h1>
            <p className="mt-4 text-sm leading-relaxed text-bark-muted md:text-base">
              Period: <span className="font-semibold text-bark-ink">{data.period}</span>. Source set:{" "}
              <span className="font-semibold text-bark-ink">{data.generatedFrom}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-bark-line bg-white px-4 py-2 text-sm font-semibold text-bark-ink transition hover:bg-bark-soft"
            >
              Back To Home
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="reveal-up rounded-3xl border border-bark-line bg-white/90 p-5 [animation-delay:40ms]">
          <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Sales Income</p>
          <p className="mt-3 font-heading text-4xl text-bark-ink">{formatCurrency(data.kpis.incomeSales)}</p>
        </article>
        <article className="reveal-up rounded-3xl border border-bark-line bg-white/90 p-5 [animation-delay:90ms]">
          <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Expense Candidate</p>
          <p className="mt-3 font-heading text-4xl text-bark-ink">{formatCurrency(data.kpis.expenseCandidate)}</p>
        </article>
        <article className="reveal-up rounded-3xl border border-bark-line bg-white/90 p-5 [animation-delay:140ms]">
          <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Operating Spread</p>
          <p className="mt-3 font-heading text-4xl text-bark-ink">{formatCurrency(data.kpis.operatingSpread)}</p>
        </article>
        <article className="reveal-up rounded-3xl border border-bark-line bg-white/90 p-5 [animation-delay:190ms]">
          <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Transfer Flow</p>
          <p className="mt-3 font-heading text-4xl text-[#7f2d15]">{formatCurrency(data.kpis.transfers)}</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-3xl border border-bark-line bg-white/85 p-6 shadow-[0_16px_30px_-26px_rgba(11,58,135,0.6)]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-3xl text-bark-ink">Monthly Operating Pulse</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Income vs Expense</p>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-3">
            {data.monthly.map((month) => (
              <div key={month.month} className="rounded-2xl border border-bark-line bg-foam p-3">
                <div className="flex h-44 items-end justify-center gap-1">
                  <span
                    title={`${formatShortMonth(month.month)} income ${formatCurrency(month.income)}`}
                    className="w-3 rounded-full bg-bark-ink"
                    style={{ height: toBarHeight(month.income, monthlyMax) }}
                  />
                  <span
                    title={`${formatShortMonth(month.month)} expense ${formatCurrency(month.expense)}`}
                    className="w-3 rounded-full bg-[#c5572b]"
                    style={{ height: toBarHeight(month.expense, monthlyMax) }}
                  />
                  <span
                    title={`${formatShortMonth(month.month)} net spread ${formatCurrency(month.netIncomeMinusExpense)}`}
                    className={`w-3 rounded-full ${month.netIncomeMinusExpense >= 0 ? "bg-[#208255]" : "bg-[#7f2d15]"}`}
                    style={{ height: toBarHeight(month.netIncomeMinusExpense, monthlyMax) }}
                  />
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-bark-ink">{formatShortMonth(month.month)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-bark-muted">
            <span className="rounded-full border border-bark-line bg-white px-3 py-1">Blue: Income</span>
            <span className="rounded-full border border-bark-line bg-white px-3 py-1">Orange: Expense</span>
            <span className="rounded-full border border-bark-line bg-white px-3 py-1">Green/Red: Net</span>
          </div>
        </article>

        <article className="rounded-3xl border border-bark-line bg-white/85 p-6 shadow-[0_16px_30px_-26px_rgba(11,58,135,0.6)]">
          <h2 className="font-heading text-3xl text-bark-ink">Liquidity Snapshot</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-bark-line bg-foam px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Checking (Dec 31)</p>
              <p className="mt-1 text-2xl font-semibold text-bark-ink">
                {formatCurrency(data.balanceSnapshot.checking)}
              </p>
            </div>
            <div className="rounded-2xl border border-bark-line bg-foam px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Accounts Receivable (Est.)</p>
              <p className="mt-1 text-2xl font-semibold text-bark-ink">
                {formatCurrency(data.balanceSnapshot.accountsReceivable)}
              </p>
            </div>
            <div className="rounded-2xl border border-bark-line bg-foam px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Card Liabilities</p>
              <p className="mt-1 text-2xl font-semibold text-[#7f2d15]">
                {formatCurrency(data.balanceSnapshot.cardLiabilitiesTotal)}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-bark-line bg-bark-soft/55 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bark-muted">Coverage Ratio</p>
            <p className="mt-1 text-3xl font-heading text-bark-ink">{liquidityCoverage.toFixed(1)}%</p>
            <p className="mt-2 text-sm text-bark-muted">
              (Checking + A/R) compared to card liabilities as of year-end snapshot.
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-bark-line bg-white/85 p-6">
          <h2 className="font-heading text-3xl text-bark-ink">Top Expense Concentration</h2>
          <div className="mt-5 space-y-3">
            {data.topExpenses.slice(0, 8).map((expense) => (
              <div key={expense.description} className="rounded-2xl border border-bark-line bg-foam p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="max-w-[78%] text-sm font-semibold leading-snug text-bark-ink">{expense.description}</p>
                  <p className="text-sm font-semibold text-bark-ink">{formatCurrency(expense.amount)}</p>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-white">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-[#0b3a87] to-[#1f6fa8]"
                    style={{ width: `${Math.round((expense.amount / topExpenseMax) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-bark-muted">{expense.rowCount} lines</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-bark-line bg-white/85 p-6">
          <h2 className="font-heading text-3xl text-bark-ink">Tax Bucket View</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-bark-line">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-foam text-left text-xs uppercase tracking-[0.16em] text-bark-muted">
                <tr>
                  <th className="px-3 py-3">Bucket</th>
                  <th className="px-3 py-3 text-right">Rows</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.bucketTotals.slice(0, 10).map((bucket) => (
                  <tr key={bucket.name} className="border-t border-bark-line/70">
                    <td className="px-3 py-2.5 text-bark-ink">{bucket.name}</td>
                    <td className="px-3 py-2.5 text-right text-bark-muted">{bucket.rowCount}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${bucket.amount < 0 ? "text-[#7f2d15]" : "text-[#166042]"}`}>
                      {formatCurrency(bucket.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-2">
            {data.notes.map((note) => (
              <p key={note} className="rounded-2xl border border-bark-line bg-foam px-3 py-2 text-xs leading-relaxed text-bark-muted">
                {note}
              </p>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
