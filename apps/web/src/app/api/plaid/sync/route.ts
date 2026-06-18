import { NextResponse } from "next/server";
import { fetchBalances, fetchTransactions } from "@/lib/plaid/service";
import { shouldUseMockPlaid } from "@/lib/plaid/config";
import { resolveActiveUserId } from "@/lib/server/user";
import { ensurePlaidItemsMatchEnvironment, syncPlaidDataForUser } from "@/lib/server/plaid";
import { getPlaidErrorMessage } from "@/lib/server/plaidErrors";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { authRequiredJson } from "@/lib/server/http";
import { isAuthRequiredError } from "@/lib/server/user";

export async function POST() {
  try {
    const userId = await resolveActiveUserId();

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

    const reset = await ensurePlaidItemsMatchEnvironment(userId);
    if (reset?.resetRequired) {
      return NextResponse.json({
        syncedItems: 0,
        importedAccounts: 0,
        importedTransactions: 0,
        transactionsReady: false,
        pendingItems: 0,
        resetRequired: true,
        removedStaleItems: reset.removedItems,
        message: `We removed ${reset.removedItems} sandbox connection${reset.removedItems === 1 ? "" : "s"} stored under this profile. Reconnect with Plaid production to continue.`
      });
    }

    const result = await syncPlaidDataForUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return authRequiredJson("Please sign in before refreshing bank data.");
    }

    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before syncing Plaid data." }, { status: 503 });
    }

    return NextResponse.json({ error: getPlaidErrorMessage(error, "Failed to sync Plaid data") }, { status: 500 });
  }
}
