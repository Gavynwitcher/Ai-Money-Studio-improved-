import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { createSquareTransferRequest } from "@/lib/server/square";
import { resolveActiveUserId } from "@/lib/server/user";
import { prisma } from "@/lib/prisma";

type CreateTransferPayload = {
  fromSource?: string;
  toSource?: string;
  amount?: number;
  purpose?: string;
  scheduledFor?: string | null;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();
    const rows = await prisma.squareTransferRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      transferRequests: rows.map((row) => ({
        id: row.id,
        fromSource: row.fromSource,
        toSource: row.toSource,
        amount: row.amount,
        currency: row.currency,
        purpose: row.purpose,
        status: row.status,
        executionRail: row.executionRail,
        squareReferenceId: row.squareReferenceId,
        scheduledFor: row.scheduledFor?.toISOString() || null,
        executedAt: row.executedAt?.toISOString() || null,
        createdAt: row.createdAt.toISOString()
      }))
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ transferRequests: [] }, { headers: { "x-data-source": "fallback" } });
    }
    return errorJson(error instanceof Error ? error.message : "Failed to load transfer requests", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CreateTransferPayload;
    const fromSource = payload.fromSource?.trim();
    const toSource = payload.toSource?.trim();
    const purpose = payload.purpose?.trim();
    const amount = Number(payload.amount);

    if (!fromSource || !toSource || !purpose || !Number.isFinite(amount) || amount <= 0) {
      return errorJson("fromSource, toSource, purpose, and a positive amount are required", 400);
    }

    const userId = await resolveActiveUserId();
    const created = await createSquareTransferRequest(userId, {
      fromSource,
      toSource,
      amount,
      purpose,
      scheduledFor: payload.scheduledFor || null
    });

    return NextResponse.json({
      id: created.id,
      status: created.status
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return errorJson("Database not reachable; transfer request was not saved", 503);
    }
    return errorJson(error instanceof Error ? error.message : "Failed to create transfer request", 500);
  }
}
