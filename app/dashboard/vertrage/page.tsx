'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, X, FileSignature, Send, CheckCircle2,
  Pencil, Trash2, Search, AlertCircle,
} from 'lucide-react';
import { Kunde, Projekt } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────

type VertragStatus = 'entwurf' | 'gesendet' | 'unterzeichnet' | 'abgelaufen';
type TemplateTyp   = 'beratung' | 'workshop' | 'umsetzung' | 'custom';

interface Vertrag {
  id: string;
  titel: string;
  kunden_id?: string;
  projekt_id?: string;
  template_typ?: TemplateTyp;
  inhalt?: string;
  status: VertragStatus;
  gueltig_bis?: string;
  unterzeichnet_am?: string;
  created_at: string;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname'>;
  projekte?: Pick<Projekt, 'id' | 'name'>;
}

const STATUS_CFG: Record<VertragStatus, { label: string; cls: string; Icon: React.ElementType; next?: VertragStatus }> = {
  entwurf:      { label: 'Entwurf',       cls: 'bg-slate-700/60 text-slate-300',   Icon: FileSignature, next: 'gesendet' },
  gesendet:     { label: 'Gesendet',      cls: 'bg-blue-900/50 text-blue-300',     Icon: Send,          next: 'unterzeichnet' },
  unterzeichnet:{ label: 'Unterzeichnet', cls: 'bg-green-900/50 text-green-300',   Icon: CheckCircle2 },
  abgelaufen:   { label: 'Abgelaufen',    cls: 'bg-orange-900/40 text-orange-300', Icon: AlertCircle },
};

const TEMPLATE_CFG: Record<TemplateTyp, string> = {
  beratung:  'Beratungsvertrag',
  workshop:  'Workshop-Vertrag',
  umsetzung: 'Umsetzungsvertrag',
  custom:    'Individuell',
};

function formatDate(iso?: string | null) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isExpiringSoon(date?: string | null) {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff < 14 * 86400000;
}

function isExpired(date?: string | null, status?: string) {
  if (!date || status === 'unterzeichnet') return false;
  return new Date(date) < new Date();
}

// ── Modal ──────────────────────────────────────────────────

