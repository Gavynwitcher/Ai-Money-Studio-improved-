import Link from "next/link";
import { navigation } from "@/data/site";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(11,31,51,0.08)] bg-[rgba(247,250,252,0.9)] backdrop-blur-xl">
      <Container className="relative flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,#102742_0%,#0b1f33_100%)] text-sm font-bold text-white shadow-[0_12px_24px_rgba(11,31,51,0.18)]">
            UH
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
              Consumer and business banking hub
            </p>
            <p className="font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Unified Banking Hub
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[var(--line)] bg-white/80 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:bg-[rgba(11,31,51,0.05)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            FDIC-style trust positioning
          </div>
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
