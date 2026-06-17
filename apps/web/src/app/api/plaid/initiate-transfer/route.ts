import { NextRequest } from "next/server";
import { privateBetaUnavailableJson } from "@/lib/server/http";
import type { TransferRequest } from "@/lib/plaid/types";

export async function POST(request: NextRequest) {
  await request.json().catch(() => ({} as TransferRequest));

  return privateBetaUnavailableJson("Bank transfers");
}
