"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ContactState = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export function ContactForm() {
  const [values, setValues] = useState<ContactState>({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");

  const error = useMemo(() => {
    if (!values.name || !values.email || !values.message) return "Please complete the required fields.";
    if (!/\S+@\S+\.\S+/.test(values.email)) return "Enter a valid email address.";
    return "";
  }, [values]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (error) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("success");
  }

  return (
    <Card className="rounded-[32px]">
      <div className="mb-6">
        <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Contact the team</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Use this demo form to model customer outreach, investor interest, and onboarding conversations.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Full name
            <input
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              placeholder="Jordan Fields"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Email
            <input
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              placeholder="jordan@company.com"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
          Company or organization
          <input
            value={values.company}
            onChange={(event) => setValues((current) => ({ ...current, company: event.target.value }))}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            placeholder="Northshore Services"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
          What are you evaluating?
          <textarea
            value={values.message}
            onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
            className="min-h-[140px] rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            placeholder="We want to understand how this could reduce account-hopping for our business clients and what transfer readiness would require."
          />
        </label>

        {status === "error" && error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {status === "success" ? (
          <p className="rounded-2xl bg-[rgba(30,142,99,0.12)] px-4 py-3 text-sm text-[var(--success)]">
            Message captured. In a production build, this would route into CRM, support, or investor intake workflows.
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button>{status === "loading" ? "Sending..." : "Send message"}</Button>
          <p className="text-xs text-[var(--muted)]">Frontend demo with validation, loading, and success states.</p>
        </div>
      </form>
    </Card>
  );
}
