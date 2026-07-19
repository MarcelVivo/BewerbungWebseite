'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Neues Passwort | Marcel Spahr';
    if (new URLSearchParams(window.location.search).get('error')) {
      setError('Der Recovery-Link ist ungültig oder abgelaufen. Fordere bitte einen neuen Link an.');
      setChecking(false);
      return;
    }
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setValidSession(Boolean(data.user));
      if (!data.user) setError('Der Recovery-Link ist ungültig oder abgelaufen. Fordere bitte einen neuen Link an.');
      setChecking(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 12) {
      setError('Das neue Passwort muss mindestens 12 Zeichen lang sein.');
      return;
    }
    if (password !== confirmation) {
      setError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError('Das Passwort konnte nicht geändert werden. Fordere bitte einen neuen Recovery-Link an.');
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 py-12 text-slate-100 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-[#2d3144] bg-[#1a1d27] p-6 sm:p-8 shadow-2xl">
        {success ? (
          <div className="text-center">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15 text-green-400"><CheckCircle2 size={27} /></span>
            <h1 className="text-2xl font-semibold text-white">Passwort geändert</h1>
            <p className="mt-3 text-sm text-slate-400">Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
            <Link href="/dashboard/login" className="mt-7 inline-flex rounded-xl bg-[#6366f1] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5558e8]">Zum Dashboard-Login</Link>
          </div>
        ) : (
          <>
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/15 text-[#818cf8]"><LockKeyhole size={23} /></span>
            <h1 className="text-2xl font-semibold text-white">Neues Passwort festlegen</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Verwende mindestens 12 Zeichen und ein Passwort, das du auf keiner anderen Website einsetzt.</p>

            {checking ? <p className="mt-7 text-sm text-slate-500">Recovery-Link wird geprüft …</p> : validSession ? (
              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Neues Passwort</span>
                  <span className="relative block">
                    <input type={showPassword ? 'text' : 'password'} required minLength={12} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-[#2d3144] bg-[#11131b] px-4 py-3 pr-12 text-sm text-white outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20" />
                    <button type="button" aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Passwort bestätigen</span>
                  <input type={showPassword ? 'text' : 'password'} required minLength={12} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded-xl border border-[#2d3144] bg-[#11131b] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20" />
                </label>
                {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#6366f1] py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Wird gespeichert …' : 'Passwort sicher ändern'}</button>
              </form>
            ) : (
              <div className="mt-7">
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</p>
                <Link href="/auth/passwort-vergessen" className="mt-5 inline-flex text-sm font-medium text-[#818cf8] hover:text-[#a5b4fc]">Neuen Recovery-Link anfordern</Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

