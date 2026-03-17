export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">
            Gov Contract Copilot
          </h1>
          <p className="mt-3 text-slate-300">
            A simple engine that helps small businesses qualify, decide, and apply
            for government contracts without getting buried in paperwork.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold">Who this is for</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
            <li>Local trades and service vendors (HVAC, cleaning, security, etc.).</li>
            <li>Small professional firms wanting steady public sector work.</li>
            <li>Owners who don&apos;t have time to learn procurement jargon.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold">What it does</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
            <li>Builds your gov‑ready profile and checklist.</li>
            <li>Scores opportunities: Bid / Stretch / Don&apos;t bid.</li>
            <li>Outlines what to say in your proposal in plain language.</li>
          </ul>
        </section>

        <a
          href="/signup"
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          Get early access
        </a>
      </div>
    </main>
  );
}
