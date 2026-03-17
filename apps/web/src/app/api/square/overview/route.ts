import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getSquareConfigError, getSquareOverviewPayload } from "@/lib/server/square";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configError = getSquareConfigError();
    if (configError) {
      return NextResponse.json({
        status: {
          configured: false,
          connected: false,
          environment: process.env.SQUARE_ENV === "production" ? "production" : "sandbox",
          merchantId: null,
          merchantName: null,
          scopes: [],
          lastSyncedAt: null,
          locations: 0,
          bankAccounts: 0,
          payments: 0,
          configError
        },
        summary: {
          grossVolume: 0,
          refunds: 0,
          fees: 0,
          netCaptured: 0,
          payoutsSettled: 0,
          pendingSettlement: 0,
          transferPending: 0
        },
        locations: [],
        linkedBankAccounts: [],
        recentActivity: [],
        transferRequests: []
      });
    }

    const userId = await resolveActiveUserId();
    return NextResponse.json(await getSquareOverviewPayload(userId));
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        {
          status: {
            configured: getSquareConfigError() === null,
            connected: false,
            environment: process.env.SQUARE_ENV === "production" ? "production" : "sandbox",
            merchantId: null,
            merchantName: null,
            scopes: [],
            lastSyncedAt: null,
            locations: 0,
            bankAccounts: 0,
            payments: 0
          },
          summary: {
            grossVolume: 0,
            refunds: 0,
            fees: 0,
            netCaptured: 0,
            payoutsSettled: 0,
            pendingSettlement: 0,
            transferPending: 0
          },
          locations: [],
          linkedBankAccounts: [],
          recentActivity: [],
          transferRequests: []
        },
        { headers: { "x-data-source": "fallback" } }
      );
    }

    return errorJson(error instanceof Error ? error.message : "Failed to load Square overview", 500);
  }
}
