import { type HelocDisclosureUrls } from "@/lib/heloc/types";

const defaultBaseUrl = "http://localhost:3000";

function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return defaultBaseUrl;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function buildDisclosureUrl(envValue: string | undefined, fallbackPath: string) {
  const trimmed = envValue?.trim();
  if (trimmed) {
    return trimmed;
  }

  return `${normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? process.env.SITE_URL
  )}${fallbackPath}`;
}

export function getHelocDisclosureUrls(): HelocDisclosureUrls {
  return {
    helocBrochureUrl: buildDisclosureUrl(
      process.env.HELOC_BROCHURE_URL,
      "/heloc/disclosures/heloc-brochure"
    ),
    earlyDisclosureUrl: buildDisclosureUrl(
      process.env.HELOC_EARLY_DISCLOSURE_URL,
      "/heloc/disclosures/early-disclosures"
    ),
    privacyUrl: buildDisclosureUrl(
      process.env.HELOC_PRIVACY_NOTICE_URL,
      "/heloc/disclosures/privacy-notice"
    ),
    eSignUrl: buildDisclosureUrl(
      process.env.HELOC_ESIGN_CONSENT_URL,
      "/heloc/disclosures/e-sign-consent"
    )
  };
}

export function getHelocPublicConfig() {
  return {
    lenderName: process.env.LENDER_NAME?.trim() || "Kitsap Bank",
    disclosures: getHelocDisclosureUrls()
  };
}

export function getMeridianLinkConfig() {
  const timeoutCandidate = Number.parseInt(process.env.MERIDIANLINK_TIMEOUT_MS ?? "15000", 10);

  return {
    mode: process.env.MERIDIANLINK_MODE === "api" ? "api" : "mock",
    endpoint: process.env.MERIDIANLINK_ENDPOINT?.trim() || "",
    apiKey: process.env.MERIDIANLINK_API_KEY?.trim() || "",
    timeoutMs: Number.isFinite(timeoutCandidate) && timeoutCandidate > 0 ? timeoutCandidate : 15000,
    lenderName: getHelocPublicConfig().lenderName,
    disclosures: getHelocDisclosureUrls()
  };
}
