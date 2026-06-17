export type PlaidEnvironment = "sandbox" | "development" | "production";

export type LinkTokenResponse = {
  linkToken: string;
  expiration: string;
  environment: PlaidEnvironment;
  mockMode: boolean;
  clientName: string;
  products: string[];
  countryCodes: string[];
};

export type LinkedInstitution = {
  institutionId: string;
  institutionName: string;
  status: "connected" | "syncing";
};

export type LinkedAccount = {
  id: string;
  institutionId: string;
  institutionName: string;
  name: string;
  officialName?: string;
  type?: string;
  subtype: string;
  mask: string;
  currentBalance: number;
  availableBalance: number;
};

export type PlaidItemSummary = {
  itemId: string;
  institutionId: string;
  institutionName: string;
  billedProducts: string[];
  availableProducts: string[];
  webhook: string | null;
  accessTokenStatus: "stored" | "mock";
};

export type PlaidTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  accountName: string;
  date: string;
  direction: "inflow" | "outflow";
  status: "posted" | "pending";
};

export type TransferRequest = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
};

export type TransferResponse = {
  transferId: string;
  status: "review" | "scheduled";
  amount: number;
  fee: number;
  eta: string;
};

export type PublicTokenExchangeResponse = {
  itemId: string;
  accessTokenStored: boolean;
  institutionName: string;
  linkedAt: string;
  mockMode: boolean;
  accessTokenPreview: string;
};

export type PlaidLinkEvent = {
  name: string;
  timestamp: string;
  detail: string;
};

export type AssetReportCreateRequest = {
  accessTokens: string[];
  daysRequested: number;
  clientReportId?: string;
  webhookUrl?: string;
  addOns?: string[];
};

export type AssetReportCreateResponse = {
  assetReportToken: string;
  assetReportId: string;
  status: "processing" | "ready";
  fastAssetsEnabled: boolean;
  webhookExpected: boolean;
  mockMode: boolean;
};

export type AssetReportSummary = {
  assetReportId: string;
  clientReportId: string | null;
  dateGenerated: string;
  daysRequested: number;
  reportType: "full" | "fast";
  user: {
    clientUserId: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  items: Array<{
    itemId: string;
    institutionId: string;
    institutionName: string;
    dateLastUpdated: string;
    accounts: Array<{
      accountId: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
      currentBalance: number | null;
      availableBalance: number | null;
      daysAvailable: number;
      ownerNames: string[];
      transactionsCount: number;
    }>;
  }>;
  warnings: string[];
  mockMode: boolean;
};

export type AssetReportPdfResponse = {
  assetReportId: string;
  filename: string;
  contentType: string;
  mockMode: boolean;
};

export type AssetReportRefreshResponse = {
  assetReportId: string;
  refreshedAssetReportId: string;
  status: "processing";
  webhookExpected: boolean;
  mockMode: boolean;
};

export type AssetReportAuditCopyResponse = {
  assetReportId: string;
  auditor: string;
  auditCopyToken: string;
  mockMode: boolean;
};

export type LiabilityCreditAccount = {
  accountId: string;
  aprs: Array<{
    aprPercentage: number;
    aprType: string;
    balanceSubjectToApr: number | null;
    interestChargeAmount: number | null;
  }>;
  isOverdue: boolean;
  lastPaymentAmount: number | null;
  lastPaymentDate: string | null;
  lastStatementIssueDate: string | null;
  lastStatementBalance: number | null;
  minimumPaymentAmount: number | null;
  nextPaymentDueDate: string | null;
};

export type LiabilityStudentLoan = {
  accountId: string;
  accountNumber: string | null;
  loanName: string | null;
  expectedPayoffDate: string | null;
  guarantor: string | null;
  interestRatePercentage: number | null;
  isOverdue: boolean;
  lastPaymentAmount: number | null;
  lastPaymentDate: string | null;
  minimumPaymentAmount: number | null;
  nextPaymentDueDate: string | null;
  originationDate: string | null;
  originationPrincipalAmount: number | null;
  outstandingInterestAmount: number | null;
  repaymentPlanDescription: string | null;
  repaymentPlanType: string | null;
  pslfPaymentsMade: number | null;
  pslfPaymentsRemaining: number | null;
};

export type LiabilityMortgage = {
  accountId: string;
  accountNumber: string | null;
  currentLateFee: number | null;
  escrowBalance: number | null;
  hasPmi: boolean | null;
  hasPrepaymentPenalty: boolean | null;
  interestRatePercentage: number | null;
  interestRateType: string | null;
  lastPaymentAmount: number | null;
  lastPaymentDate: string | null;
  loanTerm: string | null;
  loanTypeDescription: string | null;
  maturityDate: string | null;
  nextMonthlyPayment: number | null;
  nextPaymentDueDate: string | null;
  originationDate: string | null;
  originationPrincipalAmount: number | null;
  pastDueAmount: number | null;
  propertyAddress: string | null;
};

export type LiabilitiesSummary = {
  itemId: string;
  institutionName: string;
  credit: LiabilityCreditAccount[];
  student: LiabilityStudentLoan[];
  mortgage: LiabilityMortgage[];
  refreshedAt: string;
  mockMode: boolean;
};
