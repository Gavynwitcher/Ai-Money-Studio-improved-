import DatabaseOfflineNotice from "@/components/database-offline-notice";
import { formatCurrency, formatDate } from "@/lib/format";
import { getScenariosPayload } from "@/lib/server/moneyCopilot";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

function coverageLabel(start: string | null, end: string | null) {
  if (!start || !end) return "No imported transaction coverage yet";
  return `${formatDate(start)}-${formatDate(end)}`;
}

export default async function ScenariosPage() {
  try {
    const userId = await resolveActiveUserId();
    const payload = await getScenariosPayload(userId);
    const hasCoverage = payload.basis.transactionCount > 0;

    return (
      <div className="space-y-8">
        <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Scenario Simulation</p>
          <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Scenarios</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
            Compare cash-runway outcomes using your linked account balances and imported transactions.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-3xl text-slate-900">Scenario Inputs</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Coverage</p>
              <p className="mt-1 font-semibold text-slate-900">
                {coverageLabel(payload.basis.coverageStart, payload.basis.coverageEnd)}
              </p>
              <p className="mt-1">{payload.basis.transactionCount} transactions</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Liquid Balance</p>
              <p className="mt-1 font-semibold text-slate-900">{formatCurrency(payload.basis.liquidBalance)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Monthly Income / Expense</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatCurrency(payload.basis.monthlyIncome)} / {formatCurrency(payload.basis.monthlyExpenses)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Discretionary Spend</p>
              <p className="mt-1 font-semibold text-slate-900">{formatCurrency(payload.basis.discretionaryMonthlySpend)}</p>
              <p className="mt-1">Goal contrib: {formatCurrency(payload.basis.monthlyGoalContributions)}</p>
            </div>
          </div>
        </section>

        {hasCoverage ? (
          <section className="grid gap-4 md:grid-cols-3">
            {payload.scenarios.map((scenario, idx) => (
              <article
                key={scenario.name}
                className="reveal-up rounded-3xl border border-slate-200 bg-white p-6"
                style={{ animationDelay: `${idx * 80 + 80}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{scenario.name}</p>
                <h2 className="mt-3 font-heading text-3xl text-slate-900">
                  {scenario.runwayMonths.toFixed(1)} months runway
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{scenario.summary}</p>
                <div className="mt-4 space-y-1 text-sm text-slate-700">
                  <p>Monthly delta: {formatCurrency(scenario.monthlyDelta)}</p>
                  <p>Critical date: {formatDate(scenario.criticalDate)}</p>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
            No imported transactions yet. Connect and sync Plaid to generate accurate scenario projections.
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-3xl text-slate-900">Assumptions</h2>
          <ol className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Baseline uses observed monthly income and spending from imported transactions.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Moderate Cut applies a 20% discretionary reduction and 25% pause in goal contributions.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Aggressive Cut applies a 45% discretionary reduction and full temporary pause of goals.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Runway reflects liquid balances divided by projected monthly burn when cashflow is negative.
            </li>
          </ol>
        </section>
      </div>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Scenarios" />;
    }
    throw error;
  }
}
