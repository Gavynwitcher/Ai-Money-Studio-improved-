import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { OllamaMessage, runOllamaChat } from "@/lib/server/ollama";
import { getOpenAiConfig, runOpenAiChat } from "@/lib/server/openai";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/server/user";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";
import { isKillSwitchPausedFromRequest } from "@/lib/server/killSwitch";

const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARS = 25_000;

const SYSTEM_PROMPT =
  process.env.NORTHLINE_AI_SYSTEM_PROMPT?.trim() ||
  process.env.OLLAMA_SYSTEM_PROMPT?.trim() ||
  [
    "You are Northline AI, a practical financial operations assistant for Northline users.",
    "Answer only from the account, transaction, cash-flow, budgeting, and Plaid-derived context provided in the request.",
    "If the user asks for something outside the provided data, say what data is missing and suggest the next safe product step.",
    "Use clear business-owner language and avoid developer jargon.",
    "Quantify impact in dollars whenever possible.",
    "Prioritize essentials first: housing, utilities, food, transport, minimum debt payments.",
    "Offer concrete next steps, review checklists, and budgeting observations.",
    "Do not provide legal, tax, investment, credit repair, lending approval, or regulatory advice.",
    "Do not claim to move money, approve transfers, repair credit, guarantee outcomes, or replace a bank.",
    "Advanced transfer, credit, and debt features are subject to partner availability and compliance review."
  ].join(" ");

type ToolPermissions = {
  read?: boolean;
  suggest?: boolean;
  transact?: boolean;
};

type MoneySummaryContext = {
  transactionCount?: number;
  dateRange?: {
    start?: string | null;
    end?: string | null;
  };
  spendByCategory?: Array<{
    category?: string;
    amount?: number;
  }>;
  cashflow?: {
    income?: number;
    expenses?: number;
    net?: number;
  };
  upcomingBills?: Array<{
    name?: string;
    amount?: number;
    nextExpectedDate?: string;
    autopay?: boolean;
  }>;
};

type ChatPayload = {
  provider?: "openai" | "ollama" | "auto";
  model?: string;
  messages?: Array<{
    role?: string;
    content?: string;
  }>;
  toolPermissions?: ToolPermissions;
  summaryContext?: MoneySummaryContext | null;
};

function normalizeMessages(input: ChatPayload["messages"]): OllamaMessage[] {
  if (!Array.isArray(input)) {
    throw new Error("Missing messages array");
  }

  const parsed: OllamaMessage[] = [];
  for (const row of input) {
    const role = row?.role;
    const content = typeof row?.content === "string" ? row.content.trim() : "";

    if (!content) continue;
    if (role !== "user" && role !== "assistant" && role !== "system") {
      continue;
    }

    parsed.push({ role, content });
  }

  if (!parsed.length) {
    throw new Error("Provide at least one non-empty message");
  }

  return parsed.slice(-MAX_MESSAGES);
}

async function runNorthlineAiChat(params: { payload: ChatPayload; messages: OllamaMessage[] }) {
  const openAiConfig = getOpenAiConfig();
  const preferredProvider = params.payload.provider || process.env.NORTHLINE_AI_PROVIDER || "auto";
  const shouldUseOpenAi =
    preferredProvider === "openai" || (preferredProvider === "auto" && openAiConfig.configured);
  const allowLocalFallback =
    preferredProvider === "ollama" ||
    (!process.env.VERCEL && process.env.NORTHLINE_AI_ALLOW_LOCAL_FALLBACK === "true");

  if (shouldUseOpenAi) {
    try {
      return await runOpenAiChat({
        model: params.payload.model,
        messages: params.messages,
        maxOutputTokens: 1400
      });
    } catch (error) {
      if (!allowLocalFallback) {
        throw error;
      }
    }
  }

  const result = await runOllamaChat({
    model: params.payload.model,
    messages: params.messages
  });

  return {
    provider: "ollama" as const,
    ...result
  };
}

function normalizeToolPermissions(input?: ToolPermissions) {
  return {
    read: input?.read !== false,
    suggest: input?.suggest !== false,
    transact: input?.transact === true
  };
}

function summarizeContext(context?: MoneySummaryContext | null) {
  if (!context) return "No financial summary context available.";
  const transactionCount = context.transactionCount ?? 0;
  const start = context.dateRange?.start || "N/A";
  const end = context.dateRange?.end || "N/A";
  const topCategory = (context.spendByCategory || [])
    .slice(0, 3)
    .map((row) => `${row.category || "Unknown"}: $${Number(row.amount || 0).toFixed(2)}`)
    .join(", ");
  const net = Number(context.cashflow?.net || 0).toFixed(2);

  return [
    `Coverage: ${transactionCount} transactions from ${start} to ${end}.`,
    `Cashflow net: $${net}.`,
    `Top spend categories: ${topCategory || "None"}.`
  ].join(" ");
}

function buildCitation(context?: MoneySummaryContext | null) {
  const count = context?.transactionCount ?? 0;
  const start = context?.dateRange?.start || "N/A";
  const end = context?.dateRange?.end || "N/A";
  return `Based on ${count} transactions from ${start} to ${end}.`;
}

