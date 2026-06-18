"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BusinessProfile, GeneratedAsset } from "@/lib/marketpilot/types";
import { marketingSpecialists } from "@/lib/marketpilot/specialists";

export function DashboardClient() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const [profileRes, assetsRes] = await Promise.all([fetch("/api/marketpilot/profile"), fetch("/api/marketpilot/assets")]);
    if (profileRes.ok) {
      const data = await profileRes.json();
      setProfile(data.profile);
    }
    if (assetsRes.ok) {
      const data = await assetsRes.json();
      setAssets(data.assets ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function generatePlan() {
    setLoadingPlan(true);
    setMessage("");
    const res = await fetch("/api/marketpilot/generate/plan", { method: "POST" });
    const data = await res.json();
    setLoadingPlan(false);
    setMessage(res.ok ? "Your 30-day marketing plan is ready." : data.error ?? "Plan generation failed.");
    if (res.ok) await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
      <section className="grid gap-5">
        <div className="rounded-3xl bg-[#10231c] p-6 text-white md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8df0b3]">Today&apos;s Best Marketing Move</p>
          <h2 className="mt-3 text-3xl font-black">
            {profile
              ? `Ask your happiest ${profile.industry} customers for reviews, then turn one review into three social posts.`
              : "Create your business profile so MarketPilot can recommend your first move."}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d8e7dd]">
            This is a recommendation, not a guaranteed result. Review the asset before publishing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["This Week&apos;s Marketing Focus", profile ? `Promote ${profile.main_services || "your core offer"} to ${profile.target_customer || "your best-fit customers"}.` : "Complete onboarding."],
            ["Profile Status", profile ? `${profile.business_name} in ${profile.location}` : "Missing profile"],
            ["Current Challenge", profile?.biggest_challenge || "Add your biggest marketing challenge."],
            ["Goal", profile?.monthly_marketing_goal || "Add a monthly marketing goal."]
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-[#dfe7dd] bg-white p-5">
              <h3 className="font-black" dangerouslySetInnerHTML={{ __html: title }} />
              <p className="mt-2 text-sm leading-6 text-[#647067]">{copy}</p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-[#dfe7dd] bg-white p-5">
          <h2 className="text-2xl font-black">Generate marketing assets</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <button onClick={generatePlan} disabled={loadingPlan} className="rounded-xl bg-[#10231c] px-4 py-4 text-sm font-black text-white disabled:opacity-60">
              {loadingPlan ? "Generating..." : "Generate 30-Day Marketing Plan"}
            </button>
            <Link href="/marketpilot/campaigns" className="rounded-xl bg-[#e9f7ee] px-4 py-4 text-sm font-black text-[#255f3d]">
              Generate Campaign
            </Link>
            <Link href="/marketpilot/social" className="rounded-xl bg-[#eef3fb] px-4 py-4 text-sm font-black text-[#315f8b]">
              Generate Social Posts
            </Link>
            <Link href="/marketpilot/email" className="rounded-xl bg-[#fff4db] px-4 py-4 text-sm font-black text-[#7a5418]">
              Generate Email Sequence
            </Link>
          </div>
          {message ? <p className="mt-4 rounded-xl bg-[#f6f8f3] p-3 text-sm font-bold text-[#38443d]">{message}</p> : null}
        </div>
      </section>

      <aside className="rounded-2xl border border-[#dfe7dd] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Recent assets</h2>
          <Link href="/marketpilot/assets" className="text-sm font-black text-[#255f3d]">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {assets.slice(0, 5).map((asset) => (
            <Link key={`${asset.type}-${asset.id}`} href={`/marketpilot/assets?asset=${asset.type}-${asset.id}`} className="rounded-xl bg-[#f6f8f3] p-4">
              <p className="text-xs font-black uppercase text-[#3f7d58]">{asset.type.replace("_", " ")}</p>
              <h3 className="mt-1 font-black">{asset.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#647067]">{asset.preview}</p>
            </Link>
          ))}
          {!assets.length ? <p className="text-sm leading-6 text-[#647067]">No generated assets yet.</p> : null}
        </div>
      </aside>

      <section className="rounded-2xl border border-[#dfe7dd] bg-white p-5 xl:col-span-2">
        <h2 className="text-2xl font-black">AI Marketing Leadership Team</h2>
        <p className="mt-2 text-sm leading-6 text-[#647067]">
          Every plan and asset is prompted through these marketing lenses so recommendations connect strategy, messaging, channels, funnel, and analytics.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {marketingSpecialists.map((specialist) => (
            <article key={specialist.name} className="rounded-xl bg-[#f6f8f3] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#3f7d58]">{specialist.shortName}</p>
              <h3 className="mt-2 font-black">{specialist.name}</h3>
              <p className="mt-2 text-xs leading-5 text-[#647067]">{specialist.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
