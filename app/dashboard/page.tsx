'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, FolderKanban, Users, Receipt,
  GitBranch, CheckSquare, Calendar, Bot,
  Plus, ArrowUp, ArrowDown, Clock, AlertCircle,
} from 'lucide-react';
import { cn, getDayOfYear, getGreeting, formatCHF } from '@/lib/utils';

// ── Typen ────────────────────────────────────────────────────

type Metric = {
  label:    string;
  value:    string;
  change:   string;
  positive: boolean;
  icon:     React.ElementType;
  color:    string;
  bg:       string;
};

type Appointment = { time: string; title: string; type: string; client: string };
type Task        = { title: string; priority: 'kritisch' | 'hoch' | 'mittel'; due: string; project: string };
type Invoice     = { number: string; client: string; amount: number; status: 'gesendet' | 'bezahlt' | 'ueberfaellig' };
type Agent       = { emoji: string; name: string; status: 'aktiv' | 'pausiert'; runs: number };

// ── Mock-Daten (werden durch echte Supabase-Daten ersetzt) ───

const METRICS: Metric[] = [
  { label: 'Monatsumsatz',      value: formatCHF(12400), change: '+23%',    positive: true,  icon: TrendingUp,   color: 'text-[#6366f1]', bg: 'bg-[#6366f1]/10' },
  { label: 'Aktive Projekte',   value: '7',              change: '+2',       positive: true,  icon: FolderKanban, color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10' },
  { label: 'Kunden total',      value: '34',             change: '+5',       positive: true,  icon: Users,        color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10' },
  { label: 'Offene Rechnungen', value: formatCHF(6800),  change: '3 offen',  positive: false, icon: Receipt,      color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
  { label: 'Pipeline-Wert',     value: formatCHF(48000), change: '6 Deals',  positive: true,  icon: GitBranch,    color: 'text-[#8b5cf6]', bg: 'bg-[#8b5cf6]/10' },
  { label: 'Tasks diese Woche', value: '12 / 18',        change: '67% done', positive: true,  icon: CheckSquare,  color: 'text-[#06b6d4]', bg: 'bg-[#06b6d4]/10' },
];

const APPOINTMENTS: Appointment[] = [
  { time: '10:00', title: 'KI-Analyse Workshop',      type: 'workshop', client: 'Müller AG' },
  { time: '13:30', title: 'Requirements Review',       type: 'call',     client: 'Bern Digital GmbH' },
  { time: '16:00', title: 'Projektbesprechung Q3',     type: 'meeting',  client: 'Intern' },
];

const TASKS: Task[] = [
  { title: 'BPMN-Diagramm finalisieren',    priority: 'kritisch', due: 'Heute',    project: 'Prozessopt.' },
  { title: 'Angebot Müller AG nachfassen',  priority: 'hoch',     due: 'Morgen',   project: 'Sales' },
  { title: 'SQL-Report für Bern Digital',   priority: 'hoch',     due: '16. Jun',  project: 'Projekt A' },
  { title: 'LinkedIn Post erstellen',       priority: 'mittel',   due: '17. Jun',  project: 'Marketing' },
  { title: 'Rechnung RE-2026-012 senden',   priority: 'mittel',   due: '18. Jun',  project: 'Finanzen' },
];

const INVOICES: Invoice[] = [
  { number: 'RE-2026-015', client: 'Müller AG',           amount: 3600,  status: 'gesendet' },
  { number: 'RE-2026-014', client: 'TechStart GmbH',      amount: 2100,  status: 'bezahlt'  },
  { number: 'RE-2026-013', client: 'Bern Digital GmbH',   amount: 5200,  status: 'ueberfaellig' },
];

const AGENTS: Agent[] = [
  { emoji: '🔍', name: 'Max – KI-Analyse',      status: 'aktiv',    runs: 47 },
  { emoji: '📝', name: 'Clara – Angebote',       status: 'aktiv',    runs: 23 },
  { emoji: '📧', name: 'Leo – Outreach',         status: 'pausiert', runs: 8  },
  { emoji: '📊', name: 'Nina – Wochenbericht',   status: 'aktiv',    runs: 12 },
  { emoji: '🔔', name: 'Sam – Mahnwesen',        status: 'aktiv',    runs: 5  },
];

// ── Hilfskomponenten ─────────────────────────────────────────

const PRIORITY_STYLES = {
  kritisch: 'bg-red-500/20 text-red-400',
  hoch:     'bg-orange-500/20 text-orange-400',
  mittel:   'bg-yellow-500/20 text-yellow-400',
};

const INVOICE_STATUS_STYLES = {
  gesendet:     { label: 'Gesendet',    style: 'bg-blue-500/20 text-blue-400' },
  bezahlt:      { label: 'Bezahlt',     style: 'bg-green-500/20 text-green-400' },
  ueberfaellig: { label: 'Überfällig',  style: 'bg-red-500/20 text-red-400' },
};

const TYPE_COLORS: Record<string, string> = {
  workshop: 'bg-purple-500/20 text-purple-400',
  call:     'bg-blue-500/20 text-blue-400',
  meeting:  'bg-green-500/20 text-green-400',
};

// ── Hauptkomponente ──────────────────────────────────────────

export default function DashboardPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting  = getGreeting();
  const dayOfYear = getDayOfYear();
  const dateStr   = now.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {greeting}, Marcel{' '}
            <span className="inline-block" role="img" aria-label="wave">👋</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {dateStr} · Tag {dayOfYear}/365
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6366f1] text-white text-sm font-semibold hover:bg-[#5558e8] transition-colors shadow-lg shadow-indigo-500/25">
            <Plus size={16} />
            Neuer Eintrag
          </button>
        </div>
      </div>

      {/* ── Metriken ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-[#252836] border border-[#2d3144] rounded-2xl p-4 hover:border-[#3d4260] transition-colors">
              <div className="flex items-start justify-between">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', m.bg)}>
                  <Icon size={18} className={m.color} />
                </div>
                <span className={cn(
                  'text-xs font-semibold flex items-center gap-0.5',
                  m.positive ? 'text-green-400' : 'text-amber-400'
                )}>
                  {m.positive ? <ArrowUp size={11} /> : <AlertCircle size={11} />}
                  {m.change}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-white">{m.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Nächste Termine */}
        <Widget title="Heutige Termine" icon={Calendar} href="/dashboard/kalender" count={APPOINTMENTS.length}>
          <div className="space-y-2">
            {APPOINTMENTS.map((a) => (
              <div key={a.title} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                <div className="text-center w-12 flex-shrink-0">
                  <div className="text-xs font-bold text-[#6366f1]">{a.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{a.title}</div>
                  <div className="text-xs text-slate-400">{a.client}</div>
                </div>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', TYPE_COLORS[a.type] || 'bg-slate-700 text-slate-300')}>
                  {a.type}
                </span>
              </div>
            ))}
          </div>
        </Widget>

        {/* Offene Tasks */}
        <Widget title="Offene Tasks" icon={CheckSquare} href="/dashboard/projekte" count={TASKS.length}>
          <div className="space-y-2">
            {TASKS.map((t) => (
              <div key={t.title} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', PRIORITY_STYLES[t.priority])}>
                  {t.priority.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.project}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                  <Clock size={11} />{t.due}
                </div>
              </div>
            ))}
          </div>
        </Widget>

        {/* Letzte Rechnungen */}
        <Widget title="Letzte Rechnungen" icon={Receipt} href="/dashboard/rechnungen" count={INVOICES.length}>
          <div className="space-y-2">
            {INVOICES.map((inv) => {
              const s = INVOICE_STATUS_STYLES[inv.status];
              return (
                <div key={inv.number} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{inv.number}</div>
                    <div className="text-xs text-slate-400 truncate">{inv.client}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-white">{formatCHF(inv.amount)}</div>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', s.style)}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Widget>

        {/* KI-Agenten */}
        <Widget title="KI-Agenten" icon={Bot} href="/dashboard/ki-agenten" count={AGENTS.filter(a => a.status === 'aktiv').length}>
          <div className="space-y-2">
            {AGENTS.map((agent) => (
              <div key={agent.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-[#1a1d27] flex items-center justify-center text-base flex-shrink-0">
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{agent.name}</div>
                  <div className="text-xs text-slate-400">{agent.runs} Ausführungen</div>
                </div>
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  agent.status === 'aktiv' ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-slate-500'
                )} title={agent.status} />
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* ── Platzhalter für Charts (Phase 3) ── */}
      <div className="bg-[#252836] border border-[#2d3144] border-dashed rounded-2xl p-8 text-center">
        <div className="text-3xl mb-3">📊</div>
        <p className="text-slate-300 font-semibold">Charts kommen in Phase 3</p>
        <p className="text-sm text-slate-500 mt-1">
          Umsatz-Chart, Pipeline-Funnel, Projekte-Donut und Zeiterfassung werden nach Supabase-Integration integriert.
        </p>
      </div>

    </div>
  );
}

// ── Widget-Wrapper ────────────────────────────────────────────

function Widget({
  title, icon: Icon, href, count, children
}: {
  title: string;
  icon:  React.ElementType;
  href:  string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#252836] border border-[#2d3144] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3144]">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-white">{title}</span>
          {count !== undefined && (
            <span className="text-xs bg-[#6366f1]/20 text-[#6366f1] font-bold px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        <a href={href} className="text-xs text-slate-500 hover:text-[#6366f1] transition-colors">
          Alle →
        </a>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
