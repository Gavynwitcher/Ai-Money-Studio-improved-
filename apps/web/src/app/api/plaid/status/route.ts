import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getPlaidConfigError, getPlaidConnectionStatus } from "@/lib/server/plaid";
import { resolveActiveUserId } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configError = getPlaidConfigError();
    if (configError) {
      return NextResponse.json({
        configured: false,
        configError,
        connected: false,
        connectedItems: 0,
        institutions: [],
        lastSyncedAt: null,
        linkedAccounts: 0,
        importedTransactions: 0,
        coverageStart: null,
        coverageEnd: null
      });
    }

    const userId = await resolveActiveUserId();
    const status = await getPlaidConnectionStatus(userId);

    return NextResponse.json({
      configured: true,
      configError: null,
      ...status
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load Plaid status", 500);
  }
}
