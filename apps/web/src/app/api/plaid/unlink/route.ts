import { NextResponse } from "next/server";
import { shouldUseMockPlaid } from "@/lib/plaid/config";
import { resolveActiveUserId } from "@/lib/server/user";
import { unlinkPlaidDataForUser } from "@/lib/server/plaid";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";

export async function POST() {
  try {
    if (shouldUseMockPlaid()) {
      return NextResponse.json({
        removedItems: 1,
        removedAccounts: 3,
        removedTransactions: 5,
        mockMode: true,
        message: "Mock unlink complete. Replace with database cleanup for stored Plaid items and accounts."
      });
    }

    const userId = await resolveActiveUserId();
    const result = await unlinkPlaidDataForUser(userId);
    return NextResponse.json({ ...result, mockMode: false });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before unlinking Plaid data." }, { status: 503 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to unlink Plaid data" }, { status: 500 });
  }
}
