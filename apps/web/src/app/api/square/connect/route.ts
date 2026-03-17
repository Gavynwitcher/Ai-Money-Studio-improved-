import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSquareAuthorizationUrl, getSquareConfigError } from "@/lib/server/square";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configError = getSquareConfigError();
  if (configError) {
    return NextResponse.redirect(new URL(`/cash-management?square=config-error`, request.url));
  }

  const state = randomUUID();
  const response = NextResponse.redirect(new URL(createSquareAuthorizationUrl(state)));
  response.cookies.set("square_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/"
  });
  return response;
}
