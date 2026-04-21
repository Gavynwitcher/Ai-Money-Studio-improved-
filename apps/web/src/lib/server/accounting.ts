import { prisma } from "@/lib/prisma";
import type {
  AccountingAccountPayload,
  AccountingBillPayload,
  AccountingInvoicePayload,
  AccountingJournalEntryPayload,
  AccountingOverview,
  AccountingReconciliationPayload
} from "@/lib/accounting/types";
import { resolveActiveUserId } from "@/lib/server/user";

const ACCOUNTING_MODE = process.env.ACCOUNTING_PROVIDER_MODE?.trim() || "internal_demo";

function providerConfigured() {
  if (ACCOUNTING_MODE === "internal_demo") return true;
  return Boolean(process.env.QUICKBOOKS_CLIENT_ID || process.env.ACCOUNTING_PROVIDER_API_KEY);
}

async function seedAccountingWorkspace(userId: string) {
  const existing = await prisma.accountingAccount.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (existing) return;

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  await prisma.accountingAccount.createMany({
    data: [
      {
        userId,
        code: "1000",
        name: "Operating Checking",
        category: "asset",
        subtype: "bank",
        balance: 82450,
        direction: "debit",
        institutionRef: "Mercury"
      },
      {
        userId,
        code: "1010",
        name: "Reserve Savings",
        category: "asset",
        subtype: "bank",
        balance: 38820,
        direction: "debit",
        institutionRef: "Chase"
      },
      {
        userId,
        code: "1100",
        name: "Accounts Receivable",
        category: "asset",
        subtype: "receivable",
        balance: 18640,
        direction: "debit"
      },
      {
        userId,
        code: "2000",
        name: "Accounts Payable",
        category: "liability",
        subtype: "payable",
        balance: 9640,
        direction: "credit"
      },
      {
        userId,
        code: "4000",
        name: "Service Revenue",
        category: "income",
        subtype: "operating_income",
        balance: 142300,
        direction: "credit"
      },
      {
        userId,
        code: "6100",
        name: "Payroll Expense",
        category: "expense",
        subtype: "payroll",
        balance: 47800,
        direction: "debit"
      },
      {
        userId,
        code: "6300",
        name: "Software Expense",
        category: "expense",
        subtype: "software",
        balance: 8920,
        direction: "debit"
      }
    ]
  });

  await prisma.accountingJournalEntry.createMany({
    data: [
      {
        userId,
        entryDate: new Date(now.getTime() - 2 * day),
        reference: "DEP-4821",
        memo: "Client retainer received and applied to open invoice.",
        debitAccountCode: "1000",
        creditAccountCode: "1100",
        amount: 6400,
        source: "bank_sync"
      },
      {
        userId,
        entryDate: new Date(now.getTime() - 3 * day),
        reference: "PAY-1882",
        memo: "Semi-monthly payroll batch posted.",
        debitAccountCode: "6100",
        creditAccountCode: "1000",
        amount: 5400,
        source: "manual"
      },
      {
        userId,
        entryDate: new Date(now.getTime() - 5 * day),
        reference: "SUB-3011",
        memo: "Software subscriptions accrued for April.",
        debitAccountCode: "6300",
        creditAccountCode: "2000",
        amount: 1282,
        source: "rules_engine"
      }
    ]
  });

  await prisma.accountingInvoice.createMany({
    data: [
      {
        userId,
        invoiceNumber: "INV-1048",
        customerName: "Harbor Lane Studio",
        issueDate: new Date(now.getTime() - 18 * day),
        dueDate: new Date(now.getTime() - 3 * day),
        amount: 6400,
        amountPaid: 6400,
        status: "paid"
      },
      {
        userId,
        invoiceNumber: "INV-1051",
        customerName: "Northfield Services",
        issueDate: new Date(now.getTime() - 9 * day),
        dueDate: new Date(now.getTime() + 6 * day),
        amount: 8240,
        amountPaid: 2400,
        status: "partial"
      },
      {
        userId,
        invoiceNumber: "INV-1053",
        customerName: "Bright Harbor Health",
        issueDate: new Date(now.getTime() - 4 * day),
        dueDate: new Date(now.getTime() + 11 * day),
        amount: 10800,
        amountPaid: 0,
        status: "open"
      }
    ]
  });

  await prisma.accountingBill.createMany({
    data: [
      {
        userId,
        vendorName: "Gusto",
        billNumber: "BILL-2091",
        issueDate: new Date(now.getTime() - 8 * day),
        dueDate: new Date(now.getTime() + 4 * day),
        amount: 5400,
        amountPaid: 0,
        status: "open",
        expenseCode: "6100"
      },
      {
        userId,
        vendorName: "Microsoft 365",
        billNumber: "BILL-2095",
        issueDate: new Date(now.getTime() - 13 * day),
        dueDate: new Date(now.getTime() - 1 * day),
        amount: 682,
        amountPaid: 0,
        status: "overdue",
        expenseCode: "6300"
      },
      {
        userId,
        vendorName: "Ramp Card Payment",
        billNumber: "BILL-2101",
        issueDate: new Date(now.getTime() - 2 * day),
        dueDate: new Date(now.getTime() + 10 * day),
        amount: 3558,
        amountPaid: 900,
        status: "partial",
        expenseCode: "6300"
      }
    ]
  });

  await prisma.accountingReconciliationItem.createMany({
    data: [
      {
        userId,
        source: "Plaid Chase Reserve",
        statementDate: new Date(now.getTime() - day),
        description: "ACH CREDIT 241981 settlement not matched to invoice",
        amount: 2400,
        status: "needs_review",
        suggestedAccountCode: "1100"
      },
      {
        userId,
        source: "Plaid Mercury Operating",
        statementDate: new Date(now.getTime() - 2 * day),
        description: "Card spend batch awaiting software split",
        amount: -1282,
        status: "needs_split",
        suggestedAccountCode: "6300"
      },
      {
        userId,
        source: "Plaid Mercury Operating",
        statementDate: new Date(now.getTime() - 4 * day),
        description: "Vendor debit missing supporting bill image",
        amount: -682,
        status: "needs_document",
        suggestedAccountCode: "6300"
      }
    ]
  });
}

