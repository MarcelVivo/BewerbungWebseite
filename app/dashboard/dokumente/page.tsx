'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, X, FolderOpen, FileText, Search, Pencil,
  Trash2, Download, ExternalLink, Upload,
} from 'lucide-react';
import { Kunde, Projekt } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────

type DokumentTyp = 'vorlage' | 'angebot' | 'rechnung' | 'vertrag' | 'sonstiges';

interface Dokument {
  id: string;
  name: string;
  typ?: DokumentTyp;
  kunden_id?: string;
  projekt_id?: string;
  storage_path?: string;
  groesse_bytes?: number;
  created_at: string;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname'>;
  projekte?: Pick<Projekt, 'id' | 'name'>;
}

// ── Config ─────────────────────────────────────────────────

const TYP_CFG: Record<DokumentTyp, { label: string; cls: string; color: string }> = {
  vorlage:   { label: 'Vorlage',   cls: 'bg-purple-900/40 text-purple-300',  color: 'text-purple-400' },
  angebot:   { label: 'Angebot',   cls: 'bg-blue-900/40 text-blue-300',      color: 'text-blue-400' },
  rechnung:  { label: 'Rechnung',  cls: 'bg-indigo-900/40 text-indigo-300',  color: 'text-indigo-400' },
  vertrag:   { label: 'Vertrag',   cls: 'bg-green-900/40 text-green-300',    color: 'text-green-400' },
  sonstiges: { label: 'Sonstiges', cls: 'bg-slate-700/60 text-slate-300',    color: 'text-slate-400' },
};

