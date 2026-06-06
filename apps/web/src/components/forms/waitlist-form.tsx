"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BetaUserType = "individual" | "small_business_owner" | "finance_admin_operator" | "accountant_bookkeeper" | "other";
type BetaChallenge =
  | "too_many_bank_logins"
  | "hard_to_track_balances"
  | "hard_to_review_transactions"
  | "cash_flow_visibility"
  | "transfers_between_accounts"
  | "tax_reserve_tracking"
  | "payroll_or_operating_visibility"
  | "other";

type WaitlistState = {
  name: string;
  email: string;
  userType: BetaUserType;
  challenge: BetaChallenge;
};

type WaitlistInquiry = {
  id: string;
  ownerAlertStatus: string;
};

const userTypeLabels: Record<BetaUserType, string> = {
  individual: "Individual",
  small_business_owner: "Small business owner",
  finance_admin_operator: "Finance/admin operator",
  accountant_bookkeeper: "Accountant/bookkeeper",
  other: "Other"
};

const challengeLabels: Record<BetaChallenge, string> = {
  too_many_bank_logins: "Too many bank logins",
  hard_to_track_balances: "Hard to track balances",
  hard_to_review_transactions: "Hard to review transactions",
  cash_flow_visibility: "Cash flow visibility",
  transfers_between_accounts: "Transfers between accounts",
  tax_reserve_tracking: "Tax reserve tracking",
  payroll_or_operating_visibility: "Payroll or operating account visibility",
  other: "Other"
};

function buildBetaMessage(values: WaitlistState) {
  return [
    "Northline beta signup",
    "Interest: Beta access",
    `User type: ${userTypeLabels[values.userType]}`,
    `Biggest workflow challenge: ${challengeLabels[values.challenge]}`,
    "",
    "Additional context:",
    "Joined the Northline beta list."
  ].join("\n");
}

function getSuccessMessage(inquiry?: WaitlistInquiry) {
  const title = "Thanks — we received your request.";
  const baseCopy =
    "A Northline team member will review your message and follow up if your request requires a response. If you joined the beta list, we’ll use your information to help prioritize future access and product feedback.";

  if (!inquiry || inquiry.ownerAlertStatus === "sent") {
    return { title, copy: baseCopy };
  }

  return {
    title,
    copy: `${baseCopy} Your beta request was still saved even though internal routing needs a quick retry on our side.`
  };
}

export function WaitlistForm() {
  const [values, setValues] = useState<WaitlistState>({
    name: "",
    email: "",
    userType: "small_business_owner",
    challenge: "cash_flow_visibility"
  });
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [serverError, setServerError] = useState("");
  const [latestInquiry, setLatestInquiry] = useState<WaitlistInquiry | null>(null);

  const error = useMemo(() => {
    if (!values.name || !/\S+@\S+\.\S+/.test(values.email)) return "Enter your name and a valid email address.";
    return "";
  }, [values.email, values.name]);

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
          company: "",
          message: buildBetaMessage(values)
        })
      });
      const payload = (await res.json()) as { inquiry?: WaitlistInquiry; error?: string };
      if (!res.ok || !payload.inquiry) {
        throw new Error(payload.error ?? "Failed to join the beta list.");
      }

      setLatestInquiry(payload.inquiry);
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setServerError(submissionError instanceof Error ? submissionError.message : "Failed to join the beta list.");
    }
  }

  return (
    <div id="beta-access">
      <Card className="rounded-[32px]">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Want early access?</p>
          <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
            Join the Northline beta list
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Northline is being built for users who manage money across multiple accounts and institutions. Join the beta
          list to help shape the product and get notified as new features become available.
        </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Name
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
              placeholder="founder@company.com"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            User type
            <select
              value={values.userType}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  userType: event.target.value as BetaUserType
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
            Biggest workflow challenge
            <select
              value={values.challenge}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  challenge: event.target.value as BetaChallenge
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
        </div>

        {status === "error" && error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {serverError ? <p className="text-sm text-[var(--danger)]">{serverError}</p> : null}
        {status === "success" ? (
          <div className="rounded-[24px] bg-[rgba(30,142,99,0.12)] px-5 py-4 text-[var(--success)]">
            <p className="font-heading text-xl font-semibold text-[var(--navy)]">
              {getSuccessMessage(latestInquiry ?? undefined).title}
            </p>
            <p className="mt-2 text-sm leading-7">{getSuccessMessage(latestInquiry ?? undefined).copy}</p>
          </div>
        ) : null}

          <div className="flex items-center gap-3">
            <Button>{status === "loading" ? "Submitting..." : "Join beta list"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
