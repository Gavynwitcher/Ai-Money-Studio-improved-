import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getActionsPayload } from "@/lib/server/moneyCopilot";
import { fallbackActionsPayload, isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { resolveActiveUserId } from "@/lib/server/user";
import { prisma } from "@/lib/prisma";
import { isKillSwitchPausedFromRequest } from "@/lib/server/killSwitch";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const payload = await getActionsPayload(userId);
    return NextResponse.json(payload);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(fallbackActionsPayload(), {
        headers: { "x-data-source": "fallback" }
      });
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load Money Copilot actions", 500);
  }
}

type CreateActionPayload = {
  actionType?: string;
  expectedOutcome?: string;
  downside?: string;
  requiresStepUp?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    if (isKillSwitchPausedFromRequest(req)) {
      return errorJson("Kill switch is paused. Resume automations before creating new actions.", 423);
    }

    const payload = (await req.json()) as CreateActionPayload;
    const actionType = payload.actionType?.trim();
    const expectedOutcome = payload.expectedOutcome?.trim();
    const downside = payload.downside?.trim();
    const requiresStepUp = Boolean(payload.requiresStepUp);

    if (!actionType || !expectedOutcome || !downside) {
      return errorJson("actionType, expectedOutcome, and downside are required", 400);
    }

    const userId = await resolveActiveUserId();
    const created = await prisma.moneyCopilotAction.create({
      data: {
        userId,
        actionType,
        status: "PROPOSED",
        expectedOutcome,
        downside,
        requiresStepUp
      }
    });

    return NextResponse.json({
      id: created.id,
      status: "Proposed"
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return errorJson("Database not reachable; action proposal was not saved", 503);
    }
    return errorJson(error instanceof Error ? error.message : "Failed to create action", 500);
  }
}
