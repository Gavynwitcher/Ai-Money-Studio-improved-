import Link from "next/link";
import Image from "next/image";
import { navigation } from "@/data/site";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(11,31,51,0.08)] bg-[rgba(255,255,255,0.96)] backdrop-blur-xl">
      <Container className="relative flex items-center justify-between gap-3 py-3">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
          <Image
            src="/northline-logo-mark.png"
            alt="Northline logo"
            width={42}
            height={42}
            className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            priority
          />
          <div className="min-w-0">
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--teal)] sm:block">
              Multi-bank workspace
            </p>
            <div className="flex items-center gap-2 bg-white py-2 sm:mt-1 sm:px-4">
              <Image
                src="/northline-logo-mark.png"
                alt=""
                width={24}
                height={24}
                className="hidden h-6 w-6 object-contain sm:block"
              />
              <p className="truncate font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Northline
              </p>
            </div>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 rounded-[22px] border border-[var(--line)] bg-white/90 px-2 py-2 shadow-[0_12px_28px_rgba(8,23,41,0.04),inset_0_1px_0_rgba(255,255,255,0.92)] lg:flex">
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

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/signin" className="text-sm font-semibold text-[var(--navy)]">
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
