'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Projekt, ProjektStatus, Task, TaskStatus, TaskPrioritaet, Kunde } from '@/lib/types';
import { Plus, Pencil, Trash2, ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { Modal, Input, Textarea, Select, Button, Badge, Card, PageHeader, EmptyState } from '@/components/dashboard/ui';

// ── Config ────────────────────────────────────────────────

const PROJEKT_STATUS: Record<ProjektStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  aktiv:         { label: 'Aktiv',         variant: 'success' },
  pausiert:      { label: 'Pausiert',      variant: 'warning' },
  abgeschlossen: { label: 'Abgeschlossen', variant: 'info' },
  abgebrochen:   { label: 'Abgebrochen',   variant: 'danger' },
};

const TASK_COLS: { status: TaskStatus; label: string }[] = [
  { status: 'todo',        label: 'To Do' },
  { status: 'in_progress', label: 'In Arbeit' },
  { status: 'review',      label: 'Review' },
  { status: 'done',        label: 'Erledigt' },
];

const PRIO_VARIANT: Record<TaskPrioritaet, 'neutral' | 'warning' | 'gold' | 'danger'> = {
  niedrig:  'neutral',
  mittel:   'warning',
  hoch:     'gold',
  kritisch: 'danger',
};

function formatCHF(v?: number) {
  if (!v) return 'Keine Angabe.';
  return `CHF ${v.toLocaleString('de-CH')}`;
}

