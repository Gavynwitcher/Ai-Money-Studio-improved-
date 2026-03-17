import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import {
  getPlaidConfigError,
  getPlaidConnectionStatus,
  unlinkPlaidDataForUser
} from "@/lib/server/plaid";
import { resolveActiveUserId } from "@/lib/server/user";

export async function POST() {
  try {
    const configError = getPlaidConfigError();
    if (configError) {
      return errorJson(`Plaid is not configured: ${configError}`, 503);
    }

    const userId = await resolveActiveUserId();
    const removed = await unlinkPlaidDataForUser(userId);
    const status = await getPlaidConnectionStatus(userId);

    return NextResponse.json({
      ...removed,
      ...status
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to unlink Plaid accounts", 500);
  }
}
