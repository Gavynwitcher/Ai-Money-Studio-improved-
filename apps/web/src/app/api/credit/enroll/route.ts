import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { enrollInCreditMonitoring } from "@/lib/server/credit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      monitoringEnabled?: boolean;
      reportsEnabled?: boolean;
      scoreAccessEnabled?: boolean;
      bureauScope?: string;
    };

    const overview = await enrollInCreditMonitoring(body);
    return NextResponse.json(overview, { status: 201 });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to enroll in credit monitoring.", 400);
  }
}
