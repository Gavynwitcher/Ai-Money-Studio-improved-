"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UserType = "individual" | "small_business_owner" | "finance_admin_operator" | "accountant_bookkeeper" | "other";
type InstitutionCount = "1" | "2" | "3-5" | "6+";
type PainPoint =
  | "too_many_bank_logins"
  | "hard_to_track_balances"
  | "hard_to_review_transactions"
  | "cash_flow_visibility"
  | "transfers_between_accounts"
  | "tax_reserve_tracking"
  | "payroll_or_operating_visibility"
  | "other";
type InterestType = "walkthrough" | "beta_access" | "support" | "partnership" | "pricing";

type ContactState = {
  name: string;
  email: string;
  company: string;
  userType: UserType;
  institutionCount: InstitutionCount;
  painPoint: PainPoint;
  interest: InterestType;
  message: string;
  consent: boolean;
};

type ContactInquiry = {
  id: string;
  ownerAlertEmail: string;
  ownerAlertStatus: string;
};

const userTypeLabels: Record<UserType, string> = {
  individual: "Individual",
  small_business_owner: "Small business owner",
  finance_admin_operator: "Finance/admin operator",
  accountant_bookkeeper: "Accountant/bookkeeper",
  other: "Other"
};

const painPointLabels: Record<PainPoint, string> = {
  too_many_bank_logins: "Too many bank logins",
  hard_to_track_balances: "Hard to track balances",
  hard_to_review_transactions: "Hard to review transactions",
  cash_flow_visibility: "Cash flow visibility",
  transfers_between_accounts: "Transfers between accounts",
  tax_reserve_tracking: "Tax reserve tracking",
  payroll_or_operating_visibility: "Payroll or operating account visibility",
  other: "Other"
};

const interestLabels: Record<InterestType, string> = {
  walkthrough: "Walkthrough",
  beta_access: "Beta access",
  support: "Support",
  partnership: "Partnership",
  pricing: "Pricing"
};

function getSubmissionMessage(inquiry?: ContactInquiry) {
  const baseTitle = "Thanks — we received your request.";
  const baseCopy =
    "A Northline team member will review your message and follow up if your request requires a response. If you joined the beta list, we’ll use your information to help prioritize future access and product feedback.";

  if (!inquiry || inquiry.ownerAlertStatus === "sent") {
    return {
      title: baseTitle,
      copy: baseCopy
    };
  }

  if (inquiry.ownerAlertStatus === "failed") {
    return {
      title: baseTitle,
      copy: `${baseCopy} Internal email routing needs a quick retry on our side, but your request has been saved.`
    };
  }

  return {
    title: baseTitle,
    copy: `${baseCopy} Your request is saved and still routing to ${inquiry.ownerAlertEmail}.`
  };
}

function buildLeadMessage(values: ContactState) {
  return [
    "Northline lead request",
    `Interest: ${interestLabels[values.interest]}`,
    `User type: ${userTypeLabels[values.userType]}`,
    `Financial institutions managed: ${values.institutionCount}`,
    `Primary pain point: ${painPointLabels[values.painPoint]}`,
    `Consent to contact: ${values.consent ? "Yes" : "No"}`,
    "",
    "Additional context:",
    values.message.trim() || "No additional context provided."
  ].join("\n");
}

export function ContactForm() {
  const [values, setValues] = useState<ContactState>({
    name: "",
    email: "",
    company: "",
    userType: "small_business_owner",
    institutionCount: "3-5",
    painPoint: "cash_flow_visibility",
    interest: "walkthrough",
    message: "",
    consent: false
  });
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [serverError, setServerError] = useState("");
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  const error = useMemo(() => {
    if (!values.name || !values.email) return "Please complete the required fields.";
    if (!/\S+@\S+\.\S+/.test(values.email)) return "Enter a valid email address.";
    if (!values.consent) return "Please confirm that Northline may contact you about your request.";
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
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          company: values.company,
          message: buildLeadMessage(values)
        })
      });
      const payload = (await res.json()) as { inquiry?: ContactInquiry; error?: string };
      if (!res.ok || !payload.inquiry) {
        throw new Error(payload.error ?? "Failed to send request.");
      }

      setInquiries((current) => [payload.inquiry!, ...current.filter((item) => item.id !== payload.inquiry!.id)]);
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setServerError(submissionError instanceof Error ? submissionError.message : "Failed to send request.");
    }
  }

  const submission = getSubmissionMessage(inquiries[0]);

  return (
    <div id="fit-form">
      <Card className="rounded-[32px]">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Product-fit request</p>
          <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
            Tell us where Northline could help first
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Share how you manage accounts today so Northline can understand your workflow, your visibility gaps, and
          whether a walkthrough or beta access is the best next step.
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
            Email address
            <input
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              placeholder="jordan@company.com"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
          Business name, optional
          <input
            value={values.company}
            onChange={(event) => setValues((current) => ({ ...current, company: event.target.value }))}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            placeholder="Northshore Services"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            User type
            <select
              value={values.userType}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  userType: event.target.value as UserType
                }))
              }
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            >
              <option value="individual">Individual</option>
              <option value="small_business_owner">Small business owner</option>
              <option value="finance_admin_operator">Finance/admin operator</option>
              <option value="accountant_bookkeeper">Accountant/bookkeeper</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Number of financial institutions managed
            <select
              value={values.institutionCount}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  institutionCount: event.target.value as InstitutionCount
                }))
              }
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3-5">3-5</option>
              <option value="6+">6+</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Primary pain point
            <select
              value={values.painPoint}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  painPoint: event.target.value as PainPoint
                }))
              }
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            >
              <option value="too_many_bank_logins">Too many bank logins</option>
              <option value="hard_to_track_balances">Hard to track balances</option>
              <option value="hard_to_review_transactions">Hard to review transactions</option>
              <option value="cash_flow_visibility">Cash flow visibility</option>
              <option value="transfers_between_accounts">Transfers between accounts</option>
              <option value="tax_reserve_tracking">Tax reserve tracking</option>
              <option value="payroll_or_operating_visibility">Payroll or operating account visibility</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Interested in
            <select
              value={values.interest}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  interest: event.target.value as InterestType
                }))
              }
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            >
              <option value="walkthrough">Walkthrough</option>
              <option value="beta_access">Beta access</option>
              <option value="support">Support</option>
              <option value="partnership">Partnership</option>
              <option value="pricing">Pricing</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
          Message
          <textarea
            value={values.message}
            onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
            className="min-h-[140px] rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            placeholder="Tell us how you manage accounts today, what feels fragmented, and what you want to improve first."
          />
        </label>

        <label className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-white/85 px-4 py-4 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(event) => setValues((current) => ({ ...current, consent: event.target.checked }))}
            className="mt-1 h-4 w-4 rounded border-[var(--line)] text-[var(--teal)] focus:ring-[var(--teal)]"
          />
          <span>I agree that Northline may contact me about my request.</span>
        </label>

        {status === "error" && error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {serverError ? <p className="text-sm text-[var(--danger)]">{serverError}</p> : null}
        {status === "success" ? (
          <div className="rounded-[24px] bg-[rgba(30,142,99,0.12)] px-5 py-4 text-[var(--success)]">
            <p className="font-heading text-xl font-semibold text-[var(--navy)]">{submission.title}</p>
            <p className="mt-2 text-sm leading-7">{submission.copy}</p>
          </div>
        ) : null}

          <div className="flex items-center gap-3">
            <Button>{status === "loading" ? "Sending..." : "Send request"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
