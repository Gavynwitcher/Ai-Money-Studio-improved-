"use client";

import { useState } from "react";
import type { AccountingOverview } from "@/lib/accounting/types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  initialOverview: AccountingOverview;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function humanize(value: string) {
  return value.split("_").join(" ");
}

function statusTone(status: string) {
  if (["paid", "cleared", "active"].includes(status)) return "success";
  if (["overdue", "needs_review", "needs_document", "needs_split"].includes(status)) return "warning";
  return "muted";
}

export function AccountingWorkspace({ initialOverview }: Props) {
  const [overview, setOverview] = useState(initialOverview);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshOverview() {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/accounting", { cache: "no-store" });
      const data = (await response.json()) as AccountingOverview | { error?: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Failed to refresh accounting workspace.");
      }
      setOverview(data as AccountingOverview);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh accounting workspace.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="grid gap-5">
      <Card className="rounded-[34px] p-7 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="gold">Accounting workspace</Badge>
              <Badge tone={overview.configured ? "success" : "warning"}>
                {overview.mode === "internal_demo" ? "Internal books mode" : "Provider mode"}
              </Badge>
            </div>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Run the operating ledger with a QuickBooks-style flow built around cash, AR, AP, and cleanup work.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              This module is structured for day-to-day bookkeeping: chart of accounts visibility,
              journal activity, invoice and bill tracking, and a reconciliation queue tied back to
              connected bank data. It works as an internal accounting desk now and can later connect
              to providers like QuickBooks for sync.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href="/transactions" variant="secondary">
              View bank ledger
            </Button>
            <Button onClick={refreshOverview} variant="secondary" disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh books"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[22px] border border-[rgba(191,65,65,0.2)] bg-[rgba(191,65,65,0.06)] px-4 py-3 text-sm text-[rgb(157,47,47)]">
            {error}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="bank-shell rounded-[32px] p-6 text-white lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">
            Bookkeeping snapshot
          </p>
          <p className="mt-4 font-heading text-5xl font-semibold tracking-[-0.06em]">
            {formatCurrency(overview.summary.cash)}
          </p>
          <p className="mt-2 text-sm text-cyan-100/80">Cash across operating and reserve accounts</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Net operating income</p>
              <p className="mt-2 text-xl font-semibold">{formatCurrency(overview.summary.netOperatingIncome)}</p>
            </div>
            <div className="bank-stat-dark rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Items to reconcile</p>
              <p className="mt-2 text-xl font-semibold">{overview.summary.itemsToReconcile}</p>
            </div>
          </div>
        </div>

        <Card className="lg:col-span-7">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Receivables</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{formatCurrency(overview.summary.receivables)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Payables</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{formatCurrency(overview.summary.payables)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Monthly revenue</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{formatCurrency(overview.summary.monthlyRevenue)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Monthly expenses</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{formatCurrency(overview.summary.monthlyExpenses)}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Overdue invoices</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{overview.summary.overdueInvoices}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Overdue bills</p>
              <p className="mt-2 font-semibold text-[var(--navy)]">{overview.summary.overdueBills}</p>
            </div>
            <div className="ledger-row rounded-[22px] p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Accounting mode</p>
              <p className="mt-2 font-semibold capitalize text-[var(--navy)]">{humanize(overview.mode)}</p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Chart of accounts</h3>
            <Badge tone="muted">{overview.accounts.length} accounts</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.accounts.map((account) => (
              <div key={account.id} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">
                      {account.code} · {account.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {humanize(account.category)} · {humanize(account.subtype)}
                      {account.institutionRef ? ` · ${account.institutionRef}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--navy)]">{formatCurrency(account.balance)}</p>
                    <Badge tone={statusTone(account.status) as "muted" | "success" | "warning"}>
                      {account.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Accounts receivable</h3>
            <Badge tone="muted">{overview.invoices.length} invoices</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.invoices.map((invoice) => (
              <div key={invoice.id} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{invoice.customerName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      Due {formatDateTime(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--navy)]">{formatCurrency(invoice.amount - invoice.amountPaid)}</p>
                    <Badge tone={statusTone(invoice.status) as "muted" | "success" | "warning"}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Accounts payable</h3>
            <Badge tone="muted">{overview.bills.length} bills</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.bills.map((bill) => (
              <div key={bill.id} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{bill.billNumber}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{bill.vendorName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      Due {formatDateTime(bill.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--navy)]">{formatCurrency(bill.amount - bill.amountPaid)}</p>
                    <Badge tone={statusTone(bill.status) as "muted" | "success" | "warning"}>
                      {bill.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Journal activity</h3>
            <Badge tone="muted">{overview.journalEntries.length} posted entries</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.journalEntries.map((entry) => (
              <div key={entry.id} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{entry.reference}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{entry.memo}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {entry.debitAccountCode} debit · {entry.creditAccountCode} credit · {humanize(entry.source)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--navy)]">{formatCurrency(entry.amount)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {formatDateTime(entry.entryDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Reconciliation queue</h3>
            <Badge tone="warning">{overview.reconciliation.length} outstanding</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.reconciliation.map((item) => (
              <div key={item.id} className="ledger-row rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--navy)]">{item.description}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.source}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {formatDateTime(item.statementDate)}
                      {item.suggestedAccountCode ? ` · Suggest ${item.suggestedAccountCode}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--navy)]">{formatCurrency(item.amount)}</p>
                    <Badge tone={statusTone(item.status) as "muted" | "success" | "warning"}>
                      {humanize(item.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
