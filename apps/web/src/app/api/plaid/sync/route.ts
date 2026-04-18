import { NextResponse } from "next/server";
import { fetchBalances, fetchTransactions } from "@/lib/plaid/service";

export async function POST() {
  const [balances, transactions] = await Promise.all([fetchBalances(), fetchTransactions()]);

  return NextResponse.json({
    synced: true,
    balanceRecords: balances.length,
    transactionRecords: transactions.length,
    syncedAt: new Date().toISOString()
  });
}
