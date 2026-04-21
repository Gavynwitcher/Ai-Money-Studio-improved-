import { NextResponse } from "next/server";
import { getBillingOverview } from "@/lib/server/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const overview = await getBillingOverview();
  return NextResponse.json(overview);
}
