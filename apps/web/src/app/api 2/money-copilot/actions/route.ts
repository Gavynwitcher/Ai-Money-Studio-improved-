import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getActionsPayload } from "@/lib/server/moneyCopilot";
import { resolveActiveUserId } from "@/lib/server/user";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const payload = await getActionsPayload(userId);
    return NextResponse.json(payload);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load Money Copilot actions", 500);
  }
}
