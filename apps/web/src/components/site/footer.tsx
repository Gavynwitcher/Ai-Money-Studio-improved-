import Link from "next/link";
import { Container } from "@/components/ui/container";
import { footerColumns, legalLinks } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] pb-10 pt-16">
      <Container>
        <div className="bank-shell rounded-[32px] px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_repeat(3,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Banking-grade clarity
              </p>
              <h2 className="mt-3 max-w-sm font-heading text-3xl font-semibold tracking-[-0.05em] text-white">
                One place to see cash clearly.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-200">
                Northline is built for consumers and small businesses that want connected balances,
                categorized transactions, and cleaner day-to-day banking workflows across institutions.
              </p>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  {column.title}
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-300">
                  {column.links.map((link) => (
                    <Link key={link.href} href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>Powered by secure third-party integrations. Some advanced capabilities are planned and subject to review.</p>
            <div className="flex flex-wrap gap-4">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
