type OpenAiRole = "system" | "user" | "assistant";

export type OpenAiMessage = {
  role: OpenAiRole;
  content: string;
};

type OpenAiResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  model?: string;
  created_at?: number;
  error?: {
    message?: string;
  };
};

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const OPENAI_TIMEOUT_MS = 60_000;

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout)
  };
}

export function getOpenAiConfig() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
  };
}

export function getOpenAiStatus() {
  const config = getOpenAiConfig();
  return {
    available: config.configured,
    defaultModel: config.model,
    provider: "openai" as const,
    error: config.configured ? null : "OPENAI_API_KEY is not configured."
  };
}

function extractOutputText(payload: OpenAiResponsesPayload) {
  const direct = payload.output_text?.trim();
  if (direct) return direct;

  const nested = (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n")
    .trim();

  return nested || "";
}

function transcriptFromMessages(messages: OpenAiMessage[]) {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");
}

export async function runOpenAiChat(params: {
  model?: string;
  messages: OpenAiMessage[];
  instructions?: string;
  maxOutputTokens?: number;
}) {
  const config = getOpenAiConfig();
  if (!config.configured) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = params.model?.trim() || config.model;
  const systemMessages = params.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const instructions = [params.instructions, systemMessages].filter(Boolean).join("\n\n");
  const input = transcriptFromMessages(params.messages);
  const timer = withTimeoutSignal(OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      cache: "no-store",
      signal: timer.signal,
      body: JSON.stringify({
        model,
        instructions,
        input,
        max_output_tokens: params.maxOutputTokens ?? 1200
      })
    });
    const payload = (await response.json().catch(() => ({}))) as OpenAiResponsesPayload;

    if (!response.ok) {
      throw new Error(payload.error?.message || `OpenAI returned ${response.status}`);
    }

    const reply = extractOutputText(payload);
    if (!reply) {
      throw new Error("OpenAI returned an empty response.");
    }

    return {
      provider: "openai" as const,
      model: payload.model || model,
      createdAt: payload.created_at ? new Date(payload.created_at * 1000).toISOString() : new Date().toISOString(),
      reply
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Unable to complete OpenAI chat request: ${error.message}`);
    }
    throw new Error("Unable to complete OpenAI chat request.");
  } finally {
    timer.clear();
  }
}
