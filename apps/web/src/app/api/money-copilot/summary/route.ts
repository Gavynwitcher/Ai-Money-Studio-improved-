import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { errorJson } from "@/lib/server/http";

function toDateString(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export async function GET() {
  try {
    const userId = await resolveActiveUserId();

    const [transactions, coverage, upcomingBills] = await Promise.all([
      prisma.moneyCopilotTransaction.findMany({
        where: {
          userId,
          providerTransactionId: { not: null }
        },
        orderBy: { postedAt: "desc" },
        take: 500
      }),
      prisma.moneyCopilotTransaction.aggregate({
        where: {
          userId,
          providerTransactionId: { not: null }
        },
        _min: { postedAt: true },
        _max: { postedAt: true }
      }),
      prisma.moneyCopilotRecurringSeries.findMany({
        where: {
          userId,
          type: "EXPENSE"
        },
        orderBy: { nextExpectedDate: "asc" },
        take: 8
      })
    ]);

    const spendByCategoryMap = new Map<string, number>();
    let income = 0;
    let expenses = 0;

    for (const txn of transactions) {
      if (txn.amount >= 0) {
        income += txn.amount;
      } else {
        expenses += Math.abs(txn.amount);
        const key = txn.category || "Uncategorized";
        spendByCategoryMap.set(key, (spendByCategoryMap.get(key) || 0) + Math.abs(txn.amount));
      }
    }

    const spendByCategory = Array.from(spendByCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return NextResponse.json({
      transactionCount: transactions.length,
      dateRange: {
        start: toDateString(coverage._min.postedAt),
        end: toDateString(coverage._max.postedAt)
      },
      cashflow: {
        income: Number(income.toFixed(2)),
        expenses: Number(expenses.toFixed(2)),
        net: Number((income - expenses).toFixed(2))
      },
      spendByCategory,
      upcomingBills: upcomingBills.map((bill) => ({
        name: bill.serviceName,
        amount: bill.expectedAmount,
        nextExpectedDate: bill.nextExpectedDate.toISOString().slice(0, 10),
        autopay: bill.autopay
      }))
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        {
          transactionCount: 0,
          dateRange: { start: null, end: null },
          cashflow: { income: 0, expenses: 0, net: 0 },
          spendByCategory: [],
          upcomingBills: []
        },
        {
          headers: { "x-data-source": "fallback" }
        }
      );
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load summary", 500);
  }
}
