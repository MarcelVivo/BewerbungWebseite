'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Play, Square, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeTracking } from '@/lib/hooks/useTimeTracking';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':              'Dashboard',
  '/dashboard/aila':         'AILA',
  '/dashboard/eingang':      'Eingang',
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

function formatElapsed(startIso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TopBar() {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { active, start, stop } = useTimeTracking();

  const pageTitle = ROUTE_LABELS[pathname] ?? 'Dashboard';

  // Sekunden-Tick nur, solange ein Timer läuft.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  void now;

  return (
    <header className="h-14 bg-dash-surfaceAlt border-b border-dash-border flex items-center px-5 gap-4 flex-shrink-0">
      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-sm text-dash-textBright truncate">{pageTitle}</h1>
      </div>

      {/* ── Timer Widget ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dash-surface border border-dash-border">
        <button
          onClick={() => (active ? stop() : start({ beschreibung: 'Schnellstart' }))}
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center transition-colors',
            active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-dash-gold/20 text-dash-gold hover:bg-dash-gold/30'
          )}
          title={active ? 'Timer stoppen' : 'Timer starten'}
        >
          {active ? <Square size={9} fill="currentColor" /> : <Play size={9} fill="currentColor" />}
        </button>
        <span className={cn('text-xs font-mono font-semibold', active ? 'text-red-400' : 'text-dash-textMuted')}>
          {active ? formatElapsed(active.start_zeit) : '00:00'}
        </span>
        {active && (
          <span className="text-[10px] text-dash-textDim hidden sm:inline">
            {active.projekte?.name ?? 'Kein Projekt'}
          </span>
        )}
      </div>

      {/* ── Notifications ── */}
      <button className="relative p-2 rounded-lg text-dash-textMuted hover:text-dash-textBright hover:bg-dash-surface transition-colors">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-dash-gold rounded-full" />
      </button>

      {/* ── User Menu ── */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-dash-surface transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-dash-gold/15 border border-dash-gold/30 flex items-center justify-center">
            <span className="font-display text-dash-gold text-[10px]">MS</span>
          </div>
          <span className="text-sm text-dash-textBright font-medium hidden sm:block">Marcel</span>
          <ChevronDown size={13} className="text-dash-textMuted" />
        </button>

        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-52 bg-dash-surface border border-dash-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-dash-border">
                <div className="text-sm font-semibold text-dash-textBright">Marcel Spahr</div>
                <div className="text-xs text-dash-textMuted">kontakt@marcelspahr.ch</div>
              </div>
              <a
                href="/dashboard/einstellungen"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-dash-textSubtle hover:text-dash-textBright hover:bg-dash-border/40 transition-colors"
              >
                Einstellungen
              </a>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-dash-textSubtle hover:text-dash-textBright hover:bg-dash-border/40 transition-colors"
              >
                Öffentliche Website ↗
              </a>
              <div className="border-t border-dash-border mt-1" />
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
