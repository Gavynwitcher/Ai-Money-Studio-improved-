import { NextRequest, NextResponse } from "next/server";
import { handlePlaidWebhook, syncPlaidAuthDataForItem } from "@/lib/server/plaid";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));

  const result = await handlePlaidWebhook(payload);

  if (result.shouldRefreshAuth && result.itemId) {
    await syncPlaidAuthDataForItem(result.itemId);
  }

  return NextResponse.json({
    received: true,
    payload,
    ...result
  });
}
