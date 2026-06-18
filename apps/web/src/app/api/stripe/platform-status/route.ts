import { NextResponse } from "next/server";
import { getStripePlatformStatus } from "@/lib/server/stripePlatform";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getStripePlatformStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Stripe platform status." },
      { status: 500 }
    );
  }
}
