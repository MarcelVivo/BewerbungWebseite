'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Termin, TerminTyp, Kunde } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Video } from 'lucide-react';

// ── Config ────────────────────────────────────────────────

const TYP_CFG: Record<TerminTyp, { label: string; bg: string; dot: string }> = {
  meeting:  { label: 'Meeting',   bg: 'bg-indigo-600',  dot: '#6366f1' },
  workshop: { label: 'Workshop',  bg: 'bg-purple-600',  dot: '#9333ea' },
  call:     { label: 'Call',      bg: 'bg-green-600',   dot: '#16a34a' },
  intern:   { label: 'Intern',    bg: 'bg-slate-600',   dot: '#64748b' },
  buchung:  { label: 'Buchung',   bg: 'bg-orange-500',  dot: '#f97316' },
};

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS   = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

// ── Termin Modal ──────────────────────────────────────────

const EMPTY_TERMIN = (date?: string): Partial<Termin> => ({
  titel:       '',
  typ:         'meeting',
  status:      'bestaetigt',
  start_zeit:  date ? `${date}T09:00:00` : new Date().toISOString().slice(0, 16),
  end_zeit:    date ? `${date}T10:00:00` : new Date().toISOString().slice(0, 16),
  ort:         '',
  zoom_link:   '',
  beschreibung:'',
});

