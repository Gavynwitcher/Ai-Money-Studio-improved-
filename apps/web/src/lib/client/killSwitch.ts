export const KILL_SWITCH_EVENT = "money-copilot-kill-switch-changed";

export async function getKillSwitchState() {
  const res = await fetch("/api/money-copilot/kill-switch", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load kill switch state");
  }
  const payload = (await res.json()) as { paused?: boolean };
  return payload.paused === true;
}

export async function setKillSwitchState(paused: boolean) {
  const res = await fetch("/api/money-copilot/kill-switch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paused })
  });
  if (!res.ok) {
    throw new Error("Failed to update kill switch");
  }
  const payload = (await res.json()) as { paused?: boolean };
  return payload.paused === true;
}

export function broadcastKillSwitchState(paused: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(KILL_SWITCH_EVENT, { detail: { paused } }));
}

