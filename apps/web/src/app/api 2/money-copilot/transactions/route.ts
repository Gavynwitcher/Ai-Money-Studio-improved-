import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getTransactionsPayload } from "@/lib/server/moneyCopilot";
import { resolveActiveUserId } from "@/lib/server/user";

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveActiveUserId();
    const limitQuery = req.nextUrl.searchParams.get("limit");
    const parsedLimit = limitQuery ? Number.parseInt(limitQuery, 10) : 200;
    const payload = await getTransactionsPayload(userId, Number.isNaN(parsedLimit) ? 200 : parsedLimit);
    return NextResponse.json(payload);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load Money Copilot transactions", 500);
  }
}
