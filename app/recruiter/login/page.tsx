'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function RecruiterLogin() {
  const router              = useRouter();
  const [pw, setPw]         = useState('');
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/recruiter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: pw }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/recruiter');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Anmeldung fehlgeschlagen.');
      setPw('');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1d3a_0%,_#0a0c14_70%)] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#6366f1] items-center justify-center mb-4 shadow-xl shadow-indigo-500/30">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recruiter-Zugang</h1>
          <p className="text-slate-400 text-sm mt-1.5">marcelspahr.ch · Vertraulich</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1d27] border border-[#2d3144] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Passwort</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  autoFocus
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-4 py-3 pr-11 text-white placeholder-slate-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !pw}
              className="w-full py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-40 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20"
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Kein Zugang? <a href="mailto:kontakt@marcelspahr.ch" className="text-slate-500 hover:text-slate-300 transition-colors">Kontakt anfragen</a>
        </p>
      </div>
    </div>
  );
}
