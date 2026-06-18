import { NextResponse } from "next/server";
import { fetchTransactions } from "@/lib/plaid/service";
import { shouldUseMockPlaid } from "@/lib/plaid/config";
import { prisma } from "@/lib/prisma";
import { isAuthRequiredError, resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { authRequiredJson } from "@/lib/server/http";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();

    if (shouldUseMockPlaid()) {
      const transactions = await fetchTransactions();
      return NextResponse.json({
        transactions
      });
    }

    const transactions = await prisma.moneyCopilotTransaction.findMany({
      where: {
        userId,
        providerTransactionId: { not: null }
      },
      orderBy: { postedAt: "desc" },
      take: 100,
      include: {
        account: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      transactions: transactions.map((transaction) => ({
        id: transaction.providerTransactionId || transaction.id,
        merchant: transaction.merchantNormalized || transaction.merchantRaw,
        category: transaction.category,
        amount: Math.abs(transaction.amount),
        accountName: transaction.account?.name || "Linked account",
        date: transaction.postedAt.toISOString().slice(0, 10),
        direction: transaction.amount >= 0 ? "inflow" : "outflow",
        status: "posted" as const
      }))
    });
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return authRequiredJson("Please sign in before viewing transactions.");
    }

    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before reading Plaid transactions." }, { status: 503 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load Plaid transactions" }, { status: 500 });
  }
}
