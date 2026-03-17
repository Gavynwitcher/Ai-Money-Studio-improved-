"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PlaidConnectCard, PlaidStatusPayload } from "@/components/plaid-connect-card";
import { PageDataState } from "@/components/page-data-state";
import { loadAiToolPermissions, AiToolPermissions } from "@/lib/client/aiPermissions";
import { getKillSwitchState, KILL_SWITCH_EVENT } from "@/lib/client/killSwitch";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type OllamaStatus = {
  available: boolean;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  error?: string;
};

type SummaryContext = {
  transactionCount: number;
  dateRange: { start: string | null; end: string | null };
  cashflow: { income: number; expenses: number; net: number };
  spendByCategory: Array<{ category: string; amount: number }>;
  upcomingBills: Array<{ name: string; amount: number; nextExpectedDate: string; autopay: boolean }>;
};

type ChatResponse = {
  reply: string;
  model: string;
  createdAt: string;
  citation?: string;
  proposals?: {
    actionsCreated: number;
    rulesCreated: number;
    notes: string[];
  };
  error?: string;
};

type AuthStatus = {
  authenticated: boolean;
  signInPath: string;
};

type PlaidControls = {
  connect: () => void;
  sync: () => void;
  retry: () => void;
};

const STARTER_MESSAGE: ChatMessage = {
  id: "starter",
  role: "assistant",
  content:
    "I can analyze your spend summary, propose concrete next actions, and draft categorization rules. I will cite the transaction range used."
};

function inferErrorCode(message: string) {
  if (message.includes("P1001") || message.includes("ECONNREFUSED") || message.includes("database")) return "DB_UNAVAILABLE";
  if (message.includes("Ollama")) return "OLLAMA_UNAVAILABLE";
  if (message.includes("Plaid")) return "PLAID_ERROR";
  return "UNKNOWN";
}

