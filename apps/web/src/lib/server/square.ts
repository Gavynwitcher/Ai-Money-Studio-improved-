import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SQUARE_VERSION = "2026-01-22";
const DEFAULT_SCOPES = [
  "MERCHANT_PROFILE_READ",
  "PAYMENTS_READ",
  "PAYOUTS_READ",
  "BANK_ACCOUNTS_READ"
] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

type SquareEnvironment = "sandbox" | "production";

type MoneyShape = {
  amount?: number | bigint | null;
  currency?: string | null;
};

type MerchantShape = {
  id?: string;
  business_name?: string | null;
};

type LocationShape = {
  id?: string;
  name?: string | null;
  status?: string | null;
  currency?: string | null;
  timezone?: string | null;
  country?: string | null;
};

type BankAccountShape = {
  id?: string;
  bank_name?: string | null;
  account_type?: string | null;
  routing_number_suffix?: string | null;
  account_number_suffix?: string | null;
  status?: string | null;
};

type ProcessingFeeShape = {
  amount_money?: MoneyShape | null;
};

type PaymentShape = {
  id?: string;
  order_id?: string | null;
  customer_id?: string | null;
  location_id?: string | null;
  status?: string | null;
  source_type?: string | null;
  total_money?: MoneyShape | null;
  approved_money?: MoneyShape | null;
  tip_money?: MoneyShape | null;
  processing_fee?: ProcessingFeeShape[] | null;
  approved_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RefundShape = {
  id?: string;
  payment_id?: string | null;
  status?: string | null;
  reason?: string | null;
  amount_money?: MoneyShape | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PayoutShape = {
  id?: string;
  location_id?: string | null;
  status?: string | null;
  payout_type?: string | null;
  amount_money?: MoneyShape | null;
  fee_money?: MoneyShape | null;
  arrival_date?: string | null;
  paid_out_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  destination?: {
    id?: string | null;
  } | null;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string | null;
  merchant_id?: string;
  token_type?: string | null;
  short_lived?: boolean | null;
};

type SquareApiError = {
  category?: string;
  code?: string;
  detail?: string;
};

function getSquareEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENV === "production" ? "production" : "sandbox";
}

function getSquareBaseUrl() {
  return getSquareEnvironment() === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function getSquareScopes() {
  return (process.env.SQUARE_SCOPES || DEFAULT_SCOPES.join(","))
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  return parseDate(`${value}T00:00:00.000Z`);
}

function moneyToFloat(money?: MoneyShape | null) {
  const amount = money?.amount;
  if (typeof amount === "bigint") return Number(amount) / 100;
  if (typeof amount === "number") return amount / 100;
  return 0;
}

function stringOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function displayName(value?: string | null, fallback = "Square Seller") {
  return stringOrNull(value) ?? fallback;
}

async function runBatch(queries: Prisma.PrismaPromise<unknown>[]) {
  if (queries.length === 0) return [];
  return prisma.$transaction(queries);
}

async function parseSquareResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & { errors?: SquareApiError[] };
  if (!response.ok) {
    const detail = Array.isArray(payload.errors) ? payload.errors.map((item) => item.detail).filter(Boolean).join("; ") : "";
    throw new Error(detail || `Square API request failed with status ${response.status}`);
  }
  return payload;
}

async function squareApiRequest<T>(path: string, accessToken: string, search?: URLSearchParams) {
  const url = new URL(path, getSquareBaseUrl());
  if (search) url.search = search.toString();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  return parseSquareResponse<T>(response);
}

async function squareTokenRequest(body: Record<string, string>) {
  const response = await fetch(new URL("/oauth2/token", getSquareBaseUrl()), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": SQUARE_VERSION
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  return parseSquareResponse<TokenResponse>(response);
}

export function getSquareConfigError() {
  if (!process.env.SQUARE_APPLICATION_ID) return "Missing SQUARE_APPLICATION_ID";
  if (!process.env.SQUARE_APPLICATION_SECRET) return "Missing SQUARE_APPLICATION_SECRET";
  if (!process.env.SQUARE_REDIRECT_URI) return "Missing SQUARE_REDIRECT_URI";
  return null;
}

export function createSquareAuthorizationUrl(state: string) {
  const url = new URL("/oauth2/authorize", getSquareBaseUrl());
  url.searchParams.set("client_id", process.env.SQUARE_APPLICATION_ID || "");
  url.searchParams.set("scope", getSquareScopes().join(" "));
  url.searchParams.set("session", "false");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", process.env.SQUARE_REDIRECT_URI || "");
  return url.toString();
}

async function getLatestConnection(userId: string) {
  return prisma.squareConnection.findFirst({
    where: {
      userId,
      status: "connected"
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
  });
}

async function ensureFreshAccessToken(connectionId: string) {
  const existing = await prisma.squareConnection.findUnique({
    where: { id: connectionId }
  });
  if (!existing) {
    throw new Error("Square connection not found");
  }

  if (!existing.refreshToken) return existing;
  if (existing.expiresAt && existing.expiresAt.getTime() - Date.now() > DAY_MS) {
    return existing;
  }

  const token = await squareTokenRequest({
    client_id: process.env.SQUARE_APPLICATION_ID || "",
    client_secret: process.env.SQUARE_APPLICATION_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: existing.refreshToken
  });

  return prisma.squareConnection.update({
    where: { id: existing.id },
    data: {
      accessToken: token.access_token || existing.accessToken,
      refreshToken: token.refresh_token || existing.refreshToken,
      tokenType: stringOrNull(token.token_type) || existing.tokenType,
      expiresAt: parseDate(token.expires_at) || existing.expiresAt,
      status: "connected"
    }
  });
}

async function syncLocationsAndAccounts(params: {
  userId: string;
  connectionId: string;
  accessToken: string;
}) {
  const [locationsPayload, bankAccountsPayload] = await Promise.all([
    squareApiRequest<{ locations?: LocationShape[] }>("/v2/locations", params.accessToken),
    squareApiRequest<{ bank_accounts?: BankAccountShape[] }>("/v2/bank-accounts", params.accessToken).catch(() => ({
      bank_accounts: []
    }))
  ]);

  await runBatch([
    ...((locationsPayload.locations || [])
      .filter((location) => location.id)
      .map((location) =>
        prisma.squareLocation.upsert({
          where: {
            squareConnectionId_squareLocationId: {
              squareConnectionId: params.connectionId,
              squareLocationId: String(location.id)
            }
          },
          update: {
            name: displayName(location.name, "Primary location"),
            status: stringOrNull(location.status),
            currency: stringOrNull(location.currency) || "USD",
            timezone: stringOrNull(location.timezone),
            country: stringOrNull(location.country)
          },
          create: {
            userId: params.userId,
            squareConnectionId: params.connectionId,
            squareLocationId: String(location.id),
            name: displayName(location.name, "Primary location"),
            status: stringOrNull(location.status),
            currency: stringOrNull(location.currency) || "USD",
            timezone: stringOrNull(location.timezone),
            country: stringOrNull(location.country)
          }
        })
      )),
    ...((bankAccountsPayload.bank_accounts || [])
      .filter((account) => account.id)
      .map((account) =>
        prisma.squareBankAccount.upsert({
          where: {
            squareConnectionId_squareBankAccountId: {
              squareConnectionId: params.connectionId,
              squareBankAccountId: String(account.id)
            }
          },
          update: {
            bankName: stringOrNull(account.bank_name),
            accountType: stringOrNull(account.account_type),
            routingSuffix: stringOrNull(account.routing_number_suffix),
            accountSuffix: stringOrNull(account.account_number_suffix),
            status: stringOrNull(account.status)
          },
          create: {
            userId: params.userId,
            squareConnectionId: params.connectionId,
            squareBankAccountId: String(account.id),
            bankName: stringOrNull(account.bank_name),
            accountType: stringOrNull(account.account_type),
            routingSuffix: stringOrNull(account.routing_number_suffix),
            accountSuffix: stringOrNull(account.account_number_suffix),
            status: stringOrNull(account.status)
          }
        })
      ))
  ]);
}

async function syncTransactions(params: {
  userId: string;
  connectionId: string;
  accessToken: string;
}) {
  const begin = new Date(Date.now() - 90 * DAY_MS).toISOString();
  const [paymentsPayload, refundsPayload, payoutsPayload] = await Promise.all([
    squareApiRequest<{ payments?: PaymentShape[] }>("/v2/payments", params.accessToken, new URLSearchParams({
      begin_time: begin,
      sort_order: "DESC",
      limit: "100"
    })),
    squareApiRequest<{ refunds?: RefundShape[] }>("/v2/refunds", params.accessToken, new URLSearchParams({
      begin_time: begin,
      sort_order: "DESC",
      limit: "100"
    })).catch(() => ({ refunds: [] })),
    squareApiRequest<{ payouts?: PayoutShape[] }>("/v2/payouts", params.accessToken, new URLSearchParams({
      sort_order: "DESC",
      limit: "100"
    })).catch(() => ({ payouts: [] }))
  ]);

  const paymentRows = (paymentsPayload.payments || []).filter((payment) => payment.id && payment.created_at);
  await runBatch(
    paymentRows.map((payment) => {
      const amount = moneyToFloat(payment.approved_money) || moneyToFloat(payment.total_money);
      const tipAmount = moneyToFloat(payment.tip_money);
      const processingFee = (payment.processing_fee || []).reduce(
        (sum, item) => sum + moneyToFloat(item.amount_money),
        0
      );
      return prisma.squarePayment.upsert({
        where: {
          squareConnectionId_squarePaymentId: {
            squareConnectionId: params.connectionId,
            squarePaymentId: String(payment.id)
          }
        },
        update: {
          squareLocationId: stringOrNull(payment.location_id),
          orderId: stringOrNull(payment.order_id),
          customerId: stringOrNull(payment.customer_id),
          status: displayName(payment.status, "UNKNOWN"),
          sourceType: stringOrNull(payment.source_type),
          amount,
          tipAmount,
          processingFee,
          netAmount: amount - processingFee,
          currency: stringOrNull(payment.total_money?.currency) || stringOrNull(payment.approved_money?.currency) || "USD",
          approvedAt: parseDate(payment.approved_at),
          createdAtSquare: parseDate(payment.created_at) || new Date(),
          updatedAtSquare: parseDate(payment.updated_at),
          syncedAt: new Date()
        },
        create: {
          userId: params.userId,
          squareConnectionId: params.connectionId,
          squarePaymentId: String(payment.id),
          squareLocationId: stringOrNull(payment.location_id),
          orderId: stringOrNull(payment.order_id),
          customerId: stringOrNull(payment.customer_id),
          status: displayName(payment.status, "UNKNOWN"),
          sourceType: stringOrNull(payment.source_type),
          amount,
          tipAmount,
          processingFee,
          netAmount: amount - processingFee,
          currency: stringOrNull(payment.total_money?.currency) || stringOrNull(payment.approved_money?.currency) || "USD",
          approvedAt: parseDate(payment.approved_at),
          createdAtSquare: parseDate(payment.created_at) || new Date(),
          updatedAtSquare: parseDate(payment.updated_at),
          syncedAt: new Date()
        }
      });
    })
  );

  const paymentIds = await prisma.squarePayment.findMany({
    where: { squareConnectionId: params.connectionId },
    select: { id: true, squarePaymentId: true }
  });
  const paymentIdMap = new Map(paymentIds.map((row) => [row.squarePaymentId, row.id]));

  await runBatch(
    (refundsPayload.refunds || [])
      .filter((refund) => refund.id && refund.created_at)
      .map((refund) =>
        prisma.squareRefund.upsert({
          where: {
            squareConnectionId_squareRefundId: {
              squareConnectionId: params.connectionId,
              squareRefundId: String(refund.id)
            }
          },
          update: {
            squarePaymentId: refund.payment_id ? paymentIdMap.get(String(refund.payment_id)) || null : null,
            status: displayName(refund.status, "UNKNOWN"),
            reason: stringOrNull(refund.reason),
            amount: moneyToFloat(refund.amount_money),
            currency: stringOrNull(refund.amount_money?.currency) || "USD",
            createdAtSquare: parseDate(refund.created_at) || new Date(),
            updatedAtSquare: parseDate(refund.updated_at),
            syncedAt: new Date()
          },
          create: {
            userId: params.userId,
            squareConnectionId: params.connectionId,
            squarePaymentId: refund.payment_id ? paymentIdMap.get(String(refund.payment_id)) || null : null,
            squareRefundId: String(refund.id),
            status: displayName(refund.status, "UNKNOWN"),
            reason: stringOrNull(refund.reason),
            amount: moneyToFloat(refund.amount_money),
            currency: stringOrNull(refund.amount_money?.currency) || "USD",
            createdAtSquare: parseDate(refund.created_at) || new Date(),
            updatedAtSquare: parseDate(refund.updated_at),
            syncedAt: new Date()
          }
        })
      )
  );

  const bankAccounts = await prisma.squareBankAccount.findMany({
    where: { squareConnectionId: params.connectionId },
    select: { id: true, squareBankAccountId: true }
  });
  const bankAccountIdMap = new Map(bankAccounts.map((row) => [row.squareBankAccountId, row.id]));

  await runBatch(
    (payoutsPayload.payouts || [])
      .filter((payout) => payout.id && payout.created_at)
      .map((payout) =>
        prisma.squarePayout.upsert({
          where: {
            squareConnectionId_squarePayoutId: {
              squareConnectionId: params.connectionId,
              squarePayoutId: String(payout.id)
            }
          },
          update: {
            squareBankAccountId: payout.destination?.id ? bankAccountIdMap.get(String(payout.destination.id)) || null : null,
            squareLocationId: stringOrNull(payout.location_id),
            status: displayName(payout.status, "UNKNOWN"),
            payoutType: stringOrNull(payout.payout_type),
            amount: moneyToFloat(payout.amount_money),
            feeAmount: moneyToFloat(payout.fee_money),
            currency: stringOrNull(payout.amount_money?.currency) || "USD",
            arrivalDate: parseDateOnly(payout.arrival_date),
            paidOutAt: parseDate(payout.paid_out_at),
            createdAtSquare: parseDate(payout.created_at) || new Date(),
            updatedAtSquare: parseDate(payout.updated_at),
            syncedAt: new Date()
          },
          create: {
            userId: params.userId,
            squareConnectionId: params.connectionId,
            squarePayoutId: String(payout.id),
            squareBankAccountId: payout.destination?.id ? bankAccountIdMap.get(String(payout.destination.id)) || null : null,
            squareLocationId: stringOrNull(payout.location_id),
            status: displayName(payout.status, "UNKNOWN"),
            payoutType: stringOrNull(payout.payout_type),
            amount: moneyToFloat(payout.amount_money),
            feeAmount: moneyToFloat(payout.fee_money),
            currency: stringOrNull(payout.amount_money?.currency) || "USD",
            arrivalDate: parseDateOnly(payout.arrival_date),
            paidOutAt: parseDate(payout.paid_out_at),
            createdAtSquare: parseDate(payout.created_at) || new Date(),
            updatedAtSquare: parseDate(payout.updated_at),
            syncedAt: new Date()
          }
        })
      )
  );
}

export async function exchangeSquareAuthorizationCode(userId: string, code: string) {
  const token = await squareTokenRequest({
    client_id: process.env.SQUARE_APPLICATION_ID || "",
    client_secret: process.env.SQUARE_APPLICATION_SECRET || "",
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.SQUARE_REDIRECT_URI || ""
  });

  if (!token.access_token || !token.merchant_id) {
    throw new Error("Square did not return an access token");
  }

  const merchantsPayload = await squareApiRequest<{ merchants?: MerchantShape[]; merchant?: MerchantShape }>(
    "/v2/merchants",
    token.access_token
  );
  const merchant =
    merchantsPayload.merchant ||
    (merchantsPayload.merchants || []).find((item) => item.id === token.merchant_id) ||
    (merchantsPayload.merchants || [])[0];

  const connection = await prisma.squareConnection.upsert({
    where: {
      userId_merchantId: {
        userId,
        merchantId: token.merchant_id
      }
    },
    update: {
      merchantName: stringOrNull(merchant?.business_name),
      accessToken: token.access_token,
      refreshToken: stringOrNull(token.refresh_token),
      tokenType: stringOrNull(token.token_type),
      scopes: getSquareScopes().join(" "),
      environment: getSquareEnvironment(),
      status: "connected",
      expiresAt: parseDate(token.expires_at),
      lastSyncedAt: null
    },
    create: {
      userId,
      merchantId: token.merchant_id,
      merchantName: stringOrNull(merchant?.business_name),
      accessToken: token.access_token,
      refreshToken: stringOrNull(token.refresh_token),
      tokenType: stringOrNull(token.token_type),
      scopes: getSquareScopes().join(" "),
      environment: getSquareEnvironment(),
      status: "connected",
      expiresAt: parseDate(token.expires_at),
      lastSyncedAt: null
    }
  });

  await syncSquareDataForUser(userId, connection.id);
  return connection;
}

export async function syncSquareDataForUser(userId: string, connectionId?: string) {
  const connection =
    connectionId
      ? await prisma.squareConnection.findUnique({ where: { id: connectionId } })
      : await getLatestConnection(userId);

  if (!connection) {
    throw new Error("No Square connection found for this user");
  }

  const refreshed = await ensureFreshAccessToken(connection.id);
  await syncLocationsAndAccounts({
    userId,
    connectionId: refreshed.id,
    accessToken: refreshed.accessToken
  });
  await syncTransactions({
    userId,
    connectionId: refreshed.id,
    accessToken: refreshed.accessToken
  });

  const updated = await prisma.squareConnection.update({
    where: { id: refreshed.id },
    data: {
      lastSyncedAt: new Date(),
      status: "connected"
    }
  });

  return getSquareConnectionStatus(userId, updated.id);
}

export async function getSquareConnectionStatus(userId: string, connectionId?: string) {
  const connection =
    connectionId
      ? await prisma.squareConnection.findUnique({ where: { id: connectionId } })
      : await getLatestConnection(userId);

  if (!connection) {
    return {
      configured: getSquareConfigError() === null,
      environment: getSquareEnvironment(),
      connected: false,
      merchantId: null,
      merchantName: null,
      scopes: getSquareScopes(),
      lastSyncedAt: null,
      locations: 0,
      bankAccounts: 0,
      payments: 0
    };
  }

  const [locations, bankAccounts, payments] = await Promise.all([
    prisma.squareLocation.count({ where: { squareConnectionId: connection.id } }),
    prisma.squareBankAccount.count({ where: { squareConnectionId: connection.id } }),
    prisma.squarePayment.count({ where: { squareConnectionId: connection.id } })
  ]);

  return {
    configured: getSquareConfigError() === null,
    environment: getSquareEnvironment(),
    connected: true,
    merchantId: connection.merchantId,
    merchantName: connection.merchantName,
    scopes: (connection.scopes || "").split(/\s+/).filter(Boolean),
    lastSyncedAt: connection.lastSyncedAt?.toISOString() || null,
    locations,
    bankAccounts,
    payments
  };
}

export async function getSquareOverviewPayload(userId: string) {
  const status = await getSquareConnectionStatus(userId);
  if (!status.connected) {
    return {
      status,
      summary: {
        grossVolume: 0,
        refunds: 0,
        fees: 0,
        netCaptured: 0,
        payoutsSettled: 0,
        pendingSettlement: 0,
        transferPending: 0
      },
      locations: [],
      linkedBankAccounts: [],
      recentActivity: [],
      transferRequests: []
    };
  }

  const connection = await getLatestConnection(userId);
  if (!connection) {
    throw new Error("Square connection missing");
  }

  const [locations, bankAccounts, payments, refunds, payouts, transferRequests] = await Promise.all([
    prisma.squareLocation.findMany({
      where: { squareConnectionId: connection.id },
      orderBy: { name: "asc" }
    }),
    prisma.squareBankAccount.findMany({
      where: { squareConnectionId: connection.id },
      orderBy: { bankName: "asc" }
    }),
    prisma.squarePayment.findMany({
      where: { squareConnectionId: connection.id },
      orderBy: { createdAtSquare: "desc" },
      take: 12
    }),
    prisma.squareRefund.findMany({
      where: { squareConnectionId: connection.id },
      orderBy: { createdAtSquare: "desc" },
      take: 12
    }),
    prisma.squarePayout.findMany({
      where: { squareConnectionId: connection.id },
      include: {
        bankAccount: true
      },
      orderBy: { createdAtSquare: "desc" },
      take: 12
    }),
    prisma.squareTransferRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  const grossVolume = payments.reduce((sum, row) => sum + row.amount, 0);
  const refundsTotal = refunds.reduce((sum, row) => sum + row.amount, 0);
  const fees = payments.reduce((sum, row) => sum + row.processingFee, 0) + payouts.reduce((sum, row) => sum + row.feeAmount, 0);
  const netCaptured = payments.reduce((sum, row) => sum + row.netAmount, 0) - refundsTotal;
  const payoutsSettled = payouts.reduce((sum, row) => sum + row.amount, 0);
  const pendingSettlement = Math.max(netCaptured - payoutsSettled, 0);
  const transferPending = transferRequests
    .filter((row) => row.status !== "completed" && row.status !== "cancelled")
    .reduce((sum, row) => sum + row.amount, 0);

  const recentActivity = [
    ...payments.map((row) => ({
      id: `payment-${row.id}`,
      kind: "payment",
      title: row.status === "COMPLETED" ? "Customer payment captured" : `Payment ${row.status.toLowerCase()}`,
      amount: row.netAmount,
      grossAmount: row.amount,
      subtitle: `${row.sourceType || "Unknown source"}${row.squareLocationId ? ` • ${row.squareLocationId}` : ""}`,
      occurredAt: row.approvedAt?.toISOString() || row.createdAtSquare.toISOString(),
      status: row.status
    })),
    ...refunds.map((row) => ({
      id: `refund-${row.id}`,
      kind: "refund",
      title: "Customer refund",
      amount: -row.amount,
      grossAmount: row.amount,
      subtitle: row.reason || "Refund issued",
      occurredAt: row.createdAtSquare.toISOString(),
      status: row.status
    })),
    ...payouts.map((row) => ({
      id: `payout-${row.id}`,
      kind: "payout",
      title: "Square payout to bank",
      amount: row.amount - row.feeAmount,
      grossAmount: row.amount,
      subtitle: row.bankAccount?.bankName ? `${row.bankAccount.bankName} ending ${row.bankAccount.accountSuffix || "----"}` : "Linked bank account",
      occurredAt: (row.paidOutAt || row.arrivalDate || row.createdAtSquare).toISOString(),
      status: row.status
    })),
    ...transferRequests.map((row) => ({
      id: `transfer-${row.id}`,
      kind: "transfer",
      title: "Transfer request",
      amount: -row.amount,
      grossAmount: row.amount,
      subtitle: `${row.fromSource} -> ${row.toSource}`,
      occurredAt: row.createdAt.toISOString(),
      status: row.status.toUpperCase()
    }))
  ]
    .sort((a, b) => new Date(b.occurredAt).valueOf() - new Date(a.occurredAt).valueOf())
    .slice(0, 12);

  return {
    status,
    summary: {
      grossVolume,
      refunds: refundsTotal,
      fees,
      netCaptured,
      payoutsSettled,
      pendingSettlement,
      transferPending
    },
    locations: locations.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      currency: row.currency,
      timezone: row.timezone,
      country: row.country
    })),
    linkedBankAccounts: bankAccounts.map((row) => ({
      id: row.id,
      bankName: row.bankName || "Linked bank account",
      accountType: row.accountType,
      routingSuffix: row.routingSuffix,
      accountSuffix: row.accountSuffix,
      status: row.status
    })),
    recentActivity,
    transferRequests: transferRequests.map((row) => ({
      id: row.id,
      fromSource: row.fromSource,
      toSource: row.toSource,
      amount: row.amount,
      currency: row.currency,
      purpose: row.purpose,
      status: row.status,
      executionRail: row.executionRail,
      squareReferenceId: row.squareReferenceId,
      scheduledFor: row.scheduledFor?.toISOString() || null,
      executedAt: row.executedAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString()
    }))
  };
}

export async function createSquareTransferRequest(
  userId: string,
  payload: {
    fromSource: string;
    toSource: string;
    amount: number;
    purpose: string;
    scheduledFor?: string | null;
  }
) {
  const connection = await getLatestConnection(userId);
  return prisma.squareTransferRequest.create({
    data: {
      userId,
      squareConnectionId: connection?.id || null,
      fromSource: payload.fromSource.trim(),
      toSource: payload.toSource.trim(),
      amount: payload.amount,
      purpose: payload.purpose.trim(),
      status: "pending",
      executionRail: "manual",
      scheduledFor: parseDate(payload.scheduledFor)
    }
  });
}
