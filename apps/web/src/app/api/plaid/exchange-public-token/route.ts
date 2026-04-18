import { NextRequest, NextResponse } from "next/server";
import { exchangePublicToken } from "@/lib/plaid/service";
import { shouldUseMockPlaid } from "@/lib/plaid/config";
import { resolveActiveUserId } from "@/lib/server/user";
import { exchangePublicTokenAndSync } from "@/lib/server/plaid";
import { getPlaidErrorMessage } from "@/lib/server/plaidErrors";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";

type ExchangePayload = {
  publicToken?: string;
  institutionName?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExchangePayload;

    if (!body.publicToken) {
      return NextResponse.json({ error: "Missing publicToken" }, { status: 400 });
    }

    if (shouldUseMockPlaid()) {
      const result = await exchangePublicToken(body.publicToken, body.institutionName);
      return NextResponse.json(result);
    }

    const userId = await resolveActiveUserId();
    const result = await exchangePublicTokenAndSync(userId, body.publicToken, body.institutionName);

    return NextResponse.json({
      itemId: result.plaidItemId,
      importedAccounts: result.importedAccounts,
      importedTransactions: result.importedTransactions,
      transactionsReady: result.transactionsReady,
      pendingItems: result.transactionsReady ? 0 : 1,
      mockMode: false
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before syncing Plaid data." }, { status: 503 });
    }

    return NextResponse.json(
      { error: getPlaidErrorMessage(error, "Failed to exchange Plaid public token") },
      { status: 500 }
    );
  }
}
