export type Institution = {
  id: string;
  name: string;
  badge: string;
  status: "connected" | "syncing";
};

export type Account = {
  id: string;
  institutionId: string;
  institutionName: string;
  name: string;
  subtype: string;
  mask: string;
  availableBalance: number;
  currentBalance: number;
  trend: number[];
};

export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  accountName: string;
  date: string;
  direction: "inflow" | "outflow";
  status: "posted" | "pending";
};

export type Transfer = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fee: number;
  status: "scheduled" | "review" | "completed";
  eta: string;
};

export const institutions: Institution[] = [
  { id: "inst_chase", name: "Chase", badge: "CH", status: "connected" },
  { id: "inst_capital", name: "Capital One", badge: "CO", status: "connected" },
  { id: "inst_boa", name: "Bank of America", badge: "BA", status: "syncing" }
];

export const accounts: Account[] = [
  {
    id: "acc_ops",
    institutionId: "inst_chase",
    institutionName: "Chase",
    name: "Operating",
    subtype: "Business Checking",
    mask: "2481",
    availableBalance: 42680,
    currentBalance: 43820,
    trend: [32, 44, 40, 52, 59, 68, 64]
  },
  {
    id: "acc_reserve",
    institutionId: "inst_capital",
    institutionName: "Capital One",
    name: "Reserve",
    subtype: "High-Yield Savings",
    mask: "9022",
    availableBalance: 185400,
    currentBalance: 185400,
    trend: [60, 58, 62, 61, 64, 67, 70]
  },
  {
    id: "acc_tax",
    institutionId: "inst_boa",
    institutionName: "Bank of America",
    name: "Tax Holdback",
    subtype: "Business Savings",
    mask: "1124",
    availableBalance: 29840,
    currentBalance: 30150,
    trend: [24, 26, 25, 29, 31, 33, 34]
  }
];

export const transactions: Transaction[] = [
  {
    id: "txn_1",
    merchant: "Stripe Payout",
    category: "Income",
    amount: 9200,
    accountName: "Operating",
    date: "Apr 16",
    direction: "inflow",
    status: "posted"
  },
  {
    id: "txn_2",
    merchant: "Mercury Payroll Transfer",
    category: "Payroll",
    amount: -5400,
    accountName: "Operating",
    date: "Apr 15",
    direction: "outflow",
    status: "posted"
  },
  {
    id: "txn_3",
    merchant: "Microsoft 365",
    category: "Software",
    amount: -682,
    accountName: "Reserve",
    date: "Apr 15",
    direction: "outflow",
    status: "pending"
  },
  {
    id: "txn_4",
    merchant: "Client Retainer",
    category: "Income",
    amount: 3400,
    accountName: "Operating",
    date: "Apr 14",
    direction: "inflow",
    status: "posted"
  },
  {
    id: "txn_5",
    merchant: "IRS Estimated Tax",
    category: "Tax",
    amount: -1800,
    accountName: "Tax Holdback",
    date: "Apr 13",
    direction: "outflow",
    status: "posted"
  }
];

export const transfers: Transfer[] = [
  {
    id: "tr_1",
    fromAccountId: "acc_reserve",
    toAccountId: "acc_ops",
    amount: 5000,
    fee: 2,
    status: "review",
    eta: "Same day review, subject to bank timing"
  }
];

export const monthlyCashFlow = [
  { label: "Jan", inflow: 44, outflow: 31 },
  { label: "Feb", inflow: 49, outflow: 34 },
  { label: "Mar", inflow: 54, outflow: 36 },
  { label: "Apr", inflow: 57, outflow: 39 },
  { label: "May", inflow: 61, outflow: 38 },
  { label: "Jun", inflow: 64, outflow: 41 }
];

export const spendingCategories = [
  { label: "Operations", value: 34, amount: 12420 },
  { label: "Payroll", value: 26, amount: 9680 },
  { label: "Software", value: 18, amount: 6720 },
  { label: "Tax", value: 13, amount: 4870 },
  { label: "Travel", value: 9, amount: 3250 }
];

export const alerts = [
  { title: "Tax reserve below target by $3.4K", tone: "warning" },
  { title: "Two institutions synced in the last 15 minutes", tone: "neutral" },
  { title: "Transfer review ready for approval", tone: "success" }
];

export const creditSnapshot = {
  score: 708,
  trend: "+14 pts over 90 days",
  utilization: "22%",
  nextBestAction: "Pay down revolving balance by $600 to test a lower-utilization scenario."
};

export const debtProgress = {
  remaining: 18200,
  paidDown: 6400,
  targetDate: "February 2027",
  action: "Maintain current payment pace and prioritize the highest-interest balance first."
};
