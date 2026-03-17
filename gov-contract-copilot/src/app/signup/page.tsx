'use client';

import { useState } from 'react';

export default function SignupPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    industry: '',
    location: '',
    teamSize: '',
    govExperienceLevel: 'none',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Signup failed');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="you@company.com"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
            value={form.email}
            onChange={onChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
            value={form.password}
            onChange={onChange}
            required
          />
          <input
            name="industry"
            placeholder="Industry (e.g., HVAC, cleaning, IT)"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
            value={form.industry}
            onChange={onChange}
          />
          <input
            name="location"
            placeholder="Location (city, state)"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
            value={form.location}
            onChange={onChange}
          />
          <input
            name="teamSize"
            placeholder="Team size"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
            value={form.teamSize}
            onChange={onChange}
          />
          <select
            name="govExperienceLevel"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
            value={form.govExperienceLevel}
            onChange={onChange}
          >
            <option value="none">No government experience yet</option>
            <option value="some">Some gov work</option>
            <option value="experienced">Experienced gov vendor</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            {loading ? 'Creating…' : 'Continue to dashboard'}
          </button>
        </form>
      </div>
    </main>
  );
}
