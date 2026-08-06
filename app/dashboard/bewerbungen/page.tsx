'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Briefcase, Star, X, Check, Eye, Clock, Search,
  Building2, Mail, Phone, MessageSquare,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

type AnfrageStatus = 'neu' | 'gelesen' | 'interessant' | 'abgelehnt';
type StellentTyp   = 'festanstellung' | 'freelance' | 'projekt';

interface RecruiterAnfrage {
  id: string;
  recruiter_name: string;
  firma?: string;
  email: string;
  stellen_typ?: StellentTyp;
  pensum?: string;
  nachricht?: string;
  status: AnfrageStatus;
  created_at: string;
}

// ── Config ─────────────────────────────────────────────────

const STATUS_CFG: Record<AnfrageStatus, { label: string; cls: string; Icon: React.ElementType }> = {
  neu:         { label: 'Neu',          cls: 'bg-blue-900/50 text-blue-300',    Icon: Clock },
  gelesen:     { label: 'Gelesen',      cls: 'bg-slate-700/60 text-slate-300',  Icon: Eye },
  interessant: { label: 'Interessant',  cls: 'bg-green-900/50 text-green-300',  Icon: Star },
  abgelehnt:   { label: 'Abgelehnt',   cls: 'bg-red-900/40 text-red-300',      Icon: X },
};

