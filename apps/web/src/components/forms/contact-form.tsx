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

type ContactInquiry = {
  id: string;
  ownerAlertEmail: string;
  ownerAlertStatus: string;
};

function getSubmissionMessage(inquiry?: ContactInquiry) {
  if (!inquiry) {
    return "Request received. We saved your note and routed it for follow-up.";
  }

  if (inquiry.ownerAlertStatus === "sent") {
    return `Request received. The Northline team has been notified at ${inquiry.ownerAlertEmail}.`;
  }

  if (inquiry.ownerAlertStatus === "failed") {
    return "Request received. Your note is saved, but internal email delivery needs a quick retry on our side.";
  }

  return `Request received. Your note is saved and internal follow-up is still routing to ${inquiry.ownerAlertEmail}.`;
}

export function ContactForm() {
  const [values, setValues] = useState<ContactState>({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [serverError, setServerError] = useState("");
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

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

    try {
      setStatus("loading");
      setServerError("");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await res.json()) as { inquiry?: ContactInquiry; error?: string };
      if (!res.ok || !payload.inquiry) {
        throw new Error(payload.error ?? "Failed to send message.");
      }

      setInquiries((current) => [payload.inquiry!, ...current.filter((item) => item.id !== payload.inquiry!.id)]);
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setServerError(submissionError instanceof Error ? submissionError.message : "Failed to send message.");
    }
  }

  return (
    <Card className="rounded-[32px]">
      <div className="mb-6">
        <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Contact the team</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Send a note, keep your request on file, and check back later for confirmation and follow-up updates.
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
            placeholder="Examples: dashboard access, account linking, transfer setup, pricing, or onboarding support."
          />
        </label>

        {status === "error" && error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {serverError ? <p className="text-sm text-[var(--danger)]">{serverError}</p> : null}
        {status === "success" ? (
          <p className="rounded-2xl bg-[rgba(30,142,99,0.12)] px-4 py-3 text-sm text-[var(--success)]">
            {getSubmissionMessage(inquiries[0])}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button>{status === "loading" ? "Sending..." : "Send message"}</Button>
        </div>
      </form>
    </Card>
  );
}
