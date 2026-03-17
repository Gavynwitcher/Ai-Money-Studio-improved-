import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { exchangeSquareAuthorizationCode } from "@/lib/server/square";
import { resolveActiveUserId } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const storedState = cookies().get("square_oauth_state")?.value;
  const destination = new URL("/cash-management", request.url);

  if (oauthError) {
    destination.searchParams.set("square", "denied");
    return NextResponse.redirect(destination);
  }

  if (!state || !code || !storedState || state !== storedState) {
    destination.searchParams.set("square", "state-error");
    const response = NextResponse.redirect(destination);
    response.cookies.delete("square_oauth_state");
    return response;
  }

  try {
    const userId = await resolveActiveUserId();
    await exchangeSquareAuthorizationCode(userId, code);
    destination.searchParams.set("square", "connected");
  } catch {
    destination.searchParams.set("square", "exchange-error");
  }

  const response = NextResponse.redirect(destination);
  response.cookies.delete("square_oauth_state");
  return response;
}
