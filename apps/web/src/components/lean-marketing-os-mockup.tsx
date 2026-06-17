"use client";

import { useMemo, useState } from "react";

const channels = [
  { name: "Search capture", share: 34, purpose: "Buyer-intent pages, local SEO, comparison content", color: "bg-[#3f7d58]" },
  { name: "Proof engine", share: 24, purpose: "Case studies, testimonials, founder posts", color: "bg-[#315f8b]" },
  { name: "Lifecycle", share: 18, purpose: "Email nurture, reactivation, referral asks", color: "bg-[#bf7d2f]" },
  { name: "Paid tests", share: 14, purpose: "Tiny experiments with strict stop rules", color: "bg-[#7c4d8e]" },
  { name: "Conversion", share: 10, purpose: "Landing page, forms, offer experiments", color: "bg-[#b84a4a]" }
] as const;

const pipeline = [
  ["Diagnose", "Import revenue, margins, channels, offers, and current funnel leaks."],
  ["Prioritize", "Score every idea by revenue impact, confidence, speed, and effort."],
  ["Launch", "Generate campaigns, landing pages, emails, briefs, and test rules."],
  ["Optimize", "Read weekly signal and move budget only toward profitable proof."]
] as const;

const experiments = [
  { test: "Homepage offer split", metric: "+18% call starts", status: "Running" },
  { test: "Local buyer-intent page", metric: "42 qualified visits", status: "Shipping" },
  { test: "Referral email", metric: "7 warm intros", status: "Ready" }
] as const;

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

