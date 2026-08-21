'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zeiteintrag, ZeitKategorie, Projekt, Kunde } from '@/lib/types';
import { Play, Square, Plus, Trash2, Clock } from 'lucide-react';
import { Modal, Input, Select, Button, Card, PageHeader, EmptyState, Badge } from '@/components/dashboard/ui';
import { useTimeTracking } from '@/lib/hooks/useTimeTracking';

// ── Config ────────────────────────────────────────────────

const KATEGORIEN: Record<ZeitKategorie, { label: string; variant: 'info' | 'gold' | 'warning' | 'neutral' | 'danger' }> = {
  beratung:    { label: 'Beratung',    variant: 'info' },
  entwicklung: { label: 'Entwicklung', variant: 'gold' },
  meeting:     { label: 'Meeting',     variant: 'warning' },
  admin:       { label: 'Admin',       variant: 'neutral' },
  marketing:   { label: 'Marketing',   variant: 'danger' },
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
    beschreibung: '', kategorie: 'beratung' as ZeitKategorie, projekt_id: '', kunden_id: '',
    datum: today, start: '09:00', end: '10:00', abrechenbar: true,
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

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

  return (
    <Modal
      onClose={onClose}
      title="Zeiteintrag hinzufügen"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" type="submit" form="entry-form" loading={saving}>Speichern</Button>
        </>
      }
    >
      <form id="entry-form" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Beschreibung" autoFocus value={form.beschreibung} onChange={(e) => set('beschreibung', e.target.value)} placeholder="Woran hast du gearbeitet?" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Kategorie" value={form.kategorie} onChange={(e) => set('kategorie', e.target.value)}>
            {(Object.keys(KATEGORIEN) as ZeitKategorie[]).map((k) => <option key={k} value={k}>{KATEGORIEN[k].label}</option>)}
          </Select>
          <Input label="Datum" type="date" value={form.datum} onChange={(e) => set('datum', e.target.value)} className="[color-scheme:dark]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Startzeit" type="time" value={form.start} onChange={(e) => set('start', e.target.value)} className="[color-scheme:dark]" />
          <Input label="Endzeit" type="time" value={form.end} onChange={(e) => set('end', e.target.value)} className="[color-scheme:dark]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Projekt" value={form.projekt_id} onChange={(e) => set('projekt_id', e.target.value)}>
            <option value="">Kein Projekt.</option>
            {projekte.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Kunde" value={form.kunden_id} onChange={(e) => set('kunden_id', e.target.value)}>
            <option value="">Kein Kunde.</option>
            {kunden.map((k) => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={form.abrechenbar} onChange={(e) => set('abrechenbar', e.target.checked)} className="w-4 h-4 accent-dash-gold rounded" />
          <span className="text-sm text-dash-textSubtle">Abrechenbar</span>
        </label>
      </form>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function ZeiterfassungPage() {
  const [eintraege, setEintraege]   = useState<Zeiteintrag[]>([]);
  const [projekte, setProjekte]     = useState<Projekt[]>([]);
  const [kunden, setKunden]         = useState<Kunde[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [timerDesc, setTimerDesc]   = useState('');
  const [timerKat, setTimerKat]     = useState<ZeitKategorie>('beratung');
  const [timerProj, setTimerProj]   = useState('');
  const { active, start, stop } = useTimeTracking();

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

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const elapsed = active ? Math.floor((now - new Date(active.start_zeit).getTime()) / 1000) : 0;

  async function handleStart() {
    await start({ beschreibung: timerDesc, kategorie: timerKat, projekt_id: timerProj || null });
    setTimerDesc('');
  }

  async function handleStop() {
    await stop();
    load();
  }

  async function handleDelete(id: string) {
    await createClient().from('zeiteintraege').delete().eq('id', id);
    load();
  }

  const today       = new Date().toISOString().slice(0, 10);
  const weekStart   = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const todayMin    = eintraege.filter((e) => e.start_zeit.startsWith(today)).reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
  const weekMin     = eintraege.filter((e) => new Date(e.start_zeit) >= weekStart).reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
  const abrechenMin = eintraege.filter((e) => e.abrechenbar).reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
  const totalMin    = eintraege.reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);

  const groups = groupByDate(eintraege);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Zeiterfassung"
        subtitle={`${eintraege.length} Einträge gesamt`}
        actions={<Button variant="secondary" icon={<Plus size={16} />} onClick={() => setModal(true)}>Manuell hinzufügen</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Heute',       value: minutesToHM(todayMin) },
          { label: 'Diese Woche', value: minutesToHM(weekMin) },
          { label: 'Abrechenbar', value: minutesToHM(abrechenMin) },
          { label: 'Gesamt',      value: minutesToHM(totalMin) },
        ].map((s) => (
          <Card key={s.label} padding="sm">
            <p className="text-xs text-dash-textDim mb-1">{s.label}</p>
            <p className="text-xl font-display text-dash-textBright">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Timer */}
      <Card padding="md" className="mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            value={active ? (active.beschreibung ?? '') : timerDesc}
            onChange={(e) => setTimerDesc(e.target.value)}
            placeholder="Woran arbeitest du gerade?"
            className="flex-1 min-w-48 rounded-lg bg-dash-bg border border-dash-border focus:border-dash-gold focus:ring-1 focus:ring-dash-gold outline-none px-3 py-2 text-sm text-dash-textBright placeholder-dash-textDim transition-colors disabled:opacity-60"
            disabled={!!active}
          />
          <select value={active ? (active.kategorie ?? 'beratung') : timerKat} onChange={(e) => setTimerKat(e.target.value as ZeitKategorie)}
            className="w-36 rounded-lg bg-dash-bg border border-dash-border focus:border-dash-gold focus:ring-1 focus:ring-dash-gold outline-none px-3 py-2 text-sm text-dash-textBright disabled:opacity-60" disabled={!!active}>
            {(Object.keys(KATEGORIEN) as ZeitKategorie[]).map((k) => <option key={k} value={k}>{KATEGORIEN[k].label}</option>)}
          </select>
          <select value={active ? (active.projekt_id ?? '') : timerProj} onChange={(e) => setTimerProj(e.target.value)}
            className="w-40 rounded-lg bg-dash-bg border border-dash-border focus:border-dash-gold focus:ring-1 focus:ring-dash-gold outline-none px-3 py-2 text-sm text-dash-textBright disabled:opacity-60" disabled={!!active}>
            <option value="">Kein Projekt</option>
            {projekte.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex items-center gap-3 ml-auto">
            <span className={`font-mono text-2xl font-bold tabular-nums ${active ? 'text-dash-gold' : 'text-dash-textDim'}`}>
              {secondsToHMS(elapsed)}
            </span>
            {!active ? (
              <Button variant="primary" icon={<Play size={16} fill="currentColor" />} onClick={handleStart}>Start</Button>
            ) : (
              <Button variant="danger" icon={<Square size={16} fill="currentColor" />} onClick={handleStop}>Stop</Button>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-dash-textMuted text-sm">Die Einträge werden geladen.</div>
      ) : groups.length === 0 ? (
        <EmptyState icon={<Clock size={32} />} title="Noch keine Zeiteinträge. Starte den Timer!" />
      ) : (
        <div className="space-y-6">
          {groups.map(([day, entries]) => {
            const dayTotal = entries.reduce((s, e) => s + (e.dauer_minuten ?? 0), 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-semibold text-dash-textSubtle">{formatDate(day + 'T12:00:00')}</span>
                  <span className="text-sm text-dash-textDim">{minutesToHM(dayTotal)}</span>
                </div>
                <Card padding="none" className="divide-y divide-dash-border/60">
                  {entries.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 px-4 py-3 hover:bg-dash-surfaceAlt transition-colors group">
                      <Badge variant={e.kategorie ? KATEGORIEN[e.kategorie].variant : 'neutral'} className="flex-shrink-0">
                        {e.kategorie ? KATEGORIEN[e.kategorie].label : 'Keine Angabe.'}
                      </Badge>
                      <span className="flex-1 text-sm text-dash-textBright truncate">{e.beschreibung || <span className="text-dash-textDim italic">Keine Beschreibung</span>}</span>
                      {e.projekte && (
                        <span className="hidden md:flex items-center gap-1.5 text-xs text-dash-textMuted flex-shrink-0">
                          <span className="w-2 h-2 rounded-full" style={{ background: e.projekte.farbe }} />
                          {e.projekte.name}
                        </span>
                      )}
                      <span className="text-xs text-dash-textDim flex-shrink-0">
                        {formatTime(e.start_zeit)} bis {e.end_zeit ? formatTime(e.end_zeit) : 'offen'}
                      </span>
                      <span className="font-mono text-sm font-bold text-dash-textBright w-16 text-right flex-shrink-0">
                        {e.dauer_minuten ? minutesToHM(e.dauer_minuten) : 'Keine Angabe.'}
                      </span>
                      <span className={`text-xs flex-shrink-0 ${e.abrechenbar ? 'text-green-400' : 'text-dash-textDim'}`}>
                        {e.abrechenbar ? '●' : '○'}
                      </span>
                      <button onClick={() => handleDelete(e.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-dash-textDim hover:text-red-400 transition-all flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </Card>
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
