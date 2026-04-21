export type AccountingAccountPayload = {
  id: string;
  code: string;
  name: string;
  category: string;
  subtype: string;
  balance: number;
  direction: string;
  status: string;
  institutionRef: string | null;
};

export type AccountingJournalEntryPayload = {
  id: string;
  entryDate: string;
  reference: string;
  memo: string;
  debitAccountCode: string;
  creditAccountCode: string;
  amount: number;
  source: string;
  status: string;
};

export type AccountingInvoicePayload = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: string;
};

export type AccountingBillPayload = {
  id: string;
  vendorName: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: string;
  expenseCode: string;
};

export type AccountingReconciliationPayload = {
  id: string;
  source: string;
  statementDate: string;
  description: string;
  amount: number;
  status: string;
  suggestedAccountCode: string | null;
};

export type AccountingOverview = {
  mode: string;
  configured: boolean;
  summary: {
    cash: number;
    receivables: number;
    payables: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    netOperatingIncome: number;
    overdueInvoices: number;
    overdueBills: number;
    itemsToReconcile: number;
  };
  accounts: AccountingAccountPayload[];
  journalEntries: AccountingJournalEntryPayload[];
  invoices: AccountingInvoicePayload[];
  bills: AccountingBillPayload[];
  reconciliation: AccountingReconciliationPayload[];
};
