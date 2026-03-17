import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { jsonArray } from "@/lib/json";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import DatabaseOfflineNotice from "@/components/database-offline-notice";

export default async function BacktestsPage() {
  try {
    const userId = await resolveActiveUserId();
    const runs = await prisma.backtestRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        strategy: {
          select: { name: true }
        }
      }
    });

    const latest = runs[0];

    const metrics = [
      { label: "Equity curve", value: latest ? "Available" : "--" },
      { label: "Max drawdown", value: latest ? `${(latest.maxDrawdown * 100).toFixed(2)}%` : "--" },
      { label: "Win rate", value: latest ? `${(latest.winRate * 100).toFixed(2)}%` : "--" },
      {
        label: "Loss streaks",
        value: latest ? `${jsonArray<number>(latest.lossStreaks).length}` : "--"
      },
      {
        label: "Rule violation pressure",
        value: latest ? `${Number(latest.violationPressure ?? 0).toFixed(2)}` : "--"
      }
    ];

    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Backtests</h2>
          <p className="mt-3 text-sm text-steel">
            Simulations use Yahoo Finance OHLCV data with simplified payoff assumptions. All
            outputs are approximate and research-only.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-steel/10 bg-white p-5">
              <p className="text-sm font-semibold">{metric.label}</p>
              <p className="mt-2 text-xs text-steel">Result: {metric.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-steel/10 bg-white p-6">
          <h3 className="text-sm font-semibold">Recent Runs</h3>
          <div className="mt-4 space-y-3 text-sm">
            {runs.length === 0 ? (
              <p className="text-steel">No backtest runs yet.</p>
            ) : (
              runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-xl bg-sand px-3 py-2">
                  <span>
                    {run.symbol} · {run.strategy.name}
                  </span>
                  <span>{run.createdAt.toISOString().slice(0, 10)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Backtests" />;
    }
    throw error;
  }
}