function inferActionIntent(text: string) {
  return /(action|plan|next step|do now|queue|approve|fix)/i.test(text);
}

function inferRuleIntent(text: string) {
  return /(categor|rule|merchant|inbox|classification)/i.test(text);
}

async function persistAiProposals(params: {
  latestUserPrompt: string;
  toolPermissions: { read: boolean; suggest: boolean; transact: boolean };
  context?: MoneySummaryContext | null;
}) {
  const proposal = {
    actionsCreated: 0,
    rulesCreated: 0,
    notes: [] as string[]
  };

  if (!params.toolPermissions.suggest) {
    return proposal;
  }

  try {
    const userId = await resolveActiveUserId();
    const shouldCreateAction = inferActionIntent(params.latestUserPrompt);
    const shouldCreateRule = inferRuleIntent(params.latestUserPrompt);

    if (shouldCreateAction) {
      const topCategory = params.context?.spendByCategory?.[0];
      const suggestedCut = topCategory?.amount ? Math.max(10, Math.round(topCategory.amount * 0.1)) : 50;
      await prisma.moneyCopilotAction.create({
        data: {
          userId,
          actionType: "AI Proposed Action",
          status: "PROPOSED",
          expectedOutcome: `Reduce ${topCategory?.category || "discretionary"} spend by $${suggestedCut}/month`,
          downside: "Requires short-term discretionary spending cut",
          requiresStepUp: false
        }
      });
      proposal.actionsCreated += 1;
    }

    if (shouldCreateRule) {
      const topCategory = params.context?.spendByCategory?.[0];
      await prisma.moneyCopilotRecommendation.create({
        data: {
          userId,
          title: "AI categorization rule draft",
          recommendationType: "CATEGORIZATION_RULE",
          rationale: `Rule draft from assistant prompt: default merchant classification toward ${topCategory?.category || "Needs Review"}.`,
          estimatedImpact: 0,
          confidence: 0.74,
          status: "PROPOSED"
        }
      });
      proposal.rulesCreated += 1;
    }

    return proposal;
  } catch (error) {
    if (isDbUnavailableError(error)) {
      proposal.notes.push("Database unavailable; AI proposals were not persisted.");
      return proposal;
    }
    proposal.notes.push(error instanceof Error ? error.message : "Failed to persist AI proposals.");
    return proposal;
  }
}

export async function POST(req: NextRequest) {
  try {
    let payload: ChatPayload;
    try {
      payload = (await req.json()) as ChatPayload;
    } catch {
      return errorJson("Invalid request body", 400);
    }

    const normalizedMessages = normalizeMessages(payload.messages);
    const totalChars = normalizedMessages.reduce(
      (sum: number, msg: (typeof normalizedMessages)[number]) => sum + msg.content.length,
      0
    );
    if (totalChars > MAX_TOTAL_CHARS) {
      return errorJson(`Conversation is too long (${totalChars} chars). Keep it under ${MAX_TOTAL_CHARS}.`, 413);
    }

    const toolPermissions = normalizeToolPermissions(payload.toolPermissions);
    const killSwitchPaused = isKillSwitchPausedFromRequest(req);
    const effectiveToolPermissions = {
      ...toolPermissions,
      suggest: killSwitchPaused ? false : toolPermissions.suggest,
      transact: killSwitchPaused ? false : toolPermissions.transact
    };
    const citation = buildCitation(payload.summaryContext);
    const latestUserPrompt = [...normalizedMessages].reverse().find((msg) => msg.role === "user")?.content || "";

    const systemParts = [SYSTEM_PROMPT];
    systemParts.push(
      `Permissions: read=${effectiveToolPermissions.read}, suggest=${effectiveToolPermissions.suggest}, transact=${effectiveToolPermissions.transact}.`
    );
    if (killSwitchPaused) {
      systemParts.push("Kill switch is paused. Do not queue or execute actions.");
    }
    if (!effectiveToolPermissions.transact) {
      systemParts.push("Do not claim to execute transactions or move money.");
    }
    if (effectiveToolPermissions.read) {
      systemParts.push(`Context: ${summarizeContext(payload.summaryContext)}`);
    } else {
      systemParts.push("Do not use financial summary context; ask for missing data first.");
    }
    systemParts.push(`Always include this exact citation sentence once: "${citation}"`);

    const systemMessage: OllamaMessage = {
      role: "system",
      content: systemParts.join(" ")
    };

    const result = await runNorthlineAiChat({
      payload,
      messages: [systemMessage, ...normalizedMessages]
    });

    const proposals = await persistAiProposals({
      latestUserPrompt,
      toolPermissions: effectiveToolPermissions,
      context: payload.summaryContext
    });

    const replyIncludesCitation = result.reply.toLowerCase().includes("based on ");
    const reply = replyIncludesCitation ? result.reply : `${result.reply}\n\n${citation}`;

    return NextResponse.json({
      ...result,
      reply,
      citation,
      proposals,
      killSwitchPaused
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to call Northline AI", 500);
  }
}
