import { NextResponse } from "next/server";
import { fetchTransactions } from "@/lib/plaid/service";

export async function GET() {
  const transactions = await fetchTransactions();

  return NextResponse.json({
    transactions
  });
}
