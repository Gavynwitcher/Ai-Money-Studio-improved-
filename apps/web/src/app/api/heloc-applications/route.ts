import { NextRequest } from "next/server";
import { privateBetaUnavailableJson } from "@/lib/server/http";
import { type HelocApplicationFormInput } from "@/lib/heloc/types";

export async function POST(request: NextRequest) {
  await request.json().catch(() => ({} as HelocApplicationFormInput));
  return privateBetaUnavailableJson("HELOC applications");
}
