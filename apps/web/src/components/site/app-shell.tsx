"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandaloneLoanFlow =
    pathname.startsWith("/marketpilot") ||
    pathname.startsWith("/marketing-os") ||
    pathname.startsWith("/heloc-application") ||
    pathname.startsWith("/heloc/disclosures");

  if (isStandaloneLoanFlow) {
    return <main className="relative min-h-screen">{children}</main>;
  }

  return (
    <div className="site-shell min-h-screen">
      <Header />
      <main className="relative">{children}</main>
      <Footer />
    </div>
  );
}
