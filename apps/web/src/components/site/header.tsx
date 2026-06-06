import Link from "next/link";
import { BrandLogo } from "@/components/site/brand-logo";
import { navigation } from "@/data/site";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(11,31,51,0.06)] bg-[rgba(248,251,253,0.92)] backdrop-blur-xl">
      <Container className="relative flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo />
        </Link>

        <nav className="nav-surface hidden flex-1 items-center justify-center gap-1 rounded-full px-2 py-2 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-[13px] font-medium text-[var(--navy)] transition hover:bg-[rgba(11,31,51,0.05)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="nav-surface hidden rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)] 2xl:block">
            Secure via Plaid
          </div>
          <Link href="/signin" className="text-sm font-semibold text-[var(--navy)] transition hover:text-[var(--ocean)]">
            Sign in
          </Link>
          <Button href="/signup" className="px-4 py-3">
            Create account
          </Button>
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
