'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Users, TrendingUp, Briefcase, Clock, FileText,
  CheckCircle2, AlertCircle, MessageSquare, BarChart2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

interface Stats {
  kunden:      { total: number; aktive: number; leads: number };
  deals:       { total: number; offen: number; gewonnen: number; wert: number; pipeline: number };
  projekte:    { total: number; aktiv: number; abgeschlossen: number };
  rechnungen:  { total: number; offen_betrag: number; bezahlt_betrag: number; ueberfaellig: number };
  zeit:        { monat_minuten: number; woche_minuten: number; abrechenbar_minuten: number };
  anfragen:    { total: number; neu: number };
  tasks:       { total: number; done: number; in_progress: number };
}

const EMPTY_STATS: Stats = {
  kunden:     { total: 0, aktive: 0, leads: 0 },
  deals:      { total: 0, offen: 0, gewonnen: 0, wert: 0, pipeline: 0 },
  projekte:   { total: 0, aktiv: 0, abgeschlossen: 0 },
  rechnungen: { total: 0, offen_betrag: 0, bezahlt_betrag: 0, ueberfaellig: 0 },
  zeit:       { monat_minuten: 0, woche_minuten: 0, abrechenbar_minuten: 0 },
  anfragen:   { total: 0, neu: 0 },
  tasks:      { total: 0, done: 0, in_progress: 0 },
};

// ── Helpers ────────────────────────────────────────────────