function TerminModal({ termin, kunden, onClose, onSaved }: {
  termin: Partial<Termin>;
  kunden: Kunde[];
  onClose: () => void;
  onSaved: () => void;
}) {
  function toLocal(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  const [form, setForm] = useState<Partial<Termin>>({
    ...termin,
    start_zeit: toLocal(termin.start_zeit ?? ''),
    end_zeit:   toLocal(termin.end_zeit   ?? ''),
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!form.id;

  function set(k: keyof Termin, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.titel?.trim()) return;
    setSaving(true);
    const payload = {
      titel:        form.titel,
      beschreibung: form.beschreibung || null,
      kunden_id:    form.kunden_id || null,
      typ:          form.typ ?? 'meeting',
      status:       form.status ?? 'bestaetigt',
      start_zeit:   form.start_zeit ? new Date(form.start_zeit).toISOString() : null,
      end_zeit:     form.end_zeit   ? new Date(form.end_zeit).toISOString()   : null,
      ort:          form.ort || null,
      zoom_link:    form.zoom_link || null,
    };
    const sb = createClient();
    const { error } = isEdit
      ? await sb.from('termine').update(payload).eq('id', form.id!)
      : await sb.from('termine').insert(payload);
    setSaving(false);
    if (!error) onSaved();
  }

  const inputCls = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3144]">
          <h2 className="font-semibold text-white">{isEdit ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Titel *</label>
            <input value={form.titel ?? ''} onChange={e => set('titel', e.target.value)}
              className={inputCls} placeholder="Zum Beispiel ein Kundengespräch oder Workshop." autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Typ</label>
              <select value={form.typ ?? 'meeting'} onChange={e => set('typ', e.target.value)} className={inputCls}>
                {(Object.keys(TYP_CFG) as TerminTyp[]).map(t => (
                  <option key={t} value={t}>{TYP_CFG[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Kunde</label>
              <select value={form.kunden_id ?? ''} onChange={e => set('kunden_id', e.target.value || undefined)} className={inputCls}>
                <option value="">Kein Kunde.</option>
                {kunden.map(k => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Startzeit</label>
              <input type="datetime-local" value={form.start_zeit ?? ''} onChange={e => set('start_zeit', e.target.value)}
                className={inputCls + ' [color-scheme:dark]'} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Endzeit</label>
              <input type="datetime-local" value={form.end_zeit ?? ''} onChange={e => set('end_zeit', e.target.value)}
                className={inputCls + ' [color-scheme:dark]'} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ort</label>
            <input value={form.ort ?? ''} onChange={e => set('ort', e.target.value)}
              className={inputCls} placeholder="Zum Beispiel Bern oder eine Kaffeebar." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Zoom / Meeting-Link</label>
            <input value={form.zoom_link ?? ''} onChange={e => set('zoom_link', e.target.value)}
              className={inputCls} placeholder="Füge hier den Link zur Besprechung ein." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <textarea value={form.beschreibung ?? ''} onChange={e => set('beschreibung', e.target.value)}
              rows={2} className={inputCls + ' resize-none'} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-[#2d3144] transition-colors">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white transition-colors">
              {saving ? 'Ich speichere den Termin.' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail Flyout ─────────────────────────────────────────

function TerminDetail({ termin, onClose, onEdit, onDelete }: {
  termin: Termin;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = TYP_CFG[termin.typ] ?? TYP_CFG.meeting;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`h-1.5 rounded-t-2xl ${cfg.bg}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <span className={`text-xs font-medium ${cfg.bg} bg-opacity-20 text-white px-2 py-0.5 rounded-full`}>{cfg.label}</span>
              <h3 className="font-bold text-white text-lg mt-2 leading-snug">{termin.titel}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white mt-1"><X size={16} /></button>
          </div>
          <div className="space-y-2 text-sm text-slate-400 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="flex-shrink-0" />
              <span>{formatTime(termin.start_zeit)} bis {formatTime(termin.end_zeit)}</span>
            </div>
            {termin.ort && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="flex-shrink-0" />
                <span>{termin.ort}</span>
              </div>
            )}
            {termin.zoom_link && (
              <div className="flex items-center gap-2">
                <Video size={14} className="flex-shrink-0" />
                <a href={termin.zoom_link} target="_blank" rel="noopener" className="text-[#6366f1] hover:underline truncate">
                  Meeting-Link öffnen
                </a>
              </div>
            )}
            {termin.kunden && (
              <div className="text-slate-300">{termin.kunden.firmenname || termin.kunden.kontaktperson}</div>
            )}
            {termin.beschreibung && <p className="text-slate-400">{termin.beschreibung}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">Bearbeiten</button>
            <button onClick={onDelete} className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm transition-colors">Löschen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Calendar Grid ─────────────────────────────────────────

export default function KalenderPage() {
  const [termine, setTermine]   = useState<Termin[]>([]);
  const [kunden, setKunden]     = useState<Kunde[]>([]);
  const [loading, setLoading]   = useState(true);
  const [year, setYear]         = useState(() => new Date().getFullYear());
  const [month, setMonth]       = useState(() => new Date().getMonth());
  const [modal, setModal]       = useState<Partial<Termin> | false>(false);
  const [detail, setDetail]     = useState<Termin | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const [{ data: t }, { data: k }] = await Promise.all([
      sb.from('termine').select('*, kunden(id,kontaktperson,firmenname)').order('start_zeit'),
      sb.from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson'),
    ]);
    setTermine((t ?? []) as Termin[]);
    setKunden((k ?? []) as Kunde[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function handleDelete(id: string) {
    await createClient().from('termine').delete().eq('id', id);
    setDetail(null);
    load();
  }

  // Build calendar grid (Mon-Sun)
  const firstDay   = new Date(year, month, 1);
  const lastDay    = new Date(year, month + 1, 0);
  const startDow   = (firstDay.getDay() + 6) % 7; // 0=Mon
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;
  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startDow + 1;
    return d >= 1 && d <= lastDay.getDate() ? new Date(year, month, d) : null;
  });

  function terminForDay(date: Date) {
    const ds = isoDate(date);
    return termine.filter(t => t.start_zeit.startsWith(ds));
  }

  const todayStr = isoDate(new Date());

  // Upcoming (next 7 days)
  const upcoming = termine
    .filter(t => t.start_zeit >= new Date().toISOString())
    .slice(0, 5);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kalender</h1>
          <p className="text-sm text-slate-400 mt-0.5">{termine.length} Termine gesamt</p>
        </div>
        <button onClick={() => setModal(EMPTY_TERMIN())}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Neuer Termin
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Calendar */}
        <div className="bg-[#1a1d27] border border-[#2d3144] rounded-2xl overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3144]">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252836] transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-bold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252836] transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#2d3144]">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Days */}
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">Die Termine werden geladen.</div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="border-b border-r border-[#2d3144]/30 min-h-[80px]" />;
                const ds          = isoDate(date);
                const dayTermine  = terminForDay(date);
                const isToday     = ds === todayStr;
                const isThisMonth = date.getMonth() === month;
                return (
                  <div
                    key={i}
                    onClick={() => setModal(EMPTY_TERMIN(ds))}
                    className={`border-b border-r border-[#2d3144]/30 min-h-[80px] p-1.5 cursor-pointer hover:bg-[#252836] transition-colors group ${!isThisMonth ? 'opacity-30' : ''}`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 ${isToday ? 'bg-[#6366f1] text-white font-bold' : 'text-slate-400 group-hover:text-white'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayTermine.slice(0, 2).map(t => (
                        <div
                          key={t.id}
                          onClick={e => { e.stopPropagation(); setDetail(t); }}
                          className={`text-[10px] leading-tight px-1.5 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 ${TYP_CFG[t.typ]?.bg ?? 'bg-indigo-600'}`}
                          title={t.titel}
                        >
                          {formatTime(t.start_zeit)} {t.titel}
                        </div>
                      ))}
                      {dayTermine.length > 2 && (
                        <div className="text-[10px] text-slate-500 px-1">+{dayTermine.length - 2} mehr</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: upcoming */}
        <div className="space-y-4">
          <div className="bg-[#1a1d27] border border-[#2d3144] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Nächste Termine</h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-500">Keine bevorstehenden Termine.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(t => {
                  const cfg = TYP_CFG[t.typ] ?? TYP_CFG.meeting;
                  const d   = new Date(t.start_zeit);
                  return (
                    <button key={t.id} onClick={() => setDetail(t)}
                      className="w-full text-left flex gap-3 p-2.5 rounded-xl hover:bg-[#252836] transition-colors">
                      <div className={`w-1 rounded-full flex-shrink-0 self-stretch ${cfg.bg}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{t.titel}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {d.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' })} · {formatTime(t.start_zeit)}
                        </p>
                        {t.kunden && <p className="text-xs text-slate-600 truncate">{t.kunden.firmenname || t.kunden.kontaktperson}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-[#1a1d27] border border-[#2d3144] rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Legende</h3>
            <div className="space-y-1.5">
              {(Object.entries(TYP_CFG) as [TerminTyp, typeof TYP_CFG[TerminTyp]][]).map(([typ, cfg]) => (
                <div key={typ} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${cfg.bg}`} />
                  {cfg.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal !== false && (
        <TerminModal termin={modal} kunden={kunden} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      )}

      {detail && (
        <TerminDetail
          termin={detail}
          onClose={() => setDetail(null)}
          onEdit={() => { setModal(detail); setDetail(null); }}
          onDelete={() => handleDelete(detail.id)}
        />
      )}
    </div>
  );
}
