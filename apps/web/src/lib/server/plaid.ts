import { prisma } from "@/lib/prisma";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

type PlaidEnvironment = "sandbox" | "development" | "production";

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
};

let plaidClient: PlaidApi | null = null;

function readCleanEnv(name: string) {
  const value = process.env[name];
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\r\n]+/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
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
    return [Products.Transactions];
  }

  const values = raw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const mapped = values
    .map((value) => Products[value as keyof typeof Products])
    .filter((value): value is Products => Boolean(value));

  return mapped.length > 0 ? mapped : [Products.Transactions];
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
  const [items, linkedAccounts, importedTransactions, transactionCoverage] = await Promise.all([
    prisma.plaidItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { institutionName: true, lastSyncedAt: true }
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
    })
  ]);

  const institutions = Array.from(
    new Set(
      items
        .map((item) => item.institutionName?.trim())
        .filter((name): name is string => Boolean(name))
    )
  );

  const latestSync = items
    .map((item) => item.lastSyncedAt?.getTime() ?? 0)
    .sort((a, b) => b - a)[0];

  return {
    connected: items.length > 0,
    connectedItems: items.length,
    institutions,
    lastSyncedAt: latestSync ? new Date(latestSync).toISOString() : null,
    linkedAccounts,
    importedTransactions,
    coverageStart: transactionCoverage._min.postedAt ? transactionCoverage._min.postedAt.toISOString().slice(0, 10) : null,
    coverageEnd: transactionCoverage._max.postedAt ? transactionCoverage._max.postedAt.toISOString().slice(0, 10) : null
  };
}

async function syncSinglePlaidItem(userId: string, plaidItem: { id: string; accessToken: string }) {
  const client = getPlaidClient();
  const accountsResponse = await client.accountsGet({
    access_token: plaidItem.accessToken
  });

  const accountIdMap = new Map<string, string>();
  for (const account of accountsResponse.data.accounts) {
    const upsertedAccount = await prisma.moneyCopilotAccount.upsert({
      where: { providerAccountId: account.account_id },
      update: {
        userId,
        name: account.name || account.official_name || "Linked account",
        type: mapAccountType(account.type, account.subtype),
        currency: account.balances.iso_currency_code || "USD",
        currentBalance: account.balances.current ?? account.balances.available ?? 0,
        availableBalance: account.balances.available ?? null
      },
      create: {
        userId,
        providerAccountId: account.account_id,
        name: account.name || account.official_name || "Linked account",
        type: mapAccountType(account.type, account.subtype),
        currency: account.balances.iso_currency_code || "USD",
        currentBalance: account.balances.current ?? account.balances.available ?? 0,
        availableBalance: account.balances.available ?? null
      }
    });
    accountIdMap.set(account.account_id, upsertedAccount.id);
  }

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
  const items = await prisma.plaidItem.findMany({
    where: { userId },
    select: { id: true, accessToken: true }
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
