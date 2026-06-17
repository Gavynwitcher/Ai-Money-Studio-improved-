import { privateBetaUnavailableJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return privateBetaUnavailableJson("Stripe Connect onboarding refresh");
}
