export type Kpi = {
  label: string;
  value: number;
  change: string;
  tone: "positive" | "neutral" | "warning";
};

export type UpcomingBill = {
  name: string;
  dueInDays: number;
  amount: number;
  autopay: boolean;
};

export type Recommendation = {
  title: string;
  impactMonthly: number;
  confidence: "High" | "Medium" | "Low";
  reason: string;
};

export type TransactionRow = {
  postedAt: string;
  merchant: string;
  category: string;
  amount: number;
  confidence: number;
  recurring: boolean;
};

export type GoalRow = {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
};

export type DebtRow = {
  issuer: string;
  balance: number;
  apr: number;
  minimumPayment: number;
  dueDate: string;
};

export type AgentAction = {
  type: string;
  status: "Proposed" | "Awaiting Approval" | "Scheduled" | "Completed";
  expectedOutcome: string;
  downside: string;
  requiresStepUp: boolean;
};

export type ScenarioRow = {
  name: string;
  summary: string;
  runwayMonths: number;
  monthlyDelta: number;
  criticalDate: string;
};

export type PermissionRow = {
  area: string;
  read: boolean;
  suggest: boolean;
  transact: boolean;
};

export const dashboardKpis: Kpi[] = [
  {
    label: "Safe To Spend (This Week)",
    value: 468,
    change: "+12% vs last week",
    tone: "positive"
  },
  {
    label: "Forecasted Month-End Cushion",
    value: 1280,
    change: "Stable",
    tone: "neutral"
  },
  {
    label: "Avoidable Cost Opportunities",
    value: 214,
    change: "3 active opportunities",
    tone: "warning"
  },
  {
    label: "Debt Utilization",
    value: 27,
    change: "Under 30% target",
    tone: "positive"
  }
];

export const upcomingBills: UpcomingBill[] = [
  { name: "Rent", dueInDays: 4, amount: 1850, autopay: true },
  { name: "Credit Card - Freedom", dueInDays: 6, amount: 215, autopay: false },
  { name: "Phone Plan", dueInDays: 9, amount: 82, autopay: true },
  { name: "Internet", dueInDays: 12, amount: 74, autopay: true }
];

export const recommendations: Recommendation[] = [
  {
    title: "Cancel dormant music trial",
    impactMonthly: 11,
    confidence: "High",
    reason: "No usage events detected in 60 days and renewal in 3 days."
  },
  {
    title: "Shift card payment date",
    impactMonthly: 0,
    confidence: "Medium",
    reason: "Due date is 2 days before payroll, causing short-term cash stress."
  },
  {
    title: "Reduce utility bill via provider script",
    impactMonthly: 28,
    confidence: "Medium",
    reason: "Current bill is 14% above area benchmark."
  }
];

export const transactions: TransactionRow[] = [
  {
    postedAt: "2026-02-26",
    merchant: "Trader Joe's",
    category: "Groceries",
    amount: -73.8,
    confidence: 0.98,
    recurring: false
  },
  {
    postedAt: "2026-02-25",
    merchant: "NETFLIX.COM",
    category: "Subscriptions",
    amount: -17.99,
    confidence: 0.96,
    recurring: true
  },
  {
    postedAt: "2026-02-24",
    merchant: "Payroll",
    category: "Income",
    amount: 2350,
    confidence: 0.99,
    recurring: true
  },
  {
    postedAt: "2026-02-23",
    merchant: "Chevron",
    category: "Transport",
    amount: -52.41,
    confidence: 0.9,
    recurring: false
  },
  {
    postedAt: "2026-02-22",
    merchant: "AMZN Mktp US",
    category: "Shopping",
    amount: -41.22,
    confidence: 0.83,
    recurring: false
  }
];

export const goals: GoalRow[] = [
  {
    title: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 3600,
    targetDate: "2027-01-15",
    monthlyContribution: 400
  },
  {
    title: "Summer Travel",
    targetAmount: 2500,
    currentAmount: 980,
    targetDate: "2026-07-01",
    monthlyContribution: 260
  }
];

export const debts: DebtRow[] = [
  {
    issuer: "Freedom Visa",
    balance: 2810,
    apr: 21.24,
    minimumPayment: 84,
    dueDate: "2026-03-07"
  },
  {
    issuer: "Auto Loan",
    balance: 12320,
    apr: 5.1,
    minimumPayment: 352,
    dueDate: "2026-03-12"
  }
];

export const actions: AgentAction[] = [
  {
    type: "Subscription Cancellation",
    status: "Awaiting Approval",
    expectedOutcome: "Stop next $11.99 renewal",
    downside: "Service access ends immediately",
    requiresStepUp: false
  },
  {
    type: "Smart Transfer Recommendation",
    status: "Proposed",
    expectedOutcome: "Move $150 to checking to avoid overdraft risk",
    downside: "Savings cushion reduced for 4 days",
    requiresStepUp: true
  },
  {
    type: "Bill Negotiation Initiation",
    status: "Scheduled",
    expectedOutcome: "Open provider chat with benchmark script",
    downside: "No guaranteed savings",
    requiresStepUp: false
  }
];

export const scenarios: ScenarioRow[] = [
  {
    name: "Baseline",
    summary: "Maintain current spending pattern.",
    runwayMonths: 9.8,
    monthlyDelta: 120,
    criticalDate: "2026-12-05"
  },
  {
    name: "Moderate Cut",
    summary: "Reduce discretionary categories by 18%.",
    runwayMonths: 12.1,
    monthlyDelta: 420,
    criticalDate: "2027-02-21"
  },
  {
    name: "Aggressive Cut",
    summary: "Pause non-essentials and defer travel goal.",
    runwayMonths: 14.4,
    monthlyDelta: 690,
    criticalDate: "2027-05-03"
  }
];

export const permissions: PermissionRow[] = [
  { area: "Accounts & transactions", read: true, suggest: true, transact: false },
  { area: "Transfers", read: true, suggest: true, transact: false },
  { area: "Bill actions", read: true, suggest: true, transact: false },
  { area: "Recurring automations", read: true, suggest: true, transact: false }
];
