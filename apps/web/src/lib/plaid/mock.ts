import { accounts, institutions, transactions, transfers } from "@/data/mock-finance";
import type {
  LinkedAccount,
  LinkedInstitution,
  LinkTokenResponse,
  PlaidItemSummary,
  PlaidTransaction,
  PublicTokenExchangeResponse,
  TransferRequest,
  TransferResponse
} from "@/lib/plaid/types";

export async function createMockLinkToken(): Promise<LinkTokenResponse> {
  return {
    linkToken: "link-sandbox-unified-banking-hub",
    expiration: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    environment: "sandbox",
    mockMode: true,
    clientName: "Unified Banking Hub",
    products: ["auth", "transactions", "transfer"],
    countryCodes: ["US"]
  };
}

export async function exchangeMockPublicToken(
  institutionName?: string | null
): Promise<PublicTokenExchangeResponse> {
  return {
    itemId: `item_${institutionName?.toLowerCase().replace(/\s+/g, "_") || "sandbox"}`,
    accessTokenStored: false,
    institutionName: institutionName || "Plaid Sandbox Bank",
    linkedAt: new Date().toISOString(),
    mockMode: true,
    accessTokenPreview: "access-sandbox-********"
  };
}

export async function listMockInstitutions(): Promise<LinkedInstitution[]> {
  return institutions.map((institution) => ({
    institutionId: institution.id,
    institutionName: institution.name,
    status: institution.status
  }));
}

export async function listMockAccounts(): Promise<LinkedAccount[]> {
  return accounts.map((account) => ({
    id: account.id,
    institutionId: account.institutionId,
    institutionName: account.institutionName,
    name: account.name,
    officialName: `${account.institutionName} ${account.name}`,
    type: "depository",
    subtype: account.subtype,
    mask: account.mask,
    currentBalance: account.currentBalance,
    availableBalance: account.availableBalance
  }));
}

export async function getMockItem(): Promise<PlaidItemSummary> {
  return {
    itemId: "item_chase",
    institutionId: "ins_12",
    institutionName: "Chase",
    billedProducts: ["auth"],
    availableProducts: ["assets", "balance", "identity", "investments", "transactions"],
    webhook: "https://webhook.example.com/plaid",
    accessTokenStatus: "mock"
  };
}

export async function listMockTransactions(): Promise<PlaidTransaction[]> {
  return transactions.map((transaction) => ({
    id: transaction.id,
    merchant: transaction.merchant,
    category: transaction.category,
    amount: transaction.amount,
    accountName: transaction.accountName,
    date: transaction.date,
    direction: transaction.direction,
    status: transaction.status
  }));
}

export async function createMockTransfer(payload: TransferRequest): Promise<TransferResponse> {
  const match = accounts.find((account) => account.id === payload.fromAccountId);
  const fee = payload.amount >= 5000 ? 2 : 1;

  return {
    transferId: `${transfers[0].id}_${Date.now()}`,
    status: "review",
    amount: payload.amount,
    fee,
    eta: `Review created from ${match?.institutionName || "linked institution"}`
  };
}
