import Link from "next/link";
import { Container } from "@/components/ui/container";
import { footerColumns, legalLinks } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] pb-10 pt-16">
      <Container>
        <div className="bank-shell rounded-[34px] px-6 py-10 text-white sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,214,122,0.88)]">
                Northline
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-white">
                A read-only workspace for linked accounts, transaction insight, and cash-flow clarity.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-200">
                Northline is a fintech operating layer for consumers and small business owners who need a clearer view
                of balances, categorized transactions, and cash activity across multiple institutions.
              </p>
              <div className="mt-6 grid gap-2 text-sm text-slate-200">
                <p>Plaid-powered connectivity</p>
                <p>Read-only visibility. No fund custody or banking execution.</p>
              </div>
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

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Northline does not hold funds, initiate banking actions, or provide tax, legal, investment,
              credit-repair, or lending advice. Insights are informational and should be verified before decisions.
            </p>
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
