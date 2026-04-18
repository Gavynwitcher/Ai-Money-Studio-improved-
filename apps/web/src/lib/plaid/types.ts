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
