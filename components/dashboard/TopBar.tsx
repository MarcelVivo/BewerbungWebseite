'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Play, Square, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':              'Dashboard',
  '/dashboard/aila':         'AILA',
  '/dashboard/pipeline':     'Pipeline',
  '/dashboard/kunden':       'Kunden',
  '/dashboard/outreach':     'Outreach',
  '/dashboard/projekte':     'Projekte & Tasks',
  '/dashboard/zeiterfassung':'Zeiterfassung',
  '/dashboard/rechnungen':   'Rechnungen & Angebote',
  '/dashboard/vertrage':     'Verträge',
  '/dashboard/kalender':     'Kalender',
  '/dashboard/ki-agenten':   'KI-Agenten',
  '/dashboard/dokumente':    'Dokumente',
  '/dashboard/bewerbungen':  'Bewerbungen',
  '/dashboard/statistiken':  'Statistiken',
  '/dashboard/einstellungen':'Einstellungen',
};

export default function TopBar() {
  const pathname = usePathname();
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds]           = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pageTitle = ROUTE_LABELS[pathname] ?? 'Dashboard';

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  function formatTimer(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <header className="h-14 bg-[#1a1d27] border-b border-[#2d3144] flex items-center px-5 gap-4 flex-shrink-0">
      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-white truncate">{pageTitle}</h1>
      </div>

      {/* ── Timer Widget ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#252836] border border-[#2d3144]">
        <button
          onClick={() => { setTimerRunning(!timerRunning); if (!timerRunning) setSeconds(0); }}
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center transition-colors',
            timerRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-[#6366f1]/20 text-[#6366f1] hover:bg-[#6366f1]/30'
          )}
          title={timerRunning ? 'Timer stoppen' : 'Timer starten'}
        >
          {timerRunning ? <Square size={9} fill="currentColor" /> : <Play size={9} fill="currentColor" />}
        </button>
        <span className={cn('text-xs font-mono font-semibold', timerRunning ? 'text-red-400' : 'text-slate-400')}>
          {formatTimer(seconds)}
        </span>
        {timerRunning && (
          <span className="text-[10px] text-slate-500 hidden sm:inline">Kein Projekt</span>
        )}
      </div>

      {/* ── Notifications ── */}
      <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#252836] transition-colors">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#6366f1] rounded-full" />
      </button>

      {/* ── User Menu ── */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#252836] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#6366f1] flex items-center justify-center shadow shadow-indigo-500/30">
            <span className="text-white text-[10px] font-bold">MS</span>
          </div>
          <span className="text-sm text-white font-medium hidden sm:block">Marcel</span>
          <ChevronDown size={13} className="text-slate-400" />
        </button>

        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-52 bg-[#252836] border border-[#2d3144] rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#2d3144]">
                <div className="text-sm font-semibold text-white">Marcel Spahr</div>
                <div className="text-xs text-slate-400">kontakt@marcelspahr.ch</div>
              </div>
              <a
                href="/dashboard/einstellungen"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#2d3144] transition-colors"
              >
                Einstellungen
              </a>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#2d3144] transition-colors"
              >
                Öffentliche Website ↗
              </a>
              <div className="border-t border-[#2d3144] mt-1" />
              <button
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client');
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = '/dashboard/login';
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                Abmelden
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
