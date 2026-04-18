import { NextResponse } from "next/server";
import { fetchItemSummary } from "@/lib/plaid/service";

export async function GET() {
  const item = await fetchItemSummary();

  return NextResponse.json({
    item
  });
}
