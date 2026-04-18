import { NextResponse } from "next/server";
import { fetchItemSummary } from "@/lib/plaid/service";
import { shouldUseMockPlaid, getPlaidConfig } from "@/lib/plaid/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";

export async function GET() {
  try {
    if (shouldUseMockPlaid()) {
      const item = await fetchItemSummary();
      return NextResponse.json({
        item
      });
    }

    const userId = await resolveActiveUserId();
    const latestItem = await prisma.plaidItem.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { plaidItemId: true, institutionName: true }
    });

    const config = getPlaidConfig();
    const item = latestItem
      ? {
          itemId: latestItem.plaidItemId,
          institutionId: latestItem.plaidItemId,
          institutionName: latestItem.institutionName || "Linked institution",
          billedProducts: config.products,
          availableProducts: config.products,
          webhook: config.webhookUrl || null,
          accessTokenStatus: "stored" as const
        }
      : null;

    return NextResponse.json({
      item
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before reading Plaid items." }, { status: 503 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load Plaid item" }, { status: 500 });
  }
}