export function LeanMarketingOSMockup() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(180000);
  const [targetSpend, setTargetSpend] = useState(3);

  const model = useMemo(() => {
    const leanBudget = monthlyRevenue * (targetSpend / 100);
    const bloatedBudget = monthlyRevenue * 0.3;
    const savings = bloatedBudget - leanBudget;
    const annualSavings = savings * 12;

    return {
      leanBudget,
      bloatedBudget,
      savings,
      annualSavings,
      channelBudgets: channels.map((channel) => ({
        ...channel,
        budget: leanBudget * (channel.share / 100)
      }))
    };
  }, [monthlyRevenue, targetSpend]);

  return (
    <main className="min-h-screen bg-[#f4f6f2] text-[#111815]">
      <header className="border-b border-[#111815]/10 bg-[#f9fbf6]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#111815] text-sm font-black text-[#f7d95c]">
              3%
            </span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.16em]">LeanLayer</span>
              <span className="block text-xs text-[#5a665f]">Marketing OS</span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-[#34423a] md:flex">
            <a href="#budget">Budget</a>
            <a href="#system">System</a>
            <a href="#plan">90-day plan</a>
          </nav>
          <a href="#budget" className="rounded-lg bg-[#111815] px-4 py-3 text-sm font-bold text-white">
            Build plan
          </a>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-14">
        <div className="flex min-h-[560px] flex-col justify-between rounded-lg bg-[#111815] p-6 text-white md:p-9">
          <div>
            <p className="w-fit rounded-md bg-[#f7d95c] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#111815]">
              Spend 3%, behave like 30%
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] md:text-7xl">
              The anti-bloat marketing command center.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d9e3dc]">
              LeanLayer turns revenue into a disciplined marketing budget, then allocates every dollar to campaigns,
              proof assets, and conversion tests with measurable stop rules.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              ["3%", "Revenue-based budget"],
              ["5 lanes", "No channel sprawl"],
              ["7 days", "Weekly decision cycle"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/8 p-4">
                <p className="text-4xl font-black text-[#f7d95c]">{value}</p>
                <p className="mt-2 text-sm text-[#c4d1c9]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <aside id="budget" className="rounded-lg border border-[#111815]/10 bg-white p-5 shadow-[0_24px_60px_rgba(17,24,21,0.08)] md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3f7d58]">Live budget model</p>
              <h2 className="mt-2 text-3xl font-black">Replace a 30% spend habit.</h2>
            </div>
            <span className="rounded-md bg-[#e6f0e7] px-3 py-2 text-sm font-black text-[#23563a]">Interactive</span>
          </div>

          <div className="mt-7 space-y-6">
            <label className="block">
              <span className="flex justify-between text-sm font-bold text-[#34423a]">
                Monthly revenue <strong>{formatMoney(monthlyRevenue)}</strong>
              </span>
              <input
                type="range"
                min="25000"
                max="750000"
                step="5000"
                value={monthlyRevenue}
                onChange={(event) => setMonthlyRevenue(Number(event.target.value))}
                className="mt-3 w-full accent-[#3f7d58]"
              />
            </label>

            <label className="block">
              <span className="flex justify-between text-sm font-bold text-[#34423a]">
                Lean marketing target <strong>{targetSpend}%</strong>
              </span>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={targetSpend}
                onChange={(event) => setTargetSpend(Number(event.target.value))}
                className="mt-3 w-full accent-[#3f7d58]"
              />
            </label>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[#f4f6f2] p-4">
              <p className="text-xs font-bold uppercase text-[#6a766e]">Lean budget</p>
              <p className="mt-2 text-2xl font-black">{formatMoney(model.leanBudget)}</p>
            </div>
            <div className="rounded-lg bg-[#fff3e1] p-4">
              <p className="text-xs font-bold uppercase text-[#7a5a28]">30% habit</p>
              <p className="mt-2 text-2xl font-black">{formatMoney(model.bloatedBudget)}</p>
            </div>
            <div className="rounded-lg bg-[#e6f0e7] p-4">
              <p className="text-xs font-bold uppercase text-[#2c6141]">Monthly savings</p>
              <p className="mt-2 text-2xl font-black">{formatMoney(model.savings)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-[#111815] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f7d95c]">Annual capital preserved</p>
            <p className="mt-2 text-5xl font-black">{formatMoney(model.annualSavings)}</p>
            <p className="mt-3 text-sm leading-6 text-[#c4d1c9]">
              The app’s job is to turn that saved cash into runway, hiring capacity, margin, or owner distributions.
            </p>
          </div>
        </aside>
      </section>

      <section id="system" className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-[#111815]/10 bg-white p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3f7d58]">Allocation engine</p>
          <h2 className="mt-3 text-4xl font-black">Every dollar gets a job.</h2>
          <div className="mt-7 space-y-4">
            {model.channelBudgets.map((channel) => (
              <div key={channel.name}>
                <div className="flex items-center justify-between gap-4 text-sm font-bold">
                  <span>{channel.name}</span>
                  <span>{formatMoney(channel.budget)}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edf1ea]">
                  <div className={`h-full ${channel.color}`} style={{ width: `${channel.share}%` }} />
                </div>
                <p className="mt-2 text-sm text-[#5a665f]">{channel.purpose}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            {pipeline.map(([title, copy], index) => (
              <article key={title} className="rounded-lg border border-[#111815]/10 bg-white p-6">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8a5b24]">0{index + 1}</span>
                <h3 className="mt-3 text-2xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5a665f]">{copy}</p>
              </article>
            ))}
          </div>

          <div className="rounded-lg bg-[#315f8b] p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfe4ff]">AI department view</p>
            <h3 className="mt-3 text-3xl font-black">Strategy, creative, analytics, and execution in one queue.</h3>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#e4f0ff]">
              The mockup is built around a practical agency workflow: define the offer, pick one or two acquisition
              lanes, ship assets, measure signal, and kill anything that cannot justify the spend.
            </p>
          </div>
        </div>
      </section>

      <section id="plan" className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg bg-white p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3f7d58]">90-day operating plan</p>
          <h2 className="mt-3 text-4xl font-black">A lower budget needs a tighter cadence.</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              ["Days 1-30", "Positioning, ICP, budget lock, first landing page, email capture, analytics baseline."],
              ["Days 31-60", "Search pages, proof assets, outbound/referral tests, lifecycle sequences, weekly reporting."],
              ["Days 61-90", "Scale winning channel, pause weak tests, tune conversion, publish case studies, refresh budget."]
            ].map(([period, copy]) => (
              <article key={period} className="rounded-lg bg-[#f4f6f2] p-5">
                <h3 className="text-xl font-black">{period}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5a665f]">{copy}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#111815]/10 bg-white p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a5b24]">Experiment queue</p>
          <div className="mt-5 space-y-3">
            {experiments.map((item) => (
              <div key={item.test} className="rounded-lg border border-[#111815]/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black">{item.test}</h3>
                  <span className="rounded-md bg-[#f7d95c] px-2 py-1 text-xs font-black text-[#111815]">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-[#5a665f]">Target signal: {item.metric}</p>
              </div>
            ))}
          </div>
          <a href="#budget" className="mt-6 inline-flex w-full justify-center rounded-lg bg-[#3f7d58] px-5 py-4 font-black text-white">
            Recalculate 3% plan
          </a>
        </div>
      </section>
    </main>
  );
}
