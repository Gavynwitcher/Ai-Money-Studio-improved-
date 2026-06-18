"use client";

import { useEffect, useState } from "react";
import type { GeneratedAsset } from "@/lib/marketpilot/types";
import { MarkdownCard } from "./markdown-card";

export function AssetsClient() {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [selected, setSelected] = useState<GeneratedAsset | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/marketpilot/assets");
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not load assets.");
        return;
      }
      setAssets(data.assets ?? []);
      setSelected(data.assets?.[0] ?? null);
    }
    void load();
  }, []);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.42fr_1fr]">
      <aside className="rounded-2xl border border-[#dfe7dd] bg-white p-4">
        <h2 className="text-xl font-black">Generated assets</h2>
        {message ? <p className="mt-3 rounded-xl bg-[#fff4db] p-3 text-sm font-bold text-[#7a5418]">{message}</p> : null}
        <div className="mt-4 grid gap-3">
          {assets.map((asset) => (
            <button
              key={`${asset.type}-${asset.id}`}
              onClick={() => setSelected(asset)}
              className={`rounded-xl p-4 text-left ${selected?.id === asset.id ? "bg-[#10231c] text-white" : "bg-[#f6f8f3] text-[#10231c]"}`}
            >
              <p className="text-xs font-black uppercase opacity-75">{asset.type.replace("_", " ")}</p>
              <h3 className="mt-1 font-black">{asset.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm opacity-80">{asset.preview}</p>
              <p className="mt-2 text-xs font-bold opacity-70">{new Date(asset.created_at).toLocaleDateString()}</p>
            </button>
          ))}
          {!assets.length ? <p className="text-sm leading-6 text-[#647067]">No assets yet. Generate a plan, campaign, social post, or email first.</p> : null}
        </div>
      </aside>
      <section>{selected ? <MarkdownCard content={selected.content} /> : null}</section>
    </div>
  );
}
