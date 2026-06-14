'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Projekt, ProjektStatus, Task, TaskStatus, TaskPrioritaet, Kunde } from '@/lib/types';
import { Plus, X, Pencil, Trash2, ArrowLeft, Calendar, ChevronRight } from 'lucide-react';

// ── Config ────────────────────────────────────────────────

const PROJEKT_STATUS: Record<ProjektStatus, { label: string; cls: string }> = {
  aktiv:         { label: 'Aktiv',         cls: 'bg-green-900/60 text-green-300' },
  pausiert:      { label: 'Pausiert',      cls: 'bg-yellow-900/60 text-yellow-300' },
  abgeschlossen: { label: 'Abgeschlossen', cls: 'bg-blue-900/60 text-blue-300' },
  abgebrochen:   { label: 'Abgebrochen',   cls: 'bg-red-900/60 text-red-300' },
};

const TASK_COLS: { status: TaskStatus; label: string }[] = [
  { status: 'todo',        label: 'To Do' },
  { status: 'in_progress', label: 'In Arbeit' },
  { status: 'review',      label: 'Review' },
  { status: 'done',        label: 'Erledigt' },
];

const PRIO_COLOR: Record<TaskPrioritaet, string> = {
  niedrig:  'bg-slate-700 text-slate-300',
  mittel:   'bg-yellow-900/60 text-yellow-300',
  hoch:     'bg-orange-900/60 text-orange-300',
  kritisch: 'bg-red-900/60 text-red-300',
};

function formatCHF(v?: number) {
  if (!v) return '–';
  return `CHF ${v.toLocaleString('de-CH')}`;
}

function formatDate(iso?: string) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Projekt Modal ─────────────────────────────────────────

const EMPTY_PROJEKT: Partial<Projekt> = {
  name: '', kunden_id: undefined, status: 'aktiv',
  start_datum: '', end_datum: '', budget: undefined, beschreibung: '', farbe: '#6366f1',
};

