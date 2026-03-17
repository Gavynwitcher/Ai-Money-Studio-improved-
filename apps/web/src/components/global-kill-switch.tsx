"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  broadcastKillSwitchState,
  getKillSwitchState,
  setKillSwitchState
} from "@/lib/client/killSwitch";

export function GlobalKillSwitch() {
  const { data: session, status } = useSession();
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const authenticated = Boolean(session?.user?.email);

  useEffect(() => {
    if (status === "loading") return;
    if (!authenticated) {
      setLoading(false);
      setPaused(false);
      return;
    }

    let canceled = false;

    async function load() {
      try {
        const value = await getKillSwitchState();
        if (!canceled) setPaused(value);
      } catch {
        if (!canceled) setPaused(false);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    void load();
    return () => {
      canceled = true;
    };
  }, [authenticated, status]);

  async function toggle() {
    if (!authenticated || loading || updating) return;
    setUpdating(true);
    try {
      const next = await setKillSwitchState(!paused);
      setPaused(next);
      broadcastKillSwitchState(next);
    } finally {
      setUpdating(false);
    }
  }

  if (status === "loading") {
    return (
      <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        Kill Switch...
      </span>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || updating}
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${
        paused ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-emerald-600 text-white hover:bg-emerald-500"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      title="Pause all automations instantly"
    >
      Kill Switch: {loading ? "Loading" : paused ? "Paused" : "Active"}
    </button>
  );
}
