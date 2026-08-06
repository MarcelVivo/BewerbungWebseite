'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TrendingUp, FolderKanban, Users, Receipt,
  GitBranch, CheckSquare, Calendar, Bot,
  Plus, AlertCircle, Clock, Loader2,
} from 'lucide-react';
import { cn, getDayOfYear, getGreeting, formatCHF } from '@/lib/utils';

// ── Typen ────────────────────────────────────────────────────

interface DashStats {
  monatsumsatz:    number;
  aktiveProjekte:  number;
  kundenTotal:     number;
  offeneRechnBetrag: number;
  offeneRechnCount:  number;
  pipelineWert:    number;
  dealCount:       number;
  tasksDone:       number;
  tasksTotal:      number;
}

interface Termin {
  id: string;
  titel: string;
  typ: string;
  start_zeit: string;
  kunden?: { kontaktperson: string; firmenname?: string } | null;
  kunde_name?: string;
}

interface Task {
  id: string;
  titel: string;
  prioritaet: 'kritisch' | 'hoch' | 'mittel' | 'niedrig';
  faellig_am?: string;
  projekte?: { name: string } | null;
}

interface Rechnung {
  id: string;
  rechnungsnummer: string;
  gesamtbetrag?: number;
  status: 'entwurf' | 'gesendet' | 'bezahlt' | 'ueberfaellig' | 'storniert';
  kunden?: { kontaktperson: string; firmenname?: string } | null;
}

interface KiAgent {
  id: string;
  name: string;
  avatar_emoji: string;
  status: 'aktiv' | 'pausiert' | 'entwurf';
  ausfuehrungen_total: number;
}

// ── Hilfsfunktionen ──────────────────────────────────────────

const PRIORITY_STYLES = {
  kritisch: 'bg-red-500/20 text-red-400',
  hoch:     'bg-orange-500/20 text-orange-400',
  mittel:   'bg-yellow-500/20 text-yellow-400',
  niedrig:  'bg-slate-600/40 text-slate-400',
};

const INVOICE_STATUS = {
  entwurf:      { label: 'Entwurf',   style: 'bg-slate-600/40 text-slate-400' },
  gesendet:     { label: 'Gesendet',  style: 'bg-blue-500/20 text-blue-400' },
  bezahlt:      { label: 'Bezahlt',   style: 'bg-green-500/20 text-green-400' },
  ueberfaellig: { label: 'Überfällig',style: 'bg-red-500/20 text-red-400' },
  storniert:    { label: 'Storniert', style: 'bg-slate-700/40 text-slate-500' },
};

const TYPE_COLORS: Record<string, string> = {
  workshop: 'bg-purple-500/20 text-purple-400',
  call:     'bg-blue-500/20 text-blue-400',
  meeting:  'bg-green-500/20 text-green-400',
  intern:   'bg-slate-600/40 text-slate-400',
  buchung:  'bg-cyan-500/20 text-cyan-400',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function formatDue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  d.setHours(0,0,0,0);
  if (d.getTime() === today.getTime())    return 'Heute';
  if (d.getTime() === tomorrow.getTime()) return 'Morgen';
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
}

