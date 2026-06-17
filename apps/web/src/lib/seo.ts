import type { Metadata } from "next";

const defaultSiteUrl = "https://usenorthline.com";

function normalizeUrl(value?: string | null) {
  if (!value) return defaultSiteUrl;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const siteConfig = {
  name: "Northline",
  shortName: "Northline",
  description:
    "Northline is a multi-bank finance workspace for consumers and small business owners who need one place to monitor balances, transactions, cash flow, and read-only financial activity.",
  siteUrl: normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL),
  ogImage: "/opengraph-image"
};

export function absoluteUrl(path = "/") {
  return path.startsWith("http") ? path : `${siteConfig.siteUrl}${path === "/" ? "" : path}`;
}

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

export function buildMetadata({ title, description, path = "/", keywords = [] }: MetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      url: canonical,
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
      title,
      description,
      images: [absoluteUrl(siteConfig.ogImage)]
    }
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    sameAs: []
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.description
  };
}