function formatCHF(v: number) {
  return `CHF ${v.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatHours(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

// ── Mini Components ────────────────────────────────────────

function KPICard({ label, value, sub, Icon, iconCls = 'text-ms-400', accent = false }: {
  label: string; value: string | number; sub?: string;
  Icon: React.ElementType; iconCls?: string; accent?: boolean;
}) {
  return (
    <div className={`bg-[#1e2235] border rounded-2xl p-5 ${accent ? 'border-ms-500/40' : 'border-[#2d3144]'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-[#2d3144] flex items-center justify-center ${iconCls}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
      {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ label, value, max, cls = 'bg-ms-500' }: {
  label: string; value: number; max: number; cls?: string;
}) {
  const width = max > 0 ? `${Math.min(100, (value / max) * 100)}%` : '0%';
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-[#2d3144] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cls}`} style={{ width }} />
      </div>
      <span className="text-slate-300 text-xs w-10 text-right">{value}</span>
    </div>
  );
}

function SectionHeader({ title, Icon }: { title: string; Icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-ms-400" />
      <h2 className="text-white font-semibold">{title}</h2>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function StatistikenPage() {
  const supabase = createClient();
  const [stats, setStats]     = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<'monat' | 'quartal' | 'jahr'>('monat');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);

    const now  = new Date();
    const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      { data: kunden },
      { data: deals },
      { data: projekte },
      { data: rechnungen },
      { data: zeitMon },
      { data: zeitWk },
      { data: anfragen },
      { data: tasks },
    ] = await Promise.all([
      supabase.from('kunden').select('status'),
      supabase.from('deals').select('status,wert'),
      supabase.from('projekte').select('status'),
      supabase.from('rechnungen').select('status,gesamtbetrag'),
      supabase.from('zeiteintraege').select('dauer_minuten,abrechenbar').gte('start_zeit', startOfMonth.toISOString()),
      supabase.from('zeiteintraege').select('dauer_minuten').gte('start_zeit', startOfWeek.toISOString()),
      supabase.from('recruiter_anfragen').select('status'),
      supabase.from('tasks').select('status'),
    ]);

    const k = kunden || [];
    const d = deals   || [];
    const p = projekte || [];
    const r = rechnungen || [];
    const zm = zeitMon || [];
    const zw = zeitWk  || [];
    const af = anfragen || [];
    const t  = tasks || [];

    setStats({
      kunden: {
        total:  k.length,
        aktive: k.filter(x => x.status === 'kunde').length,
        leads:  k.filter(x => x.status === 'lead').length,
      },
      deals: {
        total:    d.length,
        offen:    d.filter(x => !['gewonnen','verloren'].includes(x.status)).length,
        gewonnen: d.filter(x => x.status === 'gewonnen').length,
        wert:     d.filter(x => x.status === 'gewonnen').reduce((s, x) => s + (x.wert || 0), 0),
        pipeline: d.filter(x => !['gewonnen','verloren'].includes(x.status)).reduce((s, x) => s + (x.wert || 0), 0),
      },
      projekte: {
        total:         p.length,
        aktiv:         p.filter(x => x.status === 'aktiv').length,
        abgeschlossen: p.filter(x => x.status === 'abgeschlossen').length,
      },
      rechnungen: {
        total:          r.length,
        bezahlt_betrag: r.filter(x => x.status === 'bezahlt').reduce((s, x) => s + (x.gesamtbetrag || 0), 0),
        offen_betrag:   r.filter(x => x.status === 'gesendet').reduce((s, x) => s + (x.gesamtbetrag || 0), 0),
        ueberfaellig:   r.filter(x => x.status === 'ueberfaellig').length,
      },
      zeit: {
        monat_minuten:       zm.reduce((s, x) => s + (x.dauer_minuten || 0), 0),
        woche_minuten:       zw.reduce((s, x) => s + (x.dauer_minuten || 0), 0),
        abrechenbar_minuten: zm.filter(x => x.abrechenbar).reduce((s, x) => s + (x.dauer_minuten || 0), 0),
      },
      anfragen: {
        total: af.length,
        neu:   af.filter(x => x.status === 'neu').length,
      },
      tasks: {
        total:       t.length,
        done:        t.filter(x => x.status === 'done').length,
        in_progress: t.filter(x => x.status === 'in_progress').length,
      },
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-slate-400">
        <BarChart2 size={20} className="animate-pulse" /> Statistiken werden geladen…
      </div>
    );
  }

  const abrechenbarPct = pct(stats.zeit.abrechenbar_minuten, stats.zeit.monat_minuten);
  const tasksPct       = pct(stats.tasks.done, stats.tasks.total);

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistiken</h1>
          <p className="text-slate-400 text-sm mt-0.5">Übersicht über alle Aktivitäten</p>
        </div>
        <button onClick={load}
          className="text-ms-400 text-sm hover:underline">Aktualisieren</button>
      </div>

      {/* Top KPIs */}
      <div>
        <SectionHeader title="Business Overview" Icon={TrendingUp} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Aktive Kunden"   value={stats.kunden.aktive}     sub={`${stats.kunden.total} gesamt`}  Icon={Users}    iconCls="text-blue-400" />
          <KPICard label="Deals (offen)"   value={stats.deals.offen}       sub={`Pipeline: ${formatCHF(stats.deals.pipeline)}`} Icon={TrendingUp} iconCls="text-green-400" accent />
          <KPICard label="Umsatz (bezahlt)"value={formatCHF(stats.rechnungen.bezahlt_betrag)} sub={`Offen: ${formatCHF(stats.rechnungen.offen_betrag)}`} Icon={FileText} iconCls="text-indigo-400" />
          <KPICard label="Leads"           value={stats.kunden.leads}      sub={`${stats.deals.gewonnen} Deals gewonnen`} Icon={Users} iconCls="text-cyan-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals Pipeline */}
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-5">
          <SectionHeader title="Deal-Pipeline" Icon={TrendingUp} />
          <div className="space-y-3">
            {[
              { label: 'Lead',          value: 0, status: 'lead' },
              { label: 'Erstgespräch',  value: 0, status: 'erstgespraech' },
              { label: 'Angebot',       value: 0, status: 'angebot' },
              { label: 'Verhandlung',   value: 0, status: 'verhandlung' },
              { label: 'Gewonnen',      value: 0, status: 'gewonnen' },
            ].map(stage => {
              return (
                <ProgressBar key={stage.status} label={stage.label}
                  value={0}
                  max={Math.max(stats.deals.total, 1)}
                  cls={stage.status === 'gewonnen' ? 'bg-green-500' : 'bg-ms-500'} />
              );
            })}
            <p className="text-slate-600 text-xs pt-2">* Deals nach Stage-Aufteilung in der Deals-Ansicht verfügbar</p>
          </div>
        </div>

        {/* Projekte */}
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-5">
          <SectionHeader title="Projekte" Icon={Briefcase} />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Aktiv',          value: stats.projekte.aktiv,         cls: 'text-green-400' },
              { label: 'Abgeschlossen',  value: stats.projekte.abgeschlossen, cls: 'text-blue-400' },
              { label: 'Gesamt',         value: stats.projekte.total,         cls: 'text-white' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Task-Fortschritt</span>
              <span>{tasksPct}%</span>
            </div>
            <div className="h-3 bg-[#2d3144] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-ms-600 to-ms-400 rounded-full transition-all"
                style={{ width: `${tasksPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{stats.tasks.done} erledigt</span>
              <span>{stats.tasks.in_progress} in Bearbeitung</span>
              <span>{stats.tasks.total} gesamt</span>
            </div>
          </div>
        </div>

        {/* Zeiterfassung */}
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-5">
          <SectionHeader title="Zeiterfassung (aktueller Monat)" Icon={Clock} />
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Diese Woche', value: formatHours(stats.zeit.woche_minuten), cls: 'text-white' },
              { label: 'Diesen Monat', value: formatHours(stats.zeit.monat_minuten), cls: 'text-ms-400' },
              { label: 'Abrechenbar', value: formatHours(stats.zeit.abrechenbar_minuten), cls: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Abrechenbarkeitsrate</span>
              <span>{abrechenbarPct}%</span>
            </div>
            <div className="h-2 bg-[#2d3144] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full"
                style={{ width: `${abrechenbarPct}%` }} />
            </div>
          </div>
        </div>

        {/* Rechnungen & Recruiter */}
        <div className="space-y-4">
          <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-5">
            <SectionHeader title="Rechnungen" Icon={FileText} />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Bezahlt',     value: formatCHF(stats.rechnungen.bezahlt_betrag), cls: 'text-green-400' },
                { label: 'Offen',       value: formatCHF(stats.rechnungen.offen_betrag),   cls: 'text-yellow-400' },
                { label: 'Überfällig',  value: stats.rechnungen.ueberfaellig,              cls: stats.rechnungen.ueberfaellig > 0 ? 'text-red-400' : 'text-slate-400' },
                { label: 'Total',       value: stats.rechnungen.total,                     cls: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-[#2d3144]/50 rounded-xl p-3">
                  <p className={`text-sm font-bold ${s.cls}`}>{s.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-5">
            <SectionHeader title="Recruiter-Anfragen" Icon={MessageSquare} />
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats.anfragen.total}</p>
                <p className="text-slate-500 text-xs mt-1">Gesamt</p>
              </div>
              {stats.anfragen.neu > 0 && (
                <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-xl px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-blue-300 font-semibold">{stats.anfragen.neu} neue</span>
                  <span className="text-blue-400/60 text-xs">ungelesen</span>
                </div>
              )}
              {stats.anfragen.neu === 0 && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <CheckCircle2 size={16} className="text-green-500" /> Alle gelesen
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick wins */}
      {(stats.rechnungen.ueberfaellig > 0 || stats.anfragen.neu > 0) && (
        <div className="bg-orange-900/20 border border-orange-800/40 rounded-2xl p-5">
          <h3 className="text-orange-300 font-semibold mb-3 flex items-center gap-2">
            <AlertCircle size={16} /> Handlungsbedarf
          </h3>
          <div className="space-y-2">
            {stats.rechnungen.ueberfaellig > 0 && (
              <p className="text-orange-200/80 text-sm">
                • {stats.rechnungen.ueberfaellig} überfällige Rechnung{stats.rechnungen.ueberfaellig > 1 ? 'n' : ''} — Mahnungen versenden
              </p>
            )}
            {stats.anfragen.neu > 0 && (
              <p className="text-orange-200/80 text-sm">
                • {stats.anfragen.neu} ungelesene Recruiter-Anfrage{stats.anfragen.neu > 1 ? 'n' : ''} — unter Bewerbungen prüfen
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
