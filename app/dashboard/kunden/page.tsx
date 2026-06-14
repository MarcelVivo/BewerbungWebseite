'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Kunde, KundenStatus } from '@/lib/types';
import { Search, Plus, X, Pencil, Trash2, Building2, User, Mail, Phone } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────

const STATUS_LABEL: Record<KundenStatus, string> = {
  lead: 'Lead', interessent: 'Interessent', kunde: 'Kunde', inaktiv: 'Inaktiv',
};
const STATUS_COLOR: Record<KundenStatus, string> = {
  lead:        'bg-slate-700 text-slate-300',
  interessent: 'bg-blue-900/60 text-blue-300',
  kunde:       'bg-green-900/60 text-green-300',
  inaktiv:     'bg-slate-800 text-slate-500',
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Modal ─────────────────────────────────────────────────

const EMPTY: Partial<Kunde> = { kontaktperson: '', firmenname: '', email: '', telefon: '', branche: '', status: 'lead', notizen: '' };

function KundeModal({ kunde, kunden, onClose, onSaved }: {
  kunde: Partial<Kunde> | null;
  kunden: Kunde[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Kunde>>(kunde ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!form.id;

  function set(field: keyof Kunde, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.kontaktperson?.trim()) { setError('Kontaktperson ist erforderlich.'); return; }
    setSaving(true);
    setError('');
    const sb = createClient();
    const payload = {
      kontaktperson: form.kontaktperson,
      firmenname:    form.firmenname || null,
      email:         form.email || null,
      telefon:       form.telefon || null,
      branche:       form.branche || null,
      status:        form.status ?? 'lead',
      notizen:       form.notizen || null,
    };
    const { error: err } = isEdit
      ? await sb.from('kunden').update(payload).eq('id', form.id!)
      : await sb.from('kunden').insert(payload);
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
          <h2 className="font-semibold text-white">{isEdit ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Kontaktperson *</label>
              <input value={form.kontaktperson ?? ''} onChange={e => set('kontaktperson', e.target.value)} className={inputCls} placeholder="Max Muster" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Firma</label>
              <input value={form.firmenname ?? ''} onChange={e => set('firmenname', e.target.value)} className={inputCls} placeholder="Muster GmbH" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">E-Mail</label>
              <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="max@firma.ch" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Telefon</label>
              <input value={form.telefon ?? ''} onChange={e => set('telefon', e.target.value)} className={inputCls} placeholder="+41 79 123 45 67" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Branche</label>
              <input value={form.branche ?? ''} onChange={e => set('branche', e.target.value)} className={inputCls} placeholder="IT, Handel, ..." />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select value={form.status ?? 'lead'} onChange={e => set('status', e.target.value)} className={inputCls}>
                {(Object.keys(STATUS_LABEL) as KundenStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Notizen</label>
            <textarea value={form.notizen ?? ''} onChange={e => set('notizen', e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Interne Notizen..." />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-[#2d3144] hover:border-slate-500 transition-colors">
              Abbrechen
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white transition-colors">
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function KundenPage() {
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<KundenStatus | 'alle'>('alle');
  const [modal, setModal] = useState<Partial<Kunde> | null | false>(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await createClient().from('kunden').select('*').order('created_at', { ascending: false });
    setKunden(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Kunden wirklich löschen?')) return;
    setDeleting(id);
    await createClient().from('kunden').delete().eq('id', id);
    setDeleting(null);
    load();
  }

  const filtered = kunden.filter(k => {
    const matchSearch = !search || [k.kontaktperson, k.firmenname, k.email].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'alle' || k.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kunden</h1>
          <p className="text-sm text-slate-400 mt-0.5">{kunden.length} Kontakte insgesamt</p>
        </div>
        <button onClick={() => setModal(EMPTY)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Neuer Kunde
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Suchen nach Name, Firma, E-Mail…"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1d27] border border-[#2d3144] focus:border-[#6366f1] outline-none text-white text-sm placeholder-slate-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['alle', ...Object.keys(STATUS_LABEL)] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-[#6366f1] text-white' : 'bg-[#1a1d27] border border-[#2d3144] text-slate-400 hover:text-white'}`}>
              {s === 'alle' ? 'Alle' : STATUS_LABEL[s as KundenStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Lädt…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <User size={32} className="mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">Keine Kunden gefunden.</p>
            <button onClick={() => setModal(EMPTY)} className="mt-4 text-[#6366f1] text-sm hover:underline">+ Ersten Kunden anlegen</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3144] text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Kontakt</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">E-Mail</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Telefon</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Branche</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Erstellt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(k => (
                <tr key={k.id} className="border-b border-[#2d3144]/50 hover:bg-[#252836] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366f1]/20 text-[#818cf8] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(k.kontaktperson)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{k.kontaktperson}</div>
                        {k.firmenname && <div className="text-slate-500 text-xs">{k.firmenname}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-400">
                    {k.email ? <a href={`mailto:${k.email}`} className="hover:text-white transition-colors">{k.email}</a> : '–'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-400">{k.telefon || '–'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-400">{k.branche || '–'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[k.status]}`}>
                      {STATUS_LABEL[k.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500">{formatDate(k.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(k)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(k.id)} disabled={deleting === k.id} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal !== false && (
        <KundeModal
          kunde={modal}
          kunden={kunden}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
