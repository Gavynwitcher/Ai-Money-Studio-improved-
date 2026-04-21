import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getCreditOverview } from "@/lib/server/credit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await getCreditOverview();
    return NextResponse.json(overview);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load credit overview.", 500);
  }
}
