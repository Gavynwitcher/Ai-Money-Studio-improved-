import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const routes = [
  "/",
  "/about",
  "/contact",
  "/dashboard-demo",
  "/faq",
  "/features",
  "/legal/disclaimer",
  "/legal/privacy",
  "/legal/terms",
  "/plaid-integration",
  "/pricing",
  "/security",
  "/transactions"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority:
      route === "/"
        ? 1
        : route === "/pricing" || route === "/features" || route === "/plaid-integration"
          ? 0.8
          : 0.6
  }));
}
