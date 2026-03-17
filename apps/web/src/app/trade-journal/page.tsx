import DatabaseOfflineNotice from "@/components/database-offline-notice";
import { jsonStringArray } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

export default async function TradeJournalPage() {
  try {
    const userId = await resolveActiveUserId();
    const latest = await prisma.tradeLog.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const violationReasons = latest ? jsonStringArray(latest.violationReasons) : [];

    const logFields = [
      { label: "Strategy type", value: latest?.strategyType ?? "--" },
      { label: "Risk dollars", value: latest ? latest.riskDollars.toFixed(2) : "--" },
      { label: "Risk % of account", value: latest ? latest.riskPct.toFixed(2) : "--" },
      { label: "Compliance status", value: latest?.complianceStatus ?? "--" },
      {
        label: "Violation reasons",
        value: latest ? (violationReasons.length === 0 ? "none" : violationReasons.join(", ")) : "--"
      },
      { label: "Compliance score", value: latest ? String(latest.complianceScore) : "--" }
    ];

    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Trade Journal</h2>
          <p className="mt-3 text-sm text-steel">
            Every candidate and paper trade event is logged with rule outcomes for post-trade
            process review.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {logFields.map((field) => (
            <div key={field.label} className="rounded-2xl border border-steel/10 bg-white p-5">
              <p className="text-sm font-semibold">{field.label}</p>
              <p className="mt-2 text-xs text-steel">Latest: {field.value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return <DatabaseOfflineNotice area="Trade Journal" />;
    }
    throw error;
  }
}
