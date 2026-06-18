import { privateBetaUnavailableJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return privateBetaUnavailableJson("Plaid Liabilities debt verification");
}
