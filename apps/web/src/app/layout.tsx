import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { AppShell } from "@/components/site/app-shell";
import { absoluteUrl, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "multi bank account dashboard",
    "bank account aggregation",
    "Plaid financial app",
    "small business banking dashboard",
    "consumer banking dashboard",
    "bank transaction categorization",
    "connected bank accounts"
  ],
  icons: {
    icon: "/favicon.svg"
  },
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} preview`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.ogImage)]
  },
  robots: {
    index: true,
    follow: true
  },
  category: "finance"
};

export const viewport = {
  themeColor: "#183b67"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--canvas)] text-slate-950">
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
