"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { accounts, spendingCategories, transactions } from "@/data/mock-finance";
import { currency } from "@/lib/utils";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantStatus = {
  provider: string;
  openai?: {
    available?: boolean;
    defaultModel?: string;
    error?: string | null;
  };
  ollama?: {
    available?: boolean;
    defaultModel?: string;
    error?: string | null;
  };
};

const starterPrompts = [
  "Review my cash flow",
  "Find spending pressure",
  "Prep for payroll"
];

const promptText: Record<(typeof starterPrompts)[number], string> = {
  "Review my cash flow": "Summarize my cash flow risk using the dashboard data.",
  "Find spending pressure": "Which spending categories deserve attention this week?",
  "Prep for payroll": "What should I review before the next payroll reserve check?"
};

function buildSummaryContext() {
  const income = transactions
    .filter((transaction) => transaction.direction === "inflow")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.direction === "outflow")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  return {
    transactionCount: transactions.length,
    dateRange: {
      start: transactions[transactions.length - 1]?.date ?? null,
      end: transactions[0]?.date ?? null
    },
    spendByCategory: spendingCategories.map((category) => ({
      category: category.label,
      amount: category.value
    })),
    cashflow: {
      income,
      expenses,
      net: income - expenses
    },
    upcomingBills: [
      {
        name: "Payroll reserve review",
        amount: 5400,
        nextExpectedDate: "Next Friday",
        autopay: false
      },
      {
        name: "Estimated tax reserve check",
        amount: 1800,
        nextExpectedDate: "Month end",
        autopay: false
      }
    ]
  };
}

function buildAccountContext() {
  const accountLines = accounts
    .map(
      (account) =>
        `${account.institutionName} ${account.name}: current ${currency(account.currentBalance)}, available ${currency(
          account.availableBalance
        )}, type ${account.subtype}, mask ${account.mask}`
    )
    .join("\n");
  const transactionLines = transactions
    .map(
      (transaction) =>
        `${transaction.date} ${transaction.merchant}: ${transaction.direction === "inflow" ? "+" : "-"}${currency(
          Math.abs(transaction.amount)
        )}, category ${transaction.category}, account ${transaction.accountName}, status ${transaction.status}`
    )
    .join("\n");

  return [
    "Northline connected account context:",
    accountLines,
    "",
    "Recent transaction context:",
    transactionLines
  ].join("\n");
}

