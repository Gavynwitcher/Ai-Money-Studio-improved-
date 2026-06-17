import { NextRequest } from "next/server";
import { privateBetaUnavailableJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await request.json().catch(() => ({}));
  return privateBetaUnavailableJson("Plaid Assets audit copies");
}
