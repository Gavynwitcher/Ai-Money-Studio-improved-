import "./globals.css";
import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export const metadata: Metadata = {
  title: "Unified Banking Hub",
  description:
    "Affordable multi-bank account aggregation, Plaid-powered connectivity, transfer workflows, and financial wellness tools for consumers and small businesses.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--canvas)] text-slate-950">
        <div className="site-shell min-h-screen">
          <Header />
          <main className="relative">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
