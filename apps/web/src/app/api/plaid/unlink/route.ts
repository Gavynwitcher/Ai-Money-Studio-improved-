import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    removedItems: 1,
    removedAccounts: 3,
    removedTransactions: 5,
    mockMode: true,
    message: "Mock unlink complete. Replace with database cleanup for stored Plaid items and accounts."
  });
}
