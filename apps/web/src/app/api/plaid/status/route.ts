import { NextResponse } from "next/server";
import { getPlaidConfig, shouldUseMockPlaid } from "@/lib/plaid/config";
import { fetchLinkedAccounts, fetchLinkedInstitutions } from "@/lib/plaid/service";

export async function GET() {
  const config = getPlaidConfig();
  const [institutions, accounts] = await Promise.all([
    fetchLinkedInstitutions(),
    fetchLinkedAccounts()
  ]);

  return NextResponse.json({
    configured: Boolean(config.clientId && config.secret),
    mockMode: shouldUseMockPlaid(),
    environment: config.environment,
    products: config.products,
    linkedInstitutions: institutions.length,
    linkedAccounts: accounts.length
  });
}
