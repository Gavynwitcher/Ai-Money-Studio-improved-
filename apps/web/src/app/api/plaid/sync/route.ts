import { NextResponse } from "next/server";
import { fetchBalances, fetchTransactions } from "@/lib/plaid/service";
import { shouldUseMockPlaid } from "@/lib/plaid/config";
import { resolveActiveUserId } from "@/lib/server/user";
import { syncPlaidDataForUser } from "@/lib/server/plaid";
import { getPlaidErrorMessage } from "@/lib/server/plaidErrors";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";

export async function POST() {
  try {
    if (shouldUseMockPlaid()) {
      const [balances, transactions] = await Promise.all([fetchBalances(), fetchTransactions()]);

      return NextResponse.json({
        syncedItems: balances.length > 0 || transactions.length > 0 ? 1 : 0,
        importedAccounts: balances.length,
        importedTransactions: transactions.length,
        transactionsReady: true,
        pendingItems: 0,
        syncedAt: new Date().toISOString(),
        mockMode: true
      });
    }

    const userId = await resolveActiveUserId();
    const result = await syncPlaidDataForUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before syncing Plaid data." }, { status: 503 });
    }

    return NextResponse.json({ error: getPlaidErrorMessage(error, "Failed to sync Plaid data") }, { status: 500 });
  }
}
