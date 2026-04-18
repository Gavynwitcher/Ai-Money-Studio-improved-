import { NextResponse } from "next/server";
import { fetchBalances } from "@/lib/plaid/service";

export async function GET() {
  const balances = await fetchBalances();

  return NextResponse.json({
    balances
  });
}
