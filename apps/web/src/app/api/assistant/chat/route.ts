import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { getOpenAiConfig, OpenAiMessage, runOpenAiChat } from "@/lib/server/openai";

const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARS = 25_000;

const SYSTEM_PROMPT = [
  "You are Northline AI, a practical financial operations assistant for Northline users.",
  "Use only the imported transaction records provided in the request.",
  "Do not use dashboard totals, account balances, cash-flow widgets, credit widgets, transfer panels, or any information that is not present in the transaction records.",
  "If the user asks for something outside imported transactions, say that Northline AI needs transaction data for that answer.",
  "Use clear business-owner language and avoid developer jargon.",
  "Quantify transaction patterns in dollars whenever possible.",
  "Do not provide legal, tax, investment, credit repair, lending approval, or regulatory advice.",
  "Do not claim to move money, approve transfers, repair credit, guarantee outcomes, or replace a bank.",
  "Advanced transfer, credit, and debt features are subject to partner availability and compliance review."
].join(" ");

type ImportedTransaction = {
  id?: string;
  date?: string;
  merchant?: string;
  category?: string;
  amount?: number;
  direction?: "inflow" | "outflow";
  status?: string;
  accountName?: string;
};

type ChatPayload = {
  model?: string;
  messages?: Array<{
    role?: string;
    content?: string;
  }>;
  transactions?: ImportedTransaction[];
};

function normalizeMessages(input: ChatPayload["messages"]): OpenAiMessage[] {
  if (!Array.isArray(input)) {
    throw new Error("Missing messages array");
  }

  const parsed: OpenAiMessage[] = [];
  for (const row of input) {
    const role = row?.role;
    const content = typeof row?.content === "string" ? row.content.trim() : "";

    if (!content) continue;
    if (role !== "user" && role !== "assistant" && role !== "system") continue;

    parsed.push({ role, content });
  }

  if (!parsed.length) {
    throw new Error("Provide at least one non-empty message.");
  }

  return parsed.slice(-MAX_MESSAGES);
}

function normalizeTransactions(input: ChatPayload["transactions"]) {
  if (!Array.isArray(input)) return [];

  return input.slice(0, 200).map((transaction, index) => ({
    id: String(transaction.id || `txn_${index + 1}`),
    date: String(transaction.date || "Unknown date"),
    merchant: String(transaction.merchant || "Unknown merchant"),
    category: String(transaction.category || "Uncategorized"),
    amount: Number(transaction.amount || 0),
    direction: transaction.direction === "inflow" ? "inflow" : "outflow",
    status: String(transaction.status || "unknown"),
    accountName: String(transaction.accountName || "Imported account")
  }));
}

function summarizeTransactions(transactions: ReturnType<typeof normalizeTransactions>) {
  if (!transactions.length) return "No imported transactions were provided.";

  const inflow = transactions
    .filter((transaction) => transaction.direction === "inflow")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const outflow = transactions
    .filter((transaction) => transaction.direction === "outflow")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const categories = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.direction === "outflow") {
      categories.set(transaction.category, (categories.get(transaction.category) || 0) + Math.abs(transaction.amount));
    }
  }
  const topCategories = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
    .join(", ");

  return [
    `Imported transaction count: ${transactions.length}.`,
    `Transaction inflow total: $${inflow.toFixed(2)}.`,
    `Transaction outflow total: $${outflow.toFixed(2)}.`,
    `Top outflow categories from transactions: ${topCategories || "None"}.`
  ].join(" ");
}

function transactionLedger(transactions: ReturnType<typeof normalizeTransactions>) {
  if (!transactions.length) return "No imported transaction records available.";

  return transactions
    .map(
      (transaction) =>
        `${transaction.date} | ${transaction.merchant} | ${transaction.direction === "inflow" ? "+" : "-"}$${Math.abs(
          transaction.amount
        ).toFixed(2)} | ${transaction.category} | ${transaction.accountName} | ${transaction.status}`
    )
    .join("\n");
}

function buildCitation(transactions: ReturnType<typeof normalizeTransactions>) {
  const count = transactions.length;
  const start = transactions[transactions.length - 1]?.date || "N/A";
  const end = transactions[0]?.date || "N/A";
  return `Based on ${count} transactions from ${start} to ${end}.`;
}

function friendlyOpenAiError(error: unknown) {
  const message = error instanceof Error ? error.message : "OpenAI could not complete the request.";
  const lower = message.toLowerCase();

  if (lower.includes("quota") || lower.includes("billing")) {
    return "OpenAI is connected, but the OpenAI project quota or billing limit needs attention before Northline AI can answer live.";
  }
  if (lower.includes("openai_api_key")) {
    return "OpenAI is not ready yet. Add OPENAI_API_KEY in Vercel and redeploy.";
  }
  return message;
}

export async function POST(req: NextRequest) {
  try {
    const openAiConfig = getOpenAiConfig();
    if (!openAiConfig.configured) {
      return errorJson("OpenAI is not ready yet. Add OPENAI_API_KEY in Vercel and redeploy.", 503);
    }

    let payload: ChatPayload;
    try {
      payload = (await req.json()) as ChatPayload;
    } catch {
      return errorJson("Invalid request body.", 400);
    }

    const normalizedMessages = normalizeMessages(payload.messages);
    const totalChars = normalizedMessages.reduce((sum, message) => sum + message.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return errorJson(`Conversation is too long (${totalChars} chars). Keep it under ${MAX_TOTAL_CHARS}.`, 413);
    }

    const importedTransactions = normalizeTransactions(payload.transactions);
    if (!importedTransactions.length) {
      return errorJson("Northline AI needs imported transaction records before it can answer.", 400);
    }

    const citation = buildCitation(importedTransactions);
    const systemMessage: OpenAiMessage = {
      role: "system",
      content: [
        SYSTEM_PROMPT,
        `Imported transaction summary: ${summarizeTransactions(importedTransactions)}`,
        `Imported transaction records:\n${transactionLedger(importedTransactions)}`,
        "Permissions: read=true, suggest=true, transact=false.",
        "Do not claim to execute transactions or move money.",
        `Always include this exact citation sentence once: "${citation}"`
      ].join(" ")
    };

    const result = await runOpenAiChat({
      model: payload.model,
      messages: [systemMessage, ...normalizedMessages],
      maxOutputTokens: 1400
    });

    const replyIncludesCitation = result.reply.toLowerCase().includes("based on ");
    const reply = replyIncludesCitation ? result.reply : `${result.reply}\n\n${citation}`;

    return NextResponse.json({
      ...result,
      provider: "openai",
      reply,
      citation,
      proposals: {
        actionsCreated: 0,
        rulesCreated: 0,
        notes: ["OpenAI-only assistant mode is active."]
      }
    });
  } catch (error) {
    return errorJson(friendlyOpenAiError(error), 500);
  }
}
