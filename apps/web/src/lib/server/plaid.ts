import { prisma } from "@/lib/prisma";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

type PlaidEnvironment = "sandbox" | "development" | "production";
type PlaidAuthMethod =
  | "INSTANT_AUTH"
  | "INSTANT_MATCH"
  | "AUTOMATED_MICRODEPOSITS"
  | "SAME_DAY_MICRODEPOSITS"
  | "INSTANT_MICRODEPOSITS"
  | "DATABASE_MATCH"
  | "DATABASE_INSIGHTS"
  | "TRANSFER_MIGRATED"
  | "INVESTMENTS_FALLBACK";

type SyncResult = {
  importedAccounts: number;
  importedTransactions: number;
  transactionsReady: boolean;
};

type UserSyncResult = SyncResult & {
  syncedItems: number;
  pendingItems: number;
};

export type PlaidUnlinkResult = {
  removedItems: number;
  removedAccounts: number;
  removedTransactions: number;
};

type PlaidConnectionStatus = {
  connected: boolean;
  connectedItems: number;
  institutions: string[];
  lastSyncedAt: string | null;
  linkedAccounts: number;
  importedTransactions: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  verifiedBankAccounts: number;
  pendingBankAccounts: number;
  tokenizedBankAccounts: number;
  authMethods: string[];
};

export type PlaidEnvironmentResetResult = {
  resetRequired: boolean;
  removedItems: number;
  removedAccounts: number;
  removedTransactions: number;
};

export type PlaidWebhookPayload = {
  webhook_type?: string;
  webhook_code?: string;
  item_id?: string;
  account_id?: string;
};

let plaidClient: PlaidApi | null = null;
const VERIFIED_BANK_STATUSES = new Set([
  "automatically_verified",
  "manually_verified",
  "database_matched",
  "database_insights_pass",
  "database_insights_pass_with_caution"
]);
const PENDING_BANK_STATUSES = new Set([
  "pending_automatic_verification",
  "pending_manual_verification",
  "unsent",
  "database_insights_pending"
]);

function readCleanEnv(name: string) {
  const value = process.env[name];
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\r\n]+/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function last4(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(-4) : null;
}

function mapAccountType(type?: string | null, subtype?: string | null) {
  const main = type ? type.toUpperCase() : "OTHER";
  const sub = subtype ? subtype.toUpperCase() : null;
  return sub ? `${main}:${sub}` : main;
}

function mapCategory(txn: {
  personal_finance_category?: { primary?: string | null } | null;
  category?: string[] | null;
}) {
  const primary = txn.personal_finance_category?.primary?.trim();
  if (primary) return primary;
  const fallback = txn.category?.[0]?.trim();
  return fallback || "Uncategorized";
}

function mapConfidenceLevel(level?: string | null) {
  if (level === "VERY_HIGH") return 0.98;
  if (level === "HIGH") return 0.95;
  if (level === "MEDIUM") return 0.82;
  if (level === "LOW") return 0.68;
  if (level === "UNKNOWN") return 0.7;
  return 0.75;
}

function mapRecurringFlag(category: string) {
  return category.includes("SUBSCRIPTION") || category.includes("RENT");
}

function getPlaidErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) return null;
  const maybe = error as { response?: { data?: { error_code?: unknown } } };
  const code = maybe.response?.data?.error_code;
  return typeof code === "string" ? code.trim() : null;
}

function isProductNotReadyError(error: unknown) {
  return getPlaidErrorCode(error) === "PRODUCT_NOT_READY";
}

function getPlaidErrorMessageText(error: unknown) {
  if (typeof error !== "object" || error === null) return "";
  const maybe = error as { response?: { data?: { error_message?: unknown } }; message?: unknown };
  const responseMessage = maybe.response?.data?.error_message;
  if (typeof responseMessage === "string") return responseMessage.trim();
  return typeof maybe.message === "string" ? maybe.message.trim() : "";
}

