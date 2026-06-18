import { getStripeServerClient } from "@/lib/stripe/server";

type StripeCapabilityStatus =
  | "active"
  | "inactive"
  | "pending"
  | "unrequested"
  | "unsupported"
  | "unknown";

export type StripePlatformStatus = {
  configured: boolean;
  accountId: string | null;
  country: string | null;
  accountType: string | null;
  connectedAccountsCount: number;
  transfers: {
    connectTransfersCapability: StripeCapabilityStatus;
    treasuryCapability: StripeCapabilityStatus;
    treasuryReady: boolean;
    summary: string;
    nextStep: string;
  };
  credit: {
    capitalForPlatformsReady: boolean;
    issuingCreditReady: boolean;
    summary: string;
    nextStep: string;
  };
};

function normalizeCapability(
  value: string | undefined,
  fallback: StripeCapabilityStatus = "unsupported"
): StripeCapabilityStatus {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "pending" ||
    value === "unrequested"
  ) {
    return value;
  }

  return fallback;
}

export async function getStripePlatformStatus(): Promise<StripePlatformStatus> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      configured: false,
      accountId: null,
      country: null,
      accountType: null,
      connectedAccountsCount: 0,
      transfers: {
        connectTransfersCapability: "unknown",
        treasuryCapability: "unknown",
        treasuryReady: false,
        summary: "Stripe is not configured in this environment yet.",
        nextStep: "Add STRIPE_SECRET_KEY and Treasury-enabled account access before testing transfer rails."
      },
      credit: {
        capitalForPlatformsReady: false,
        issuingCreditReady: false,
        summary: "Stripe credit products are unavailable until the account is configured.",
        nextStep: "Add Stripe credentials, then validate Connect platform and product access."
      }
    };
  }

  const stripe = getStripeServerClient();
  const [account, connectedAccounts] = await Promise.all([
    stripe.accounts.retrieve(null),
    stripe.accounts.list({ limit: 1 })
  ]);

  const connectTransfersCapability = normalizeCapability(account.capabilities?.transfers, "unknown");
  const treasuryCapability = normalizeCapability(
    (account.capabilities as Record<string, string | undefined> | undefined)?.treasury,
    "unsupported"
  );
  const connectedAccountsCount = connectedAccounts.has_more
    ? connectedAccounts.data.length + 1
    : connectedAccounts.data.length;

  const treasuryReady = treasuryCapability === "active";
  const capitalForPlatformsReady =
    (account.country === "US" || account.country === "GB") && connectedAccountsCount > 0;

  const transfersSummary = treasuryReady
    ? "Treasury capability is active, so Financial Account transfer rails can be wired next."
    : connectTransfersCapability === "active"
      ? "Standard Stripe transfers are active, but Treasury banking rails are not enabled on this account."
      : "Stripe transfer capability is not active on this account yet.";

  const transfersNextStep = treasuryReady
    ? "Add a connected account with Treasury, create a Financial Account, and wire inbound or outbound transfer calls."
    : connectedAccountsCount === 0
      ? "Treasury-style bank transfers need a Connect platform setup plus Treasury access; this account currently has no connected accounts."
      : "Request the Treasury capability for your Connect setup before trying to move bank funds through Stripe.";

  const creditSummary = capitalForPlatformsReady
    ? "Capital for platforms may be available once eligible connected accounts start receiving financing offers."
    : "Credit is not live on this account. Stripe Capital requires a Connect platform with eligible connected accounts, and Stripe Issuing Credit remains preview-gated.";

  const creditNextStep = capitalForPlatformsReady
    ? "Finish Capital onboarding in Stripe, then expose financing offers or embedded components to connected accounts."
    : connectedAccountsCount === 0
      ? "Create a real Connect platform flow first. Without connected accounts, Stripe Capital cannot be surfaced."
      : "Contact Stripe to enable Capital or Issuing Credit preview access after your Connect platform is eligible.";

  return {
    configured: true,
    accountId: account.id,
    country: account.country ?? null,
    accountType: account.type ?? null,
    connectedAccountsCount,
    transfers: {
      connectTransfersCapability,
      treasuryCapability,
      treasuryReady,
      summary: transfersSummary,
      nextStep: transfersNextStep
    },
    credit: {
      capitalForPlatformsReady,
      issuingCreditReady: false,
      summary: creditSummary,
      nextStep: creditNextStep
    }
  };
}