function formatDate(iso?: string) {
  if (!iso) return 'Keine Angabe.';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Projekt Modal ─────────────────────────────────────────

const EMPTY_PROJEKT: Partial<Projekt> = {
  name: '', kunden_id: undefined, status: 'aktiv',
  start_datum: '', end_datum: '', budget: undefined, beschreibung: '', farbe: '#c9a84c',
};

const COLORS = ['#c9a84c', '#4d7fbf', '#4ade80', '#f59e0b', '#e25566', '#8ebef2', '#a6425c', '#b7b54e'];

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

  function set(field: keyof Projekt, value: any) { setForm((f) => ({ ...f, [field]: value })); }

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
      farbe:        form.farbe || '#c9a84c',
    };
    const sb = createClient();
    const { error: err } = isEdit
      ? await sb.from('projekte').update(payload).eq('id', form.id!)
      : await sb.from('projekte').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? 'Projekt bearbeiten' : 'Neues Projekt'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" type="submit" form="projekt-form" loading={saving}>Speichern</Button>
        </>
      }
    >
      <form id="projekt-form" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Projektname" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Website Relaunch Müller AG" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Kunde" value={form.kunden_id ?? ''} onChange={(e) => set('kunden_id', e.target.value || undefined)}>
            <option value="">Kein Kunde.</option>
            {kunden.map((k) => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
          </Select>
          <Select label="Status" value={form.status ?? 'aktiv'} onChange={(e) => set('status', e.target.value)}>
            {(Object.keys(PROJEKT_STATUS) as ProjektStatus[]).map((s) => (
              <option key={s} value={s}>{PROJEKT_STATUS[s].label}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start" type="date" value={form.start_datum ?? ''} onChange={(e) => set('start_datum', e.target.value)} className="[color-scheme:dark]" />
          <Input label="Ende" type="date" value={form.end_datum ?? ''} onChange={(e) => set('end_datum', e.target.value)} className="[color-scheme:dark]" />
        </div>
        <Input label="Budget (CHF)" type="number" value={form.budget ?? ''} onChange={(e) => set('budget', e.target.value)} placeholder="5000" />
        <div>
          <label className="block text-xs text-dash-textMuted mb-1.5">Farbe</label>
          <div className="flex gap-2 mt-1">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set('farbe', c)}
                className={`w-7 h-7 rounded-full transition-transform ${form.farbe === c ? 'scale-125 ring-2 ring-dash-textBright ring-offset-1 ring-offset-dash-surface' : 'hover:scale-110'}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <Textarea label="Beschreibung" rows={2} value={form.beschreibung ?? ''} onChange={(e) => set('beschreibung', e.target.value)} />
        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </Modal>
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

  function set(field: keyof Task, value: any) { setForm((f) => ({ ...f, [field]: value })); }

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

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? 'Task bearbeiten' : 'Neuer Task'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" type="submit" form="task-form" loading={saving}>Speichern</Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Titel" required autoFocus value={form.titel ?? ''} onChange={(e) => set('titel', e.target.value)} placeholder="Beschreibe die Aufgabe." />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" value={form.status ?? 'todo'} onChange={(e) => set('status', e.target.value)}>
            {TASK_COLS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
          </Select>
          <Select label="Priorität" value={form.prioritaet ?? 'mittel'} onChange={(e) => set('prioritaet', e.target.value)}>
            <option value="niedrig">Niedrig</option>
            <option value="mittel">Mittel</option>
            <option value="hoch">Hoch</option>
            <option value="kritisch">Kritisch</option>
          </Select>
        </div>
        <Input label="Fällig am" type="date" value={form.faellig_am ?? ''} onChange={(e) => set('faellig_am', e.target.value)} className="[color-scheme:dark]" />
        <Textarea label="Beschreibung" rows={2} value={form.beschreibung ?? ''} onChange={(e) => set('beschreibung', e.target.value)} />
      </form>
    </Modal>
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

  const done  = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-dash-textMuted hover:text-dash-textBright text-sm transition-colors">
          <ArrowLeft size={16} /> Projekte
        </button>
        <div className="w-px h-4 bg-dash-border" />
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: projekt.farbe }} />
          <h1 className="font-display text-xl text-dash-textBright">{projekt.name}</h1>
          <Badge variant={PROJEKT_STATUS[projekt.status].variant}>{PROJEKT_STATUS[projekt.status].label}</Badge>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {total > 0 && <span className="text-sm text-dash-textMuted">{done}/{total} Tasks</span>}
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setModal({ ...EMPTY_TASK })}>Task</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-dash-textMuted text-sm">Das Projekt wird geladen.</div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {TASK_COLS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.status);
              return (
                <div key={col.status} className="flex flex-col w-60 flex-shrink-0"
                  onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(col.status)}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-sm font-semibold text-dash-textBright">{col.label}</span>
                    <span className="text-xs text-dash-textDim bg-dash-surfaceAlt px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 min-h-[80px] rounded-xl bg-dash-bg/50 border border-dash-border/60 p-2">
                    {colTasks.map((t) => (
                      <div key={t.id} draggable onDragStart={() => setDragging(t.id)}
                        className="group bg-dash-surfaceAlt border border-dash-border rounded-xl p-3 cursor-grab hover:border-dash-gold/40 transition-all">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm text-dash-textBright font-medium leading-snug flex-1">{t.titel}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => setModal(t)} className="p-0.5 text-dash-textDim hover:text-dash-textBright"><Pencil size={11} /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-0.5 text-dash-textDim hover:text-red-400"><Trash2 size={11} /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={PRIO_VARIANT[t.prioritaet]}>{t.prioritaet.charAt(0).toUpperCase() + t.prioritaet.slice(1)}</Badge>
                          {t.faellig_am && (
                            <span className="text-xs text-dash-textDim flex items-center gap-1">
                              <Calendar size={10} /> {formatDate(t.faellig_am)}
                            </span>
                          )}
                        </div>
                        {t.beschreibung && <p className="mt-2 text-xs text-dash-textDim leading-relaxed">{t.beschreibung}</p>}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-16 flex items-center justify-center text-xs text-dash-textDim border-2 border-dashed border-dash-border rounded-lg">
                        Hier ablegen
                      </div>
                    )}
                    <button onClick={() => setModal({ ...EMPTY_TASK, status: col.status })}
                      className="w-full py-1.5 rounded-lg text-xs text-dash-textDim hover:text-dash-gold hover:bg-dash-gold/5 border border-dashed border-dash-border hover:border-dash-gold/40 transition-all">
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
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Projekte & Tasks"
        subtitle={`${projekte.length} Projekte`}
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModal(EMPTY_PROJEKT)}>Neues Projekt</Button>}
      />

      {loading ? (
        <div className="py-16 text-center text-dash-textMuted text-sm">Die Projekte werden geladen.</div>
      ) : projekte.length === 0 ? (
        <EmptyState title="Noch keine Projekte." action={<button onClick={() => setModal(EMPTY_PROJEKT)} className="text-dash-gold text-sm hover:underline">+ Erstes Projekt anlegen</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projekte.map((p) => (
            <Card key={p.id} padding="none" className="group overflow-hidden hover:border-dash-gold/40">
              <div className="h-1.5" style={{ background: p.farbe }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <h3 className="font-display text-dash-textBright leading-snug">{p.name}</h3>
                    {p.kunden && <p className="text-xs text-dash-textDim mt-0.5">{p.kunden.firmenname || p.kunden.kontaktperson}</p>}
                  </div>
                  <Badge variant={PROJEKT_STATUS[p.status].variant} className="flex-shrink-0">{PROJEKT_STATUS[p.status].label}</Badge>
                </div>
                {p.beschreibung && <p className="text-sm text-dash-textMuted mb-3 line-clamp-2">{p.beschreibung}</p>}
                <div className="flex items-center justify-between text-xs text-dash-textDim mb-4">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(p.start_datum)} bis {formatDate(p.end_datum)}</span>
                  {p.budget && <span className="font-medium text-dash-textSubtle">{formatCHF(p.budget)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-dash-gold/10 hover:bg-dash-gold/20 text-dash-gold text-sm font-medium transition-colors">
                    Tasks öffnen <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setModal(p)} className="p-2 rounded-lg text-dash-textDim hover:text-dash-textBright hover:bg-dash-border/40 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-dash-textDim hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal !== false && (
        <ProjektModal projekt={modal} kunden={kunden} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      )}
    </div>
  );
}
