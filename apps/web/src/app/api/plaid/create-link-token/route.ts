import { NextResponse } from "next/server";
import { createLinkToken } from "@/lib/plaid/service";
import { resolveActiveUserId } from "@/lib/server/user";
import { createPlaidLinkToken, getPlaidConfigError } from "@/lib/server/plaid";
import { getPlaidErrorMessage } from "@/lib/server/plaidErrors";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { getPlaidConfig, shouldUseMockPlaid } from "@/lib/plaid/config";

export async function POST() {
  try {
    const config = getPlaidConfig();

    if (shouldUseMockPlaid()) {
      const result = await createLinkToken();
      return NextResponse.json(result);
    }

    const configError = getPlaidConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 400 });
    }

    const userId = await resolveActiveUserId();
    const result = await createPlaidLinkToken(userId);

    return NextResponse.json({
      linkToken: result.link_token,
      expiration: result.expiration,
      environment: process.env.PLAID_ENV || "sandbox",
      mockMode: false,
      clientName: "Northline",
      products: config.products,
      countryCodes: ["US"]
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before connecting Plaid." }, { status: 503 });
    }

    return NextResponse.json(
      { error: getPlaidErrorMessage(error, "Failed to create Plaid link token") },
      { status: 500 }
    );
  }
}
