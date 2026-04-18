import { NextResponse } from "next/server";
import { getPlaidConfig, shouldUseMockPlaid } from "@/lib/plaid/config";
import { fetchLinkedAccounts, fetchLinkedInstitutions } from "@/lib/plaid/service";
import {
  ensurePlaidItemsMatchEnvironment,
  getPlaidConfigError,
  getPlaidConnectionStatus,
  isPlaidConfigured
} from "@/lib/server/plaid";
import { resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";

export async function GET() {
  try {
    const config = getPlaidConfig();

    if (shouldUseMockPlaid()) {
      const [institutions, accounts] = await Promise.all([fetchLinkedInstitutions(), fetchLinkedAccounts()]);

      return NextResponse.json({
        configured: true,
        configError: null,
        mockMode: true,
        environment: config.environment,
        products: config.products,
        connected: institutions.length > 0,
        connectedItems: institutions.length,
        institutions: institutions.map((institution) => institution.institutionName),
        lastSyncedAt: null,
        linkedAccounts: accounts.length,
        importedTransactions: 0,
        coverageStart: null,
        coverageEnd: null,
        verifiedBankAccounts: 0,
        pendingBankAccounts: 0,
        tokenizedBankAccounts: 0,
        authMethods: []
      });
    }

    const userId = await resolveActiveUserId();
    const reset = await ensurePlaidItemsMatchEnvironment(userId);
    const status = await getPlaidConnectionStatus(userId);

    return NextResponse.json({
      configured: isPlaidConfigured(),
      configError: getPlaidConfigError(),
      mockMode: false,
      environment: config.environment,
      products: config.products,
      resetRequired: Boolean(reset?.resetRequired),
      resetMessage: reset?.resetRequired
        ? `We cleared ${reset.removedItems} older sandbox connection${reset.removedItems === 1 ? "" : "s"} so this workspace matches Plaid production. Reconnect your bank to continue.`
        : null,
      ...status
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        {
          configured: false,
          configError: "Database unavailable. Start the app database before using live Plaid.",
          mockMode: false,
          environment: getPlaidConfig().environment,
          products: getPlaidConfig().products,
          connected: false,
          connectedItems: 0,
          institutions: [],
          lastSyncedAt: null,
          linkedAccounts: 0,
          importedTransactions: 0,
          coverageStart: null,
          coverageEnd: null,
          verifiedBankAccounts: 0,
          pendingBankAccounts: 0,
          tokenizedBankAccounts: 0,
          authMethods: []
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load Plaid status" }, { status: 500 });
  }
}
