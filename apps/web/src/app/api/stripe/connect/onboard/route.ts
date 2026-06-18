import { privateBetaUnavailableJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return privateBetaUnavailableJson("Stripe Connect onboarding");
}