function ProjektModal({ projekt, kunden, onClose, onSaved }: {
  projekt: Partial<Projekt>;
  kunden: Kunde[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Projekt>>(projekt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!form.id;

  function set(field: keyof Projekt, value: any) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) { setError('Name ist erforderlich.'); return; }
    setSaving(true); setError('');
    const payload = {
      name:         form.name,
      kunden_id:    form.kunden_id || null,
      status:       form.status ?? 'aktiv',
      start_datum:  form.start_datum || null,
      end_datum:    form.end_datum || null,
      budget:       form.budget ? Number(form.budget) : null,
      beschreibung: form.beschreibung || null,
      farbe:        form.farbe || '#6366f1',
    };
    const sb = createClient();
    const { error: err } = isEdit
      ? await sb.from('projekte').update(payload).eq('id', form.id!)
      : await sb.from('projekte').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  const inputCls = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';
  const COLORS = ['#6366f1','#06b6d4','#22c55e','#f59e0b','#ec4899','#8b5cf6','#ef4444','#0ea5e9'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3144]">
          <h2 className="font-semibold text-white">{isEdit ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Projektname *</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Website Relaunch Müller AG" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Kunde</label>
              <select value={form.kunden_id ?? ''} onChange={e => set('kunden_id', e.target.value || undefined)} className={inputCls}>
                <option value="">– Kein Kunde –</option>
                {kunden.map(k => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select value={form.status ?? 'aktiv'} onChange={e => set('status', e.target.value)} className={inputCls}>
                {(Object.keys(PROJEKT_STATUS) as ProjektStatus[]).map(s => (
                  <option key={s} value={s}>{PROJEKT_STATUS[s].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start</label>
              <input type="date" value={form.start_datum ?? ''} onChange={e => set('start_datum', e.target.value)} className={inputCls + ' [color-scheme:dark]'} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ende</label>
              <input type="date" value={form.end_datum ?? ''} onChange={e => set('end_datum', e.target.value)} className={inputCls + ' [color-scheme:dark]'} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Budget (CHF)</label>
            <input type="number" value={form.budget ?? ''} onChange={e => set('budget', e.target.value)} className={inputCls} placeholder="5000" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Farbe</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('farbe', c)}
                  className={`w-7 h-7 rounded-full transition-transform ${form.farbe === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#1a1d27]' : 'hover:scale-110'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <textarea value={form.beschreibung ?? ''} onChange={e => set('beschreibung', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-[#2d3144] hover:border-slate-500 transition-colors">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white transition-colors">
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Modal ────────────────────────────────────────────

const EMPTY_TASK: Partial<Task> = { titel: '', beschreibung: '', status: 'todo', prioritaet: 'mittel', faellig_am: '' };

function TaskModal({ task, projektId, onClose, onSaved }: {
  task: Partial<Task>;
  projektId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Task>>({ ...task, projekt_id: projektId });
  const [saving, setSaving] = useState(false);
  const isEdit = !!form.id;

  function set(field: keyof Task, value: any) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.titel?.trim()) return;
    setSaving(true);
    const payload = {
      titel:        form.titel,
      beschreibung: form.beschreibung || null,
      projekt_id:   projektId,
      status:       form.status ?? 'todo',
      prioritaet:   form.prioritaet ?? 'mittel',
      faellig_am:   form.faellig_am || null,
    };
    const sb = createClient();
    const { error } = isEdit
      ? await sb.from('tasks').update(payload).eq('id', form.id!)
      : await sb.from('tasks').insert(payload);
    setSaving(false);
    if (!error) onSaved();
  }

  const inputCls = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3144]">
          <h2 className="font-semibold text-white">{isEdit ? 'Task bearbeiten' : 'Neuer Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Titel *</label>
            <input value={form.titel ?? ''} onChange={e => set('titel', e.target.value)} className={inputCls} placeholder="Task beschreiben…" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select value={form.status ?? 'todo'} onChange={e => set('status', e.target.value)} className={inputCls}>
                {TASK_COLS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Priorität</label>
              <select value={form.prioritaet ?? 'mittel'} onChange={e => set('prioritaet', e.target.value)} className={inputCls}>
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
                <option value="kritisch">Kritisch</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fällig am</label>
            <input type="date" value={form.faellig_am ?? ''} onChange={e => set('faellig_am', e.target.value)} className={inputCls + ' [color-scheme:dark]'} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <textarea value={form.beschreibung ?? ''} onChange={e => set('beschreibung', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-[#2d3144] hover:border-slate-500 transition-colors">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white transition-colors">
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Kanban ───────────────────────────────────────────

function TaskKanban({ projekt, onBack }: { projekt: Projekt; onBack: () => void }) {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<Partial<Task> | false>(false);
  const [dragging, setDragging] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await createClient().from('tasks').select('*').eq('projekt_id', projekt.id).order('position').order('created_at');
    setTasks((data ?? []) as Task[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [projekt.id]);

  async function handleDelete(id: string) {
    if (!confirm('Task löschen?')) return;
    await createClient().from('tasks').delete().eq('id', id);
    load();
  }

  async function handleDrop(targetStatus: TaskStatus) {
    if (!dragging) return;
    await createClient().from('tasks').update({ status: targetStatus }).eq('id', dragging);
    setDragging(null);
    load();
  }

  const done  = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Projekte
        </button>
        <div className="w-px h-4 bg-[#2d3144]" />
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: projekt.farbe }} />
          <h1 className="text-xl font-bold text-white">{projekt.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROJEKT_STATUS[projekt.status].cls}`}>
            {PROJEKT_STATUS[projekt.status].label}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {total > 0 && <span className="text-sm text-slate-400">{done}/{total} Tasks</span>}
          <button onClick={() => setModal({ ...EMPTY_TASK })} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
            <Plus size={14} /> Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Lädt…</div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {TASK_COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.status);
              return (
                <div key={col.status} className="flex flex-col w-60 flex-shrink-0"
                  onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col.status)}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-sm font-semibold text-white">{col.label}</span>
                    <span className="text-xs text-slate-500 bg-[#252836] px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 min-h-[80px] rounded-xl bg-[#0f1117]/50 border border-[#2d3144]/50 p-2">
                    {colTasks.map(t => (
                      <div key={t.id} draggable onDragStart={() => setDragging(t.id)}
                        className="group bg-[#252836] border border-[#2d3144] rounded-xl p-3 cursor-grab hover:border-[#6366f1]/40 transition-all">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm text-white font-medium leading-snug flex-1">{t.titel}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => setModal(t)} className="p-0.5 text-slate-500 hover:text-white"><Pencil size={11} /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-0.5 text-slate-500 hover:text-red-400"><Trash2 size={11} /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIO_COLOR[t.prioritaet]}`}>
                            {t.prioritaet.charAt(0).toUpperCase() + t.prioritaet.slice(1)}
                          </span>
                          {t.faellig_am && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar size={10} /> {formatDate(t.faellig_am)}
                            </span>
                          )}
                        </div>
                        {t.beschreibung && <p className="mt-2 text-xs text-slate-500 leading-relaxed">{t.beschreibung}</p>}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-16 flex items-center justify-center text-xs text-slate-600 border-2 border-dashed border-[#2d3144] rounded-lg">
                        Hier ablegen
                      </div>
                    )}
                    <button onClick={() => setModal({ ...EMPTY_TASK, status: col.status })}
                      className="w-full py-1.5 rounded-lg text-xs text-slate-600 hover:text-[#6366f1] hover:bg-[#6366f1]/5 border border-dashed border-[#2d3144] hover:border-[#6366f1]/40 transition-all">
                      + Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal !== false && (
        <TaskModal task={modal} projektId={projekt.id} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      )}
    </div>
  );
}

// ── Projekte List ─────────────────────────────────────────

export default function ProjektePage() {
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [kunden, setKunden]     = useState<Kunde[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<Partial<Projekt> | false>(false);
  const [selected, setSelected] = useState<Projekt | null>(null);

  async function load() {
    setLoading(true);
    const sb = createClient();
    const [{ data: p }, { data: k }] = await Promise.all([
      sb.from('projekte').select('*, kunden(id,kontaktperson,firmenname)').order('created_at', { ascending: false }),
      sb.from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson'),
    ]);
    setProjekte((p ?? []) as Projekt[]);
    setKunden((k ?? []) as Kunde[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Projekt und alle Tasks löschen?')) return;
    await createClient().from('projekte').delete().eq('id', id);
    load();
  }

  if (selected) return <TaskKanban projekt={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projekte & Tasks</h1>
          <p className="text-sm text-slate-400 mt-0.5">{projekte.length} Projekte</p>
        </div>
        <button onClick={() => setModal(EMPTY_PROJEKT)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Neues Projekt
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">Lädt…</div>
      ) : projekte.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-slate-400 text-sm">Noch keine Projekte.</p>
          <button onClick={() => setModal(EMPTY_PROJEKT)} className="mt-4 text-[#6366f1] text-sm hover:underline">+ Erstes Projekt anlegen</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projekte.map(p => (
            <div key={p.id} className="group rounded-xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden hover:border-[#6366f1]/40 transition-all">
              <div className="h-1.5" style={{ background: p.farbe }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white leading-snug">{p.name}</h3>
                    {p.kunden && <p className="text-xs text-slate-500 mt-0.5">{p.kunden.firmenname || p.kunden.kontaktperson}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PROJEKT_STATUS[p.status].cls}`}>
                    {PROJEKT_STATUS[p.status].label}
                  </span>
                </div>
                {p.beschreibung && <p className="text-sm text-slate-400 mb-3 line-clamp-2">{p.beschreibung}</p>}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(p.start_datum)} – {formatDate(p.end_datum)}</span>
                  {p.budget && <span className="font-medium text-slate-300">{formatCHF(p.budget)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#818cf8] text-sm font-medium transition-colors">
                    Tasks öffnen <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setModal(p)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== false && (
        <ProjektModal projekt={modal} kunden={kunden} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      )}
    </div>
  );
}
