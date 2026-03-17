import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { getSquareConfigError, syncSquareDataForUser } from "@/lib/server/square";
import { resolveActiveUserId } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const configError = getSquareConfigError();
    if (configError) {
      return errorJson(`Square is not configured: ${configError}`, 503);
    }

    const userId = await resolveActiveUserId();
    const status = await syncSquareDataForUser(userId);
    return NextResponse.json({
      synced: true,
      status
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return errorJson("Database not reachable; Square sync was not saved", 503);
    }
    return errorJson(error instanceof Error ? error.message : "Failed to sync Square data", 500);
  }
}
