import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import {
  exchangePublicTokenAndSync,
  getPlaidConfigError,
  getPlaidConnectionStatus
} from "@/lib/server/plaid";
import { getPlaidErrorMessage } from "@/lib/server/plaidErrors";
import { resolveActiveUserId } from "@/lib/server/user";

type ExchangePayload = {
  publicToken?: string;
  institutionName?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const configError = getPlaidConfigError();
    if (configError) {
      return errorJson(`Plaid is not configured: ${configError}`, 503);
    }

    let payload: ExchangePayload;
    try {
      payload = (await req.json()) as ExchangePayload;
    } catch {
      return errorJson("Invalid request body", 400);
    }

    if (!payload.publicToken || typeof payload.publicToken !== "string") {
      return errorJson("Missing publicToken", 400);
    }

    const userId = await resolveActiveUserId();
    const result = await exchangePublicTokenAndSync(
      userId,
      payload.publicToken,
      payload.institutionName
    );
    const status = await getPlaidConnectionStatus(userId);

    return NextResponse.json({
      ...result,
      ...status
    });
  } catch (error) {
    return errorJson(getPlaidErrorMessage(error, "Failed to exchange public token"), 500);
  }
}
