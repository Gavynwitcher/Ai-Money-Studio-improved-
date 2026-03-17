export type AiToolPermissions = {
  read: boolean;
  suggest: boolean;
  transact: boolean;
};

export const AI_PERMISSIONS_STORAGE_KEY = "aimoneycopilot.ai.permissions.v1";

export const DEFAULT_AI_TOOL_PERMISSIONS: AiToolPermissions = {
  read: true,
  suggest: true,
  transact: false
};

export function parseAiToolPermissions(raw: string | null | undefined): AiToolPermissions {
  if (!raw) return DEFAULT_AI_TOOL_PERMISSIONS;
  try {
    const parsed = JSON.parse(raw) as Partial<AiToolPermissions>;
    return {
      read: typeof parsed.read === "boolean" ? parsed.read : DEFAULT_AI_TOOL_PERMISSIONS.read,
      suggest: typeof parsed.suggest === "boolean" ? parsed.suggest : DEFAULT_AI_TOOL_PERMISSIONS.suggest,
      transact: typeof parsed.transact === "boolean" ? parsed.transact : DEFAULT_AI_TOOL_PERMISSIONS.transact
    };
  } catch {
    return DEFAULT_AI_TOOL_PERMISSIONS;
  }
}

export function loadAiToolPermissions(): AiToolPermissions {
  if (typeof window === "undefined") return DEFAULT_AI_TOOL_PERMISSIONS;
  return parseAiToolPermissions(window.localStorage.getItem(AI_PERMISSIONS_STORAGE_KEY));
}

export function saveAiToolPermissions(value: AiToolPermissions) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AI_PERMISSIONS_STORAGE_KEY, JSON.stringify(value));
}

