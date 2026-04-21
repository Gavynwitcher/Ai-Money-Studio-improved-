import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getCreditReports } from "@/lib/server/credit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reports = await getCreditReports();
    return NextResponse.json({ reports });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load credit reports.", 500);
  }
}
