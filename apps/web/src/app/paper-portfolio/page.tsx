import { exposureByStrategy, exposureByTicker, expirationClustering } from "@options/core";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { jsonObject } from "@/lib/json";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import DatabaseOfflineNotice from "@/components/database-offline-notice";

export default async function PaperPortfolioPage() {
  try {
    const userId = await resolveActiveUserId();
    const openPositions = await prisma.paperPosition.findMany({
      where: { userId, outcome: "OPEN" },
      orderBy: { openedAt: "desc" }
    });

    const ticker = exposureByTicker(openPositions);
    const strategy = exposureByStrategy(openPositions);
    const expiration = expirationClustering(
      openPositions.map((position) => {
        const metadata = jsonObject(position.metadata) as { expiration?: string };
        return {
          id: position.id,
          symbol: position.symbol,
          strategyType: position.strategyType,
          riskDollars: position.riskDollars,
          openedAt: position.openedAt,
          expiration: metadata?.expiration ? new Date(metadata.expiration) : undefined
        };
      })
    );

    const snapshots = [
      { label: "Risk by ticker", value: Object.keys(ticker).length },
      { label: "Risk by strategy", value: Object.keys(strategy).length },
      { label: "Expiration clustering", value: Object.keys(expiration).length },
      { label: "Open positions", value: openPositions.length }
    ];

    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Paper Portfolio</h2>
          <p className="mt-3 text-sm text-steel">
            Simulated positions only. Exposure analytics are for concentration-risk review and
            discipline, not execution.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {snapshots.map((item) => (
            <div key={item.label} className="rounded-2xl border border-steel/10 bg-white p-5">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-2 text-xs text-steel">Snapshot: {item.value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Paper Portfolio" />;
    }
    throw error;
  }
}
