type OllamaRole = "system" | "user" | "assistant";

export type OllamaMessage = {
  role: OllamaRole;
  content: string;
};

type OllamaChatResponse = {
  model?: string;
  message?: {
    role?: string;
    content?: string;
  };
  created_at?: string;
};

type OllamaTagsResponse = {
  models?: Array<{
    name?: string;
  }>;
};

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2";
const OLLAMA_TIMEOUT_MS = 60_000;

function normalizeBaseUrl(value?: string): string {
  const raw = value?.trim() || DEFAULT_OLLAMA_BASE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function isLocalhostUrl(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout)
  };
}

export function getOllamaConfig() {
  const baseUrl = normalizeBaseUrl(process.env.OLLAMA_BASE_URL);
  const model = process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  return { baseUrl, model };
}

export async function getOllamaStatus() {
  const { baseUrl, model } = getOllamaConfig();
  if (process.env.VERCEL === "1" && isLocalhostUrl(baseUrl)) {
    return {
      available: false,
      baseUrl,
      defaultModel: model,
      models: [] as string[],
      error:
        "OLLAMA_BASE_URL points to localhost inside Vercel. Use a public Ollama endpoint (or run the app locally with Ollama)."
    };
  }
  const timer = withTimeoutSignal(OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      cache: "no-store",
      signal: timer.signal
    });
    const payload = (await res.json().catch(() => ({}))) as OllamaTagsResponse & { error?: string };

    if (!res.ok) {
      throw new Error(payload.error || `Ollama returned ${res.status}`);
    }

    return {
      available: true,
      baseUrl,
      defaultModel: model,
      models: (payload.models || []).map((row) => row.name).filter((name): name is string => Boolean(name))
    };
  } catch (error) {
    return {
      available: false,
      baseUrl,
      defaultModel: model,
      models: [] as string[],
      error:
        error instanceof Error
          ? `Unable to reach Ollama at ${baseUrl}. ${error.message}`
          : `Unable to reach Ollama at ${baseUrl}.`
    };
  } finally {
    timer.clear();
  }
}

export async function runOllamaChat(params: { model?: string; messages: OllamaMessage[] }) {
  const { baseUrl, model: fallbackModel } = getOllamaConfig();
  if (process.env.VERCEL === "1" && isLocalhostUrl(baseUrl)) {
    throw new Error(
      "OLLAMA_BASE_URL points to localhost inside Vercel. Set OLLAMA_BASE_URL to a public Ollama host."
    );
  }
  const model = params.model?.trim() || fallbackModel;
  const timer = withTimeoutSignal(OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: timer.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: params.messages
      })
    });
    const payload = (await res.json().catch(() => ({}))) as OllamaChatResponse & { error?: string };

    if (!res.ok) {
      throw new Error(payload.error || `Ollama returned ${res.status}`);
    }

    const reply = payload.message?.content?.trim();
    if (!reply) {
      throw new Error("Ollama response did not include assistant content.");
    }

    return {
      model: payload.model || model,
      createdAt: payload.created_at || new Date().toISOString(),
      reply
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Unable to complete Ollama chat request: ${error.message}`);
    }
    throw new Error("Unable to complete Ollama chat request.");
  } finally {
    timer.clear();
  }
}