export function NorthlineAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about the connected accounts, recent transactions, cash-flow patterns, and budgeting context in Northline. I can help interpret the data, but I will not move money or provide legal, tax, investment, credit repair, or lending approval advice."
    }
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const summaryContext = useMemo(() => buildSummaryContext(), []);
  const accountContext = useMemo(() => buildAccountContext(), []);
  const openAiReady = status?.openai?.available === true;
  const providerTone = openAiReady ? "success" : status?.provider === "ollama" ? "warning" : "muted";
  const providerLabel = openAiReady ? "OpenAI connected" : status?.provider === "ollama" ? "Local fallback" : "Checking";

  useEffect(() => {
    let active = true;
    fetch("/api/assistant/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: AssistantStatus) => {
        if (active) setStatus(payload);
      })
      .catch(() => {
        if (active) setStatus({ provider: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, []);

  function friendlyError(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes("quota") || lower.includes("billing")) {
      return "OpenAI is connected, but the OpenAI project quota or billing limit needs attention before Northline AI can answer live.";
    }
    if (lower.includes("openai_api_key")) {
      return "OpenAI is not ready yet. Add the OpenAI API key in Vercel and redeploy.";
    }
    if (lower.includes("ollama") || lower.includes("localhost")) {
      return "Northline AI is configured for OpenAI in production. The local Ollama fallback is not used on the live site.";
    }
    return message || "Northline AI could not respond. Please try again.";
  }

  async function sendMessage(nextPrompt?: string) {
    const prompt = (nextPrompt ?? input).trim();
    if (!prompt || isPending) return;

    setError("");
    setInput("");

    const nextMessages: AssistantMessage[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "auto",
          messages: [
            ...nextMessages.map((message) => ({
              role: message.role,
              content: message.content
            })),
            {
              role: "user",
              content: `Use this Northline account context as the only financial data source for the answer:\n${accountContext}`
            }
          ],
          toolPermissions: {
            read: true,
            suggest: true,
            transact: false
          },
          summaryContext
        })
      });
      const payload = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || !payload.reply) {
        throw new Error(payload.error || "Northline AI could not respond.");
      }
      setMessages((current) => [...current, { role: "assistant", content: payload.reply || "" }]);
    } catch (nextError) {
      setError(friendlyError(nextError instanceof Error ? nextError.message : "Northline AI could not respond."));
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void sendMessage();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.62fr_1.38fr]">
      <div className="grid gap-5">
        <Card className="rounded-[32px] border-[rgba(11,31,51,0.08)] bg-white/95 p-6 shadow-[0_24px_70px_rgba(11,31,51,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                Production AI
              </p>
              <h2 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                OpenAI for connected-account insight
              </h2>
            </div>
            <Badge tone={providerTone}>{providerLabel}</Badge>
          </div>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            Northline uses OpenAI in production to interpret account visibility, transaction history, cash-flow patterns, and budgeting context.
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="rounded-[22px] border border-[var(--line)] bg-slate-50/80 px-4 py-3">
              <p className="font-semibold text-[var(--navy)]">OpenAI model</p>
              <p className="mt-1 text-[var(--muted)]">{status?.openai?.defaultModel ?? "Configured by OPENAI_MODEL"}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-slate-50/80 px-4 py-3">
              <p className="font-semibold text-[var(--navy)]">Data boundary</p>
              <p className="mt-1 text-[var(--muted)]">Connected accounts, transactions, cash flow, categories, and budgeting context only.</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[32px] border-[rgba(11,31,51,0.08)] bg-[linear-gradient(135deg,#ffffff_0%,#f3fbfb_100%)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Guardrails</p>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
            <p>Answers stay grounded in the account and transaction data available in Northline.</p>
            <p>Money movement, legal, tax, investment, credit repair, and lending decisions stay outside the assistant.</p>
            <p>If data is missing, Northline AI should ask for a bank sync or clearer context instead of guessing.</p>
          </div>
        </Card>
      </div>

      <Card className="rounded-[36px] border-[rgba(11,31,51,0.08)] bg-white/95 p-0 shadow-[0_30px_90px_rgba(11,31,51,0.10)]">
        <div className="rounded-t-[36px] bg-[linear-gradient(135deg,#0b1f33_0%,#163d5d_58%,#1d7778_100%)] px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">Northline AI</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-white">
                Ask about your banking picture
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Get plain-language observations from your connected account demo, cash-flow summary, and transaction categories.
              </p>
            </div>
            <Badge tone="teal">Demo data</Badge>
          </div>
        </div>

        <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm font-semibold text-[var(--navy)]">Start with a guided question</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() =>
                startTransition(() => {
                  void sendMessage(promptText[prompt]);
                })
              }
              className="rounded-[22px] border border-[var(--line)] bg-slate-50/80 px-4 py-4 text-left text-sm font-semibold text-[var(--navy)] transition hover:-translate-y-0.5 hover:border-[var(--ocean)] hover:bg-white hover:shadow-[0_14px_34px_rgba(11,31,51,0.08)]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-6 grid max-h-[520px] gap-4 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-[24px] bg-[var(--navy)] px-5 py-4 text-sm leading-7 text-white"
                  : "max-w-[88%] rounded-[24px] border border-[var(--line)] bg-slate-50/90 px-5 py-4 text-sm leading-7 text-[var(--navy)] shadow-[0_12px_30px_rgba(11,31,51,0.04)]"
              }
            >
              {message.content}
            </div>
          ))}
          {isPending ? (
            <div className="max-w-[80%] rounded-[24px] border border-[var(--line)] bg-slate-50/90 px-5 py-4 text-sm text-[var(--muted)]">
              Northline AI is reviewing the connected-account context...
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-5 rounded-[22px] border border-[rgba(178,67,67,0.18)] bg-[rgba(178,67,67,0.09)] px-4 py-3 text-sm leading-7 text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <label className="text-sm font-semibold text-[var(--navy)]" htmlFor="northline-ai-message">
            Ask a question
          </label>
          <textarea
            id="northline-ai-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            placeholder="Example: What does my recent cash flow suggest I should review before payroll?"
            className="min-h-28 rounded-[24px] border border-[var(--line)] bg-white px-5 py-4 text-sm leading-7 text-[var(--navy)] outline-none transition focus:border-[var(--ocean)]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-xs leading-6 text-[var(--muted)]">
              Responses are generated from the supplied Northline demo context and should be reviewed before decisions are made.
            </p>
            <Button type="submit" disabled={isPending || !input.trim()}>
              Ask Northline AI
            </Button>
          </div>
        </form>
        </div>
      </Card>
    </div>
  );
}
