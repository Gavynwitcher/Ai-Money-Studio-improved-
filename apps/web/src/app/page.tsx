import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";

const panels = [
  {
    title: "Rule & Discipline Monitor",
    desc: "Define limits, measure compliance, and throttle risk behavior.",
    href: "/rules"
  },
  {
    title: "Strategy Lab",
    desc: "Build algorithmic option structures with clear filters and targets.",
    href: "/strategy-lab"
  },
  {
    title: "Backtests",
    desc: "Simulate candidate trades against historical OHLCV (approximate).",
    href: "/backtests"
  },
  {
    title: "Trade Gatekeeper",
    desc: "Every trade must pass a rule engine before the paper portfolio.",
    href: "/trade-gatekeeper"
  }
];

export default async function Dashboard() {
  const userId = await resolveActiveUserId();
  const [positions, latestLogs, recentViolations] = await Promise.all([
    prisma.paperPosition.findMany({
      where: { userId, outcome: "OPEN" },
      select: { riskDollars: true }
    }),
    prisma.tradeLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { complianceScore: true }
    }),
    prisma.candidateTrade.count({
      where: {
        userId,
        complianceStatus: "BLOCKED",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
  ]);

  const openRisk = positions.reduce((sum, pos) => sum + pos.riskDollars, 0);
  const complianceScore =
    latestLogs.length === 0
      ? "--"
      : Math.round(latestLogs.reduce((sum, log) => sum + log.complianceScore, 0) / latestLogs.length);

  return (
    <section className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-steel/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-ember">System Posture</p>
          <h2 className="mt-3 text-3xl font-semibold">Personal Research Command</h2>
          <p className="mt-4 text-sm text-steel">
            This environment is for research and behavioral discipline only. All outputs are
            approximations and never trade recommendations.
          </p>
          <div className="mt-6 flex gap-3">
            <span className="rounded-full bg-pine/10 px-3 py-1 text-xs text-pine">
              No live execution
            </span>
            <span className="rounded-full bg-ember/10 px-3 py-1 text-xs text-ember">
              Rule-based decisions only
            </span>
          </div>
        </div>
        <div className="gradient-panel rounded-3xl border border-steel/10 p-8">
          <h3 className="text-xl font-semibold">Discipline Pulse</h3>
          <p className="mt-3 text-sm text-steel">
            Track compliance score, risk budget usage, and violations over time. Use the
            Behavior Insights page to visualize patterns.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
              <span>Compliance Score</span>
              <span className="font-semibold">{complianceScore}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
              <span>Open Risk</span>
              <span className="font-semibold">${openRisk.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
              <span>Recent Violations</span>
              <span className="font-semibold">{recentViolations}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {panels.map((panel) => (
          <Link
            key={panel.title}
            href={panel.href}
            className="rounded-2xl border border-steel/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-ink">{panel.title}</h3>
            <p className="mt-2 text-sm text-steel">{panel.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
