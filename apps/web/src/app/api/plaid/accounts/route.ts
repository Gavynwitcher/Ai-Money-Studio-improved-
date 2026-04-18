import { NextResponse } from "next/server";
import { fetchItemSummary, fetchLinkedAccounts, fetchLinkedInstitutions } from "@/lib/plaid/service";

export async function GET() {
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
