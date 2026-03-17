import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import DatabaseOfflineNotice from "@/components/database-offline-notice";

export default async function StrategyLabPage() {
  try {
    const userId = await resolveActiveUserId();
    const strategies = await prisma.strategyTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8
    });

    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Strategy Lab</h2>
          <p className="mt-3 text-sm text-steel">
            Define rule-based options strategies with trend and volatility filters. Output is
            candidate research only and not recommendations.
          </p>
        </div>

        {strategies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-steel/30 bg-white p-6 text-sm text-steel">
            No saved strategy templates yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="rounded-2xl border border-steel/10 bg-white p-5">
                <p className="text-sm font-semibold">{strategy.name}</p>
                <p className="mt-1 text-xs text-steel">Type: {strategy.strategyType}</p>
                <p className="mt-1 text-xs text-steel">DTE target: {strategy.dteTarget}</p>
                <p className="mt-1 text-xs text-steel">Spread width: {strategy.spreadWidth}</p>
                <p className="mt-1 text-xs text-steel">Profit target %: {strategy.profitTargetPct}</p>
                <p className="mt-1 text-xs text-steel">Stop loss %: {strategy.stopLossPct}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Strategy Lab" />;
    }
    throw error;
  }
}
