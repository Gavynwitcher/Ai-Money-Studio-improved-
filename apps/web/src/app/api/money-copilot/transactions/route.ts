import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getTransactionsPayload } from "@/lib/server/moneyCopilot";
import {
  fallbackTransactionsPayload,
  isDbUnavailableError
} from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const limitQuery = req.nextUrl.searchParams.get("limit");
    const parsedLimit = limitQuery ? Number.parseInt(limitQuery, 10) : 200;
    const payload = await getTransactionsPayload(userId, Number.isNaN(parsedLimit) ? 200 : parsedLimit);
    return NextResponse.json(payload);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      const limitQuery = req.nextUrl.searchParams.get("limit");
      const parsedLimit = limitQuery ? Number.parseInt(limitQuery, 10) : 200;
      return NextResponse.json(fallbackTransactionsPayload(Number.isNaN(parsedLimit) ? 200 : parsedLimit), {
        headers: { "x-data-source": "fallback" }
      });
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load Money Copilot transactions", 500);
  }
}
