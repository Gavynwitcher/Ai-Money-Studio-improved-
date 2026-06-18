import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getAccountingOverview } from "@/lib/server/accounting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await getAccountingOverview();
    return NextResponse.json(overview);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load accounting overview.", 500);
  }
}