function VertragModal({ vertrag, kunden, projekte, onClose, onSaved }: {
  vertrag: Partial<Vertrag>;
  kunden: Kunde[];
  projekte: Projekt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<Partial<Vertrag>>(vertrag);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState<'info' | 'inhalt'>('info');
  const isEdit = !!vertrag.id;

  function set(k: keyof Vertrag, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.titel?.trim()) { setError('Titel ist erforderlich'); return; }
    setSaving(true); setError('');
    const payload = {
      titel:            form.titel,
      kunden_id:        form.kunden_id || null,
      projekt_id:       form.projekt_id || null,
      template_typ:     form.template_typ || null,
      inhalt:           form.inhalt || null,
      status:           form.status || 'entwurf',
      gueltig_bis:      form.gueltig_bis || null,
      unterzeichnet_am: form.unterzeichnet_am || null,
    };
    const { error: err } = isEdit
      ? await supabase.from('vertraege').update(payload).eq('id', vertrag.id!)
      : await supabase.from('vertraege').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  }

  async function handleDelete() {
    if (!isEdit || !confirm('Vertrag wirklich löschen?')) return;
    await supabase.from('vertraege').delete().eq('id', vertrag.id!);
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#2d3144]">
          <h2 className="text-white font-semibold text-lg">{isEdit ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex border-b border-[#2d3144]">
          {(['info', 'inhalt'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'text-ms-400 border-b-2 border-ms-400 -mb-px' : 'text-slate-400 hover:text-white'
              }`}>
              {t === 'info' ? 'Informationen' : 'Vertragstext'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {tab === 'info' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Titel *</label>
                <input value={form.titel || ''} onChange={e => set('titel', e.target.value)}
                  placeholder="z.B. Beratungsvertrag Q3 2026"
                  className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kunde</label>
                  <select value={form.kunden_id || ''} onChange={e => set('kunden_id', e.target.value || undefined)}
                    className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">— Kein Kunde —</option>
                    {kunden.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.firmenname ? `${k.firmenname} – ${k.kontaktperson}` : k.kontaktperson}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Projekt</label>
                  <select value={form.projekt_id || ''} onChange={e => set('projekt_id', e.target.value || undefined)}
                    className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">— Kein Projekt —</option>
                    {projekte.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Vorlage</label>
                  <select value={form.template_typ || ''} onChange={e => set('template_typ', e.target.value || undefined)}
                    className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">— Wählen —</option>
                    {(Object.keys(TEMPLATE_CFG) as TemplateTyp[]).map(k => (
                      <option key={k} value={k}>{TEMPLATE_CFG[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <select value={form.status || 'entwurf'} onChange={e => set('status', e.target.value)}
                    className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm">
                    {(Object.keys(STATUS_CFG) as VertragStatus[]).map(k => (
                      <option key={k} value={k}>{STATUS_CFG[k].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Gültig bis</label>
                  <input type="date" value={form.gueltig_bis || ''} onChange={e => set('gueltig_bis', e.target.value || undefined)}
                    className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Unterzeichnet am</label>
                  <input type="date" value={form.unterzeichnet_am ? form.unterzeichnet_am.slice(0, 10) : ''}
                    onChange={e => set('unterzeichnet_am', e.target.value || undefined)}
                    className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-slate-400 mb-2">Vertragstext</label>
              <textarea rows={18} value={form.inhalt || ''} onChange={e => set('inhalt', e.target.value)}
                placeholder="Vollständigen Vertragstext hier eingeben…"
                className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-xs font-mono leading-relaxed resize-none" />
            </div>
          )}

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <div className="flex items-center justify-between pt-4">
            {isEdit
              ? <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm"><Trash2 size={14} /> Löschen</button>
              : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm">Abbrechen</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-ms-500 hover:bg-ms-600 text-white rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function VertragePage() {
  const supabase = createClient();
  const [vertraege, setVertraege]   = useState<Vertrag[]>([]);
  const [kunden, setKunden]         = useState<Kunde[]>([]);
  const [projekte, setProjekte]     = useState<Projekt[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<Partial<Vertrag> | null>(null);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState<VertragStatus | ''>('');

  async function load() {
    setLoading(true);
    const [{ data: ve }, { data: ke }, { data: pe }] = await Promise.all([
      supabase.from('vertraege').select('*, kunden(id,kontaktperson,firmenname), projekte(id,name)').order('created_at', { ascending: false }),
      supabase.from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson'),
      supabase.from('projekte').select('id,name').order('name'),
    ]);
    setVertraege((ve as Vertrag[]) || []);
    setKunden((ke as Kunde[]) || []);
    setProjekte((pe as Projekt[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function advanceStatus(v: Vertrag) {
    const next = STATUS_CFG[v.status].next;
    if (!next) return;
    const extra = next === 'unterzeichnet' ? { unterzeichnet_am: new Date().toISOString() } : {};
    await supabase.from('vertraege').update({ status: next, ...extra }).eq('id', v.id);
    load();
  }

  const filtered = vertraege.filter(v =>
    (v.titel.toLowerCase().includes(search.toLowerCase()) ||
     (v.kunden?.kontaktperson || '').toLowerCase().includes(search.toLowerCase()) ||
     (v.kunden?.firmenname || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || v.status === filterStatus)
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Verträge</h1>
          <p className="text-slate-400 text-sm mt-0.5">Verträge erstellen, versenden und unterzeichnen</p>
        </div>
        <button onClick={() => setModal({ status: 'entwurf' })}
          className="flex items-center gap-2 bg-ms-500 hover:bg-ms-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Neuer Vertrag
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt',        value: vertraege.length,                                         cls: 'text-white' },
          { label: 'Entwürfe',      value: vertraege.filter(v => v.status === 'entwurf').length,     cls: 'text-slate-400' },
          { label: 'Unterzeichnet', value: vertraege.filter(v => v.status === 'unterzeichnet').length, cls: 'text-green-400' },
          { label: 'Läuft ab (<14 Tage)', value: vertraege.filter(v => isExpiringSoon(v.gueltig_bis)).length,
            cls: vertraege.filter(v => isExpiringSoon(v.gueltig_bis)).length > 0 ? 'text-orange-400' : 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#1e2235] border border-[#2d3144] rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Titel oder Kunde suchen…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1e2235] border border-[#2d3144] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-500 focus:border-ms-500 outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilter(e.target.value as VertragStatus | '')}
          className="bg-[#1e2235] border border-[#2d3144] rounded-xl px-3 py-2.5 text-white text-sm">
          <option value="">Alle Status</option>
          {(Object.keys(STATUS_CFG) as VertragStatus[]).map(k => (
            <option key={k} value={k}>{STATUS_CFG[k].label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Lade Daten…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-12 text-center">
          <FileSignature size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Noch keine Verträge</p>
          <button onClick={() => setModal({ status: 'entwurf' })} className="mt-4 text-ms-400 text-sm hover:underline">Ersten Vertrag erstellen</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(v => {
            const cfg  = STATUS_CFG[v.status];
            const Icon = cfg.Icon;
            const expiring = isExpiringSoon(v.gueltig_bis);
            const expired  = isExpired(v.gueltig_bis, v.status);
            return (
              <div key={v.id} className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-5 hover:border-[#3d4460] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{v.titel}</h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {v.kunden?.firmenname || v.kunden?.kontaktperson || 'Kein Kunde'}
                      {v.projekte && <span className="text-slate-600"> · {v.projekte.name}</span>}
                    </p>
                  </div>
                  <span className={`ml-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.cls}`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
                  {v.template_typ && <span className="text-indigo-400">{TEMPLATE_CFG[v.template_typ]}</span>}
                  <span>Erstellt {formatDate(v.created_at)}</span>
                  {v.gueltig_bis && (
                    <span className={expiring ? 'text-orange-400 font-medium' : expired ? 'text-red-400' : ''}>
                      {expiring ? '⚠ Läuft ab ' : 'Bis '}
                      {formatDate(v.gueltig_bis)}
                    </span>
                  )}
                  {v.unterzeichnet_am && <span className="text-green-400">✓ Unterz. {formatDate(v.unterzeichnet_am)}</span>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {(Object.keys(STATUS_CFG) as VertragStatus[]).map((s, i) => {
                      const statusOrder = Object.keys(STATUS_CFG).indexOf(v.status);
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            v.status === s ? 'bg-ms-400' :
                            statusOrder > i ? 'bg-green-500' : 'bg-[#2d3144]'
                          }`} />
                          {i < 3 && <div className="w-4 h-px bg-[#2d3144]" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    {cfg.next && (
                      <button onClick={() => advanceStatus(v)}
                        className="px-3 py-1.5 bg-ms-500/20 hover:bg-ms-500/40 text-ms-400 rounded-lg text-xs font-medium transition-colors">
                        → {STATUS_CFG[cfg.next].label}
                      </button>
                    )}
                    <button onClick={() => setModal(v)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <VertragModal vertrag={modal} kunden={kunden} projekte={projekte} onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}