function isWrongEnvironmentAccessTokenError(error: unknown) {
  if (getPlaidErrorCode(error) !== "INVALID_ACCESS_TOKEN") return false;
  const message = getPlaidErrorMessageText(error);
  return /wrong plaid environment/i.test(message) || /expected "production", got "sandbox"/i.test(message);
}

function hasConfiguredProduct(product: Products) {
  return resolveConfiguredProducts().includes(product);
}

function getPlaidEnvironment(): PlaidEnvironment {
  const env = (readCleanEnv("PLAID_ENV") || "sandbox").toLowerCase();
  if (env === "production" || env === "development" || env === "sandbox") {
    return env;
  }
  return "sandbox";
}

export function getPlaidConfigError() {
  const env = getPlaidEnvironment();
  if (!["sandbox", "development", "production"].includes(env)) {
    return `Invalid PLAID_ENV (current: ${env})`;
  }
  if (!readCleanEnv("PLAID_CLIENT_ID")) return "Missing PLAID_CLIENT_ID";
  if (!readCleanEnv("PLAID_SECRET")) return "Missing PLAID_SECRET";
  return null;
}

export function isPlaidConfigured() {
  return getPlaidConfigError() === null;
}

function getPlaidClient() {
  if (plaidClient) return plaidClient;
  const env = getPlaidEnvironment();
  const clientId = readCleanEnv("PLAID_CLIENT_ID") || "";
  const secret = readCleanEnv("PLAID_SECRET") || "";
  plaidClient = new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": clientId,
          "PLAID-SECRET": secret,
          "Plaid-Version": "2020-09-14"
        }
      }
    })
  );
  return plaidClient;
}

function resolveConfiguredProducts() {
  const raw = process.env.PLAID_PRODUCTS?.trim();
  if (!raw) {
    return [Products.Auth, Products.Transactions];
  }

  const productMap: Record<string, Products> = {
    auth: Products.Auth,
    transactions: Products.Transactions,
    transfer: Products.Transfer,
    identity: Products.Identity,
    investments: Products.Investments,
    liabilities: Products.Liabilities,
    assets: Products.Assets,
    signal: Products.Signal,
    statements: Products.Statements
  };

  const mapped = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const products = mapped
    .map((value) => productMap[value])
    .filter((value): value is Products => Boolean(value));

  return products.length > 0 ? products : [Products.Auth, Products.Transactions];
}

export async function createPlaidLinkToken(userId: string) {
  const client = getPlaidClient();
  const response = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "AI Money Copilot",
    products: resolveConfiguredProducts(),
    country_codes: [CountryCode.Us],
    language: "en",
    redirect_uri: process.env.PLAID_REDIRECT_URI || undefined,
    webhook: process.env.PLAID_WEBHOOK_URL || undefined
  });
  return response.data;
}

export async function getPlaidConnectionStatus(userId: string): Promise<PlaidConnectionStatus> {
  const [items, linkedAccounts, importedTransactions, transactionCoverage, accountVerification] = await Promise.all([
    prisma.plaidItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { institutionName: true, lastSyncedAt: true, authMethod: true }
    }),
    prisma.moneyCopilotAccount.count({
      where: {
        userId,
        providerAccountId: { not: null }
      }
    }),
    prisma.moneyCopilotTransaction.count({
      where: {
        userId,
        providerTransactionId: { not: null }
      }
    }),
    prisma.moneyCopilotTransaction.aggregate({
      where: {
        userId,
        providerTransactionId: { not: null }
      },
      _min: { postedAt: true },
      _max: { postedAt: true }
    }),
    prisma.moneyCopilotAccount.findMany({
      where: {
        userId,
        providerAccountId: { not: null }
      },
      select: {
        bankVerificationStatus: true,
        isTokenizedAccountNumber: true
      }
    })
  ]);

  const institutions: string[] = Array.from(
    new Set(
      items
        .map((item) => item.institutionName?.trim())
        .filter((name): name is string => Boolean(name))
    )
  );

  const latestSync = items
    .map((item) => item.lastSyncedAt?.getTime() ?? 0)
    .sort((a, b) => b - a)[0];
  const authMethods: string[] = Array.from(
    new Set(
      items
        .map((item) => item.authMethod?.trim())
        .filter((method): method is string => Boolean(method))
    )
  );
  const verifiedBankAccounts = accountVerification.filter((account) =>
    VERIFIED_BANK_STATUSES.has((account.bankVerificationStatus || "").trim())
  ).length;
  const pendingBankAccounts = accountVerification.filter((account) =>
    PENDING_BANK_STATUSES.has((account.bankVerificationStatus || "").trim())
  ).length;
  const tokenizedBankAccounts = accountVerification.filter((account) => account.isTokenizedAccountNumber).length;

  return {
    connected: items.length > 0,
    connectedItems: items.length,
    institutions,
    lastSyncedAt: latestSync ? new Date(latestSync).toISOString() : null,
    linkedAccounts,
    importedTransactions,
    coverageStart: transactionCoverage._min.postedAt ? transactionCoverage._min.postedAt.toISOString().slice(0, 10) : null,
    coverageEnd: transactionCoverage._max.postedAt ? transactionCoverage._max.postedAt.toISOString().slice(0, 10) : null,
    verifiedBankAccounts,
    pendingBankAccounts,
    tokenizedBankAccounts,
    authMethods
  };
}

