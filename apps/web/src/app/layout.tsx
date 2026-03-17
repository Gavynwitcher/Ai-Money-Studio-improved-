import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Options Research Discipline",
  description: "Personal, rule-based options research and discipline system"
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/rules", label: "Rules & Risk" },
  { href: "/strategy-lab", label: "Strategy Lab" },
  { href: "/backtests", label: "Backtests" },
  { href: "/trade-gatekeeper", label: "Trade Gatekeeper" },
  { href: "/paper-portfolio", label: "Paper Portfolio" },
  { href: "/trade-journal", label: "Trade Journal" },
  { href: "/behavior-insights", label: "Behavior Insights" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-steel/10 bg-white/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-pine">Personal Research System</p>
                <h1 className="text-xl font-semibold text-ink">Options Discipline Lab</h1>
              </div>
              <div className="rounded-full border border-steel/20 px-4 py-2 text-xs text-steel">
                No broker integrations · Approximate analytics
              </div>
            </div>
            <nav className="border-t border-steel/10">
              <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6 py-4 text-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-transparent px-3 py-1 text-steel transition hover:border-steel/20 hover:bg-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
