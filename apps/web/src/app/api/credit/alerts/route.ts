import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getCreditAlerts } from "@/lib/server/credit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alerts = await getCreditAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load credit alerts.", 500);
  }
}