function serializeAccount(account: {
  id: string;
  code: string;
  name: string;
  category: string;
  subtype: string;
  balance: number;
  direction: string;
  status: string;
  institutionRef: string | null;
}): AccountingAccountPayload {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    category: account.category,
    subtype: account.subtype,
    balance: account.balance,
    direction: account.direction,
    status: account.status,
    institutionRef: account.institutionRef
  };
}

function serializeJournal(entry: {
  id: string;
  entryDate: Date;
  reference: string;
  memo: string;
  debitAccountCode: string;
  creditAccountCode: string;
  amount: number;
  source: string;
  status: string;
}): AccountingJournalEntryPayload {
  return {
    id: entry.id,
    entryDate: entry.entryDate.toISOString(),
    reference: entry.reference,
    memo: entry.memo,
    debitAccountCode: entry.debitAccountCode,
    creditAccountCode: entry.creditAccountCode,
    amount: entry.amount,
    source: entry.source,
    status: entry.status
  };
}

function serializeInvoice(invoice: {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  amountPaid: number;
  status: string;
}): AccountingInvoicePayload {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    amount: invoice.amount,
    amountPaid: invoice.amountPaid,
    status: invoice.status
  };
}

function serializeBill(bill: {
  id: string;
  vendorName: string;
  billNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  amountPaid: number;
  status: string;
  expenseCode: string;
}): AccountingBillPayload {
  return {
    id: bill.id,
    vendorName: bill.vendorName,
    billNumber: bill.billNumber,
    issueDate: bill.issueDate.toISOString(),
    dueDate: bill.dueDate.toISOString(),
    amount: bill.amount,
    amountPaid: bill.amountPaid,
    status: bill.status,
    expenseCode: bill.expenseCode
  };
}

function serializeReconciliation(item: {
  id: string;
  source: string;
  statementDate: Date;
  description: string;
  amount: number;
  status: string;
  suggestedAccountCode: string | null;
}): AccountingReconciliationPayload {
  return {
    id: item.id,
    source: item.source,
    statementDate: item.statementDate.toISOString(),
    description: item.description,
    amount: item.amount,
    status: item.status,
    suggestedAccountCode: item.suggestedAccountCode
  };
}

export async function getAccountingOverview(): Promise<AccountingOverview> {
  const userId = await resolveActiveUserId();
  await seedAccountingWorkspace(userId);

  const [accounts, journalEntries, invoices, bills, reconciliation] = await Promise.all([
    prisma.accountingAccount.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { code: "asc" }]
    }),
    prisma.accountingJournalEntry.findMany({
      where: { userId },
      orderBy: { entryDate: "desc" },
      take: 12
    }),
    prisma.accountingInvoice.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
      take: 12
    }),
    prisma.accountingBill.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
      take: 12
    }),
    prisma.accountingReconciliationItem.findMany({
      where: { userId },
      orderBy: { statementDate: "desc" },
      take: 12
    })
  ]);

  const cash = accounts
    .filter((account) => account.subtype === "bank")
    .reduce((sum, account) => sum + account.balance, 0);
  const receivables = invoices.reduce((sum, invoice) => sum + (invoice.amount - invoice.amountPaid), 0);
  const payables = bills.reduce((sum, bill) => sum + (bill.amount - bill.amountPaid), 0);
  const monthlyRevenue = accounts
    .filter((account) => account.category === "income")
    .reduce((sum, account) => sum + account.balance, 0);
  const monthlyExpenses = accounts
    .filter((account) => account.category === "expense")
    .reduce((sum, account) => sum + account.balance, 0);
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue").length;
  const overdueBills = bills.filter((bill) => bill.status === "overdue").length;
  const itemsToReconcile = reconciliation.filter((item) => item.status !== "cleared").length;

  return {
    mode: ACCOUNTING_MODE,
    configured: providerConfigured(),
    summary: {
      cash,
      receivables,
      payables,
      monthlyRevenue,
      monthlyExpenses,
      netOperatingIncome: monthlyRevenue - monthlyExpenses,
      overdueInvoices,
      overdueBills,
      itemsToReconcile
    },
    accounts: accounts.map(serializeAccount),
    journalEntries: journalEntries.map(serializeJournal),
    invoices: invoices.map(serializeInvoice),
    bills: bills.map(serializeBill),
    reconciliation: reconciliation.map(serializeReconciliation)
  };
}
