"use client";

import { FormEvent, useState } from "react";
import { MarkdownCard } from "./markdown-card";

type GeneratorType = "campaign" | "social" | "email";
type GeneratorField = readonly [name: string, label: string, options: readonly string[]];

const campaignFields = [
  ["campaignGoal", "Campaign goal", ["leads", "bookings", "sales", "reviews", "awareness", "reactivation"]],
  ["offerType", "Offer type", ["discount", "free consultation", "bundle", "seasonal promo", "limited-time offer"]],
  ["platform", "Platform", ["email", "Instagram", "Facebook", "Google Business Profile", "SMS", "landing page"]]
] as const;

const socialFields = [
  ["platform", "Platform", ["Instagram", "Facebook", "TikTok", "LinkedIn", "Google Business Profile"]],
  ["theme", "Content theme", ["education", "behind the scenes", "before and after", "customer proof", "seasonal offer"]],
  ["frequency", "Posting frequency", ["3 posts/week", "5 posts/week", "daily"]]
] as const;

const emailFields = [
  ["emailGoal", "Email goal", ["bookings", "reactivation", "reviews", "launch offer", "newsletter"]],
  ["audience", "Audience", ["new leads", "past customers", "VIP customers", "cold list", "local prospects"]],
  ["offer", "Offer/message", ["free consultation", "limited-time promo", "new service", "review request", "educational value"]]
] as const;

const config = {
  campaign: { endpoint: "/api/marketpilot/generate/campaign", fields: campaignFields, button: "Generate Campaign" },
  social: { endpoint: "/api/marketpilot/generate/social", fields: socialFields, button: "Generate Social Content" },
  email: { endpoint: "/api/marketpilot/generate/email", fields: emailFields, button: "Generate Email" }
} satisfies Record<GeneratorType, { endpoint: string; fields: readonly GeneratorField[]; button: string }>;

export function GeneratorForm({ type }: { type: GeneratorType }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const formConfig: { endpoint: string; fields: readonly GeneratorField[]; button: string } = config[type];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch(formConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
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
      <form onSubmit={submit} className="rounded-2xl border border-[#dfe7dd] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {formConfig.fields.map(([name, label, options]) => (
            <label key={name} className="grid gap-2 text-sm font-black">
              {label}
              <select name={name} className="rounded-xl border border-[#d8e1d7] bg-white px-4 py-3 outline-none focus:border-[#3f7d58]">
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <button disabled={loading} className="mt-5 rounded-xl bg-[#10231c] px-5 py-4 font-black text-white disabled:opacity-60">
          {loading ? "Generating..." : formConfig.button}
        </button>
        {message ? <p className="mt-4 rounded-xl bg-[#f6f8f3] p-3 text-sm font-bold text-[#38443d]">{message}</p> : null}
      </form>
      {content ? <MarkdownCard content={content} /> : null}
    </div>
  );
}
