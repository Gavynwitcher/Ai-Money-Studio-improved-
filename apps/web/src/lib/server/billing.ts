import type Stripe from "stripe";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getStripeBaseUrl, getBillingPlanByPriceId, getBillingPlanConfig, type BillingPlanKey } from "@/lib/stripe/config";
import { getStripeServerClient } from "@/lib/stripe/server";

export type BillingOverview = {
  userId: string | null;
  email: string | null;
  authenticated: boolean;
  stripeConfigured: boolean;
  currentPlan: BillingPlanKey;
  billingStatus: string;
  portalAvailable: boolean;
  checkoutReadyPlans: BillingPlanKey[];
  activeSubscription: {
    id: string;
    planKey: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      billingPlan: true,
      billingStatus: true
    }
  });
}

export async function getBillingOverview(): Promise<BillingOverview> {
  const user = await getAuthenticatedUser();
  const checkoutReadyPlans = (["northline_plus", "pro"] as BillingPlanKey[]).filter((planKey) =>
    Boolean(getBillingPlanConfig(planKey).stripePriceId)
  );

  if (!user) {
    return {
      userId: null,
      email: null,
      authenticated: false,
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      currentPlan: "starter",
      billingStatus: "guest",
      portalAvailable: false,
      checkoutReadyPlans,
      activeSubscription: null
    };
  }

  const activeSubscription = await prisma.billingSubscription.findFirst({
    where: {
      userId: user.id,
      status: {
        in: ["trialing", "active", "past_due", "unpaid"]
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return {
    userId: user.id,
    email: user.email,
    authenticated: true,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    currentPlan: (user.billingPlan as BillingPlanKey) ?? "starter",
    billingStatus: user.billingStatus,
    portalAvailable: Boolean(user.stripeCustomerId),
    checkoutReadyPlans,
    activeSubscription: activeSubscription
      ? {
          id: activeSubscription.stripeSubscriptionId,
          planKey: activeSubscription.planKey,
          status: activeSubscription.status,
          currentPeriodEnd: activeSubscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd
        }
      : null
  };
}

export async function requireBillingUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  return user;
}

export async function ensureStripeCustomer(user: {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
}) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripeServerClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id }
  });

  return customer.id;
}

export async function createCheckoutSession(input: {
  user: {
    id: string;
    email: string;
    name: string | null;
    stripeCustomerId: string | null;
  };
  planKey: BillingPlanKey;
}) {
  const plan = getBillingPlanConfig(input.planKey);
  if (!plan?.stripePriceId || !plan.checkoutMode) {
    throw new Error("PLAN_NOT_CONFIGURED");
  }

  const stripe = getStripeServerClient();
  const customerId = await ensureStripeCustomer(input.user);
  const baseUrl = getStripeBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: plan.checkoutMode,
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    customer_update: {
      name: "auto",
      address: "auto"
    },
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing/cancel?plan=${plan.key}`,
    metadata: {
      userId: input.user.id,
      planKey: plan.key
    },
    ...(plan.checkoutMode === "subscription"
      ? {
          subscription_data: {
            metadata: {
              userId: input.user.id,
              planKey: plan.key
            }
          }
        }
      : {})
  });

  return session;
}

export async function createBillingPortalSession(user: {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
}) {
  const stripeCustomerId = await ensureStripeCustomer(user);
  const stripe = getStripeServerClient();
  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${getStripeBaseUrl()}/pricing`
  });

  return portal;
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const startSeconds = item?.current_period_start ?? null;
  const endSeconds = item?.current_period_end ?? null;

  return {
    currentPeriodStart: startSeconds ? new Date(startSeconds * 1000) : null,
    currentPeriodEnd: endSeconds ? new Date(endSeconds * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  };
}

function mapPlanKey(subscription: Stripe.Subscription): BillingPlanKey {
  const priceId = subscription.items.data[0]?.price?.id;
  const configuredPlan = getBillingPlanByPriceId(priceId);
  if (configuredPlan) {
    return configuredPlan.key;
  }

  const metadataPlan = subscription.metadata.planKey;
  if (metadataPlan === "northline_plus" || metadataPlan === "pro" || metadataPlan === "starter") {
    return metadataPlan;
  }
  if (metadataPlan === "hub_plus") {
    return "northline_plus";
  }

  return "starter";
}

function deriveUserBillingStatus(status: string, planKey: BillingPlanKey) {
  if (status === "active" || status === "trialing") {
    return { billingPlan: planKey, billingStatus: status };
  }

  if (status === "past_due" || status === "unpaid") {
    return { billingPlan: planKey, billingStatus: status };
  }

  return { billingPlan: "starter" as BillingPlanKey, billingStatus: status };
}

export async function upsertSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription,
  explicitUserId?: string | null
) {
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const userId =
    explicitUserId ??
    subscription.metadata.userId ??
    (await prisma.user.findFirst({
      where: { stripeCustomerId },
      select: { id: true }
    }).then((user) => user?.id ?? null));

  if (!userId) {
    return null;
  }

  const planKey = mapPlanKey(subscription);
  const period = getSubscriptionPeriod(subscription);

  const saved = await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      stripeCustomerId,
      stripePriceId: subscription.items.data[0]?.price?.id ?? null,
      planKey,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      trialEnd: period.trialEnd
    },
    create: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id ?? null,
      planKey,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      trialEnd: period.trialEnd
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId,
      ...deriveUserBillingStatus(subscription.status, planKey)
    }
  });

  return saved;
}

export async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  const stripe = getStripeServerClient();
  const userId = session.metadata?.userId ?? null;
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  if (userId && stripeCustomerId) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId }
    });
  }

  if (session.subscription) {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"]
    });
    return upsertSubscriptionFromStripeSubscription(subscription, userId);
  }

  return null;
}

export async function handleInvoiceEvent(invoice: Stripe.Invoice, paid: boolean) {
  const invoiceRecord = invoice as unknown as { subscription?: string | { id: string } | null };
  const subscriptionId =
    typeof invoiceRecord.subscription === "string"
      ? invoiceRecord.subscription
      : invoiceRecord.subscription?.id ?? null;

  if (!subscriptionId) return null;

  const existing = await prisma.billingSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    select: { userId: true, planKey: true }
  });

  if (!existing) return null;

  const nextStatus = paid ? "active" : "past_due";

  await prisma.billingSubscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: nextStatus }
  });

  await prisma.user.update({
    where: { id: existing.userId },
    data: {
      billingPlan: paid ? existing.planKey : existing.planKey,
      billingStatus: nextStatus
    }
  });

  return nextStatus;
}

export async function recordStripeEvent(event: Stripe.Event, userId?: string | null) {
  await prisma.billingEvent.upsert({
    where: { providerEventId: event.id },
    update: {
      eventType: event.type,
      payloadJson: JSON.stringify(event),
      processedAt: new Date(),
      userId: userId ?? undefined
    },
    create: {
      providerEventId: event.id,
      eventType: event.type,
      payloadJson: JSON.stringify(event),
      userId: userId ?? undefined
    }
  });
}
