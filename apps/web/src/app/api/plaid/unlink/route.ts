import { NextResponse } from "next/server";
import { shouldUseMockPlaid } from "@/lib/plaid/config";
import { resolveActiveUserId } from "@/lib/server/user";
import { unlinkPlaidDataForUser } from "@/lib/server/plaid";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { authRequiredJson } from "@/lib/server/http";
import { isAuthRequiredError } from "@/lib/server/user";

export async function POST() {
  try {
    const userId = await resolveActiveUserId();

    if (shouldUseMockPlaid()) {
      return NextResponse.json({
        removedItems: 1,
        removedAccounts: 3,
        removedTransactions: 5,
        mockMode: true,
        message: "Mock unlink complete. Replace with database cleanup for stored Plaid items and accounts."
      });
    }

    const result = await unlinkPlaidDataForUser(userId);
    return NextResponse.json({ ...result, mockMode: false });
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return authRequiredJson("Please sign in before unlinking bank data.");
    }

    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before unlinking Plaid data." }, { status: 503 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to unlink Plaid data" }, { status: 500 });
  }
}
