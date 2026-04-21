import { NextResponse } from "next/server";
import { createStripeConnectOnboardingLink } from "@/lib/server/stripeConnect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const payload = await createStripeConnectOnboardingLink();
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json(
        {
          error: "Authentication required.",
          signInPath: "/signin?callbackUrl=/dashboard-demo"
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to start Stripe Connect onboarding."
      },
      { status: 500 }
    );
  }
}
