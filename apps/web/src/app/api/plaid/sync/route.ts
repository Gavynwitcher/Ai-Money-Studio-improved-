import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import {
  getPlaidConfigError,
  getPlaidConnectionStatus,
  syncPlaidDataForUser
} from "@/lib/server/plaid";
import { getPlaidErrorMessage } from "@/lib/server/plaidErrors";
import { resolveActiveUserId } from "@/lib/server/user";

export async function POST() {
  try {
    const configError = getPlaidConfigError();
    if (configError) {
      return errorJson(`Plaid is not configured: ${configError}`, 503);
    }

    const userId = await resolveActiveUserId();
    const sync = await syncPlaidDataForUser(userId);
    const status = await getPlaidConnectionStatus(userId);

    return NextResponse.json({
      ...sync,
      ...status
    });
  } catch (error) {
    return errorJson(getPlaidErrorMessage(error, "Failed to sync Plaid data"), 500);
  }
}
