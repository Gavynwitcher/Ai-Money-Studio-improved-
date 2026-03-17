import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import DatabaseOfflineNotice from "@/components/database-offline-notice";

const defaults = {
  maxRiskPerTradePct: 2,
  maxOpenPositions: 6,
  maxDailyLossPct: 3,
  maxTradesPerDay: 5,
  cooldownMinutes: 30,
  tickerConcentrationPct: 10,
  strategyConcentrationPct: 20
};

export default async function RulesPage() {
  try {
    const userId = await resolveActiveUserId();
    const rules = await prisma.ruleSettings.findUnique({ where: { userId } });
    const active = rules ?? defaults;

    const limits = [
      { label: "Max risk per trade %", value: active.maxRiskPerTradePct },
      { label: "Max open positions", value: active.maxOpenPositions },
      { label: "Max daily loss %", value: active.maxDailyLossPct },
      { label: "Max trades per day", value: active.maxTradesPerDay },
      { label: "Cooldown between trades (minutes)", value: active.cooldownMinutes },
      { label: "Ticker concentration %", value: active.tickerConcentrationPct },
      { label: "Strategy concentration %", value: active.strategyConcentrationPct }
    ];

    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Rules & Risk Settings</h2>
          <p className="mt-3 text-sm text-steel">
            Configure the discipline engine. These limits gate every candidate trade and
            backtest fill. Research-only constraints, not execution instructions.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {limits.map((limit) => (
            <div key={limit.label} className="rounded-2xl border border-steel/10 bg-white p-5">
              <p className="text-sm font-semibold text-ink">{limit.label}</p>
              <p className="mt-2 text-xs text-steel">Current: {limit.value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Rules & Risk Settings" />;
    }
    throw error;
  }
}
