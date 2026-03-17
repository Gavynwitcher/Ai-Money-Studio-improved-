import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const MONEY_COPILOT_KILL_SWITCH_COOKIE = "money_copilot_kill_switch";

export function isKillSwitchPausedFromRequest(req: NextRequest) {
  return req.cookies.get(MONEY_COPILOT_KILL_SWITCH_COOKIE)?.value === "paused";
}

export function isKillSwitchPausedFromServerCookies() {
  return cookies().get(MONEY_COPILOT_KILL_SWITCH_COOKIE)?.value === "paused";
}

