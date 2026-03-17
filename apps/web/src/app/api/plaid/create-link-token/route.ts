import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import {
  createPlaidLinkToken,
  getPlaidConfigError,
  getPlaidConnectionStatus
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
    const [linkToken, status] = await Promise.all([
      createPlaidLinkToken(userId),
      getPlaidConnectionStatus(userId)
    ]);

    return NextResponse.json({
      linkToken: linkToken.link_token,
      expiration: linkToken.expiration,
      ...status
    });
  } catch (error) {
    return errorJson(getPlaidErrorMessage(error, "Failed to create Plaid link token"), 500);
  }
}
