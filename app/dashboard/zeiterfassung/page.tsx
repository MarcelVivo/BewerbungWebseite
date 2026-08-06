'use client';

import { useEffect, useState, useRef, useCallback, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zeiteintrag, ZeitKategorie, Projekt, Kunde } from '@/lib/types';
import { Play, Square, Plus, Trash2, X, Clock, ChevronDown } from 'lucide-react';

// ── Config ────────────────────────────────────────────────

const KATEGORIEN: Record<ZeitKategorie, { label: string; color: string }> = {
  beratung:     { label: 'Beratung',     color: 'bg-indigo-900/60 text-indigo-300' },
  entwicklung:  { label: 'Entwicklung',  color: 'bg-cyan-900/60 text-cyan-300' },
  meeting:      { label: 'Meeting',      color: 'bg-purple-900/60 text-purple-300' },
  admin:        { label: 'Admin',        color: 'bg-slate-700 text-slate-300' },
  marketing:    { label: 'Marketing',    color: 'bg-pink-900/60 text-pink-300' },
};

function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function secondsToHMS(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(entries: Zeiteintrag[]) {
  const groups: Record<string, Zeiteintrag[]> = {};
  for (const e of entries) {
    const day = e.start_zeit.slice(0, 10);
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

// ── Manual Entry Modal ────────────────────────────────────

function EntryModal({ projekte, kunden, onClose, onSaved }: {
  projekte: Projekt[];
  kunden: Kunde[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    beschreibung: '',
    kategorie:    'beratung' as ZeitKategorie,
    projekt_id:   '',
    kunden_id:    '',
    datum:        today,
    start:        '09:00',
    end:          '10:00',
    abrechenbar:  true,
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const startISO = new Date(`${form.datum}T${form.start}:00`).toISOString();
    const endISO   = new Date(`${form.datum}T${form.end}:00`).toISOString();
    const dauer    = Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000);
    await createClient().from('zeiteintraege').insert({
      beschreibung: form.beschreibung || null,
      kategorie:    form.kategorie,
      projekt_id:   form.projekt_id || null,
      kunden_id:    form.kunden_id || null,
      start_zeit:   startISO,
      end_zeit:     endISO,
      dauer_minuten: dauer > 0 ? dauer : 0,
      abrechenbar:  form.abrechenbar,
    });
    setSaving(false);
    onSaved();
  }

  const inputCls = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3144]">
          <h2 className="font-semibold text-white">Zeiteintrag hinzufügen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <input value={form.beschreibung} onChange={e => set('beschreibung', e.target.value)}
              className={inputCls} placeholder="Woran hast du gearbeitet?" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Kategorie</label>
              <select value={form.kategorie} onChange={e => set('kategorie', e.target.value)} className={inputCls}>
                {(Object.keys(KATEGORIEN) as ZeitKategorie[]).map(k => (
                  <option key={k} value={k}>{KATEGORIEN[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Datum</label>
              <input type="date" value={form.datum} onChange={e => set('datum', e.target.value)}
                className={inputCls + ' [color-scheme:dark]'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Startzeit</label>
              <input type="time" value={form.start} onChange={e => set('start', e.target.value)}
                className={inputCls + ' [color-scheme:dark]'} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Endzeit</label>
              <input type="time" value={form.end} onChange={e => set('end', e.target.value)}
                className={inputCls + ' [color-scheme:dark]'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Projekt</label>
              <select value={form.projekt_id} onChange={e => set('projekt_id', e.target.value)} className={inputCls}>
                <option value="">Kein Projekt.</option>
                {projekte.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Kunde</label>
              <select value={form.kunden_id} onChange={e => set('kunden_id', e.target.value)} className={inputCls}>
                <option value="">Kein Kunde.</option>
                {kunden.map(k => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.abrechenbar} onChange={e => set('abrechenbar', e.target.checked)}
              className="w-4 h-4 accent-[#6366f1] rounded" />
            <span className="text-sm text-slate-300">Abrechenbar</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-[#2d3144] transition-colors">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white transition-colors">
              {saving ? 'Ich speichere den Eintrag.' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function ZeiterfassungPage() {
  const [eintraege, setEintraege]   = useState<Zeiteintrag[]>([]);
  const [projekte, setProjekte]     = useState<Projekt[]>([]);
  const [kunden, setKunden]         = useState<Kunde[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);

  // Timer state
  const [running, setRunning]       = useState(false);
  const [elapsed, setElapsed]       = useState(0);
  const [timerDesc, setTimerDesc]   = useState('');
  const [timerKat, setTimerKat]     = useState<ZeitKategorie>('beratung');
  const [timerProj, setTimerProj]   = useState('');
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const intervalRef                 = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const [{ data: z }, { data: p }, { data: k }] = await Promise.all([
      sb.from('zeiteintraege').select('*, projekte(id,name,farbe), kunden(id,kontaktperson,firmenname)')
        .order('start_zeit', { ascending: false }).limit(200),
      sb.from('projekte').select('id,name,farbe').order('name'),
      sb.from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson'),
    ]);
    setEintraege((z ?? []) as Zeiteintrag[]);
    setProjekte((p ?? []) as Projekt[]);
    setKunden((k ?? []) as Kunde[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Ticker
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function startTimer() {
    setTimerStart(new Date());
    setElapsed(0);
    setRunning(true);
  }

  async function stopTimer() {
    if (!timerStart) return;
    setRunning(false);
    const end   = new Date();
    const dauer = Math.round((end.getTime() - timerStart.getTime()) / 60000);
    await createClient().from('zeiteintraege').insert({
      beschreibung:  timerDesc || null,
      kategorie:     timerKat,
      projekt_id:    timerProj || null,
      start_zeit:    timerStart.toISOString(),
      end_zeit:      end.toISOString(),
      dauer_minuten: dauer,
      abrechenbar:   true,
    });
    setTimerDesc('');
    setElapsed(0);
    setTimerStart(null);
    load();
  }

  async function handleDelete(id: string) {
    await createClient().from('zeiteintraege').delete().eq('id', id);
    load();
  }

  // Stats
  const today       = new Date().toISOString().slice(0, 10);
  const weekStart   = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const todayMin    = eintraege.filter(e => e.start_zeit.startsWith(today)).reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
  const weekMin     = eintraege.filter(e => new Date(e.start_zeit) >= weekStart).reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
  const abrechenMin = eintraege.filter(e => e.abrechenbar).reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
  const totalMin    = eintraege.reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);

  const groups = groupByDate(eintraege);

  const inputCls = 'rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Zeiterfassung</h1>
          <p className="text-sm text-slate-400 mt-0.5">{eintraege.length} Einträge gesamt</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#252836] hover:bg-[#2d3144] text-slate-300 text-sm font-medium transition-colors border border-[#2d3144]">
          <Plus size={16} /> Manuell hinzufügen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Heute',        value: minutesToHM(todayMin) },
          { label: 'Diese Woche',  value: minutesToHM(weekMin) },
          { label: 'Abrechenbar',  value: minutesToHM(abrechenMin) },
          { label: 'Gesamt',       value: minutesToHM(totalMin) },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1d27] border border-[#2d3144] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Timer */}
      <div className="bg-[#1a1d27] border border-[#2d3144] rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            value={timerDesc}
            onChange={e => setTimerDesc(e.target.value)}
            placeholder="Woran arbeitest du gerade?"
            className={inputCls + ' flex-1 min-w-48'}
            disabled={running}
          />
          <select value={timerKat} onChange={e => setTimerKat(e.target.value as ZeitKategorie)}
            className={inputCls + ' w-36'} disabled={running}>
            {(Object.keys(KATEGORIEN) as ZeitKategorie[]).map(k => (
              <option key={k} value={k}>{KATEGORIEN[k].label}</option>
            ))}
          </select>
          <select value={timerProj} onChange={e => setTimerProj(e.target.value)}
            className={inputCls + ' w-40'} disabled={running}>
            <option value="">Kein Projekt</option>
            {projekte.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex items-center gap-3 ml-auto">
            <span className={`font-mono text-2xl font-bold tabular-nums ${running ? 'text-[#6366f1]' : 'text-slate-500'}`}>
              {secondsToHMS(elapsed)}
            </span>
            {!running ? (
              <button onClick={startTimer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] text-white font-medium transition-colors shadow-lg shadow-indigo-500/20">
                <Play size={16} fill="white" /> Start
              </button>
            ) : (
              <button onClick={stopTimer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-lg shadow-red-500/20">
                <Square size={16} fill="white" /> Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Die Einträge werden geladen.</div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center">
          <Clock size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">Noch keine Zeiteinträge. Starte den Timer!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, entries]) => {
            const dayTotal = entries.reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-semibold text-slate-300">{formatDate(day + 'T12:00:00')}</span>
                  <span className="text-sm text-slate-500">{minutesToHM(dayTotal)}</span>
                </div>
                <div className="rounded-xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden divide-y divide-[#2d3144]/50">
                  {entries.map(e => (
                    <div key={e.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#252836] transition-colors group">
                      {/* Kategorie dot */}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${e.kategorie ? KATEGORIEN[e.kategorie].color : 'bg-slate-700 text-slate-400'}`}>
                        {e.kategorie ? KATEGORIEN[e.kategorie].label : 'Keine Angabe.'}
                      </span>
                      {/* Beschreibung */}
                      <span className="flex-1 text-sm text-white truncate">{e.beschreibung || <span className="text-slate-500 italic">Keine Beschreibung</span>}</span>
                      {/* Projekt */}
                      {e.projekte && (
                        <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full" style={{ background: e.projekte.farbe }} />
                          {e.projekte.name}
                        </span>
                      )}
                      {/* Zeit */}
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatTime(e.start_zeit)} bis {e.end_zeit ? formatTime(e.end_zeit) : 'offen'}
                      </span>
                      {/* Dauer */}
                      <span className="font-mono text-sm font-bold text-white w-16 text-right flex-shrink-0">
                        {e.dauer_minuten ? minutesToHM(e.dauer_minuten) : 'Keine Angabe.'}
                      </span>
                      {/* Abrechenbar */}
                      <span className={`text-xs flex-shrink-0 ${e.abrechenbar ? 'text-green-400' : 'text-slate-600'}`}>
                        {e.abrechenbar ? '●' : '○'}
                      </span>
                      {/* Delete */}
                      <button onClick={() => handleDelete(e.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <EntryModal projekte={projekte} kunden={kunden} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      )}
    </div>
  );
}
