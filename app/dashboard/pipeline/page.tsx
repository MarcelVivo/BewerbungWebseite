'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Deal, DealStatus, Kunde } from '@/lib/types';
import { Plus, X, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal, Input, Textarea, Select, Button, PageHeader } from '@/components/dashboard/ui';

// ── Config ────────────────────────────────────────────────

const COLUMNS: { status: DealStatus; label: string; color: string }[] = [
  { status: 'lead',          label: 'Lead',           color: '#7a6d5a' },
  { status: 'erstgespraech', label: 'Erstgespräch',   color: '#8ebef2' },
  { status: 'angebot',       label: 'Angebot',        color: '#4d7fbf' },
  { status: 'verhandlung',   label: 'Verhandlung',    color: '#c9a84c' },
  { status: 'gewonnen',      label: 'Gewonnen ✓',     color: '#4ade80' },
  { status: 'verloren',      label: 'Verloren',       color: '#f87171' },
];

function formatCHF(v?: number) {
  if (!v) return 'Keine Angabe.';
  return `CHF ${v.toLocaleString('de-CH')}`;
}

// ── Modal ─────────────────────────────────────────────────

const EMPTY_DEAL: Partial<Deal> = {
  titel: '', kunden_id: undefined, status: 'lead',
  wert: undefined, wahrscheinlichkeit: 50, geplanter_abschluss: '', notizen: '',
};

