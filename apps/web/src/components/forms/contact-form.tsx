"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CONTACT_EMAIL_STORAGE_KEY = "ubh_contact_email";

type ContactState = {
  name: string;
  email: string;
  company: string;
  message: string;
};

type ContactNotification = {
  id: string;
  title: string;
  message: string;
  channel: string;
  sentAt: string;
  acknowledgedAt: string | null;
};

type ContactInquiry = {
  id: string;
  reference: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  createdAt: string;
  ownerAlertEmail: string;
  ownerAlertStatus: string;
  ownerAlertSentAt: string | null;
  ownerAlertError: string | null;
  notifications: ContactNotification[];
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ContactForm() {
  const [values, setValues] = useState<ContactState>({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [serverError, setServerError] = useState("");
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  const error = useMemo(() => {
    if (!values.name || !values.email || !values.message) return "Please complete the required fields.";
    if (!/\S+@\S+\.\S+/.test(values.email)) return "Enter a valid email address.";
    return "";
  }, [values]);

  async function loadContactStatus(email: string) {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setLookupStatus("error");
      setServerError("Enter a valid email address to check outreach status.");
      return;
    }

    try {
      setLookupStatus("loading");
      setServerError("");
      const res = await fetch(`/api/contact?email=${encodeURIComponent(email)}`, {
        cache: "no-store"
      });
      const payload = (await res.json()) as { inquiries?: ContactInquiry[]; error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to load outreach status.");
      }
      setInquiries(payload.inquiries ?? []);
      setLookupStatus("success");
    } catch (submissionError) {
      setLookupStatus("error");
      setServerError(submissionError instanceof Error ? submissionError.message : "Failed to load outreach status.");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEmail = window.localStorage.getItem(CONTACT_EMAIL_STORAGE_KEY);
    if (!storedEmail) return;
    setValues((current) => ({
      ...current,
      email: current.email || storedEmail
    }));
    void loadContactStatus(storedEmail);
  }, []);

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
      setLookupStatus("success");
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CONTACT_EMAIL_STORAGE_KEY, values.email.trim().toLowerCase());
      }
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
          Send a real inquiry, store it in the application, and let the customer come back later to see outreach updates by email.
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
        {serverError ? <p className="text-sm text-[var(--danger)]">{serverError}</p> : null}
        {status === "success" ? (
          <p className="rounded-2xl bg-[rgba(30,142,99,0.12)] px-4 py-3 text-sm text-[var(--success)]">
            {inquiries[0]?.ownerAlertStatus === "sent"
              ? `Message sent. We logged the inquiry and emailed the owner alert to ${inquiries[0].ownerAlertEmail}.`
              : `Message sent. We logged the inquiry and queued the owner alert to ${inquiries[0]?.ownerAlertEmail ?? "sales@hibark.com"}.`}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button>{status === "loading" ? "Sending..." : "Send message"}</Button>
          <button
            type="button"
            onClick={() => void loadContactStatus(values.email)}
            disabled={lookupStatus === "loading"}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {lookupStatus === "loading" ? "Checking..." : "Check status"}
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-heading text-xl font-semibold text-[var(--navy)]">Outreach status</h4>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Use the same email address to review the latest confirmation and follow-up notifications.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            {inquiries.length > 0 ? `${inquiries.length} request${inquiries.length === 1 ? "" : "s"}` : "No requests yet"}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {inquiries.length > 0 ? (
            inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-[22px] border border-[var(--line)] bg-slate-50/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--teal)]">
                      Reference {inquiry.reference}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--navy)]">
                      {inquiry.company || inquiry.name}
                    </p>
                  </div>
                  <div className="rounded-full bg-[rgba(25,106,117,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ocean)]">
                    {inquiry.status}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">Submitted {formatTimestamp(inquiry.createdAt)}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{inquiry.message}</p>
                <div className="mt-4 grid gap-3">
                  {inquiry.notifications.map((notification) => (
                    <div key={notification.id} className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--navy)]">{notification.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{notification.message}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {notification.channel.replace(/_/g, " ")} · {formatTimestamp(notification.sentAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-[var(--line-strong)] bg-slate-50 px-4 py-4 text-sm text-[var(--muted)]">
              Submit the form or enter the same email you used previously, then choose <span className="font-semibold text-[var(--navy)]">Check status</span> to load your confirmation.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
