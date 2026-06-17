import { NextResponse } from "next/server";
import { getOllamaStatus } from "@/lib/server/ollama";
import { getOpenAiStatus } from "@/lib/server/openai";

export async function GET() {
  const openai = getOpenAiStatus();
  const ollama = await getOllamaStatus();

  return NextResponse.json({
    provider: openai.available ? "openai" : ollama.available ? "ollama" : "unavailable",
    openai,
    ollama,
    guardrails: [
      "Answers are limited to provided account, transaction, cash-flow, budgeting, and Plaid-derived context.",
      "Northline AI does not move money, approve transfers, repair credit, or provide legal, tax, or investment advice.",
      "Advanced transfer, credit, and debt workflows remain subject to partner availability and compliance review."
    ]
  });
}
