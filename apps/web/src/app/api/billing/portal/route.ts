import { NextResponse } from "next/server";
import { createBillingPortalSession, requireBillingUser } from "@/lib/server/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireBillingUser();
    const portal = await createBillingPortalSession(user);
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "Authentication required.", signInPath: "/signin?callbackUrl=/pricing" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to open Stripe Billing Portal." },
      { status: 500 }
    );
  }
}
