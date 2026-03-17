import { NextRequest, NextResponse } from "next/server";
import {
  isKillSwitchPausedFromServerCookies,
  MONEY_COPILOT_KILL_SWITCH_COOKIE
} from "@/lib/server/killSwitch";
import { errorJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    paused: isKillSwitchPausedFromServerCookies()
  });
}

type KillSwitchPayload = {
  paused?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as KillSwitchPayload;
    const paused = payload.paused === true;

    const res = NextResponse.json({ paused });
    res.cookies.set(MONEY_COPILOT_KILL_SWITCH_COOKIE, paused ? "paused" : "active", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
    return res;
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to update kill switch", 500);
  }
}

