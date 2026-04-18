import { NextResponse } from "next/server";
import { fetchBalances } from "@/lib/plaid/service";
import { shouldUseMockPlaid } from "@/lib/plaid/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";

export async function GET() {
  try {
    if (shouldUseMockPlaid()) {
      const balances = await fetchBalances();
      return NextResponse.json({
        balances
      });
    }

    const userId = await resolveActiveUserId();
    const balances = await prisma.moneyCopilotAccount.findMany({
      where: {
        userId,
        providerAccountId: { not: null }
      },
      orderBy: { createdAt: "asc" },
      select: {
        providerAccountId: true,
        name: true,
        currentBalance: true,
        availableBalance: true,
        currency: true,
        accountMask: true
      }
    });

    return NextResponse.json({
      balances: balances.map((account) => ({
        id: account.providerAccountId || account.name,
        name: account.name,
        currentBalance: account.currentBalance,
        availableBalance: account.availableBalance ?? account.currentBalance,
        currency: account.currency,
        mask: account.accountMask || "0000"
      }))
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ error: "Database unavailable. Start the app database before reading Plaid balances." }, { status: 503 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load Plaid balances" }, { status: 500 });
  }
}
