'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Passwort zurücksetzen | Marcel Spahr'; }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/api/auth/callback?next=/auth/passwort-zuruecksetzen`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);
    if (resetError) {
      setError('Die E-Mail konnte nicht gesendet werden. Bitte versuche es in einigen Minuten erneut.');
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 py-12 text-slate-100 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-[#2d3144] bg-[#1a1d27] p-6 sm:p-8 shadow-2xl">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15 text-green-400"><CheckCircle2 size={27} /></span>
            <h1 className="text-2xl font-semibold text-white">E-Mail ist unterwegs</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">Wenn die Adresse zu deinem Konto gehört, erhältst du einen sicheren Link. Öffne ihn im selben Browser, in dem du die Anfrage gestartet hast.</p>
            <Link href="/dashboard/login" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#818cf8] hover:text-[#a5b4fc]"><ArrowLeft size={15} /> Zurück zum Login</Link>
          </div>
        ) : (
          <>
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/15 text-[#818cf8]"><Mail size={23} /></span>
            <h1 className="text-2xl font-semibold text-white">Passwort zurücksetzen</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Gib die E-Mail-Adresse deines Dashboard-Kontos ein. Du erhältst anschließend einen einmal verwendbaren Recovery-Link.</p>
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">E-Mail-Adresse</span>
                <input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-xl border border-[#2d3144] bg-[#11131b] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20" />
              </label>
              {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#6366f1] py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Der Link wird gesendet.' : 'Link zum Zurücksetzen senden'}</button>
            </form>
            <Link href="/dashboard/login" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300"><ArrowLeft size={15} /> Zurück zum Login</Link>
          </>
        )}
      </section>
    </main>
  );
}