// ── Hauptkomponente ──────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient();
  const [now, setNow] = useState(new Date());
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState<DashStats | null>(null);
  const [termine, setTermine]     = useState<Termin[]>([]);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [agents, setAgents]       = useState<KiAgent[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd     = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const [
      { data: rechnDaten },
      { data: projekteDaten },
      { data: kundenDaten },
      { data: dealsDaten },
      { data: tasksDaten },
      { data: termineDaten },
      { data: agentsDaten },
      { data: rechnungsList },
    ] = await Promise.all([
      // Alle Rechnungen für Stats
      supabase.from('rechnungen').select('status,gesamtbetrag,bezahlt_am'),
      // Projekte-Status
      supabase.from('projekte').select('status'),
      // Kunden-Anzahl
      supabase.from('kunden').select('id'),
      // Deals für Pipeline
      supabase.from('deals').select('status,wert'),
      // Tasks alle (für Stats + Widget offen max 5)
      supabase.from('tasks').select('id,titel,prioritaet,faellig_am,status,projekte(name)')
        .order('faellig_am', { ascending: true }),
      // Heutige Termine
      supabase.from('termine').select('id,titel,typ,start_zeit,kunden(kontaktperson,firmenname),kunde_name')
        .gte('start_zeit', todayStart).lt('start_zeit', todayEnd).order('start_zeit'),
      // KI-Agenten
      supabase.from('ki_agenten').select('id,name,avatar_emoji,status,ausfuehrungen_total').order('status'),
      // Letzte 4 Rechnungen für Widget
      supabase.from('rechnungen').select('id,rechnungsnummer,gesamtbetrag,status,kunden(kontaktperson,firmenname)')
        .order('created_at', { ascending: false }).limit(4),
    ]);

    // Stats berechnen
    const rd = rechnDaten || [];
    const pd = projekteDaten || [];
    const dd = dealsDaten || [];
    const td = (tasksDaten as any[]) || [];

    const monatsBezahlt = rd.filter(r =>
      r.status === 'bezahlt' && r.bezahlt_am && r.bezahlt_am >= startOfMonth
    );

    setStats({
      monatsumsatz:      monatsBezahlt.reduce((s, r) => s + (r.gesamtbetrag || 0), 0),
      aktiveProjekte:    pd.filter(p => p.status === 'aktiv').length,
      kundenTotal:       kundenDaten?.length ?? 0,
      offeneRechnBetrag: rd.filter(r => ['gesendet','ueberfaellig'].includes(r.status)).reduce((s, r) => s + (r.gesamtbetrag || 0), 0),
      offeneRechnCount:  rd.filter(r => ['gesendet','ueberfaellig'].includes(r.status)).length,
      pipelineWert:      dd.filter(d => !['gewonnen','verloren'].includes(d.status)).reduce((s, d) => s + (d.wert || 0), 0),
      dealCount:         dd.filter(d => !['gewonnen','verloren'].includes(d.status)).length,
      tasksDone:         td.filter(t => t.status === 'done').length,
      tasksTotal:        td.length,
    });

    setTermine((termineDaten as Termin[]) || []);
    // Widget: nur offene Tasks, max 5
    setTasks(td.filter(t => t.status !== 'done').slice(0, 5) as Task[]);
    setRechnungen((rechnungsList as Rechnung[]) || []);
    setAgents((agentsDaten as KiAgent[]) || []);
    setLoading(false);
  }

  const greeting  = getGreeting();
  const dayOfYear = getDayOfYear();
  const dateStr   = now.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const donePct   = stats && stats.tasksTotal > 0 ? Math.round((stats.tasksDone / stats.tasksTotal) * 100) : 0;

  const METRICS = stats ? [
    {
      label: 'Monatsumsatz',
      value: formatCHF(stats.monatsumsatz),
      badge: 'bezahlt',
      positive: true,
      icon: TrendingUp,
      color: 'text-[#6366f1]',
      bg: 'bg-[#6366f1]/10',
    },
    {
      label: 'Aktive Projekte',
      value: String(stats.aktiveProjekte),
      badge: 'aktiv',
      positive: true,
      icon: FolderKanban,
      color: 'text-[#22c55e]',
      bg: 'bg-[#22c55e]/10',
    },
    {
      label: 'Kunden total',
      value: String(stats.kundenTotal),
      badge: 'gesamt',
      positive: true,
      icon: Users,
      color: 'text-[#3b82f6]',
      bg: 'bg-[#3b82f6]/10',
    },
    {
      label: 'Offene Rechnungen',
      value: formatCHF(stats.offeneRechnBetrag),
      badge: `${stats.offeneRechnCount} offen`,
      positive: stats.offeneRechnCount === 0,
      icon: Receipt,
      color: 'text-[#f59e0b]',
      bg: 'bg-[#f59e0b]/10',
    },
    {
      label: 'Pipeline-Wert',
      value: formatCHF(stats.pipelineWert),
      badge: `${stats.dealCount} Deals`,
      positive: true,
      icon: GitBranch,
      color: 'text-[#8b5cf6]',
      bg: 'bg-[#8b5cf6]/10',
    },
    {
      label: 'Offene Tasks',
      value: String(stats.tasksTotal),
      badge: `${donePct}% erledigt`,
      positive: donePct >= 50,
      icon: CheckSquare,
      color: 'text-[#06b6d4]',
      bg: 'bg-[#06b6d4]/10',
    },
  ] : [];

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
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6366f1] text-white text-sm font-semibold hover:bg-[#5558e8] transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {loading ? 'Die Daten werden geladen.' : 'Aktualisieren'}
        </button>
      </div>

      {/* ── Metriken ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {loading && !stats ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#252836] border border-[#2d3144] rounded-2xl p-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-[#2d3144] mb-4" />
              <div className="h-6 bg-[#2d3144] rounded w-24 mb-2" />
              <div className="h-3 bg-[#2d3144] rounded w-16" />
            </div>
          ))
        ) : METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-[#252836] border border-[#2d3144] rounded-2xl p-4 hover:border-[#3d4260] transition-colors">
              <div className="flex items-start justify-between">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', m.bg)}>
                  <Icon size={18} className={m.color} />
                </div>
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  m.positive ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                )}>
                  {m.positive ? '' : <AlertCircle size={10} className="inline mr-0.5" />}
                  {m.badge}
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

        {/* Heutige Termine */}
        <Widget title="Heutige Termine" icon={Calendar} href="/dashboard/kalender" count={termine.length}>
          {termine.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Keine Termine heute</p>
          ) : (
            <div className="space-y-2">
              {termine.map((t) => {
                const clientName = t.kunden?.firmenname || t.kunden?.kontaktperson || t.kunde_name || 'Intern';
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                    <div className="text-center w-12 flex-shrink-0">
                      <div className="text-xs font-bold text-[#6366f1]">{formatTime(t.start_zeit)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{t.titel}</div>
                      <div className="text-xs text-slate-400">{clientName}</div>
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0', TYPE_COLORS[t.typ] || 'bg-slate-700 text-slate-300')}>
                      {t.typ}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Offene Tasks */}
        <Widget title="Offene Tasks" icon={CheckSquare} href="/dashboard/projekte" count={tasks.length}>
          {tasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Es sind keine Aufgaben offen.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', PRIORITY_STYLES[t.prioritaet])}>
                    {t.prioritaet.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{t.titel}</div>
                    <div className="text-xs text-slate-400">{(t.projekte as any)?.name || 'Kein Projekt.'}</div>
                  </div>
                  {t.faellig_am && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                      <Clock size={11} />{formatDue(t.faellig_am)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Letzte Rechnungen */}
        <Widget title="Letzte Rechnungen" icon={Receipt} href="/dashboard/rechnungen" count={rechnungen.length}>
          {rechnungen.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Noch keine Rechnungen</p>
          ) : (
            <div className="space-y-2">
              {rechnungen.map((inv) => {
                const s = INVOICE_STATUS[inv.status] || INVOICE_STATUS.entwurf;
                const client = (inv.kunden as any)?.firmenname || (inv.kunden as any)?.kontaktperson || 'Kein Kunde.';
                return (
                  <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">{inv.rechnungsnummer}</div>
                      <div className="text-xs text-slate-400 truncate">{client}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-white">{formatCHF(inv.gesamtbetrag || 0)}</div>
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', s.style)}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* KI-Agenten */}
        <Widget title="KI-Agenten" icon={Bot} href="/dashboard/ki-agenten" count={agents.filter(a => a.status === 'aktiv').length}>
          {agents.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Noch keine KI-Agenten konfiguriert</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1117]/60 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#1a1d27] flex items-center justify-center text-base flex-shrink-0">
                    {agent.avatar_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{agent.name}</div>
                    <div className="text-xs text-slate-400">{agent.ausfuehrungen_total} Ausführungen</div>
                  </div>
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    agent.status === 'aktiv' ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-slate-500'
                  )} title={agent.status} />
                </div>
              ))}
            </div>
          )}
        </Widget>

      </div>
    </div>
  );
}

// ── Widget-Wrapper ────────────────────────────────────────────

function Widget({ title, icon: Icon, href, count, children }: {
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
