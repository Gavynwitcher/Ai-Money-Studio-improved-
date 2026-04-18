import { NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { scrapeGoogleFlightsSnapshot } from "@/lib/server/googleFlights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const snapshot = await scrapeGoogleFlightsSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : "Failed to fetch Google Flights snapshot",
      500
    );
  }
}
