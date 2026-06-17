export type BillingPlanKey = "starter" | "northline_plus" | "pro";
export type StripeCheckoutMode = "subscription" | "payment";

export type BillingPlanConfig = {
  key: BillingPlanKey;
  name: string;
  stripePriceId?: string;
  checkoutMode?: StripeCheckoutMode;
  ctaLabel: string;
  featured?: boolean;
};

const billingPlans: Record<BillingPlanKey, BillingPlanConfig> = {
  starter: {
    key: "starter",
    name: "Starter",
    ctaLabel: "Start free"
  },
  northline_plus: {
    key: "northline_plus",
    name: "Northline Plus",
    stripePriceId: process.env.STRIPE_PRICE_NORTHLINE_PLUS ?? process.env.STRIPE_PRICE_HUB_PLUS ?? process.env.STRIPE_PRICE_PLUS ?? undefined,
    checkoutMode: "subscription",
    ctaLabel: "Subscribe to Northline Plus",
    featured: true
  },
  pro: {
    key: "pro",
    name: "Pro",
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? undefined,
    checkoutMode: "subscription",
    ctaLabel: "Subscribe to Pro"
  }
};

export function getBillingPlanConfig(planKey: BillingPlanKey) {
  return billingPlans[planKey];
}

export function getAllBillingPlans() {
  return Object.values(billingPlans);
}

export function getBillingPlanByPriceId(priceId?: string | null) {
  if (!priceId) return null;
  return getAllBillingPlans().find((plan) => plan.stripePriceId === priceId) ?? null;
}

export function getStripeBaseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.SITE_URL ??
    process.env.NEXTAUTH_URL;

  return (explicit && explicit.endsWith("/")) ? explicit.slice(0, -1) : explicit ?? "http://localhost:3000";
}

export function stripeEnvIsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
