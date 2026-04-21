import { NextResponse } from "next/server";
import { getStripeConnectWorkspace } from "@/lib/server/stripeConnect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const workspace = await getStripeConnectWorkspace();
    return NextResponse.json(workspace);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load Stripe Connect workspace."
      },
      { status: 500 }
    );
  }
}
