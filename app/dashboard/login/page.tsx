'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const IS_SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function LoginForm() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const nextPath     = searchParams.get('next') || '/dashboard';
  const configError  = searchParams.get('error') === 'not_configured';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!IS_SUPABASE_CONFIGURED) {
      setError('Supabase ist noch nicht konfiguriert.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError('Falsche E-Mail oder Passwort. Bitte erneut versuchen.');
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError('Verbindungsfehler. Bitte später erneut versuchen.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#6366f1] flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-4">
            <span className="text-white text-xl font-bold tracking-tight">MS</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Command Center</h1>
          <p className="mt-1 text-sm text-slate-400">marcelspahr.ch</p>
        </div>

        {/* Setup Warning */}
        {(!IS_SUPABASE_CONFIGURED || configError) && (
          <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
            <Info size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-400">Supabase Setup erforderlich</p>
              <p className="mt-1 text-xs text-amber-300/70 leading-relaxed">
                Füge in <code className="bg-amber-500/20 px-1 rounded">.env.local</code> folgende Keys ein:<br />
                <code className="text-[10px]">NEXT_PUBLIC_SUPABASE_URL</code><br />
                <code className="text-[10px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kontakt@marcelspahr.ch"
              required
              autoComplete="email"
              className={cn(
                'w-full px-4 py-3 rounded-xl bg-[#1a1d27] border text-white text-sm',
                'placeholder:text-slate-600 outline-none transition-all',
                'focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20',
                error ? 'border-red-500/50' : 'border-[#2d3144]'
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className={cn(
                  'w-full px-4 py-3 pr-12 rounded-xl bg-[#1a1d27] border text-white text-sm',
                  'placeholder:text-slate-600 outline-none transition-all',
                  'focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20',
                  error ? 'border-red-500/50' : 'border-[#2d3144]'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !IS_SUPABASE_CONFIGURED}
            className={cn(
              'w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200',
              'bg-[#6366f1] text-white hover:bg-[#5558e8] active:scale-[0.98]',
              'shadow-lg shadow-indigo-500/25',
              (loading || !IS_SUPABASE_CONFIGURED) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Wird angemeldet…
              </span>
            ) : (
              'Anmelden'
            )}
          </button>
          <div className="text-center">
            <a href="/auth/passwort-vergessen" className="text-xs text-slate-500 transition-colors hover:text-[#818cf8]">
              Passwort vergessen?
            </a>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          marcelspahr.ch Command Center · Phase 1
        </p>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <LoginForm />
    </Suspense>
  );
}
