import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { fallbackDashboardPayload, isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { getDashboardPayload } from "@/lib/server/moneyCopilot";
import { resolveActiveUserId } from "@/lib/server/user";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const payload = await getDashboardPayload(userId);
    return NextResponse.json(payload);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(fallbackDashboardPayload(), {
        headers: { "x-data-source": "fallback" }
      });
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load Money Copilot dashboard", 500);
  }
}