export default function AssistantPage() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [summary, setSummary] = useState<SummaryContext | null>(null);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [plaidStatus, setPlaidStatus] = useState<PlaidStatusPayload | null>(null);
  const [plaidControls, setPlaidControls] = useState<PlaidControls | null>(null);
  const [permissions, setPermissions] = useState<AiToolPermissions>(loadAiToolPermissions());
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [dbFallback, setDbFallback] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [proposalFeedback, setProposalFeedback] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [killSwitchPaused, setKillSwitchPaused] = useState(false);
  const handlePlaidLinked = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    let canceled = false;

    async function loadStatus() {
      try {
        const [authRes, statusRes, summaryRes, paused] = await Promise.all([
          fetch("/api/auth/status", { cache: "no-store" }),
          fetch("/api/ollama/status", { cache: "no-store" }),
          fetch("/api/money-copilot/summary", { cache: "no-store" }),
          getKillSwitchState().catch(() => false)
        ]);
        const authPayload = (await authRes.json()) as AuthStatus;
        const statusPayload = (await statusRes.json()) as OllamaStatus;
        const summaryPayload = (await summaryRes.json()) as SummaryContext;

        if (!authRes.ok) {
          throw new Error("Failed to resolve auth status");
        }
        if (!statusRes.ok) {
          throw new Error((statusPayload as { error?: string }).error || "Failed to load Ollama status");
        }
        if (!summaryRes.ok) {
          throw new Error("Failed to load summary context");
        }

        if (!canceled) {
          setAuth(authPayload);
          setStatus(statusPayload);
          setSummary(summaryPayload);
          setDbFallback(summaryRes.headers.get("x-data-source") === "fallback");
          setKillSwitchPaused(paused);
          const firstModel = statusPayload.models[0];
          setSelectedModel(firstModel || statusPayload.defaultModel);
        }
      } catch (err) {
        if (!canceled) {
          const message = err instanceof Error ? err.message : "Failed to load Ollama status";
          setError(message);
          setErrorCode(inferErrorCode(message));
        }
      } finally {
        if (!canceled) setLoadingStatus(false);
      }
    }

    loadStatus();
    setPermissions(loadAiToolPermissions());
    return () => {
      canceled = true;
    };
  }, [refreshNonce]);

  useEffect(() => {
    function onKillSwitchChanged(event: Event) {
      const payload = (event as CustomEvent<{ paused?: boolean }>).detail;
      if (payload && typeof payload.paused === "boolean") {
        setKillSwitchPaused(payload.paused);
      }
    }

    window.addEventListener(KILL_SWITCH_EVENT, onKillSwitchChanged as EventListener);
    return () => window.removeEventListener(KILL_SWITCH_EVENT, onKillSwitchChanged as EventListener);
  }, []);

  const chatPayload = useMemo(
    () =>
      messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
    [messages]
  );

  const pageState = useMemo(() => {
    if (loadingStatus) return null;
    if (auth && !auth.authenticated) return "unauthed" as const;
    if (error) return "error" as const;
    if (dbFallback) return "db_unavailable" as const;
    if (plaidStatus?.configured && !plaidStatus.connected) return "plaid_not_connected" as const;
    if (plaidStatus?.connected && (summary?.transactionCount ?? 0) === 0) return "connected_empty" as const;
    if (status && !status.available) return "error" as const;
    return null;
  }, [auth, dbFallback, error, loadingStatus, plaidStatus, status, summary?.transactionCount]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || killSwitchPaused) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed
    };

    const nextMessages = [...messages, userMessage];
    const currentPermissions = loadAiToolPermissions();
    setPermissions(currentPermissions);
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    setProposalFeedback(null);

    try {
      const res = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: selectedModel || status?.defaultModel,
          messages: [...chatPayload, { role: "user", content: trimmed }],
          toolPermissions: currentPermissions,
          summaryContext: currentPermissions.read ? summary : null
        })
      });
      const payload = (await res.json()) as ChatResponse;
      if (!res.ok) {
        throw new Error(payload.error || "Failed to get assistant reply");
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: payload.reply
      };
      setMessages([...nextMessages, assistantMessage]);
      if (payload.model) setSelectedModel(payload.model);
      if (payload.proposals && (payload.proposals.actionsCreated > 0 || payload.proposals.rulesCreated > 0 || payload.proposals.notes.length > 0)) {
        const notes = payload.proposals.notes.length > 0 ? ` Notes: ${payload.proposals.notes.join(" ")}` : "";
        setProposalFeedback(
          `AI proposals: ${payload.proposals.actionsCreated} action(s), ${payload.proposals.rulesCreated} rule draft(s).${notes}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
      setErrorCode(inferErrorCode(message));
    } finally {
      setSending(false);
    }
  }

  const availableModels = status?.models || [];
  const hasModels = availableModels.length > 0;

  return (
    <div className="space-y-8">
      <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Local Agent</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Ollama Chat Agent</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          Permission-aware assistant with spend summaries, action proposals, and categorization rule drafts.
        </p>
      </section>

      <PlaidConnectCard
        compact
        onStatusChange={setPlaidStatus}
        onControlsReady={setPlaidControls}
        onLinked={handlePlaidLinked}
      />

      {loadingStatus ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Checking assistant status...</section>
      ) : null}

      {pageState ? (
        <PageDataState
          kind={pageState}
          signInPath={auth?.signInPath}
          emptyMessage="No transactions yet. Sync now so the assistant can reason over real data."
          errorCode={errorCode || (!status?.available ? "OLLAMA_UNAVAILABLE" : null)}
          errorMessage={error || status?.error || null}
          onConnect={plaidControls?.connect}
          onSync={plaidControls?.sync}
          onRetry={() => {
            plaidControls?.retry();
            setRefreshNonce((value) => value + 1);
          }}
        />
      ) : null}

      {!loadingStatus && status ? (
        <section
          className={`rounded-3xl border p-5 text-sm md:p-6 ${
            status.available ? "border-emerald-200 bg-emerald-50/80 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em]">Connection</p>
              <p className="mt-1 font-semibold">{status.available ? "Connected" : "Unavailable"}</p>
              <p className="mt-1 text-xs">Endpoint: {status.baseUrl}</p>
            </div>
            <div className="min-w-[220px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em]" htmlFor="model-picker">
                Model
              </label>
              <select
                id="model-picker"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
                value={selectedModel}
                disabled={!status.available || sending}
                onChange={(event) => setSelectedModel(event.target.value)}
              >
                {hasModels
                  ? availableModels.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  : [status.defaultModel].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-semibold uppercase tracking-[0.08em] ${permissions.read ? "bg-emerald-200/70 text-emerald-900" : "bg-slate-200 text-slate-700"}`}>
              Read {permissions.read ? "On" : "Off"}
            </span>
            <span className={`rounded-full px-2.5 py-1 font-semibold uppercase tracking-[0.08em] ${permissions.suggest ? "bg-emerald-200/70 text-emerald-900" : "bg-slate-200 text-slate-700"}`}>
              Suggest {permissions.suggest ? "On" : "Off"}
            </span>
            <span className={`rounded-full px-2.5 py-1 font-semibold uppercase tracking-[0.08em] ${permissions.transact ? "bg-rose-200 text-rose-900" : "bg-slate-200 text-slate-700"}`}>
              Transact {permissions.transact ? "On" : "Off"}
            </span>
            <Link href="/settings" className="rounded-full border border-slate-300 bg-white px-3 py-1 font-semibold uppercase tracking-[0.08em] text-slate-800">
              Manage permissions
            </Link>
          </div>
          {!status.available && status.error ? <p className="mt-3 text-sm">{status.error}</p> : null}
        </section>
      ) : null}

      {proposalFeedback ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">{proposalFeedback}</section>
      ) : null}

      {killSwitchPaused ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          Kill switch is paused. Assistant action and rule tooling is disabled until you switch it back to Active.
        </section>
      ) : null}

      {error ? <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</section> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Conversation</p>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-100"
            onClick={() => {
              setMessages([STARTER_MESSAGE]);
              setError(null);
            }}
            disabled={sending}
          >
            Clear
          </button>
        </div>

        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "assistant" ? "bg-slate-100 text-slate-800" : "ml-auto bg-emerald-600 text-white"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {sending ? <div className="max-w-[90%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">Thinking...</div> : null}
        </div>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="agent-input">
            Ask Ollama
          </label>
          <textarea
            id="agent-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for spending diagnosis, concrete 7-day plan, or categorization rule ideas..."
            className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            disabled={sending || !status?.available || killSwitchPaused}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Assistant uses your current tool permissions and cites transaction coverage when summary context is available.
            </p>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={sending || !status?.available || !input.trim() || killSwitchPaused}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
