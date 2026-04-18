import Link from "next/link";
import { navigation } from "@/data/site";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-[rgba(248,251,251,0.82)] backdrop-blur-xl">
      <Container className="relative flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--navy)] text-sm font-bold text-white">
            UB
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
              Plaid-ready fintech MVP
            </p>
            <p className="font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Unified Banking Hub
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:bg-slate-900/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/signin" className="text-sm font-semibold text-[var(--navy)]">
            Sign in
          </Link>
          <Button href="/signup">Get early access</Button>
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
