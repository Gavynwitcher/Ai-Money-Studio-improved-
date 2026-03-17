"use client";

import { useEffect, useMemo, useState } from "react";
import { permissions } from "@/data/money-copilot";
import {
  AiToolPermissions,
  DEFAULT_AI_TOOL_PERMISSIONS,
  loadAiToolPermissions,
  saveAiToolPermissions
} from "@/lib/client/aiPermissions";

function icon(enabled: boolean): string {
  return enabled ? "Enabled" : "Disabled";
}

function Toggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-600">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const [aiPermissions, setAiPermissions] = useState<AiToolPermissions>(DEFAULT_AI_TOOL_PERMISSIONS);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setAiPermissions(loadAiToolPermissions());
  }, []);

  const permissionSummary = useMemo(() => {
    if (aiPermissions.transact) return "Read + Suggest + Transact enabled";
    if (aiPermissions.suggest) return "Read + Suggest enabled";
    if (aiPermissions.read) return "Read-only mode";
    return "AI tools disabled";
  }, [aiPermissions]);

  function updatePermissions(next: AiToolPermissions) {
    setAiPermissions(next);
    saveAiToolPermissions(next);
    setSavedAt(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
  }

  return (
    <div className="space-y-8">
      <section className="reveal-up rounded-[2rem] border border-slate-200 bg-white/90 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Safety, Privacy & Controls</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-900 md:text-5xl">Settings</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          Permission model for read, suggest, and transact controls with consent-aware defaults.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-3xl text-slate-900">AI Tool Permissions</h2>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{permissionSummary}</p>
        </div>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Read"
            description="AI can read summaries (spend by category, cashflow, and upcoming bills)."
            checked={aiPermissions.read}
            onChange={(read) =>
              updatePermissions({
                ...aiPermissions,
                read,
                suggest: read ? aiPermissions.suggest : false,
                transact: read ? aiPermissions.transact : false
              })
            }
          />
          <Toggle
            label="Suggest"
            description="AI can draft recommendations, categorization rules, and action proposals."
            checked={aiPermissions.suggest}
            onChange={(suggest) =>
              updatePermissions({
                ...aiPermissions,
                read: suggest ? true : aiPermissions.read,
                suggest,
                transact: suggest ? aiPermissions.transact : false
              })
            }
          />
          <Toggle
            label="Transact"
            description="Reserved for future execution tools. Keep disabled unless you explicitly approve."
            checked={aiPermissions.transact}
            onChange={(transact) =>
              updatePermissions({
                ...aiPermissions,
                read: transact ? true : aiPermissions.read,
                suggest: transact ? true : aiPermissions.suggest,
                transact
              })
            }
          />
        </div>
        {savedAt ? <p className="mt-3 text-xs text-slate-500">Saved locally at {savedAt}.</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Area</th>
                <th className="px-3 py-3">Read</th>
                <th className="px-3 py-3">Suggest</th>
                <th className="px-3 py-3">Transact</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((row) => (
                <tr key={row.area} className="border-t border-slate-200">
                  <td className="px-3 py-3 font-semibold text-slate-900">{row.area}</td>
                  <td className="px-3 py-3 text-slate-700">{icon(row.read)}</td>
                  <td className="px-3 py-3 text-slate-700">{icon(row.suggest)}</td>
                  <td className="px-3 py-3 text-slate-700">{icon(row.transact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-3xl text-slate-900">User Protection</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Step-up auth before money movement.</li>
            <li>Action receipts with rollback and pause controls.</li>
            <li>Global automation kill switch in app header.</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-3xl text-slate-900">Privacy Posture</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Tokenized aggregator credentials (no raw bank secrets stored).</li>
            <li>Retention controls and export/delete user workflow.</li>
            <li>Audit log for recommendations, approvals, and execution states.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