const STELLEN_CFG: Record<StellentTyp, { label: string; cls: string }> = {
  festanstellung: { label: 'Festanstellung', cls: 'text-indigo-400' },
  freelance:      { label: 'Freelance',      cls: 'text-cyan-400' },
  projekt:        { label: 'Projekt',        cls: 'text-orange-400' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  if (days < 30) return `vor ${Math.floor(days / 7)} Wochen`;
  return `vor ${Math.floor(days / 30)} Monaten`;
}

// ── Detail Flyout ──────────────────────────────────────────

function DetailFlyout({ anfrage, onClose, onStatusChange }: {
  anfrage: RecruiterAnfrage;
  onClose: () => void;
  onStatusChange: (id: string, status: AnfrageStatus) => void;
}) {
  const cfg = STATUS_CFG[anfrage.status];
  const Icon = cfg.Icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1d27] border-l border-[#2d3144] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Anfrage Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Recruiter */}
        <div className="bg-[#1e2235] rounded-2xl p-5 border border-[#2d3144]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-ms-500/20 flex items-center justify-center">
              <Briefcase size={20} className="text-ms-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{anfrage.recruiter_name}</p>
              {anfrage.firma && <p className="text-slate-400 text-sm">{anfrage.firma}</p>}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <a href={`mailto:${anfrage.email}`}
              className="flex items-center gap-2.5 text-slate-300 hover:text-ms-400 transition-colors">
              <Mail size={14} className="text-slate-500" /> {anfrage.email}
            </a>
            {anfrage.stellen_typ && (
              <div className="flex items-center gap-2.5">
                <Building2 size={14} className="text-slate-500" />
                <span className={STELLEN_CFG[anfrage.stellen_typ]?.cls}>{STELLEN_CFG[anfrage.stellen_typ]?.label}</span>
                {anfrage.pensum && <span className="text-slate-400">· {anfrage.pensum}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Nachricht */}
        {anfrage.nachricht && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Nachricht</p>
            <div className="bg-[#1e2235] rounded-xl p-4 border border-[#2d3144]">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{anfrage.nachricht}</p>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="text-xs text-slate-500">
          Eingegangen: {formatDate(anfrage.created_at)} ({timeAgo(anfrage.created_at)})
        </div>

        {/* Status Actions */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Status ändern</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STATUS_CFG) as AnfrageStatus[]).map(s => {
              const c = STATUS_CFG[s];
              const SI = c.Icon;
              const active = anfrage.status === s;
              return (
                <button key={s} onClick={() => onStatusChange(anfrage.id, s)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? `${c.cls} ring-1 ring-current` : 'bg-[#1e2235] border border-[#2d3144] text-slate-400 hover:text-white hover:border-[#3d4460]'
                  }`}>
                  <SI size={14} /> {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <a href={`mailto:${anfrage.email}?subject=Re: Ihre Anfrage auf marcelspahr.ch`}
            className="w-full flex items-center justify-center gap-2 bg-ms-500 hover:bg-ms-600 text-white rounded-xl py-3 text-sm font-medium transition-colors">
            <Mail size={15} /> Per E-Mail antworten
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function BewerbungenPage() {
  const supabase = createClient();
  const [anfragen, setAnfragen]   = useState<RecruiterAnfrage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<RecruiterAnfrage | null>(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState<AnfrageStatus | ''>('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('recruiter_anfragen')
      .select('*')
      .order('created_at', { ascending: false });
    setAnfragen((data as RecruiterAnfrage[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: AnfrageStatus) {
    await supabase.from('recruiter_anfragen').update({ status }).eq('id', id);
    setAnfragen(a => a.map(x => x.id === id ? { ...x, status } : x));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
  }

  const filtered = anfragen.filter(a =>
    (a.recruiter_name.toLowerCase().includes(search.toLowerCase()) ||
     (a.firma || '').toLowerCase().includes(search.toLowerCase()) ||
     a.email.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || a.status === filterStatus)
  );

  const neuCount = anfragen.filter(a => a.status === 'neu').length;
  const interessantCount = anfragen.filter(a => a.status === 'interessant').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recruiter-Anfragen</h1>
          <p className="text-slate-400 text-sm mt-0.5">Eingehende Anfragen vom Recruiter-Portfolio</p>
        </div>
        {neuCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {neuCount} neue Anfragen
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.keys(STATUS_CFG) as AnfrageStatus[]).map(s => {
          const c = STATUS_CFG[s];
          const SI = c.Icon;
          const count = anfragen.filter(a => a.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filterStatus === s ? '' : s)}
              className={`bg-[#1e2235] border rounded-xl p-4 text-left transition-all ${
                filterStatus === s ? 'border-ms-500/60' : 'border-[#2d3144] hover:border-[#3d4460]'
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
        <input type="text" placeholder="Suche nach Name, Firma oder E-Mail." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#1e2235] border border-[#2d3144] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-500 focus:border-ms-500 outline-none" />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Die Anfragen werden geladen.</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">Noch keine Anfragen</p>
          <p className="text-slate-600 text-sm mt-1">Anfragen kommen über dein Recruiter-Portfolio unter /recruiter</p>
        </div>
      ) : (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3144]">
                {['', 'Recruiter', 'Firma', 'Art', 'Status', 'Eingegangen', ''].map((h, i) => (
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
                    className="border-b border-[#2d3144]/60 hover:bg-[#252a40] transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}>
                    <td className="pl-4 py-3 w-4">
                      {a.status === 'neu' && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 block" />
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className={`font-medium ${a.status === 'neu' ? 'text-white' : 'text-slate-300'}`}>
                        {a.recruiter_name}
                      </p>
                      <p className="text-slate-500 text-xs">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {a.firma || <span className="text-slate-600">Keine Firma.</span>}
                    </td>
                    <td className="px-4 py-3">
                      {a.stellen_typ
                        ? <span className={`text-xs font-medium ${STELLEN_CFG[a.stellen_typ]?.cls}`}>{STELLEN_CFG[a.stellen_typ]?.label}</span>
                        : <span className="text-slate-600 text-xs">Keine Angabe.</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                        <SI size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {timeAgo(a.created_at)}
                    </td>
                    <td className="pr-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {a.status !== 'interessant' && (
                          <button onClick={() => updateStatus(a.id, 'interessant')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-[#2d3144] transition-colors" title="Als interessant markieren">
                            <Star size={14} />
                          </button>
                        )}
                        {a.status !== 'abgelehnt' && (
                          <button onClick={() => updateStatus(a.id, 'abgelehnt')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-[#2d3144] transition-colors" title="Ablehnen">
                            <X size={14} />
                          </button>
                        )}
                        {a.status === 'neu' && (
                          <button onClick={() => updateStatus(a.id, 'gelesen')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors" title="Als gelesen markieren">
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
        <DetailFlyout anfrage={selected} onClose={() => setSelected(null)} onStatusChange={updateStatus} />
      )}
    </div>
  );
}
