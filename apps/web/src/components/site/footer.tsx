import Link from "next/link";
import { Container } from "@/components/ui/container";
import { footerColumns, legalLinks } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] pb-10 pt-16">
      <Container>
        <div className="glass-panel-strong rounded-[32px] px-6 py-10 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
                Affordable by design
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-[var(--navy)]">
                One place to see cash clearly.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
                Unified Banking Hub is a premium-feeling, cost-sensitive fintech MVP designed for
                consumers and small businesses managing money across multiple institutions.
              </p>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--navy)]">
                  {column.title}
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
                  {column.links.map((link) => (
                    <Link key={link.href} href={link.href} className="transition hover:text-[var(--navy)]">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
            <p>Powered by secure third-party integrations. Some advanced capabilities are planned and subject to review.</p>
            <div className="flex flex-wrap gap-4">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-[var(--navy)]">
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
