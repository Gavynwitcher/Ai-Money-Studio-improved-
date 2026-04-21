import Link from "next/link";
import { navigation } from "@/data/site";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(11,31,51,0.08)] bg-[rgba(248,251,253,0.96)] backdrop-blur-xl">
      <Container className="relative flex items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,#102742_0%,#0b1f33_100%)] text-sm font-bold text-white shadow-[0_12px_24px_rgba(11,31,51,0.14)]">
            NL
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--teal)]">
              Banking and books
            </p>
            <p className="font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Northline
            </p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 rounded-[22px] border border-[var(--line)] bg-white/90 px-2 py-2 shadow-[0_12px_28px_rgba(8,23,41,0.04),inset_0_1px_0_rgba(255,255,255,0.92)] xl:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[16px] px-3 py-2 text-[13px] font-medium text-[var(--navy)] transition hover:bg-[rgba(11,31,51,0.05)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <div className="hidden rounded-[18px] border border-[var(--line)] bg-white/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)] 2xl:block">
            Secure aggregation
          </div>
          <Link href="/signin" className="text-sm font-semibold text-[var(--navy)]">
            Sign in
          </Link>
          <Button href="/signup" className="px-4 py-3">
            Request access
          </Button>
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
