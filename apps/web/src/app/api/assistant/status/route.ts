import { NextResponse } from "next/server";
import { getOpenAiStatus } from "@/lib/server/openai";

export async function GET() {
  const openai = getOpenAiStatus();

  return NextResponse.json({
    provider: openai.available ? "openai" : "unavailable",
    openai,
    guardrails: [
      "Answers are limited to imported transaction records provided to Northline AI.",
      "Northline AI does not initiate bank actions, repair credit, or provide legal, tax, or investment advice.",
      "Advanced credit and debt workflows remain subject to partner availability and compliance review."
    ]
  });
}
