"use client";

import { FormEvent, useEffect, useState } from "react";
import type { BusinessProfile } from "@/lib/marketpilot/types";

const emptyProfile: BusinessProfile = {
  business_name: "",
  industry: "Dog grooming",
  location: "",
  website_url: "",
  target_customer: "",
  main_services: "",
  brand_tone: "Friendly, clear, trustworthy",
  monthly_marketing_goal: "",
  current_channels: "",
  biggest_challenge: ""
};

const fields = [
  ["business_name", "Business name"],
  ["industry", "Industry"],
  ["location", "Location"],
  ["website_url", "Website URL"],
  ["target_customer", "Target customer"],
  ["main_services", "Main services/products"],
  ["brand_tone", "Brand tone"],
  ["monthly_marketing_goal", "Monthly marketing goal"],
  ["current_channels", "Current marketing channels"],
  ["biggest_challenge", "Biggest marketing challenge"]
] as const;

export function ProfileForm() {
  const [profile, setProfile] = useState<BusinessProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/marketpilot/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/marketpilot/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Business profile saved." : data.error ?? "Could not save profile.");
  }

  if (loading) {
    return <div className="rounded-2xl bg-white p-5 text-sm font-bold text-[#647067]">Loading profile...</div>;
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-[#dfe7dd] bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className={key === "biggest_challenge" || key === "main_services" ? "grid gap-2 md:col-span-2" : "grid gap-2"}>
            <span className="text-sm font-black">{label}</span>
            {key === "biggest_challenge" || key === "main_services" || key === "target_customer" ? (
              <textarea
                value={profile[key] ?? ""}
                onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))}
                className="min-h-28 rounded-xl border border-[#d8e1d7] px-4 py-3 outline-none focus:border-[#3f7d58]"
                required
              />
            ) : (
              <input
                value={profile[key] ?? ""}
                onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))}
                className="rounded-xl border border-[#d8e1d7] px-4 py-3 outline-none focus:border-[#3f7d58]"
                required={key !== "website_url"}
              />
            )}
          </label>
        ))}
      </div>
      {message ? <p className="mt-4 rounded-xl bg-[#eef8f0] p-3 text-sm font-bold text-[#255f3d]">{message}</p> : null}
      <button disabled={saving} className="mt-5 rounded-xl bg-[#10231c] px-5 py-4 font-black text-white disabled:opacity-60">
        {saving ? "Saving..." : "Save business profile"}
      </button>
    </form>
  );
}
