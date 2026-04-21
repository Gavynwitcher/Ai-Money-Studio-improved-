import { NextResponse } from "next/server";
import { createCheckoutSession, requireBillingUser } from "@/lib/server/billing";
import type { BillingPlanKey } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { planKey?: BillingPlanKey };
    if (!body.planKey) {
      return NextResponse.json({ error: "A billing plan is required." }, { status: 400 });
    }

    const user = await requireBillingUser();
    const session = await createCheckoutSession({
      user,
      planKey: body.planKey
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "Authentication required.", signInPath: "/signin?callbackUrl=/pricing" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "PLAN_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "This plan is not connected to a Stripe Price ID yet." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start Stripe Checkout." },
      { status: 500 }
    );
  }
}
