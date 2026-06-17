"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMarketPilotBrowserClient } from "@/lib/marketpilot/supabase-browser";
import { supabaseIsConfigured } from "@/lib/marketpilot/config";

export function MarketPilotAuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (!supabaseIsConfigured()) {
      const res = await fetch("/api/marketpilot/demo-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Could not start demo session.");
        setLoading(false);
        return;
      }
      router.push("/marketpilot/dashboard");
      router.refresh();
      return;
    }

    const supabase = createMarketPilotBrowserClient();
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    router.push("/marketpilot/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm font-bold">
        Email
        <input name="email" type="email" required className="rounded-xl border border-[#d8e1d7] px-4 py-3 outline-none focus:border-[#3f7d58]" />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Password
        <input
          name="password"
          type="password"
          minLength={6}
          required
          className="rounded-xl border border-[#d8e1d7] px-4 py-3 outline-none focus:border-[#3f7d58]"
        />
      </label>
      {message ? <p className="rounded-xl bg-[#fff4db] p-3 text-sm font-semibold text-[#7a5418]">{message}</p> : null}
      <button disabled={loading} className="rounded-xl bg-[#10231c] px-5 py-4 font-black text-white disabled:opacity-60">
        {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
      </button>
      <p className="text-sm text-[#647067]">
        {mode === "signup" ? "Already have an account? " : "Need an account? "}
        <Link className="font-black text-[#255f3d]" href={mode === "signup" ? "/marketpilot/login" : "/marketpilot/signup"}>
          {mode === "signup" ? "Log in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
