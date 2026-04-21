import { NextResponse } from "next/server";
import { refreshStripeConnectOnboardingLink } from "@/lib/server/stripeConnect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const accountId = url.searchParams.get("account");

  if (!accountId) {
    return NextResponse.redirect(new URL("/dashboard-demo?stripeConnect=missing-account", url));
  }

  try {
    const redirectUrl = await refreshStripeConnectOnboardingLink(accountId);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      const signInUrl = new URL("/signin", url);
      signInUrl.searchParams.set("callbackUrl", `/api/stripe/connect/refresh?account=${encodeURIComponent(accountId)}`);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.redirect(new URL("/dashboard-demo?stripeConnect=refresh-error", url));
  }
}
