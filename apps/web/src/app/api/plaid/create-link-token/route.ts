import { NextResponse } from "next/server";
import { createLinkToken } from "@/lib/plaid/service";

export async function POST() {
  const result = await createLinkToken();

  return NextResponse.json(result);
}
