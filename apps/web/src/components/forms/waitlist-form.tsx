"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WaitlistState = {
  email: string;
  segment: "consumer" | "business" | "investor";
  connectedBanks: string;
  interest: string;
};

export function WaitlistForm() {
  const [values, setValues] = useState<WaitlistState>({
    email: "",
    segment: "business",
    connectedBanks: "3+",
    interest: "aggregation"
  });
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "success">("idle");

  const error = useMemo(() => {
    if (!/\S+@\S+\.\S+/.test(values.email)) return "Enter a valid email to join the waitlist.";
    return "";
  }, [values.email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (error) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 650));
    setStatus("success");
  }

  return (
    <Card className="rounded-[32px]">
      <div className="mb-6">
        <h3 className="font-heading text-2xl font-semibold text-[var(--navy)]">Join the waitlist</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Capture segment demand, pricing sensitivity, and multi-institution complexity from early users.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
          Work email
          <input
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            placeholder="founder@company.com"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            I’m signing up as a
            <select
              value={values.segment}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  segment: event.target.value as WaitlistState["segment"]
                }))
              }
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            >
              <option value="consumer">Consumer</option>
              <option value="business">Small business owner</option>
              <option value="investor">Investor or partner</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
            Institutions I want to connect
            <select
              value={values.connectedBanks}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  connectedBanks: event.target.value
                }))
              }
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
            >
              <option>2</option>
              <option>3+</option>
              <option>5+</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[var(--navy)]">
          Highest interest
          <select
            value={values.interest}
            onChange={(event) => setValues((current) => ({ ...current, interest: event.target.value }))}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
          >
            <option value="aggregation">Account aggregation</option>
            <option value="cash_flow">Cash-flow visibility</option>
            <option value="credit">Credit tools</option>
            <option value="debt">Debt assistance</option>
          </select>
        </label>

        {status === "error" && error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {status === "success" ? (
          <p className="rounded-2xl bg-[rgba(30,142,99,0.12)] px-4 py-3 text-sm text-[var(--success)]">
            Waitlist entry saved. This payload is shaped to support segment, demand, and pricing analysis later.
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button>{status === "loading" ? "Submitting..." : "Join waitlist"}</Button>
          <p className="text-xs text-[var(--muted)]">Great for measuring CTA conversion and onboarding drop-off.</p>
        </div>
      </form>
    </Card>
  );
}