export async function ensurePlaidItemsMatchEnvironment(userId: string): Promise<PlaidEnvironmentResetResult | null> {
  const items = await prisma.plaidItem.findMany({
    where: { userId },
    select: {
      accessToken: true
    },
    take: 5
  });

  if (items.length === 0) return null;

  const client = getPlaidClient();
  for (const item of items) {
    try {
      await client.itemGet({ access_token: item.accessToken });
    } catch (error) {
      if (isWrongEnvironmentAccessTokenError(error)) {
        const removed = await unlinkPlaidDataForUser(userId);
        return {
          resetRequired: true,
          ...removed
        };
      }
      throw error;
    }
  }

  return null;
}

async function upsertPlaidAccounts(
  userId: string,
  accounts: Array<{
    account_id: string;
    name?: string | null;
    official_name?: string | null;
    type?: string | null;
    subtype?: string | null;
    mask?: string | null;
    balances: {
      iso_currency_code?: string | null;
      current?: number | null;
      available?: number | null;
    };
  }>
) {
  const accountIdMap = new Map<string, string>();

  for (const account of accounts) {
    const upsertedAccount = await prisma.moneyCopilotAccount.upsert({
      where: { providerAccountId: account.account_id },
      update: {
        userId,
        name: account.name || account.official_name || "Linked account",
        type: mapAccountType(account.type, account.subtype),
        currency: account.balances.iso_currency_code || "USD",
        currentBalance: account.balances.current ?? account.balances.available ?? 0,
        availableBalance: account.balances.available ?? null,
        accountMask: account.mask ?? undefined
      },
      create: {
        userId,
        providerAccountId: account.account_id,
        name: account.name || account.official_name || "Linked account",
        type: mapAccountType(account.type, account.subtype),
        currency: account.balances.iso_currency_code || "USD",
        currentBalance: account.balances.current ?? account.balances.available ?? 0,
        availableBalance: account.balances.available ?? null,
        accountMask: account.mask ?? null
      }
    });
    accountIdMap.set(account.account_id, upsertedAccount.id);
  }

  return accountIdMap;
}

