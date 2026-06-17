import { NextRequest } from "next/server";
import { privateBetaUnavailableJson } from "@/lib/server/http";

type CreateTransferPayload = {
  fromSource?: string;
  toSource?: string;
  amount?: number;
  purpose?: string;
  scheduledFor?: string | null;
};

export const dynamic = "force-dynamic";

export async function GET() {
  return privateBetaUnavailableJson("Square transfer requests");
}

export async function POST(request: NextRequest) {
  await request.json().catch(() => ({} as CreateTransferPayload));
  return privateBetaUnavailableJson("Square transfer requests");
}