function formatDate(iso?: string | null) {
  if (!iso) return 'Keine Angabe.';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return 'Keine Angabe.';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(name: string) {
  return name.split('.').pop()?.toUpperCase() || '?';
}

// ── Modal ──────────────────────────────────────────────────

function DokumentModal({ dokument, kunden, projekte, onClose, onSaved }: {
  dokument: Partial<Dokument>;
  kunden: Kunde[];
  projekte: Projekt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm]     = useState<Partial<Dokument>>(dokument);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const isEdit = !!dokument.id;

  function set(k: keyof Dokument, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) { setError('Name ist erforderlich'); return; }
    setSaving(true); setError('');
    const payload = {
      name:         form.name,
      typ:          form.typ || null,
      kunden_id:    form.kunden_id || null,
      projekt_id:   form.projekt_id || null,
      storage_path: form.storage_path || null,
      groesse_bytes: form.groesse_bytes || null,
    };
    const { error: err } = isEdit
      ? await supabase.from('dokumente').update(payload).eq('id', dokument.id!)
      : await supabase.from('dokumente').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  }

  async function handleDelete() {
    if (!isEdit || !confirm('Dokument wirklich löschen?')) return;
    await supabase.from('dokumente').delete().eq('id', dokument.id!);
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2d3144]">
          <h2 className="text-white font-semibold text-lg">{isEdit ? 'Dokument bearbeiten' : 'Dokument erfassen'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Dateiname *</label>
            <input value={form.name || ''} onChange={e => set('name', e.target.value)}
              placeholder="z.B. Angebot_Musterfirma_2026.pdf"
              className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Typ</label>
              <select value={form.typ || ''} onChange={e => set('typ', e.target.value || undefined)}
                className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm">
                <option value="">Bitte wählen.</option>
                {(Object.keys(TYP_CFG) as DokumentTyp[]).map(k => (
                  <option key={k} value={k}>{TYP_CFG[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Grösse (Bytes)</label>
              <input type="number" value={form.groesse_bytes || ''} onChange={e => set('groesse_bytes', parseInt(e.target.value) || undefined)}
                placeholder="z.B. 102400"
                className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Kunde</label>
              <select value={form.kunden_id || ''} onChange={e => set('kunden_id', e.target.value || undefined)}
                className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm">
                <option value="">Kein Kunde.</option>
                {kunden.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.firmenname ? `${k.firmenname}. ${k.kontaktperson}.` : k.kontaktperson}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Projekt</label>
              <select value={form.projekt_id || ''} onChange={e => set('projekt_id', e.target.value || undefined)}
                className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm">
                <option value="">Kein Projekt.</option>
                {projekte.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Pfad / URL</label>
            <input value={form.storage_path || ''} onChange={e => set('storage_path', e.target.value)}
              placeholder="Füge einen Pfad oder eine vollständige Adresse ein."
              className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm font-mono text-xs" />
            <p className="text-slate-600 text-xs mt-1">Direkter Link oder relativer Pfad zur Datei</p>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {isEdit
              ? <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm"><Trash2 size={14} /> Löschen</button>
              : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm">Abbrechen</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-ms-500 hover:bg-ms-600 text-white rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Ich speichere das Dokument.' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function DokumentePage() {
  const supabase = createClient();
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [kunden, setKunden]       = useState<Kunde[]>([]);
  const [projekte, setProjekte]   = useState<Projekt[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<Partial<Dokument> | null>(null);
  const [search, setSearch]       = useState('');
  const [filterTyp, setFilter]    = useState<DokumentTyp | ''>('');

  async function load() {
    setLoading(true);
    const [{ data: de }, { data: ke }, { data: pe }] = await Promise.all([
      supabase.from('dokumente').select('*, kunden(id,kontaktperson,firmenname), projekte(id,name)').order('created_at', { ascending: false }),
      supabase.from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson'),
      supabase.from('projekte').select('id,name').order('name'),
    ]);
    setDokumente((de as Dokument[]) || []);
    setKunden((ke as Kunde[]) || []);
    setProjekte((pe as Projekt[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = dokumente.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterTyp || d.typ === filterTyp)
  );

  const grouped = filtered.reduce<Record<string, Dokument[]>>((acc, d) => {
    const typ = d.typ || 'sonstiges';
    return { ...acc, [typ]: [...(acc[typ] || []), d] };
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dokumente</h1>
          <p className="text-slate-400 text-sm mt-0.5">Dateien und Dokumente verwalten</p>
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-ms-500 hover:bg-ms-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Dokument erfassen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(TYP_CFG) as DokumentTyp[]).map(t => (
          <button key={t} onClick={() => setFilter(filterTyp === t ? '' : t)}
            className={`bg-[#1e2235] border rounded-xl p-3 text-left transition-colors ${
              filterTyp === t ? 'border-ms-500/60' : 'border-[#2d3144] hover:border-[#3d4460]'
            }`}>
            <p className={`text-xs mb-1 ${TYP_CFG[t].color}`}>{TYP_CFG[t].label}</p>
            <p className="text-xl font-bold text-white">{dokumente.filter(d => d.typ === t).length}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" placeholder="Suche nach einem Dateinamen." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#1e2235] border border-[#2d3144] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-500 focus:border-ms-500 outline-none" />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Die Dokumente werden geladen.</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-12 text-center">
          <FolderOpen size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Noch keine Dokumente</p>
          <button onClick={() => setModal({})} className="mt-4 text-ms-400 text-sm hover:underline">Erstes Dokument erfassen</button>
        </div>
      ) : filterTyp ? (
        /* Flat list when filtered */
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl overflow-hidden">
          <DocumentTable docs={filtered} onEdit={setModal} />
        </div>
      ) : (
        /* Grouped by type */
        <div className="space-y-4">
          {(Object.keys(TYP_CFG) as DokumentTyp[]).map(t => {
            const docs = grouped[t];
            if (!docs?.length) return null;
            return (
              <div key={t} className="bg-[#1e2235] border border-[#2d3144] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2d3144]/60">
                  <span className={`text-xs font-semibold ${TYP_CFG[t].color}`}>{TYP_CFG[t].label.toUpperCase()}</span>
                  <span className="text-slate-600 text-xs">({docs.length})</span>
                </div>
                <DocumentTable docs={docs} onEdit={setModal} />
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <DokumentModal dokument={modal} kunden={kunden} projekte={projekte} onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}

function DocumentTable({ docs, onEdit }: { docs: Dokument[]; onEdit: (d: Dokument) => void }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {docs.map(d => {
          const ext = getFileExt(d.name);
          const hasLink = !!d.storage_path;
          return (
            <tr key={d.id} className="border-b border-[#2d3144]/40 last:border-0 hover:bg-[#252a40] transition-colors">
              <td className="px-4 py-3 w-10">
                <div className="w-9 h-9 rounded-lg bg-[#2d3144] flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-400">{ext}</span>
                </div>
              </td>
              <td className="px-3 py-3">
                <p className="text-white font-medium">{d.name}</p>
                <p className="text-slate-500 text-xs">
                  {d.kunden?.firmenname || d.kunden?.kontaktperson || ''}
                  {d.projekte && <span> · {d.projekte.name}</span>}
                  {!d.kunden && !d.projekte && 'Allgemein'}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap hidden sm:table-cell">
                {formatBytes(d.groesse_bytes)}
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap hidden md:table-cell">
                {formatDate(d.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 justify-end">
                  {hasLink && (
                    <a href={d.storage_path!} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-ms-400 hover:bg-[#2d3144] transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={() => onEdit(d)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors">
                    <Pencil size={14} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