async function syncPlaidAuthData(
  userId: string,
  plaidItem: { id: string; plaidItemId: string; accessToken: string; institutionName?: string | null }
) {
  if (!hasConfiguredProduct(Products.Auth)) {
    return { authReady: false };
  }

  const client = getPlaidClient();
  let authResponse;
  try {
    authResponse = await client.authGet({
      access_token: plaidItem.accessToken
    });
  } catch (error) {
    if (isProductNotReadyError(error)) {
      return { authReady: false };
    }
    throw error;
  }

  await upsertPlaidAccounts(userId, authResponse.data.accounts);

  const achByAccountId = new Map<
    string,
    {
      accountMask: string | null;
      routingNumberSuffix: string | null;
      isTokenizedAccountNumber: boolean;
    }
  >(
    (authResponse.data.numbers?.ach || []).map((entry) => [
      entry.account_id,
      {
        accountMask: last4(entry.account),
        routingNumberSuffix: last4(entry.routing),
        isTokenizedAccountNumber: Boolean(entry.is_tokenized_account_number)
      }
    ])
  );

  for (const account of authResponse.data.accounts) {
    const ach = achByAccountId.get(account.account_id);
    await prisma.moneyCopilotAccount.updateMany({
      where: {
        userId,
        providerAccountId: account.account_id
      },
      data: {
        accountMask: ach?.accountMask ?? account.mask ?? undefined,
        routingNumberSuffix: ach?.routingNumberSuffix ?? undefined,
        bankVerificationStatus: account.verification_status || null,
        verificationName: account.verification_name || null,
        persistentAccountId: account.persistent_account_id || null,
        holderCategory: account.holder_category || null,
        isTokenizedAccountNumber: ach?.isTokenizedAccountNumber ?? false
      }
    });
  }

  await prisma.plaidItem.update({
    where: { id: plaidItem.id },
    data: {
      institutionName: authResponse.data.item.institution_name || plaidItem.institutionName || null,
      authMethod: (authResponse.data.item.auth_method as PlaidAuthMethod | null) || null
    }
  });

  return { authReady: true };
}

async function syncSinglePlaidItem(
  userId: string,
  plaidItem: { id: string; plaidItemId: string; accessToken: string; institutionName?: string | null }
) {
  const client = getPlaidClient();
  const accountsResponse = await client.accountsGet({
    access_token: plaidItem.accessToken
  });

  const accountIdMap = await upsertPlaidAccounts(userId, accountsResponse.data.accounts);
  await syncPlaidAuthData(userId, plaidItem);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  let offset = 0;
  let total = 0;
  let importedTransactions = 0;
  let transactionsReady = true;

  do {
    let transactionsResponse;
    try {
      transactionsResponse = await client.transactionsGet({
        access_token: plaidItem.accessToken,
        start_date: isoDate(startDate),
        end_date: isoDate(endDate),
        options: {
          count: 500,
          offset
        }
      });
    } catch (error) {
      if (isProductNotReadyError(error)) {
        transactionsReady = false;
        break;
      }
      throw error;
    }

    total = transactionsResponse.data.total_transactions;
    const rows = transactionsResponse.data.transactions;

    for (const txn of rows) {
      if (!txn.transaction_id) continue;

      const category = mapCategory(txn);
      const postedAt = txn.date || txn.authorized_date || isoDate(endDate);
      await prisma.moneyCopilotTransaction.upsert({
        where: { providerTransactionId: txn.transaction_id },
        update: {
          userId,
          accountId: accountIdMap.get(txn.account_id) ?? null,
          postedAt: new Date(`${postedAt}T00:00:00.000Z`),
          amount: Number((-(txn.amount || 0)).toFixed(2)),
          currency: txn.iso_currency_code || "USD",
          merchantRaw: txn.name || txn.merchant_name || "Unknown",
          merchantNormalized: txn.merchant_name || txn.name || "Unknown",
          category,
          confidence: mapConfidenceLevel(txn.personal_finance_category?.confidence_level),
          recurring: mapRecurringFlag(category)
        },
        create: {
          userId,
          providerTransactionId: txn.transaction_id,
          accountId: accountIdMap.get(txn.account_id) ?? null,
          postedAt: new Date(`${postedAt}T00:00:00.000Z`),
          amount: Number((-(txn.amount || 0)).toFixed(2)),
          currency: txn.iso_currency_code || "USD",
          merchantRaw: txn.name || txn.merchant_name || "Unknown",
          merchantNormalized: txn.merchant_name || txn.name || "Unknown",
          category,
          confidence: mapConfidenceLevel(txn.personal_finance_category?.confidence_level),
          recurring: mapRecurringFlag(category)
        }
      });
      importedTransactions += 1;
    }

    offset += rows.length;
  } while (offset < total && offset < 1000);

  if (transactionsReady) {
    await prisma.plaidItem.update({
      where: { id: plaidItem.id },
      data: { lastSyncedAt: new Date() }
    });
  }

  return {
    importedAccounts: accountIdMap.size,
    importedTransactions,
    transactionsReady
  } satisfies SyncResult;
}

