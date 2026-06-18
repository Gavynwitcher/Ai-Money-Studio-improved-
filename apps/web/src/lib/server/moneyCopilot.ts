import { prisma } from "@/lib/prisma";

const RECURRING_EXPENSE = "EXPENSE";
const HORIZON_WEEK = "WEEK";
const HORIZON_MONTH = "MONTH";
const STATUS_PROPOSED = "PROPOSED";
const STATUS_ACCEPTED = "ACCEPTED";
const STATUS_AWAITING_APPROVAL = "AWAITING_APPROVAL";
const STATUS_SCHEDULED = "SCHEDULED";
const STATUS_COMPLETED = "COMPLETED";

function uniqBy<T>(rows: T[], keyFn: (row: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const row of rows) {
    const key = keyFn(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function confidenceLabel(value: number): "High" | "Medium" | "Low" {
  if (value >= 0.9) return "High";
  if (value >= 0.75) return "Medium";
  return "Low";
}

function isLikelyTransferOrPayment(params: {
  merchantRaw: string;
  category: string;
  accountType?: string | null;
  amount: number;
}) {
  const merchant = params.merchantRaw.toLowerCase();
  const category = params.category.toUpperCase();
  const accountType = (params.accountType || "").toUpperCase();

  if (category.includes("TRANSFER")) return true;
  if (category.includes("LOAN_PAYMENT")) return true;
  if (category.includes("CREDIT_CARD_PAYMENT")) return true;

  if (/(^|\b)(zelle|venmo|cash app|paypal|ach|xfer|transfer)(\b|$)/i.test(merchant)) {
    return true;
  }

  if (/(^|\b)(payment to|payment from|online payment|internal transfer)(\b|$)/i.test(merchant)) {
    return true;
  }

  if (accountType.includes("CREDIT") && /\b(payment|transfer)\b/i.test(merchant)) {
    return true;
  }

  if ((accountType.includes("CHECKING") || accountType.includes("SAVINGS")) && params.amount < 0) {
    if (/\b(card payment|credit card payment|loan payment)\b/i.test(merchant)) {
      return true;
    }
  }

  return false;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Math.abs(value));
}

function accountTypeLabel(type?: string | null) {
  const normalized = (type || "").toUpperCase();
  if (normalized.includes("CHECKING")) return "Checking";
  if (normalized.includes("SAVINGS")) return "Savings";
  if (normalized.includes("CREDIT")) return "Credit Card";
  if (normalized.includes("LOAN")) return "Loan";
  if (normalized.includes("INVEST")) return "Investment";
  return "Other";
}

function transactionExplanation(params: {
  amount: number;
  category: string;
  recurring: boolean;
  confidence: number;
  accountName: string;
  accountType?: string | null;
}) {
  const direction = params.amount < 0 ? "Spent" : "Received";
  const category = params.category || "Uncategorized";
  const accountLabel = `${params.accountName} (${accountTypeLabel(params.accountType)})`;

  const notes = [`${direction} ${formatUsd(params.amount)} in ${category} on ${accountLabel}.`];
  if (params.recurring) {
    notes.push("Marked recurring based on Plaid category patterns.");
  } else if (params.amount < 0) {
    notes.push("Classified as a one-time payment (not recurring).");
  } else {
    notes.push("Classified as a one-time deposit (not recurring).");
  }
  if (params.confidence < 0.85) {
    notes.push("Low confidence classification; review is recommended.");
  } else if (params.confidence < 0.95) {
    notes.push("Medium confidence classification.");
  } else {
    notes.push("High confidence classification.");
  }
  return notes.join(" ");
}

const LEGACY_SEED_GOAL_TITLES = ["Emergency Fund", "Summer Travel"] as const;
const LEGACY_SEED_DEBT_ISSUERS = ["Freedom Visa", "Auto Loan"] as const;
const LEGACY_SEED_RECOMMENDATIONS = [
  "Cancel dormant music trial",
  "Shift card payment date",
  "Reduce utility bill via provider script"
] as const;
const LEGACY_SEED_ACTION_TYPES = [
  "Subscription Cancellation",
  "Smart Transfer Recommendation",
  "Bill Negotiation Initiation"
] as const;
const LEGACY_SEED_RECURRING_SERVICES = ["Rent", "Credit Card - Freedom", "Phone Plan", "Internet"] as const;
const LEGACY_SEED_ACCOUNT_NAMES = ["Main Checking", "Emergency Savings"] as const;

export async function purgeSandboxDataForUser(userId: string) {
  await prisma.$transaction([
    prisma.moneyCopilotGoal.deleteMany({
      where: { userId, title: { in: [...LEGACY_SEED_GOAL_TITLES] } }
    }),
    prisma.moneyCopilotDebt.deleteMany({
      where: { userId, issuer: { in: [...LEGACY_SEED_DEBT_ISSUERS] } }
    }),
    prisma.moneyCopilotRecommendation.deleteMany({
      where: { userId, title: { in: [...LEGACY_SEED_RECOMMENDATIONS] } }
    }),
    prisma.moneyCopilotAction.deleteMany({
      where: { userId, actionType: { in: [...LEGACY_SEED_ACTION_TYPES] } }
    }),
    prisma.moneyCopilotRecurringSeries.deleteMany({
      where: { userId, serviceName: { in: [...LEGACY_SEED_RECURRING_SERVICES] } }
    }),
    prisma.moneyCopilotSafeToSpendSnapshot.deleteMany({
      where: {
        userId,
        OR: [
          { horizon: HORIZON_WEEK, amount: 468 },
          { horizon: HORIZON_MONTH, amount: 1280 }
        ]
      }
    }),
    prisma.moneyCopilotAccount.deleteMany({
      where: {
        userId,
        providerAccountId: null,
        name: { in: [...LEGACY_SEED_ACCOUNT_NAMES] }
      }
    })
  ]);

  const plaidItemCount = await prisma.plaidItem.count({ where: { userId } });
  if (plaidItemCount > 0) return;

  await prisma.$transaction([
    prisma.moneyCopilotAction.deleteMany({ where: { userId } }),
    prisma.moneyCopilotRecommendation.deleteMany({ where: { userId } }),
    prisma.moneyCopilotSafeToSpendSnapshot.deleteMany({ where: { userId } }),
    prisma.moneyCopilotGoal.deleteMany({ where: { userId } }),
    prisma.moneyCopilotDebt.deleteMany({ where: { userId } }),
    prisma.moneyCopilotRecurringSeries.deleteMany({ where: { userId } }),
    prisma.moneyCopilotAccount.deleteMany({
      where: { userId, providerAccountId: null }
    }),
    prisma.moneyCopilotTransaction.deleteMany({
      where: { userId, providerTransactionId: null }
    })
  ]);
}

export async function getDashboardPayload(userId: string) {
  await purgeSandboxDataForUser(userId);

  const twoWeeksOut = daysFromNow(14);
  const [transactions, accounts, debts, recommendations, upcomingBills] = await Promise.all([
    prisma.moneyCopilotTransaction.findMany({
      where: {
        userId,
        providerTransactionId: { not: null }
      },
      include: {
        account: {
          select: {
            type: true
          }
        }
      },
      orderBy: { postedAt: "asc" },
      take: 800
    }),
    prisma.moneyCopilotAccount.findMany({
      where: { userId },
      select: { currentBalance: true, availableBalance: true }
    }),
    prisma.moneyCopilotDebt.findMany({ where: { userId } }),
    prisma.moneyCopilotRecommendation.findMany({
      where: {
        userId,
        status: { in: [STATUS_PROPOSED, STATUS_ACCEPTED] }
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 20
    }),
    prisma.moneyCopilotRecurringSeries.findMany({
      where: {
        userId,
        type: RECURRING_EXPENSE,
        nextExpectedDate: { lte: twoWeeksOut }
      },
      orderBy: { nextExpectedDate: "asc" },
      take: 20
    })
  ]);

  const uniqueRecommendations = uniqBy<(typeof recommendations)[number]>(
    recommendations,
    (row) => row.title
  ).slice(0, 6);
  const uniqueUpcomingBills = uniqBy<(typeof upcomingBills)[number]>(
    upcomingBills,
    (row) => `${row.serviceName}-${row.nextExpectedDate.toISOString().slice(0, 10)}-${row.expectedAmount}`
  ).slice(0, 8);
  const cashflowTransactions = transactions.filter(
    (txn) =>
      !isLikelyTransferOrPayment({
        merchantRaw: txn.merchantRaw,
        category: txn.category,
        accountType: txn.account?.type,
        amount: txn.amount
      })
  );
  const observedDays =
    cashflowTransactions.length > 1
      ? Math.max(1, daysBetween(cashflowTransactions[0].postedAt, cashflowTransactions[cashflowTransactions.length - 1].postedAt))
      : 30;
  const monthsObserved = Math.max(1, observedDays / 30.4375);
  const incomeTotal = cashflowTransactions
    .filter((txn) => txn.amount >= 0)
    .reduce((sum, txn) => sum + txn.amount, 0);
  const expenseTotal = cashflowTransactions
    .filter((txn) => txn.amount < 0)
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  const monthlyIncome = incomeTotal / monthsObserved;
  const monthlyExpenses = expenseTotal / monthsObserved;
  const weeklyIncome = monthlyIncome / 4.345;
  const weeklyExpenses = monthlyExpenses / 4.345;
  const liquidBalance = accounts.reduce(
    (sum, account) => sum + Math.max(0, account.availableBalance ?? account.currentBalance),
    0
  );
  const upcomingBillsNext14 = uniqueUpcomingBills.reduce((sum, bill) => sum + bill.expectedAmount, 0);
  const safeToSpendWeek = Math.max(0, liquidBalance + weeklyIncome - weeklyExpenses - upcomingBillsNext14);
  const monthEndCushion = liquidBalance + (monthlyIncome - monthlyExpenses);
  const confidence =
    cashflowTransactions.length >= 120 ? "High" : cashflowTransactions.length >= 40 ? "Medium" : "Low";
  const totalCreditBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalCreditLimit = debts.reduce((sum, debt) => sum + (debt.creditLimit ?? 0), 0);
  const utilizationPct = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;
  const avoidableCosts = uniqueRecommendations.reduce((sum, rec) => sum + Math.max(0, rec.estimatedImpact), 0);

  return {
    kpis: [
      {
        label: "Safe To Spend (This Week)",
        value: Number(safeToSpendWeek.toFixed(2)),
        change: transactions.length > 0 ? `Confidence ${confidence}` : "Awaiting imported transactions",
        tone: "positive" as const
      },
      {
        label: "Forecasted Month-End Cushion",
        value: Number(monthEndCushion.toFixed(2)),
        change: transactions.length > 0 ? `Confidence ${confidence}` : "Awaiting imported transactions",
        tone: monthEndCushion >= 0 ? ("neutral" as const) : ("warning" as const)
      },
      {
        label: "Avoidable Cost Opportunities",
        value: avoidableCosts,
        change: `${uniqueRecommendations.length} active opportunities`,
        tone: "warning" as const
      },
      {
        label: "Debt Utilization",
        value: Number(utilizationPct.toFixed(1)),
        change: totalCreditLimit > 0 ? "Computed from connected limits" : "No credit limits linked",
        tone: utilizationPct <= 30 ? ("positive" as const) : ("warning" as const)
      }
    ],
    upcomingBills: uniqueUpcomingBills.map((bill) => ({
      name: bill.serviceName,
      dueInDays: Math.max(0, Math.ceil((bill.nextExpectedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
      amount: bill.expectedAmount,
      autopay: bill.autopay
    })),
    recommendations: uniqueRecommendations.map((rec) => ({
      title: rec.title,
      impactMonthly: rec.estimatedImpact,
      confidence: confidenceLabel(rec.confidence),
      reason: rec.rationale
    }))
  };
}

export async function getTransactionsPayload(userId: string, limit = 200) {
  await prisma.moneyCopilotTransaction.deleteMany({
    where: { userId, providerTransactionId: null }
  });
  const safeLimit = Math.min(Math.max(limit, 1), 500);

  const txns = await prisma.moneyCopilotTransaction.findMany({
    where: {
      userId,
      providerTransactionId: { not: null }
    },
    include: {
      account: {
        select: {
          name: true,
          type: true
        }
      }
    },
    orderBy: { postedAt: "desc" },
    take: safeLimit * 2
  });
  const dedupedTxns = uniqBy<(typeof txns)[number]>(
    txns,
    (txn) =>
      `${txn.postedAt.toISOString().slice(0, 10)}-${txn.merchantRaw}-${txn.amount}-${txn.accountId ?? "unlinked"}`
  ).slice(0, safeLimit);

  return {
    transactions: dedupedTxns.map((txn) => ({
      id: txn.id,
      postedAt: txn.postedAt.toISOString().slice(0, 10),
      merchant: txn.merchantNormalized,
      source: "plaid" as const,
      category: txn.category,
      amount: txn.amount,
      confidence: txn.confidence,
      recurring: txn.recurring,
      accountName: txn.account?.name || "Unknown account",
      accountType: txn.account?.type || "OTHER",
      explanation: transactionExplanation({
        amount: txn.amount,
        category: txn.category,
        recurring: txn.recurring,
        confidence: txn.confidence,
        accountName: txn.account?.name || "Unknown account",
        accountType: txn.account?.type
      })
    }))
  };
}

function toActionStatusLabel(status: string): string {
  if (status === STATUS_AWAITING_APPROVAL) return "Awaiting Approval";
  if (status === STATUS_PROPOSED) return "Proposed";
  if (status === STATUS_SCHEDULED) return "Scheduled";
  if (status === STATUS_COMPLETED) return "Completed";
  return "Failed";
}

function impactFromOutcome(text: string): number {
  const amountMatch = text.match(/\$([0-9,]+(?:\.[0-9]{1,2})?)/);
  if (!amountMatch) return 0;
  const parsed = Number.parseFloat(amountMatch[1].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function riskLevelForAction(params: { requiresStepUp: boolean; downside: string }) {
  if (params.requiresStepUp) return "High";
  if (/reduced|loss|penalty|overdraft|fee/i.test(params.downside)) return "Medium";
  return "Low";
}

function stepsForAction(status: string) {
  if (status === STATUS_COMPLETED) {
    return ["Completed", "Receipt generated", "Rollback window active"];
  }
  if (status === STATUS_AWAITING_APPROVAL) {
    return ["Review impact and downside", "Approve action", "Execute and verify receipt"];
  }
  if (status === STATUS_SCHEDULED) {
    return ["Scheduled for execution", "Policy check before run", "Receipt on completion"];
  }
  if (status === STATUS_PROPOSED) {
    return ["Review recommendation", "Approve or reject", "Move to scheduled queue"];
  }
  return ["Investigate failure reason", "Retry or discard"];
}

export async function getActionsPayload(userId: string) {
  await purgeSandboxDataForUser(userId);

  const rows = await prisma.moneyCopilotAction.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    take: 100
  });
  const dedupedRows = uniqBy<(typeof rows)[number]>(
    rows,
    (row) => `${row.actionType}-${row.expectedOutcome}`
  );

  return {
    actions: dedupedRows.map((row) => ({
      id: row.id,
      type: row.actionType,
      status: toActionStatusLabel(row.status),
      expectedOutcome: row.expectedOutcome,
      downside: row.downside,
      requiresStepUp: row.requiresStepUp,
      impactMonthly: impactFromOutcome(row.expectedOutcome),
      risk: riskLevelForAction({ requiresStepUp: row.requiresStepUp, downside: row.downside }),
      steps: stepsForAction(row.status),
      requiredApprovals: row.requiresStepUp ? ["User approval", "Step-up authentication"] : ["User approval"],
      receipt: row.status === STATUS_COMPLETED ? "Execution receipt available in audit trail." : null,
      rollback: row.status === STATUS_COMPLETED ? "Rollback can be requested within 24 hours." : null
    }))
  };
}

type ScenarioModel = {
  name: string;
  summary: string;
  runwayMonths: number;
  monthlyDelta: number;
  criticalDate: string;
};

type ScenarioBasis = {
  transactionCount: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtMinimums: number;
  monthlyGoalContributions: number;
  discretionaryMonthlySpend: number;
  liquidBalance: number;
};

const ESSENTIAL_CATEGORY_PATTERN =
  /(rent|mortgage|utility|insurance|loan|debt|grocer|food|gas|transport|medical|health|tax|tuition|education|childcare|phone|internet)/i;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)) + 1);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function buildScenario(params: {
  name: string;
  baseMonthlyIncome: number;
  baseMonthlyExpenses: number;
  discretionaryMonthlySpend: number;
  monthlyGoalContributions: number;
  liquidBalance: number;
  discretionaryCutPct: number;
  goalsPausePct: number;
}) {
  const discretionaryReduction = params.discretionaryMonthlySpend * params.discretionaryCutPct;
  const goalReduction = params.monthlyGoalContributions * params.goalsPausePct;
  const adjustedExpenses = Math.max(0, params.baseMonthlyExpenses - discretionaryReduction - goalReduction);
  const monthlyDelta = params.baseMonthlyIncome - adjustedExpenses;

  const today = new Date();
  let runwayMonths = 60;
  let criticalDate = addDays(today, 365 * 5);

  if (monthlyDelta < 0) {
    const burnRate = Math.abs(monthlyDelta);
    const rawRunway = burnRate > 0 ? params.liquidBalance / burnRate : 0;
    runwayMonths = clampNumber(Number(rawRunway.toFixed(1)), 0, 60);
    criticalDate = addDays(today, Math.round(runwayMonths * 30.4375));
  }

  return {
    name: params.name,
    summary:
      monthlyDelta >= 0
        ? "Projected cashflow remains positive under this plan."
        : "Projected cashflow is negative; runway reflects estimated depletion timing.",
    runwayMonths,
    monthlyDelta: Number(monthlyDelta.toFixed(2)),
    criticalDate: toIsoDate(criticalDate)
  } satisfies ScenarioModel;
}

export async function getScenariosPayload(userId: string) {
  await purgeSandboxDataForUser(userId);

  const [transactions, accounts, debts, goals] = await Promise.all([
    prisma.moneyCopilotTransaction.findMany({
      where: {
        userId,
        providerTransactionId: { not: null }
      },
      orderBy: { postedAt: "asc" },
      take: 1000
    }),
    prisma.moneyCopilotAccount.findMany({
      where: { userId },
      select: {
        currentBalance: true,
        availableBalance: true
      }
    }),
    prisma.moneyCopilotDebt.findMany({
      where: { userId },
      select: { minimumPayment: true }
    }),
    prisma.moneyCopilotGoal.findMany({
      where: { userId },
      select: { monthlyContribution: true }
    })
  ]);

  const transactionCount = transactions.length;
  const coverageStart = transactionCount > 0 ? transactions[0].postedAt : null;
  const coverageEnd = transactionCount > 0 ? transactions[transactionCount - 1].postedAt : null;
  const observedDays =
    coverageStart && coverageEnd ? daysBetween(coverageStart, coverageEnd) : 30;
  const monthsObserved = Math.max(1, observedDays / 30.4375);

  let incomeTotal = 0;
  let expenseTotal = 0;
  let discretionaryExpenseTotal = 0;

  for (const txn of transactions) {
    if (txn.amount >= 0) {
      incomeTotal += txn.amount;
      continue;
    }

    const expense = Math.abs(txn.amount);
    expenseTotal += expense;
    if (!ESSENTIAL_CATEGORY_PATTERN.test(txn.category)) {
      discretionaryExpenseTotal += expense;
    }
  }

  const monthlyIncome = Number((incomeTotal / monthsObserved).toFixed(2));
  const monthlyExpenses = Number((expenseTotal / monthsObserved).toFixed(2));
  const discretionaryMonthlySpend = Number((discretionaryExpenseTotal / monthsObserved).toFixed(2));
  const monthlyDebtMinimums = Number(
    debts.reduce((sum, debt) => sum + debt.minimumPayment, 0).toFixed(2)
  );
  const monthlyGoalContributions = Number(
    goals.reduce((sum, goal) => sum + goal.monthlyContribution, 0).toFixed(2)
  );
  const liquidBalance = Number(
    accounts
      .reduce((sum, account) => sum + Math.max(0, account.availableBalance ?? account.currentBalance), 0)
      .toFixed(2)
  );

  const scenarios: ScenarioModel[] = [
    buildScenario({
      name: "Baseline",
      baseMonthlyIncome: monthlyIncome,
      baseMonthlyExpenses: monthlyExpenses,
      discretionaryMonthlySpend,
      monthlyGoalContributions,
      liquidBalance,
      discretionaryCutPct: 0,
      goalsPausePct: 0
    }),
    buildScenario({
      name: "Moderate Cut",
      baseMonthlyIncome: monthlyIncome,
      baseMonthlyExpenses: monthlyExpenses,
      discretionaryMonthlySpend,
      monthlyGoalContributions,
      liquidBalance,
      discretionaryCutPct: 0.2,
      goalsPausePct: 0.25
    }),
    buildScenario({
      name: "Aggressive Cut",
      baseMonthlyIncome: monthlyIncome,
      baseMonthlyExpenses: monthlyExpenses,
      discretionaryMonthlySpend,
      monthlyGoalContributions,
      liquidBalance,
      discretionaryCutPct: 0.45,
      goalsPausePct: 1
    })
  ];

  return {
    scenarios,
    basis: {
      transactionCount,
      coverageStart: coverageStart ? toIsoDate(coverageStart) : null,
      coverageEnd: coverageEnd ? toIsoDate(coverageEnd) : null,
      monthlyIncome,
      monthlyExpenses,
      monthlyDebtMinimums,
      monthlyGoalContributions,
      discretionaryMonthlySpend,
      liquidBalance
    } satisfies ScenarioBasis
  };
}
