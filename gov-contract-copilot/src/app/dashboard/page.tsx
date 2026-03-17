'use client';

import { useState } from 'react';

type AnalysisResult = {
  fitScore: number;
  recommendation: string;
  risks: string[];
  requirements: string[];
};

export default function DashboardPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: text }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResult(data);
    else alert(data.error || 'Error');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>

        <section className="mb-8 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Analyze a contract opportunity</h2>
          <p className="mt-1 text-sm text-slate-300">
            Paste the text of a solicitation or RFP and get a quick
            fit score and Bid / Stretch / Don&apos;t bid suggestion.
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <textarea
              className="h-48 w-full rounded-md bg-slate-950 px-3 py-2 text-sm"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste RFP or opportunity description here…"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              {loading ? 'Analyzing…' : 'Analyze opportunity'}
            </button>
          </form>
        </section>

        {result && (
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold">Analysis result</h2>
            <p className="mt-2 text-sm">
              Fit score:{' '}
              <span className="font-semibold">{result.fitScore}/10</span> · Recommendation:{' '}
              <span className="font-semibold capitalize">{result.recommendation}</span>
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-1 text-sm font-semibold">Key requirements</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {result.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold">Risks / blockers</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {result.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