export async function exchangePublicTokenAndSync(
  userId: string,
  publicToken: string,
  institutionName?: string | null
) {
  const client = getPlaidClient();
  const exchangeResponse = await client.itemPublicTokenExchange({
    public_token: publicToken
  });

  const accessToken = exchangeResponse.data.access_token;
  const plaidItemId = exchangeResponse.data.item_id;

  const plaidItem = await prisma.plaidItem.upsert({
    where: {
      userId_plaidItemId: {
        userId,
        plaidItemId
      }
    },
    update: {
      accessToken,
      institutionName: institutionName?.trim() || undefined
    },
    create: {
      userId,
      plaidItemId,
      accessToken,
      institutionName: institutionName?.trim() || null
    }
  });

  const sync = await syncSinglePlaidItem(userId, plaidItem);
  return {
    plaidItemId,
    ...sync
  };
}

export async function syncPlaidDataForUser(userId: string): Promise<UserSyncResult> {
  const reset = await ensurePlaidItemsMatchEnvironment(userId);
  if (reset?.resetRequired) {
    return {
      syncedItems: 0,
      importedAccounts: 0,
      importedTransactions: 0,
      transactionsReady: false,
      pendingItems: 0
    };
  }

  const items = await prisma.plaidItem.findMany({
    where: { userId },
    select: { id: true, plaidItemId: true, accessToken: true, institutionName: true }
  });

  let importedAccounts = 0;
  let importedTransactions = 0;
  let pendingItems = 0;
  for (const item of items) {
    const result = await syncSinglePlaidItem(userId, item);
    importedAccounts += result.importedAccounts;
    importedTransactions += result.importedTransactions;
    if (!result.transactionsReady) pendingItems += 1;
  }

  return {
    syncedItems: items.length,
    importedAccounts,
    importedTransactions,
    transactionsReady: pendingItems === 0,
    pendingItems
  };
}

export async function unlinkPlaidDataForUser(userId: string): Promise<PlaidUnlinkResult> {
  return prisma.$transaction(async (tx) => {
    const [transactionDelete, accountDelete, itemDelete] = await Promise.all([
      tx.moneyCopilotTransaction.deleteMany({
        where: {
          userId,
          providerTransactionId: { not: null }
        }
      }),
      tx.moneyCopilotAccount.deleteMany({
        where: {
          userId,
          providerAccountId: { not: null }
        }
      }),
      tx.plaidItem.deleteMany({
        where: { userId }
      })
    ]);

    return {
      removedItems: itemDelete.count,
      removedAccounts: accountDelete.count,
      removedTransactions: transactionDelete.count
    };
  });
}

export async function syncPlaidAuthDataForItem(plaidItemId: string) {
  const plaidItem = await prisma.plaidItem.findFirst({
    where: { plaidItemId },
    select: {
      id: true,
      userId: true,
      plaidItemId: true,
      accessToken: true,
      institutionName: true
    }
  });
  if (!plaidItem) return false;

  await syncPlaidAuthData(plaidItem.userId, plaidItem);
  return true;
}

export async function handlePlaidWebhook(payload: PlaidWebhookPayload) {
  const webhookType = payload.webhook_type?.trim() || "";
  const webhookCode = payload.webhook_code?.trim() || "";
  const itemId = payload.item_id?.trim() || null;

  const shouldRefreshAuth =
    webhookType === "AUTH" &&
    itemId !== null &&
    ["DEFAULT_UPDATE", "AUTOMATICALLY_VERIFIED", "VERIFICATION_EXPIRED", "SMS_MICRODEPOSITS_VERIFICATION"].includes(webhookCode);

  return {
    itemId,
    shouldRefreshAuth
  };
}
