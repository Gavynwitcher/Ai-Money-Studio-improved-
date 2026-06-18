"use client";

import { useState } from "react";
import { MarkdownCard } from "./markdown-card";

export function PlanClient() {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/marketpilot/generate/plan", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Generation failed.");
      return;
    }
    setContent(data.asset.content);
    setMessage("Saved to your asset library.");
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-[#dfe7dd] bg-white p-5">
        <h2 className="text-2xl font-black">30-day marketing plan generator</h2>
        <p className="mt-2 text-sm leading-6 text-[#647067]">
          Uses your business profile to generate strategy suggestions, a content calendar, campaign ideas, email ideas, local SEO topics, and weekly actions.
        </p>
        <button onClick={generate} disabled={loading} className="mt-5 rounded-xl bg-[#10231c] px-5 py-4 font-black text-white disabled:opacity-60">
          {loading ? "Generating plan..." : "Generate 30-Day Marketing Plan"}
        </button>
        {message ? <p className="mt-4 rounded-xl bg-[#f6f8f3] p-3 text-sm font-bold text-[#38443d]">{message}</p> : null}
      </div>
      {content ? <MarkdownCard content={content} /> : null}
    </div>
  );
}
