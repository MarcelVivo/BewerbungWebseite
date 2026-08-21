'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TrendingUp, FolderKanban, Users, Receipt,
  GitBranch, CheckSquare, Calendar, Bot,
  RefreshCw, AlertCircle, Clock, Loader2,
} from 'lucide-react';
import { cn, getDayOfYear, getGreeting, formatCHF } from '@/lib/utils';
import { Card, Button, Badge } from '@/components/dashboard/ui';

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

const PRIORITY_VARIANT: Record<Task['prioritaet'], 'danger' | 'gold' | 'warning' | 'neutral'> = {
  kritisch: 'danger',
  hoch:     'gold',
  mittel:   'warning',
  niedrig:  'neutral',
};

const INVOICE_STATUS: Record<Rechnung['status'], { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' }> = {
  entwurf:      { label: 'Entwurf',    variant: 'neutral' },
  gesendet:     { label: 'Gesendet',   variant: 'info' },
  bezahlt:      { label: 'Bezahlt',    variant: 'success' },
  ueberfaellig: { label: 'Überfällig', variant: 'danger' },
  storniert:    { label: 'Storniert',  variant: 'neutral' },
};

const TYPE_VARIANT: Record<string, 'gold' | 'info' | 'success' | 'neutral'> = {
  workshop: 'gold',
  call:     'info',
  meeting:  'success',
  intern:   'neutral',
  buchung:  'info',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function formatDue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  d.setHours(0, 0, 0, 0);
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
      supabase.from('rechnungen').select('status,gesamtbetrag,bezahlt_am'),
      supabase.from('projekte').select('status'),
      supabase.from('kunden').select('id'),
      supabase.from('deals').select('status,wert'),
      supabase.from('tasks').select('id,titel,prioritaet,faellig_am,status,projekte(name)')
        .order('faellig_am', { ascending: true }),
      supabase.from('termine').select('id,titel,typ,start_zeit,kunden(kontaktperson,firmenname),kunde_name')
        .gte('start_zeit', todayStart).lt('start_zeit', todayEnd).order('start_zeit'),
      supabase.from('ki_agenten').select('id,name,avatar_emoji,status,ausfuehrungen_total').order('status'),
      supabase.from('rechnungen').select('id,rechnungsnummer,gesamtbetrag,status,kunden(kontaktperson,firmenname)')
        .order('created_at', { ascending: false }).limit(4),
    ]);

    const rd = rechnDaten || [];
    const pd = projekteDaten || [];
    const dd = dealsDaten || [];
    const td = (tasksDaten as any[]) || [];

    const monatsBezahlt = rd.filter((r) =>
      r.status === 'bezahlt' && r.bezahlt_am && r.bezahlt_am >= startOfMonth
    );

    setStats({
      monatsumsatz:      monatsBezahlt.reduce((s, r) => s + (r.gesamtbetrag || 0), 0),
      aktiveProjekte:    pd.filter((p) => p.status === 'aktiv').length,
      kundenTotal:       kundenDaten?.length ?? 0,
      offeneRechnBetrag: rd.filter((r) => ['gesendet', 'ueberfaellig'].includes(r.status)).reduce((s, r) => s + (r.gesamtbetrag || 0), 0),
      offeneRechnCount:  rd.filter((r) => ['gesendet', 'ueberfaellig'].includes(r.status)).length,
      pipelineWert:      dd.filter((d) => !['gewonnen', 'verloren'].includes(d.status)).reduce((s, d) => s + (d.wert || 0), 0),
      dealCount:         dd.filter((d) => !['gewonnen', 'verloren'].includes(d.status)).length,
      tasksDone:         td.filter((t) => t.status === 'done').length,
      tasksTotal:        td.length,
    });

    setTermine((termineDaten as unknown as Termin[]) || []);
    setTasks(td.filter((t) => t.status !== 'done').slice(0, 5) as Task[]);
    setRechnungen((rechnungsList as unknown as Rechnung[]) || []);
    setAgents((agentsDaten as KiAgent[]) || []);
    setLoading(false);
  }

  const greeting  = getGreeting();
  const dayOfYear = getDayOfYear();
  const dateStr   = now.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const donePct   = stats && stats.tasksTotal > 0 ? Math.round((stats.tasksDone / stats.tasksTotal) * 100) : 0;

  const METRICS = stats ? [
    { label: 'Monatsumsatz',     value: formatCHF(stats.monatsumsatz),          badge: 'bezahlt',              positive: true,                     icon: TrendingUp,  color: '#c9a84c' },
    { label: 'Aktive Projekte',  value: String(stats.aktiveProjekte),           badge: 'aktiv',                 positive: true,                     icon: FolderKanban, color: '#4ade80' },
    { label: 'Kunden total',     value: String(stats.kundenTotal),              badge: 'gesamt',                positive: true,                     icon: Users,       color: '#8ebef2' },
    { label: 'Offene Rechnungen', value: formatCHF(stats.offeneRechnBetrag),    badge: `${stats.offeneRechnCount} offen`, positive: stats.offeneRechnCount === 0, icon: Receipt, color: '#e0b84c' },
    { label: 'Pipeline-Wert',    value: formatCHF(stats.pipelineWert),          badge: `${stats.dealCount} Deals`, positive: true,                   icon: GitBranch,   color: '#a6425c' },
    { label: 'Offene Tasks',     value: String(stats.tasksTotal),               badge: `${donePct}% erledigt`,  positive: donePct >= 50,            icon: CheckSquare, color: '#4d7fbf' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-dash-textBright">
            {greeting}, Marcel{' '}
            <span className="inline-block" role="img" aria-label="wave">👋</span>
          </h2>
          <p className="text-sm text-dash-textMuted mt-0.5">
            {dateStr} · Tag {dayOfYear}/365
          </p>
        </div>
        <Button variant="primary" onClick={load} disabled={loading} icon={loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}>
          {loading ? 'Die Daten werden geladen.' : 'Aktualisieren'}
        </Button>
      </div>

      {/* ── Metriken ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {loading && !stats ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="sm" className="animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-dash-border mb-4" />
              <div className="h-6 bg-dash-border rounded w-24 mb-2" />
              <div className="h-3 bg-dash-border rounded w-16" />
            </Card>
          ))
        ) : METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} padding="sm" interactive>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${m.color}1a` }}>
                  <Icon size={18} style={{ color: m.color }} />
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
                <div className="font-display text-xl text-dash-textBright">{m.value}</div>
                <div className="text-xs text-dash-textMuted mt-0.5">{m.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Widget title="Heutige Termine" icon={Calendar} href="/dashboard/kalender" count={termine.length}>
          {termine.length === 0 ? (
            <p className="text-dash-textDim text-sm text-center py-4">Keine Termine heute</p>
          ) : (
            <div className="space-y-2">
              {termine.map((t) => {
                const clientName = t.kunden?.firmenname || t.kunden?.kontaktperson || t.kunde_name || 'Intern';
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dash-bg/60 transition-colors">
                    <div className="text-center w-12 flex-shrink-0">
                      <div className="text-xs font-bold text-dash-gold">{formatTime(t.start_zeit)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-dash-textBright font-medium truncate">{t.titel}</div>
                      <div className="text-xs text-dash-textMuted">{clientName}</div>
                    </div>
                    <Badge variant={TYPE_VARIANT[t.typ] || 'neutral'} className="flex-shrink-0">{t.typ}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        <Widget title="Offene Tasks" icon={CheckSquare} href="/dashboard/projekte" count={tasks.length}>
          {tasks.length === 0 ? (
            <p className="text-dash-textDim text-sm text-center py-4">Es sind keine Aufgaben offen.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dash-bg/60 transition-colors">
                  <Badge variant={PRIORITY_VARIANT[t.prioritaet]} className="flex-shrink-0">{t.prioritaet.toUpperCase()}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-dash-textBright font-medium truncate">{t.titel}</div>
                    <div className="text-xs text-dash-textMuted">{(t.projekte as any)?.name || 'Kein Projekt.'}</div>
                  </div>
                  {t.faellig_am && (
                    <div className="flex items-center gap-1 text-xs text-dash-textDim flex-shrink-0">
                      <Clock size={11} />{formatDue(t.faellig_am)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Widget>

        <Widget title="Letzte Rechnungen" icon={Receipt} href="/dashboard/rechnungen" count={rechnungen.length}>
          {rechnungen.length === 0 ? (
            <p className="text-dash-textDim text-sm text-center py-4">Noch keine Rechnungen</p>
          ) : (
            <div className="space-y-2">
              {rechnungen.map((inv) => {
                const s = INVOICE_STATUS[inv.status] || INVOICE_STATUS.entwurf;
                const client = (inv.kunden as any)?.firmenname || (inv.kunden as any)?.kontaktperson || 'Kein Kunde.';
                return (
                  <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dash-bg/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-dash-textBright font-medium">{inv.rechnungsnummer}</div>
                      <div className="text-xs text-dash-textMuted truncate">{client}</div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <div className="text-sm font-semibold text-dash-textBright">{formatCHF(inv.gesamtbetrag || 0)}</div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        <Widget title="KI-Agenten" icon={Bot} href="/dashboard/ki-agenten" count={agents.filter((a) => a.status === 'aktiv').length}>
          {agents.length === 0 ? (
            <p className="text-dash-textDim text-sm text-center py-4">Noch keine KI-Agenten konfiguriert</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dash-bg/60 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-dash-surface flex items-center justify-center text-base flex-shrink-0">
                    {agent.avatar_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-dash-textBright font-medium truncate">{agent.name}</div>
                    <div className="text-xs text-dash-textMuted">{agent.ausfuehrungen_total} Ausführungen</div>
                  </div>
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    agent.status === 'aktiv' ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-dash-textDim'
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
    <Card padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dash-border">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-dash-textMuted" />
          <span className="text-sm font-semibold text-dash-textBright">{title}</span>
          {count !== undefined && (
            <span className="text-xs bg-dash-gold/15 text-dash-gold font-bold px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        <a href={href} className="text-xs text-dash-textDim hover:text-dash-gold transition-colors">
          Alle →
        </a>
      </div>
      <div className="p-3">{children}</div>
    </Card>
  );
}
