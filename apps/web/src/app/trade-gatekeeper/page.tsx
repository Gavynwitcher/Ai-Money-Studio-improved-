import DatabaseOfflineNotice from "@/components/database-offline-notice";
import { prisma } from "@/lib/prisma";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

export default async function TradeGatekeeperPage() {
  try {
    const userId = await resolveActiveUserId();
    const [allowed, warnings, blocked, recent] = await Promise.all([
      prisma.candidateTrade.count({ where: { userId, complianceStatus: "ALLOWED" } }),
      prisma.candidateTrade.count({ where: { userId, complianceStatus: "WARNINGS" } }),
      prisma.candidateTrade.count({ where: { userId, complianceStatus: "BLOCKED" } }),
      prisma.candidateTrade.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          symbol: true,
          strategyType: true,
          complianceStatus: true,
          complianceScore: true,
          createdAt: true
        }
      })
    ]);

    const statusCards = [
      { label: "ALLOWED", count: allowed },
      { label: "WARNINGS", count: warnings },
      { label: "BLOCKED", count: blocked }
    ];

    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Trade Gatekeeper</h2>
          <p className="mt-3 text-sm text-steel">
            Every candidate trade is evaluated by the rule engine before paper entry. This is
            compliance research, not a trade prompt.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {statusCards.map((status) => (
            <div key={status.label} className="rounded-2xl border border-steel/10 bg-white p-5">
              <p className="text-sm font-semibold">{status.label}</p>
              <p className="mt-2 text-xs text-steel">Count: {status.count}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-steel/10 bg-white p-6">
          <h3 className="text-sm font-semibold">Recent Evaluations</h3>
          <div className="mt-4 space-y-3 text-sm">
            {recent.length === 0 ? (
              <p className="text-steel">No gatekeeper evaluations yet.</p>
            ) : (
              recent.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-sand px-3 py-2">
                  <span>
                    {item.symbol} · {item.strategyType}
                  </span>
                  <span>
                    {item.complianceStatus} ({item.complianceScore})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Trade Gatekeeper" />;
    }
    throw error;
  }
}
