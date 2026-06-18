import type { Metadata } from "next";
import { LiveFinanceWorkspace } from "@/components/v1/live-finance-workspace";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Settings and Connected Institutions",
  description: "Manage connected institutions, data permissions, sync status, and support requests.",
  path: "/settings"
});

export default function SettingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Settings"
        title="Connected institution settings."
        description="Review linked institutions, last sync status, masked account identifiers, data permissions, and support paths."
        primaryCta={{ href: "/plaid-integration", label: "Manage connections" }}
        secondaryCta={{ href: "/contact", label: "Request data help" }}
      />
      <section className="page-section pt-0">
        <Container>
          <LiveFinanceWorkspace view="settings" />
        </Container>
      </section>
    </>
  );
}
