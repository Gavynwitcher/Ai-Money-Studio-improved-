import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const requireSignin = process.env.REQUIRE_SIGNIN !== "false";
  const authenticated = Boolean(session?.user?.email);

  return NextResponse.json({
    authenticated: requireSignin ? authenticated : true,
    signInPath: "/signin",
    guestMode: !requireSignin && !authenticated
  });
}
