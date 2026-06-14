'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Mail, Eye, Check, X, Search, MessageSquare, ExternalLink, Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

type KontaktStatus = 'neu' | 'gelesen' | 'beantwortet';

interface Kontaktanfrage {
  id: string;
  name: string;
  email: string;
  nachricht?: string;
  sprache?: string;
  status: KontaktStatus;
  created_at: string;
}

// ── Config ─────────────────────────────────────────────────

const STATUS_CFG: Record<KontaktStatus, { label: string; cls: string; Icon: React.ElementType }> = {
  neu:          { label: 'Neu',          cls: 'bg-blue-900/50 text-blue-300',   Icon: Clock },
  gelesen:      { label: 'Gelesen',      cls: 'bg-slate-700/60 text-slate-300', Icon: Eye },
  beantwortet:  { label: 'Beantwortet',  cls: 'bg-green-900/50 text-green-300', Icon: Check },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (min < 60)  return `vor ${min} Min.`;
  if (h < 24)    return `vor ${h} Std.`;
  if (days === 1) return 'gestern';
  if (days < 7)  return `vor ${days} Tagen`;
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Detail Flyout ──────────────────────────────────────────

function DetailFlyout({ anfrage, onClose, onStatusChange }: {
  anfrage: Kontaktanfrage;
  onClose: () => void;
  onStatusChange: (id: string, s: KontaktStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1d27] border-l border-[#2d3144] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Kontaktanfrage</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Absender */}
        <div className="bg-[#1e2235] rounded-2xl p-5 border border-[#2d3144]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-300 font-bold text-lg">{anfrage.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-semibold">{anfrage.name}</p>
              <a href={`mailto:${anfrage.email}`}
                className="text-indigo-400 text-sm hover:underline flex items-center gap-1">
                {anfrage.email} <ExternalLink size={11} />
              </a>
            </div>
          </div>
          <p className="text-xs text-slate-500">{timeAgo(anfrage.created_at)}</p>
        </div>

        {/* Nachricht */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Nachricht</p>
          <div className="bg-[#1e2235] rounded-xl p-4 border border-[#2d3144]">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {anfrage.nachricht || <span className="text-slate-600 italic">Keine Nachricht</span>}
            </p>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Status</p>
          <div className="space-y-2">
            {(Object.keys(STATUS_CFG) as KontaktStatus[]).map(s => {
              const c  = STATUS_CFG[s];
              const SI = c.Icon;
              const active = anfrage.status === s;
              return (
                <button key={s} onClick={() => onStatusChange(anfrage.id, s)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    active
                      ? `${c.cls} ring-1 ring-current`
                      : 'bg-[#1e2235] border border-[#2d3144] text-slate-400 hover:text-white hover:border-[#3d4460]'
                  }`}>
                  <SI size={14} /> {c.label}
                  {active && <span className="ml-auto text-xs opacity-60">Aktuell</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aktionen */}
        <div className="space-y-2 pt-2">
          <a href={`mailto:${anfrage.email}?subject=Re: Ihre Anfrage auf marcelspahr.ch`}
            onClick={() => onStatusChange(anfrage.id, 'beantwortet')}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium transition-colors">
            <Mail size={15} /> Per E-Mail antworten
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function KontaktPage() {
  const supabase = createClient();
  const [anfragen, setAnfragen]   = useState<Kontaktanfrage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Kontaktanfrage | null>(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState<KontaktStatus | ''>('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('kontaktanfragen')
      .select('*')
      .order('created_at', { ascending: false });
    setAnfragen((data as Kontaktanfrage[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: KontaktStatus) {
    await supabase.from('kontaktanfragen').update({ status }).eq('id', id);
    setAnfragen(a => a.map(x => x.id === id ? { ...x, status } : x));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
  }

  async function openDetail(a: Kontaktanfrage) {
    setSelected(a);
    if (a.status === 'neu') await updateStatus(a.id, 'gelesen');
  }

  const filtered = anfragen.filter(a =>
    (a.name.toLowerCase().includes(search.toLowerCase()) ||
     a.email.toLowerCase().includes(search.toLowerCase()) ||
     (a.nachricht || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || a.status === filterStatus)
  );

  const neuCount = anfragen.filter(a => a.status === 'neu').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kontaktanfragen</h1>
          <p className="text-slate-400 text-sm mt-0.5">Nachrichten vom Kontaktformular auf marcelspahr.ch</p>
        </div>
        {neuCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {neuCount} neue Nachricht{neuCount > 1 ? 'en' : ''}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(STATUS_CFG) as KontaktStatus[]).map(s => {
          const c  = STATUS_CFG[s];
          const SI = c.Icon;
          const count = anfragen.filter(a => a.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filterStatus === s ? '' : s)}
              className={`bg-[#1e2235] border rounded-xl p-4 text-left transition-all ${
                filterStatus === s ? 'border-indigo-500/60' : 'border-[#2d3144] hover:border-[#3d4460]'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <SI size={14} className="text-slate-500" />
                <p className="text-slate-400 text-xs">{c.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" placeholder="Name, E-Mail oder Nachricht suchen…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#1e2235] border border-[#2d3144] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none" />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-slate-400 text-sm">Lade Anfragen…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">Noch keine Kontaktanfragen</p>
          <p className="text-slate-600 text-sm mt-1">
            Anfragen kommen über das Kontaktformular auf marcelspahr.ch
          </p>
        </div>
      ) : (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3144]">
                {['', 'Name', 'E-Mail', 'Nachricht', 'Status', 'Eingegangen', ''].map((h, i) => (
                  <th key={i} className="text-left text-xs text-slate-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const cfg = STATUS_CFG[a.status];
                const SI  = cfg.Icon;
                return (
                  <tr key={a.id}
                    className="border-b border-[#2d3144]/60 last:border-0 hover:bg-[#252a40] transition-colors cursor-pointer"
                    onClick={() => openDetail(a)}>
                    <td className="pl-4 py-3 w-4">
                      {a.status === 'neu' && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 block" />
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-300 font-bold text-xs">
                            {a.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className={`font-medium ${a.status === 'neu' ? 'text-white' : 'text-slate-300'}`}>
                          {a.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{a.email}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-400 text-xs truncate">
                        {a.nachricht || <span className="text-slate-600 italic">–</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                        <SI size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {timeAgo(a.created_at)}
                    </td>
                    <td className="pr-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {a.status !== 'beantwortet' && (
                          <a href={`mailto:${a.email}?subject=Re: Ihre Anfrage auf marcelspahr.ch`}
                            onClick={() => updateStatus(a.id, 'beantwortet')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-[#2d3144] transition-colors"
                            title="Antworten">
                            <Mail size={14} />
                          </a>
                        )}
                        {a.status === 'neu' && (
                          <button onClick={() => updateStatus(a.id, 'gelesen')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors"
                            title="Als gelesen markieren">
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailFlyout
          anfrage={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}
