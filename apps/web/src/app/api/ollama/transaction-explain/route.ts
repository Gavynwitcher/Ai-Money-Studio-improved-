import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { OllamaMessage, runOllamaChat } from "@/lib/server/ollama";
import { getOpenAiConfig, runOpenAiChat } from "@/lib/server/openai";

type ExplainPayload = {
  model?: string;
  userContext?: string;
  transaction?: {
    postedAt?: string;
    merchant?: string;
    category?: string;
    amount?: number;
    recurring?: boolean;
    confidence?: number;
    accountName?: string;
    accountType?: string;
  };
};

function toUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Math.abs(value));
}

function normalizePayload(input: ExplainPayload) {
  const txn = input.transaction;
  if (!txn) throw new Error("Missing transaction payload");

  const amount = typeof txn.amount === "number" ? txn.amount : Number.NaN;
  if (!Number.isFinite(amount)) throw new Error("Transaction amount is required");

  const merchant = (txn.merchant || "").trim();
  if (!merchant) throw new Error("Transaction merchant is required");

  const category = (txn.category || "Uncategorized").trim() || "Uncategorized";
  const postedAt = (txn.postedAt || "").trim() || "Unknown date";
  const accountName = (txn.accountName || "Unknown account").trim() || "Unknown account";
  const accountType = (txn.accountType || "Other").trim() || "Other";
  const recurring = txn.recurring === true;
  const confidence = typeof txn.confidence === "number" ? txn.confidence : 0.7;
  const userContext = typeof input.userContext === "string" ? input.userContext.trim().slice(0, 500) : "";

  return {
    amount,
    merchant,
    category,
    postedAt,
    accountName,
    accountType,
    recurring,
    confidence,
    userContext
  };
}

export async function POST(req: NextRequest) {
  try {
    let payload: ExplainPayload;
    try {
      payload = (await req.json()) as ExplainPayload;
    } catch {
      return errorJson("Invalid request body", 400);
    }

    const txn = normalizePayload(payload);
    const direction = txn.amount < 0 ? "spend" : "deposit";
    const recurringLabel = txn.recurring ? "recurring" : "one-time";

    const systemMessage: OllamaMessage = {
      role: "system",
      content:
        "You explain bank transactions for end users. Write plain-English, specific, neutral explanations. " +
        "Use 1-2 short sentences only. Always state whether it looks one-time or recurring. " +
        "If confidence is low (<0.85), explicitly mention uncertainty and suggest review. " +
        "If user context is provided, incorporate it directly."
    };

    const userMessage: OllamaMessage = {
      role: "user",
      content: [
        `Transaction date: ${txn.postedAt}`,
        `Merchant: ${txn.merchant}`,
        `Amount: ${toUsd(txn.amount)} (${direction})`,
        `Category: ${txn.category}`,
        `Account: ${txn.accountName} (${txn.accountType})`,
        `Detected pattern: ${recurringLabel}`,
        `Classification confidence: ${(txn.confidence * 100).toFixed(1)}%`,
        txn.userContext ? `User context: ${txn.userContext}` : "User context: none",
        "Write the explanation now."
      ].join("\n")
    };

    const openAiConfig = getOpenAiConfig();
    const result = openAiConfig.configured
      ? await runOpenAiChat({
          model: payload.model,
          messages: [systemMessage, userMessage],
          maxOutputTokens: 220
        })
      : await runOllamaChat({
          model: payload.model,
          messages: [systemMessage, userMessage]
        });

    return NextResponse.json({
      explanation: result.reply,
      provider: "provider" in result ? result.provider : "ollama",
      model: result.model,
      createdAt: result.createdAt
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to generate transaction explanation", 500);
  }
}
