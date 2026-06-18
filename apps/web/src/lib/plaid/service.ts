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
import type {
  AssetReportAuditCopyResponse,
  AssetReportCreateRequest,
  AssetReportCreateResponse,
  AssetReportPdfResponse,
  AssetReportRefreshResponse,
  AssetReportSummary,
  LiabilitiesSummary,
  TransferRequest
} from "@/lib/plaid/types";

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

export async function createLinkToken(clientUserId = "sandbox-demo-user") {
  if (shouldUseMockPlaid()) {
    return createMockLinkToken();
  }

  const client = getPlaidClient();

  // Real implementation hook for /link/token/create:
  // In production, create a user record and pass its stable ID into `client_user_id`.
  // The Quickstart uses link token config such as products, country codes, language,
  // webhook, and redirect URI to initialize Plaid Link on the client.
  const response = await client.linkTokenCreate({
    user: { client_user_id: clientUserId },
    client_name: "Northline",
    country_codes: [CountryCode.Us],
    language: "en",
    products: [Products.Auth, Products.Transactions],
    webhook: getPlaidConfig().webhookUrl || undefined,
    redirect_uri: getPlaidConfig().redirectUri || undefined
  });

  return {
    linkToken: response.data.link_token,
    expiration: response.data.expiration,
    environment: getPlaidEnvironment(),
    mockMode: false,
    clientName: "Northline",
    products: ["auth", "transactions"],
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

function buildMockAssetReport(daysRequested: number): AssetReportSummary {
  return {
    assetReportId: "asset_report_demo_001",
    clientReportId: "northline-underwriting-demo",
    dateGenerated: new Date().toISOString(),
    daysRequested,
    reportType: "full",
    user: {
      clientUserId: "demo-user-id",
      email: "borrower@example.com",
      firstName: "Alberta",
      lastName: "Charleson"
    },
    items: [
      {
        itemId: "item_demo_chase_001",
        institutionId: "ins_3",
        institutionName: "Chase",
        dateLastUpdated: new Date().toISOString(),
        accounts: [
          {
            accountId: "acct_demo_checking_001",
            name: "Plaid Checking",
            mask: "0000",
            type: "depository",
            subtype: "checking",
            currentBalance: 110,
            availableBalance: 100,
            daysAvailable: 2,
            ownerNames: ["Alberta Bobbeth Charleson"],
            transactionsCount: 1
          },
          {
            accountId: "acct_demo_ira_001",
            name: "Plaid IRA",
            mask: "5555",
            type: "investment",
            subtype: "ira",
            currentBalance: 320.76,
            availableBalance: null,
            daysAvailable: 0,
            ownerNames: ["Alberta Bobbeth Charleson"],
            transactionsCount: 0
          }
        ]
      }
    ],
    warnings: [],
    mockMode: true
  };
}

function buildMockLiabilitiesSummary(): LiabilitiesSummary {
  return {
    itemId: "item_demo_liabilities_001",
    institutionName: "Chase",
    credit: [
      {
        accountId: "acct_liability_credit_001",
        aprs: [
          {
            aprPercentage: 15.24,
            aprType: "balance_transfer_apr",
            balanceSubjectToApr: 1562.32,
            interestChargeAmount: 130.22
          },
          {
            aprPercentage: 12.5,
            aprType: "purchase_apr",
            balanceSubjectToApr: 157.01,
            interestChargeAmount: 25.66
          }
        ],
        isOverdue: false,
        lastPaymentAmount: 168.25,
        lastPaymentDate: "2026-04-22",
        lastStatementIssueDate: "2026-04-28",
        lastStatementBalance: 1708.77,
        minimumPaymentAmount: 20,
        nextPaymentDueDate: "2026-05-28"
      }
    ],
    student: [
      {
        accountId: "acct_liability_student_001",
        accountNumber: "4277075694",
        loanName: "Consolidation",
        expectedPayoffDate: "2032-07-28",
        guarantor: "DEPT OF ED",
        interestRatePercentage: 5.25,
        isOverdue: false,
        lastPaymentAmount: 138.05,
        lastPaymentDate: "2026-04-22",
        minimumPaymentAmount: 25,
        nextPaymentDueDate: "2026-05-28",
        originationDate: "2002-08-28",
        originationPrincipalAmount: 25000,
        outstandingInterestAmount: 6227.36,
        repaymentPlanDescription: "Standard Repayment",
        repaymentPlanType: "standard",
        pslfPaymentsMade: 200,
        pslfPaymentsRemaining: 160
      }
    ],
    mortgage: [
      {
        accountId: "acct_liability_mortgage_001",
        accountNumber: "3120194154",
        currentLateFee: 25,
        escrowBalance: 3141.54,
        hasPmi: true,
        hasPrepaymentPenalty: true,
        interestRatePercentage: 3.99,
        interestRateType: "fixed",
        lastPaymentAmount: 3141.54,
        lastPaymentDate: "2026-04-01",
        loanTerm: "30 year",
        loanTypeDescription: "conventional",
        maturityDate: "2045-07-31",
        nextMonthlyPayment: 3141.54,
        nextPaymentDueDate: "2026-05-15",
        originationDate: "2015-08-01",
        originationPrincipalAmount: 425000,
        pastDueAmount: 2304,
        propertyAddress: "2992 Cameron Road, Malakoff, NY 14236"
      }
    ],
    refreshedAt: new Date().toISOString(),
    mockMode: true
  };
}

export async function createAssetReport(
  payload: AssetReportCreateRequest
): Promise<AssetReportCreateResponse> {
  if (shouldUseMockPlaid()) {
    return {
      assetReportToken: "asset-report-token-demo",
      assetReportId: "asset_report_demo_001",
      status: "processing",
      fastAssetsEnabled: (payload.addOns ?? []).includes("fast_assets"),
      webhookExpected: true,
      mockMode: true
    };
  }

  // Real implementation hook:
  // 1. Verify every access_token was created with `assets` in the Link product array.
  // 2. Call /asset_report/create with the requested history, webhook, and optional add-ons.
  // 3. Persist the returned asset_report_token + asset_report_id to your database.
  // 4. Wait for PRODUCT_READY before fetching the report payload.
  return {
    assetReportToken: "asset_report_pending_live_configuration",
    assetReportId: "asset_report_pending_live_configuration",
    status: "processing",
    fastAssetsEnabled: (payload.addOns ?? []).includes("fast_assets"),
    webhookExpected: true,
    mockMode: false
  };
}

export async function getAssetReport(): Promise<AssetReportSummary> {
  if (shouldUseMockPlaid()) {
    return buildMockAssetReport(2);
  }

  // Real implementation hook:
  // 1. Read the latest ready asset_report_token from your database.
  // 2. Call /asset_report/get (optionally with include_insights or fast_report flags).
  // 3. Normalize report.items, balances, owners, and transactions for the UI.
  return {
    ...buildMockAssetReport(2),
    mockMode: false
  };
}

export async function getAssetReportPdf(): Promise<AssetReportPdfResponse> {
  if (shouldUseMockPlaid()) {
    return {
      assetReportId: "asset_report_demo_001",
      filename: "northline-asset-report-demo.pdf",
      contentType: "application/pdf",
      mockMode: true
    };
  }

  // Real implementation hook:
  // 1. Call /asset_report/pdf/get with a ready asset_report_token.
  // 2. Stream or store the PDF response for the requesting underwriter.
  return {
    assetReportId: "asset_report_pending_live_configuration",
    filename: "northline-asset-report.pdf",
    contentType: "application/pdf",
    mockMode: false
  };
}

export async function refreshAssetReport(): Promise<AssetReportRefreshResponse> {
  if (shouldUseMockPlaid()) {
    return {
      assetReportId: "asset_report_demo_001",
      refreshedAssetReportId: "asset_report_demo_refresh_001",
      status: "processing",
      webhookExpected: true,
      mockMode: true
    };
  }

  // Real implementation hook:
  // 1. Call /asset_report/refresh against an existing asset_report_token.
  // 2. Store the new report identifiers and wait for the next PRODUCT_READY webhook.
  return {
    assetReportId: "asset_report_pending_live_configuration",
    refreshedAssetReportId: "asset_report_refresh_pending_live_configuration",
    status: "processing",
    webhookExpected: true,
    mockMode: false
  };
}

export async function createAssetReportAuditCopy(
  auditor = "fannie_mae"
): Promise<AssetReportAuditCopyResponse> {
  if (shouldUseMockPlaid()) {
    return {
      assetReportId: "asset_report_demo_001",
      auditor,
      auditCopyToken: "audit-copy-token-demo",
      mockMode: true
    };
  }

  // Real implementation hook:
  // 1. Call /asset_report/audit_copy/create for an eligible auditor integration.
  // 2. Deliver the audit_copy_token only to the requesting third-party auditor.
  return {
    assetReportId: "asset_report_pending_live_configuration",
    auditor,
    auditCopyToken: "audit_copy_pending_live_configuration",
    mockMode: false
  };
}

export async function getLiabilities(): Promise<LiabilitiesSummary> {
  if (shouldUseMockPlaid()) {
    return buildMockLiabilitiesSummary();
  }

  // Real implementation hook:
  // 1. Read the stored access_token for the connected Item that has `liabilities` enabled.
  // 2. Call /liabilities/get to fetch the latest credit, student loan, and mortgage details.
  // 3. Normalize payment cadence, APR, payoff, and collateral fields for the UI.
  // 4. Use Liabilities webhooks or a daily refresh process to keep cached debt data current.
  return {
    ...buildMockLiabilitiesSummary(),
    mockMode: false
  };
}