function DealModal({ deal, kunden, onClose, onSaved }: {
  deal: Partial<Deal>;
  kunden: Kunde[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Deal>>(deal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!form.id;

  function set(field: keyof Deal, value: any) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.titel?.trim()) { setError('Titel ist erforderlich.'); return; }
    setSaving(true); setError('');
    const sb = createClient();
    const payload = {
      titel:               form.titel,
      kunden_id:           form.kunden_id || null,
      status:              form.status ?? 'lead',
      wert:                form.wert ? Number(form.wert) : null,
      wahrscheinlichkeit:  form.wahrscheinlichkeit ?? 50,
      geplanter_abschluss: form.geplanter_abschluss || null,
      notizen:             form.notizen || null,
    };
    const { error: err } = isEdit
      ? await sb.from('deals').update(payload).eq('id', form.id!)
      : await sb.from('deals').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? 'Deal bearbeiten' : 'Neuer Deal'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" type="submit" form="deal-form" loading={saving}>Speichern</Button>
        </>
      }
    >
      <form id="deal-form" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Titel" required value={form.titel ?? ''} onChange={(e) => set('titel', e.target.value)} placeholder="KI-Beratung Müller AG" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Kunde" value={form.kunden_id ?? ''} onChange={(e) => set('kunden_id', e.target.value || undefined)}>
            <option value="">Kein Kunde.</option>
            {kunden.map((k) => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
          </Select>
          <Select label="Status" value={form.status ?? 'lead'} onChange={(e) => set('status', e.target.value)}>
            {COLUMNS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Wert (CHF)" type="number" value={form.wert ?? ''} onChange={(e) => set('wert', e.target.value)} placeholder="5000" />
          <div>
            <label className="block text-xs text-dash-textMuted mb-1.5">Wahrscheinlichkeit ({form.wahrscheinlichkeit}%)</label>
            <input type="range" min={0} max={100} value={form.wahrscheinlichkeit ?? 50}
              onChange={(e) => set('wahrscheinlichkeit', Number(e.target.value))}
              className="w-full mt-2.5 accent-dash-gold" />
          </div>
        </div>
        <Input label="Geplanter Abschluss" type="date" value={form.geplanter_abschluss ?? ''} onChange={(e) => set('geplanter_abschluss', e.target.value)} className="[color-scheme:dark]" />
        <Textarea label="Notizen" rows={2} value={form.notizen ?? ''} onChange={(e) => set('notizen', e.target.value)} />
        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </Modal>
  );
}

// ── Deal Card ─────────────────────────────────────────────

function DealCard({ deal, onEdit, onDelete, onDragStart }: {
  deal: Deal;
  onEdit: (d: Deal) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(deal.id)}
      className="group bg-dash-surfaceAlt border border-dash-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-dash-gold/40 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-dash-textBright leading-snug flex-1">{deal.titel}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(deal)} className="p-1 rounded text-dash-textDim hover:text-dash-textBright hover:bg-dash-border/40 transition-colors"><Pencil size={12} /></button>
          <button onClick={() => onDelete(deal.id)} className="p-1 rounded text-dash-textDim hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>
      {deal.kunden && (
        <p className="text-xs text-dash-textDim mb-3">{deal.kunden.firmenname || deal.kunden.kontaktperson}</p>
      )}
      {deal.wert && (
        <p className="text-base font-bold text-dash-gold mb-2">{formatCHF(deal.wert)}</p>
      )}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-dash-textDim">
          <span>Wahrscheinlichkeit</span>
          <span>{deal.wahrscheinlichkeit}%</span>
        </div>
        <div className="h-1 rounded-full bg-dash-border overflow-hidden">
          <div className="h-full rounded-full bg-dash-gold" style={{ width: `${deal.wahrscheinlichkeit}%` }} />
        </div>
      </div>
      {deal.geplanter_abschluss && (
        <p className="mt-2 text-xs text-dash-textDim">
          Abschluss: {new Date(deal.geplanter_abschluss).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
        </p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function PipelinePage() {
  const [deals, setDeals]   = useState<Deal[]>([]);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState<Partial<Deal> | false>(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const sb = createClient();
    const [{ data: d }, { data: k }] = await Promise.all([
      sb.from('deals').select('*, kunden(id,kontaktperson,firmenname)').order('created_at'),
      sb.from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson'),
    ]);
    setDeals((d ?? []) as Deal[]);
    setKunden((k ?? []) as Kunde[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleDelete(id: string) {
    if (!confirm('Deal wirklich löschen?')) return;
    await createClient().from('deals').delete().eq('id', id);
    load();
  }

  async function handleDrop(targetStatus: DealStatus) {
    if (!dragging) return;
    const dealId = dragging;
    setDragging(null);
    const sb = createClient();
    await sb.from('deals').update({ status: targetStatus }).eq('id', dealId);
    await load();

    // Die Automation läuft serverseitig im DB-Trigger (Migration 007).
    // Hier nur nachfragen, was daraus entstanden ist, um es zu bestätigen.
    if (targetStatus === 'gewonnen') {
      const { data } = await sb.from('projekte').select('name').eq('deal_id', dealId).maybeSingle();
      if (data) setNotice(`Kunde befördert – Projekt "${data.name}" wurde automatisch angelegt.`);
    } else if (targetStatus === 'verloren') {
      const { data } = await sb.from('tasks').select('titel').eq('deal_id', dealId).maybeSingle();
      if (data) setNotice(`Nachfass-Aufgabe "${data.titel}" wurde automatisch angelegt.`);
    }
  }

  const totalWert = deals.filter((d) => d.status !== 'verloren').reduce((s, d) => s + (d.wert ?? 0), 0);
  const gewonnen  = deals.filter((d) => d.status === 'gewonnen').reduce((s, d) => s + (d.wert ?? 0), 0);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Pipeline"
        subtitle={`${deals.length} Deals · Pipeline-Wert ${formatCHF(totalWert)} · Gewonnen ${formatCHF(gewonnen)}`}
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModal(EMPTY_DEAL)}>Neuer Deal</Button>}
      />

      {notice && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-dash-gold/10 border border-dash-gold/25 text-sm text-dash-gold flex-shrink-0">
          <span className="flex items-center gap-2"><CheckCircle2 size={15} /> {notice}</span>
          <button onClick={() => setNotice(null)} className="text-dash-gold/70 hover:text-dash-gold"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-dash-textMuted text-sm">Die Einträge werden geladen.</div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {COLUMNS.map((col) => {
              const colDeals = deals.filter((d) => d.status === col.status);
              const colWert  = colDeals.reduce((s, d) => s + (d.wert ?? 0), 0);
              return (
                <div
                  key={col.status}
                  className="flex flex-col w-64 flex-shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(col.status)}
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-sm font-semibold text-dash-textBright">{col.label}</span>
                      <span className="text-xs text-dash-textDim bg-dash-surfaceAlt px-1.5 py-0.5 rounded-full">{colDeals.length}</span>
                    </div>
                    {colWert > 0 && <span className="text-xs text-dash-textDim">{formatCHF(colWert)}</span>}
                  </div>

                  <div className="flex-1 space-y-3 min-h-[100px] rounded-xl bg-dash-bg/50 border border-dash-border/60 p-2">
                    {colDeals.map((d) => (
                      <DealCard key={d.id} deal={d} onEdit={setModal} onDelete={handleDelete} onDragStart={setDragging} />
                    ))}
                    {colDeals.length === 0 && (
                      <div className="h-20 flex items-center justify-center text-xs text-dash-textDim border-2 border-dashed border-dash-border rounded-lg">
                        Hier ablegen
                      </div>
                    )}
                    <button onClick={() => setModal({ ...EMPTY_DEAL, status: col.status })}
                      className="w-full py-2 rounded-lg text-xs text-dash-textDim hover:text-dash-gold hover:bg-dash-gold/5 border border-dashed border-dash-border hover:border-dash-gold/40 transition-all">
                      + Deal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal !== false && (
        <DealModal
          deal={modal}
          kunden={kunden}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
