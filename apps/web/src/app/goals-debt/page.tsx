import DatabaseOfflineNotice from "@/components/database-offline-notice";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { purgeSandboxDataForUser } from "@/lib/server/moneyCopilot";
import { resolveActiveUserId } from "@/lib/server/user";

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export default async function GoalsDebtPage() {
  try {
    const userId = await resolveActiveUserId();
    await purgeSandboxDataForUser(userId);

    const [goals, debts] = await Promise.all([
      prisma.moneyCopilotGoal.findMany({
        where: { userId },
        orderBy: { targetDate: "asc" }
      }),
      prisma.moneyCopilotDebt.findMany({
        where: { userId },
        orderBy: { dueDate: "asc" }
      })
    ]);

    return (
      <div className="space-y-8">
        <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Goal & Debt Planning</p>
          <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Goals & Debt</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
            Configure goals, compare paydown strategy outcomes, and tune contribution rules.
          </p>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-heading text-3xl text-slate-900">Goals</h2>
            {goals.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No live goals yet.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {goals.map((goal) => {
                  const progress = progressPercent(goal.currentAmount, goal.targetAmount);
                  return (
                    <div key={goal.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{goal.title}</p>
                        <p className="text-sm font-semibold text-slate-900">{progress}%</p>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-slate-200">
                        <div className="h-2.5 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-slate-600">
                        <p>Current: {formatCurrency(goal.currentAmount)}</p>
                        <p>Target: {formatCurrency(goal.targetAmount)}</p>
                        <p>Monthly contribution: {formatCurrency(goal.monthlyContribution)}</p>
                        <p>Target date: {formatDate(goal.targetDate.toISOString().slice(0, 10))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-heading text-3xl text-slate-900">Debt Instruments</h2>
            {debts.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No live debt instruments yet.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {debts.map((debt) => (
                  <div key={debt.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{debt.issuer}</p>
                      <p className="text-sm font-semibold text-rose-700">APR {debt.apr.toFixed(2)}%</p>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-slate-600">
                      <p>Balance: {formatCurrency(debt.balance)}</p>
                      <p>Minimum payment: {formatCurrency(debt.minimumPayment)}</p>
                      <p>Due date: {formatDate(debt.dueDate.toISOString().slice(0, 10))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Goals & Debt" />;
    }
    throw error;
  }
}
