import { privateBetaUnavailableJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST() {
  return privateBetaUnavailableJson("Plaid Assets report refresh");
}
