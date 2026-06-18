import { NextResponse } from "next/server";
import { fetchItemSummary, fetchLinkedAccounts, fetchLinkedInstitutions } from "@/lib/plaid/service";
import { shouldUseMockPlaid, getPlaidConfig } from "@/lib/plaid/config";
import { prisma } from "@/lib/prisma";
import { isAuthRequiredError, resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { authRequiredJson } from "@/lib/server/http";

export async function GET() {
  try {
    const userId = await resolveActiveUserId();

    if (shouldUseMockPlaid()) {
      const [institutions, accounts, item] = await Promise.all([
        fetchLinkedInstitutions(),
        fetchLinkedAccounts(),
        fetchItemSummary()
      ]);

      return NextResponse.json({
        institutions,
        accounts,
        item
      });
    }

    const [items, accounts] = await Promise.all([
      prisma.plaidItem.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { plaidItemId: true, institutionName: true, lastSyncedAt: true }
      }),
      prisma.moneyCopilotAccount.findMany({
        where: {
          userId,
          providerAccountId: { not: null }
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          providerAccountId: true,
          name: true,
          type: true,
          accountMask: true,
          currentBalance: true,
          availableBalance: true
        }
      })
    ]);

    const institutions = items.map((item) => ({
      institutionId: item.plaidItemId,
      institutionName: item.institutionName || "Linked institution",
      status: item.lastSyncedAt ? "connected" : "syncing"
    }));

    const primaryInstitution = institutions[0];
    const config = getPlaidConfig();
    const item = primaryInstitution
      ? {
          itemId: primaryInstitution.institutionId,
          institutionId: primaryInstitution.institutionId,
          institutionName: primaryInstitution.institutionName,
          billedProducts: config.products,
          availableProducts: config.products,
          webhook: config.webhookUrl || null,
          accessTokenStatus: "stored" as const
        }
      : null;

    return NextResponse.json({
      institutions,
      accounts: accounts.map((account) => {
        const [type = "OTHER", subtype = "account"] = (account.type || "OTHER:account").split(":");
        return {
          id: account.providerAccountId || account.id,
          institutionId: primaryInstitution?.institutionId || "linked-institution",
          institutionName: primaryInstitution?.institutionName || "Linked institution",
          name: account.name,
          officialName: account.name,
          type: type.toLowerCase(),
          subtype: subtype.toLowerCase(),
          mask: account.accountMask || "0000",
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance ?? account.currentBalance
        };
      }),
      item
    });
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return authRequiredJson("Please sign in before viewing linked bank accounts.");
    }

    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before reading Plaid accounts." }, { status: 503 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load Plaid accounts" }, { status: 500 });
  }
}
