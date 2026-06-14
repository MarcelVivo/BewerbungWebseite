'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Deal, DealStatus, Kunde } from '@/lib/types';
import { Plus, X, ChevronRight, Pencil, Trash2 } from 'lucide-react';

// ── Config ────────────────────────────────────────────────

const COLUMNS: { status: DealStatus; label: string; color: string }[] = [
  { status: 'lead',          label: 'Lead',           color: '#64748b' },
  { status: 'erstgespraech', label: 'Erstgespräch',   color: '#3b82f6' },
  { status: 'angebot',       label: 'Angebot',        color: '#06b6d4' },
  { status: 'verhandlung',   label: 'Verhandlung',    color: '#f59e0b' },
  { status: 'gewonnen',      label: 'Gewonnen ✓',     color: '#22c55e' },
  { status: 'verloren',      label: 'Verloren',       color: '#ef4444' },
];

function formatCHF(v?: number) {
  if (!v) return '–';
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

  function set(field: keyof Deal, value: any) { setForm(f => ({ ...f, [field]: value })); }

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

  const inputCls = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3144]">
          <h2 className="font-semibold text-white">{isEdit ? 'Deal bearbeiten' : 'Neuer Deal'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Titel *</label>
            <input value={form.titel ?? ''} onChange={e => set('titel', e.target.value)} className={inputCls} placeholder="KI-Beratung Müller AG" />
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
              <select value={form.status ?? 'lead'} onChange={e => set('status', e.target.value)} className={inputCls}>
                {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Wert (CHF)</label>
              <input type="number" value={form.wert ?? ''} onChange={e => set('wert', e.target.value)} className={inputCls} placeholder="5000" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Wahrscheinlichkeit ({form.wahrscheinlichkeit}%)</label>
              <input type="range" min={0} max={100} value={form.wahrscheinlichkeit ?? 50}
                onChange={e => set('wahrscheinlichkeit', Number(e.target.value))}
                className="w-full mt-2 accent-[#6366f1]" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Geplanter Abschluss</label>
            <input type="date" value={form.geplanter_abschluss ?? ''} onChange={e => set('geplanter_abschluss', e.target.value)}
              className={inputCls + ' [color-scheme:dark]'} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Notizen</label>
            <textarea value={form.notizen ?? ''} onChange={e => set('notizen', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
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
      className="group bg-[#252836] border border-[#2d3144] rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-[#6366f1]/40 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-white leading-snug flex-1">{deal.titel}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(deal)} className="p-1 rounded text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors"><Pencil size={12} /></button>
          <button onClick={() => onDelete(deal.id)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>
      {deal.kunden && (
        <p className="text-xs text-slate-500 mb-3">{deal.kunden.firmenname || deal.kunden.kontaktperson}</p>
      )}
      {deal.wert && (
        <p className="text-base font-bold text-[#6366f1] mb-2">{formatCHF(deal.wert)}</p>
      )}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Wahrscheinlichkeit</span>
          <span>{deal.wahrscheinlichkeit}%</span>
        </div>
        <div className="h-1 rounded-full bg-[#2d3144] overflow-hidden">
          <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${deal.wahrscheinlichkeit}%` }} />
        </div>
      </div>
      {deal.geplanter_abschluss && (
        <p className="mt-2 text-xs text-slate-600">
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

  async function handleDelete(id: string) {
    if (!confirm('Deal wirklich löschen?')) return;
    await createClient().from('deals').delete().eq('id', id);
    load();
  }

  async function handleDrop(targetStatus: DealStatus) {
    if (!dragging) return;
    await createClient().from('deals').update({ status: targetStatus }).eq('id', dragging);
    setDragging(null);
    load();
  }

  const totalWert = deals.filter(d => d.status !== 'verloren').reduce((s, d) => s + (d.wert ?? 0), 0);
  const gewonnen  = deals.filter(d => d.status === 'gewonnen').reduce((s, d) => s + (d.wert ?? 0), 0);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {deals.length} Deals · Pipeline-Wert {formatCHF(totalWert)} · Gewonnen {formatCHF(gewonnen)}
          </p>
        </div>
        <button onClick={() => setModal(EMPTY_DEAL)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Neuer Deal
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Lädt…</div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {COLUMNS.map(col => {
              const colDeals = deals.filter(d => d.status === col.status);
              const colWert  = colDeals.reduce((s, d) => s + (d.wert ?? 0), 0);
              return (
                <div
                  key={col.status}
                  className="flex flex-col w-64 flex-shrink-0"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(col.status)}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-sm font-semibold text-white">{col.label}</span>
                      <span className="text-xs text-slate-500 bg-[#252836] px-1.5 py-0.5 rounded-full">{colDeals.length}</span>
                    </div>
                    {colWert > 0 && <span className="text-xs text-slate-500">{formatCHF(colWert)}</span>}
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-3 min-h-[100px] rounded-xl bg-[#0f1117]/50 border border-[#2d3144]/50 p-2">
                    {colDeals.map(d => (
                      <DealCard
                        key={d.id}
                        deal={d}
                        onEdit={setModal}
                        onDelete={handleDelete}
                        onDragStart={setDragging}
                      />
                    ))}
                    {colDeals.length === 0 && (
                      <div className="h-20 flex items-center justify-center text-xs text-slate-600 border-2 border-dashed border-[#2d3144] rounded-lg">
                        Hier ablegen
                      </div>
                    )}
                    <button onClick={() => setModal({ ...EMPTY_DEAL, status: col.status })}
                      className="w-full py-2 rounded-lg text-xs text-slate-600 hover:text-[#6366f1] hover:bg-[#6366f1]/5 border border-dashed border-[#2d3144] hover:border-[#6366f1]/40 transition-all">
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
