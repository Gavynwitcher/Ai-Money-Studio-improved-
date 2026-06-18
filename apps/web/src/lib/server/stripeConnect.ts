import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeBaseUrl } from "@/lib/stripe/config";
import { getStripeServerClient } from "@/lib/stripe/server";
import { requireBillingUser } from "@/lib/server/billing";

export type ConnectedAccountWorkspace = {
  id: string;
  stripeAccountId: string;
  onboardingStatus: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDueCount: number;
  eventuallyDueCount: number;
  pendingVerificationCount: number;
  disabledReason: string | null;
  lastSyncedAt: string | null;
  dashboardAccess: "express";
};

export type StripeConnectWorkspace = {
  authenticated: boolean;
  userEmail: string | null;
  platformConfigured: boolean;
  hasConnectedAccount: boolean;
  connectedAccount: ConnectedAccountWorkspace | null;
};

function mapOnboardingStatus(account: Stripe.Account) {
  if (account.charges_enabled && account.payouts_enabled) {
    return "active";
  }

  if (account.details_submitted) {
    return "under_review";
  }

  if ((account.requirements?.currently_due?.length ?? 0) > 0) {
    return "requirements_due";
  }

  return "created";
}

async function syncConnectedAccountRecord(record: { id: string; stripeAccountId: string }) {
  const stripe = getStripeServerClient();
  const account = await stripe.accounts.retrieve(record.stripeAccountId);

  const updated = await prisma.stripeConnectedAccount.update({
    where: { id: record.id },
    data: {
      email: account.email ?? null,
      country: account.country ?? null,
      accountType: account.type ?? "express",
      onboardingStatus: mapOnboardingStatus(account),
      detailsSubmitted: account.details_submitted ?? false,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      currentlyDueCount: account.requirements?.currently_due?.length ?? 0,
      eventuallyDueCount: account.requirements?.eventually_due?.length ?? 0,
      pendingVerificationCount: account.requirements?.pending_verification?.length ?? 0,
      disabledReason: account.requirements?.disabled_reason ?? null,
      lastSyncedAt: new Date()
    }
  });

  return updated;
}

async function getOrCreateConnectedAccountRecord() {
  const user = await requireBillingUser();
  const existing = await prisma.stripeConnectedAccount.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" }
  });

  if (existing) {
    const synced = await syncConnectedAccountRecord(existing);
    return { user, record: synced, created: false };
  }

  const stripe = getStripeServerClient();
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    business_profile: {
      name: "Northline",
      product_description: "Connected cash platform for bank visibility, transfers, and capital readiness.",
      url: getStripeBaseUrl()
    },
    settings: {
      payouts: {
        schedule: {
          interval: "manual"
        }
      }
    },
    metadata: {
      northlineUserId: user.id,
      northlineUserEmail: user.email
    }
  });

  const record = await prisma.stripeConnectedAccount.create({
    data: {
      userId: user.id,
      stripeAccountId: account.id,
      email: account.email ?? user.email,
      country: account.country ?? "US",
      accountType: account.type ?? "express",
      onboardingStatus: mapOnboardingStatus(account),
      detailsSubmitted: account.details_submitted ?? false,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      currentlyDueCount: account.requirements?.currently_due?.length ?? 0,
      eventuallyDueCount: account.requirements?.eventually_due?.length ?? 0,
      pendingVerificationCount: account.requirements?.pending_verification?.length ?? 0,
      disabledReason: account.requirements?.disabled_reason ?? null,
      lastSyncedAt: new Date()
    }
  });

  return { user, record, created: true };
}

async function createAccountLink(accountId: string) {
  const stripe = getStripeServerClient();
  const baseUrl = getStripeBaseUrl();
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/api/stripe/connect/refresh?account=${encodeURIComponent(accountId)}`,
    return_url: `${baseUrl}/dashboard-demo?stripeConnect=return`,
    type: "account_onboarding",
    collection_options: {
      fields: "eventually_due"
    }
  });
}

export async function createStripeConnectOnboardingLink() {
  const { record } = await getOrCreateConnectedAccountRecord();
  const link = await createAccountLink(record.stripeAccountId);

  await prisma.stripeConnectedAccount.update({
    where: { id: record.id },
    data: {
      lastAccountLinkCreatedAt: new Date()
    }
  });

  return {
    url: link.url,
    accountId: record.stripeAccountId
  };
}

export async function refreshStripeConnectOnboardingLink(accountId: string) {
  const user = await requireBillingUser();
  const record = await prisma.stripeConnectedAccount.findFirst({
    where: {
      userId: user.id,
      stripeAccountId: accountId
    }
  });

  if (!record) {
    throw new Error("CONNECTED_ACCOUNT_NOT_FOUND");
  }

  const synced = await syncConnectedAccountRecord(record);
  const link = await createAccountLink(synced.stripeAccountId);

  await prisma.stripeConnectedAccount.update({
    where: { id: synced.id },
    data: { lastAccountLinkCreatedAt: new Date() }
  });

  return link.url;
}

export async function getStripeConnectWorkspace(): Promise<StripeConnectWorkspace> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      authenticated: false,
      userEmail: null,
      platformConfigured: false,
      hasConnectedAccount: false,
      connectedAccount: null
    };
  }

  try {
    const user = await requireBillingUser();
    const latest = await prisma.stripeConnectedAccount.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" }
    });

    if (!latest) {
      return {
        authenticated: true,
        userEmail: user.email,
        platformConfigured: true,
        hasConnectedAccount: false,
        connectedAccount: null
      };
    }

    const synced = await syncConnectedAccountRecord(latest);

    return {
      authenticated: true,
      userEmail: user.email,
      platformConfigured: true,
      hasConnectedAccount: true,
      connectedAccount: {
        id: synced.id,
        stripeAccountId: synced.stripeAccountId,
        onboardingStatus: synced.onboardingStatus,
        detailsSubmitted: synced.detailsSubmitted,
        chargesEnabled: synced.chargesEnabled,
        payoutsEnabled: synced.payoutsEnabled,
        currentlyDueCount: synced.currentlyDueCount,
        eventuallyDueCount: synced.eventuallyDueCount,
        pendingVerificationCount: synced.pendingVerificationCount,
        disabledReason: synced.disabledReason,
        lastSyncedAt: synced.lastSyncedAt?.toISOString() ?? null,
        dashboardAccess: "express"
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return {
        authenticated: false,
        userEmail: null,
        platformConfigured: true,
        hasConnectedAccount: false,
        connectedAccount: null
      };
    }

    throw error;
  }
}
