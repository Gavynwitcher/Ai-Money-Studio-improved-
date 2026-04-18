import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";
import { getPlaidConfig, getPlaidEnvironment, shouldUseMockPlaid } from "@/lib/plaid/config";
import {
  createMockLinkToken,
  createMockTransfer,
  exchangeMockPublicToken,
  getMockItem,
  listMockAccounts,
  listMockInstitutions,
  listMockTransactions
} from "@/lib/plaid/mock";
import type { TransferRequest } from "@/lib/plaid/types";

let plaidClient: PlaidApi | null = null;

function getPlaidClient() {
  if (plaidClient) return plaidClient;

  const config = getPlaidConfig();
  plaidClient = new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[getPlaidEnvironment()],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": config.clientId,
          "PLAID-SECRET": config.secret,
          "Plaid-Version": "2020-09-14"
        }
      }
    })
  );

  return plaidClient;
}

export async function createLinkToken() {
  if (shouldUseMockPlaid()) {
    return createMockLinkToken();
  }

  const client = getPlaidClient();

  // Real implementation hook for /link/token/create:
  // In production, create a user record and pass its stable ID into `client_user_id`.
  // The Quickstart uses link token config such as products, country codes, language,
  // webhook, and redirect URI to initialize Plaid Link on the client.
  const response = await client.linkTokenCreate({
    user: { client_user_id: "demo-user-id" },
    client_name: "Unified Banking Hub",
    country_codes: [CountryCode.Us],
    language: "en",
    products: [Products.Auth, Products.Transactions, Products.Transfer],
    webhook: getPlaidConfig().webhookUrl || undefined,
    redirect_uri: getPlaidConfig().redirectUri || undefined
  });

  return {
    linkToken: response.data.link_token,
    expiration: response.data.expiration,
    environment: getPlaidEnvironment(),
    mockMode: false,
    clientName: "Unified Banking Hub",
    products: ["auth", "transactions", "transfer"],
    countryCodes: ["US"]
  };
}

export async function exchangePublicToken(publicToken: string, institutionName?: string | null) {
  if (shouldUseMockPlaid()) {
    return exchangeMockPublicToken(institutionName);
  }

  const client = getPlaidClient();

  // Real implementation hook for /item/public_token/exchange:
  // 1. Exchange Plaid Link's `public_token`
  // 2. Persist `access_token` and `item_id` to your database
  // 3. Associate the Item with the authenticated platform user
  const response = await client.itemPublicTokenExchange({ public_token: publicToken });

  return {
    itemId: response.data.item_id,
    accessTokenStored: true,
    institutionName: institutionName || "Linked institution",
    linkedAt: new Date().toISOString(),
    mockMode: false,
    accessTokenPreview: "access-********"
  };
}

export async function fetchLinkedInstitutions() {
  if (shouldUseMockPlaid()) {
    return listMockInstitutions();
  }

  // Real implementation hook:
  // Query your database for previously stored Plaid items and institution metadata.
  return [];
}

export async function fetchLinkedAccounts() {
  if (shouldUseMockPlaid()) {
    return listMockAccounts();
  }

  // Real implementation hook for /accounts/get:
  // Use stored access tokens to call Plaid and normalize the accounts response for UI rendering.
  return [];
}

export async function fetchBalances() {
  if (shouldUseMockPlaid()) {
    return listMockAccounts();
  }

  // Real implementation hook:
  // Call /accounts/balance/get for near-real-time balances when supported for the connected institution.
  return [];
}

export async function fetchTransactions() {
  if (shouldUseMockPlaid()) {
    return listMockTransactions();
  }

  // Real implementation hook:
  // Use /transactions/sync or /transactions/get, persist normalized transactions, and paginate results.
  return [];
}

export async function fetchItemSummary() {
  if (shouldUseMockPlaid()) {
    return getMockItem();
  }

  // Real implementation hook:
  // Read the Item metadata and product coverage you persist after token exchange.
  return null;
}

export async function initiateTransfer(payload: TransferRequest) {
  if (shouldUseMockPlaid()) {
    return createMockTransfer(payload);
  }

  // Real implementation hook:
  // For supported users and accounts:
  // 1. Authorize with Plaid Transfer
  // 2. Create a transfer
  // 3. Store transfer status and audit trail
  return {
    transferId: "transfer_pending_configuration",
    status: "review" as const,
    amount: payload.amount,
    fee: 0,
    eta: "Pending Plaid Transfer configuration and compliance review"
  };
}
