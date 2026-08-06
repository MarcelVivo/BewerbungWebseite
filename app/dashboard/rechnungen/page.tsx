'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Rechnung, RechnungPosition, RechnungStatus, RechnungTyp, Kunde, Projekt } from '@/lib/types';
import { Plus, X, Pencil, Trash2, FileText, Send, CheckCircle, Eye, Search, Download, AlertCircle } from 'lucide-react';

// ── Config ────────────────────────────────────────────────

const STATUS_CFG: Record<RechnungStatus, { label: string; cls: string; icon: React.ElementType }> = {
  entwurf:      { label: 'Entwurf',     cls: 'bg-slate-700 text-slate-300',     icon: FileText },
  gesendet:     { label: 'Gesendet',    cls: 'bg-blue-900/60 text-blue-300',    icon: Send },
  bezahlt:      { label: 'Bezahlt',     cls: 'bg-green-900/60 text-green-300',  icon: CheckCircle },
  ueberfaellig: { label: 'Überfällig',  cls: 'bg-red-900/60 text-red-300',      icon: AlertCircle },
  storniert:    { label: 'Storniert',   cls: 'bg-slate-800 text-slate-500',     icon: X },
};

const TYP_CFG: Record<RechnungTyp, { label: string; cls: string }> = {
  angebot:  { label: 'Angebot',  cls: 'text-cyan-400' },
  rechnung: { label: 'Rechnung', cls: 'text-indigo-400' },
  mahnung:  { label: 'Mahnung',  cls: 'text-orange-400' },
};

const MWST = 8.1;

function formatCHF(v?: number | null) {
  if (v == null) return 'Keine Angabe.';
  return `CHF ${v.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Keine Angabe.';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function calcTotals(positionen: RechnungPosition[], mwst_satz: number) {
  const zwischensumme = positionen.reduce((s, p) => s + p.total, 0);
  const mwst_betrag   = zwischensumme * (mwst_satz / 100);
  const gesamtbetrag  = zwischensumme + mwst_betrag;
  return { zwischensumme, mwst_betrag, gesamtbetrag };
}

// ── Rechnung Modal ────────────────────────────────────────

const EMPTY_POSITION: RechnungPosition = { beschreibung: '', menge: 1, einheit: 'Stunden', einzelpreis: 0, total: 0 };

const EMPTY_RECHNUNG = (): Partial<Rechnung> => ({
  typ: 'rechnung',
  status: 'entwurf',
  ausgestellt_am: new Date().toISOString().slice(0, 10),
  faellig_am: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  mwst_satz: MWST,
  zahlungskonditionen: '30 Tage netto',
  positionen: [{ ...EMPTY_POSITION }],
  notizen: '',
});

function RechnungModal({ rechnung, kunden, projekte, nextNr, onClose, onSaved }: {
  rechnung: Partial<Rechnung>;
  kunden: Kunde[];
  projekte: Projekt[];
  nextNr: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Rechnung>>({
    rechnungsnummer: nextNr,
    ...rechnung,
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const isEdit                = !!form.id;

  function setField(field: keyof Rechnung, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function setPos(idx: number, field: keyof RechnungPosition, value: any) {
    setForm(f => {
      const pos = [...(f.positionen ?? [])];
      pos[idx] = { ...pos[idx], [field]: value };
      if (field === 'menge' || field === 'einzelpreis') {
        pos[idx].total = Number(pos[idx].menge) * Number(pos[idx].einzelpreis);
      }
      return { ...f, positionen: pos };
    });
  }

  function addRow() {
    setForm(f => ({ ...f, positionen: [...(f.positionen ?? []), { ...EMPTY_POSITION }] }));
  }

  function removeRow(idx: number) {
    setForm(f => ({ ...f, positionen: (f.positionen ?? []).filter((_, i) => i !== idx) }));
  }

  const { zwischensumme, mwst_betrag, gesamtbetrag } = calcTotals(form.positionen ?? [], form.mwst_satz ?? MWST);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.rechnungsnummer?.trim()) { setError('Rechnungsnummer fehlt.'); return; }
    setSaving(true); setError('');
    const payload = {
      rechnungsnummer:    form.rechnungsnummer,
      kunden_id:          form.kunden_id || null,
      projekt_id:         form.projekt_id || null,
      typ:                form.typ ?? 'rechnung',
      status:             form.status ?? 'entwurf',
      ausgestellt_am:     form.ausgestellt_am || null,
      faellig_am:         form.faellig_am || null,
      bezahlt_am:         form.bezahlt_am || null,
      positionen:         form.positionen ?? [],
      zwischensumme,
      mwst_betrag,
      gesamtbetrag,
      mwst_satz:          form.mwst_satz ?? MWST,
      notizen:            form.notizen || null,
      zahlungskonditionen: form.zahlungskonditionen || '30 Tage netto',
    };
    const sb = createClient();
    const { error: err } = isEdit
      ? await sb.from('rechnungen').update(payload).eq('id', form.id!)
      : await sb.from('rechnungen').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  const inputCls = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3144] flex-shrink-0">
          <h2 className="font-semibold text-white">{isEdit ? 'Rechnung bearbeiten' : 'Neue Rechnung / Angebot'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Metadaten */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Typ</label>
                <select value={form.typ ?? 'rechnung'} onChange={e => setField('typ', e.target.value)} className={inputCls}>
                  <option value="rechnung">Rechnung</option>
                  <option value="angebot">Angebot</option>
                  <option value="mahnung">Mahnung</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nummer</label>
                <input value={form.rechnungsnummer ?? ''} onChange={e => setField('rechnungsnummer', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Status</label>
                <select value={form.status ?? 'entwurf'} onChange={e => setField('status', e.target.value)} className={inputCls}>
                  {(Object.keys(STATUS_CFG) as RechnungStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Kunde</label>
                <select value={form.kunden_id ?? ''} onChange={e => setField('kunden_id', e.target.value || undefined)} className={inputCls}>
                  <option value="">Kein Kunde.</option>
                  {kunden.map(k => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Projekt</label>
                <select value={form.projekt_id ?? ''} onChange={e => setField('projekt_id', e.target.value || undefined)} className={inputCls}>
                  <option value="">Kein Projekt.</option>
                  {projekte.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ausgestellt am</label>
                <input type="date" value={form.ausgestellt_am ?? ''} onChange={e => setField('ausgestellt_am', e.target.value)} className={inputCls + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fällig am</label>
                <input type="date" value={form.faellig_am ?? ''} onChange={e => setField('faellig_am', e.target.value)} className={inputCls + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Zahlungskonditionen</label>
                <input value={form.zahlungskonditionen ?? ''} onChange={e => setField('zahlungskonditionen', e.target.value)} className={inputCls} placeholder="30 Tage netto" />
              </div>
            </div>

            {/* Positionen */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Positionen</label>
                <button type="button" onClick={addRow} className="text-xs text-[#6366f1] hover:underline flex items-center gap-1">
                  <Plus size={12} /> Zeile
                </button>
              </div>
              <div className="rounded-lg border border-[#2d3144] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#252836] text-xs text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-3 py-2 flex-1">Beschreibung</th>
                      <th className="text-right px-3 py-2 w-20">Menge</th>
                      <th className="text-left px-3 py-2 w-28">Einheit</th>
                      <th className="text-right px-3 py-2 w-28">Einzelpreis</th>
                      <th className="text-right px-3 py-2 w-28">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {(form.positionen ?? []).map((pos, i) => (
                      <tr key={i} className="border-t border-[#2d3144]">
                        <td className="px-2 py-1.5">
                          <input value={pos.beschreibung} onChange={e => setPos(i, 'beschreibung', e.target.value)}
                            className="w-full bg-transparent text-white text-sm outline-none focus:bg-[#0f1117] rounded px-1 py-0.5" placeholder="Beschreibe die erbrachte Leistung." />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={pos.menge} onChange={e => setPos(i, 'menge', e.target.value)}
                            className="w-full bg-transparent text-white text-sm text-right outline-none focus:bg-[#0f1117] rounded px-1 py-0.5" min="0" step="0.5" />
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={pos.einheit} onChange={e => setPos(i, 'einheit', e.target.value)}
                            className="w-full bg-transparent text-slate-300 text-sm outline-none focus:bg-[#0f1117] rounded px-1 py-0.5">
                            <option>Stunden</option>
                            <option>Stück</option>
                            <option>Pauschal</option>
                            <option>Tage</option>
                            <option>Monate</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={pos.einzelpreis} onChange={e => setPos(i, 'einzelpreis', e.target.value)}
                            className="w-full bg-transparent text-white text-sm text-right outline-none focus:bg-[#0f1117] rounded px-1 py-0.5" min="0" step="0.01" />
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-300 font-medium whitespace-nowrap">
                          {pos.total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="pr-2">
                          <button type="button" onClick={() => removeRow(i)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                            <X size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-3 ml-auto w-64 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Zwischensumme</span>
                  <span>CHF {zwischensumme.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>MwSt. {form.mwst_satz ?? MWST}%</span>
                  <span>CHF {mwst_betrag.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-[#2d3144] pt-2">
                  <span>Gesamtbetrag</span>
                  <span>CHF {gesamtbetrag.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Notizen */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notizen / Zahlungsinformationen</label>
              <textarea value={form.notizen ?? ''} onChange={e => setField('notizen', e.target.value)} rows={2}
                className={inputCls + ' resize-none'}
                placeholder="IBAN: CH00 0000 0000 0000 0000 0&#10;Bank: Raiffeisen Schweiz" />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#2d3144] flex-shrink-0 bg-[#1a1d27] sticky bottom-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-[#2d3144] hover:border-slate-500 transition-colors">
              Abbrechen
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white transition-colors">
              {saving ? 'Ich speichere die Rechnung.' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function RechnungenPage() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [kunden, setKunden]         = useState<Kunde[]>([]);
  const [projekte, setProjekte]     = useState<Projekt[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [typFilter, setTypFilter]   = useState<RechnungTyp | 'alle'>('alle');
  const [modal, setModal]           = useState<Partial<Rechnung> | false>(false);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const [{ data: r }, { data: k }, { data: p }] = await Promise.all([
      sb.from('rechnungen').select('*, kunden(id,kontaktperson,firmenname,email)').order('created_at', { ascending: false }),
      sb.from('kunden').select('id,kontaktperson,firmenname,email').order('kontaktperson'),
      sb.from('projekte').select('id,name,farbe').order('name'),
    ]);
    setRechnungen((r ?? []) as Rechnung[]);
    setKunden((k ?? []) as Kunde[]);
    setProjekte((p ?? []) as Projekt[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Rechnung wirklich löschen?')) return;
    await createClient().from('rechnungen').delete().eq('id', id);
    load();
  }

  async function handleStatusChange(id: string, status: RechnungStatus) {
    const update: Record<string, any> = { status };
    if (status === 'bezahlt') update.bezahlt_am = new Date().toISOString().slice(0, 10);
    await createClient().from('rechnungen').update(update).eq('id', id);
    load();
  }

  function getNextNr() {
    const year = new Date().getFullYear();
    const prefix = `RE-${year}-`;
    const existing = rechnungen
      .filter(r => r.rechnungsnummer.startsWith(prefix))
      .map(r => parseInt(r.rechnungsnummer.replace(prefix, ''), 10))
      .filter(n => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
  }

  const filtered = rechnungen.filter(r => {
    const matchSearch = !search || [r.rechnungsnummer, r.kunden?.firmenname, r.kunden?.kontaktperson].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchTyp    = typFilter === 'alle' || r.typ === typFilter;
    return matchSearch && matchTyp;
  });

  // Stats
  const totalGesendet    = rechnungen.filter(r => r.typ === 'rechnung' && r.status !== 'storniert').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);
  const totalBezahlt     = rechnungen.filter(r => r.status === 'bezahlt').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);
  const totalAusstehend  = rechnungen.filter(r => r.status === 'gesendet').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);
  const totalUeberfaellig = rechnungen.filter(r => r.status === 'ueberfaellig').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Rechnungen & Angebote</h1>
          <p className="text-sm text-slate-400 mt-0.5">{rechnungen.length} Dokumente</p>
        </div>
        <button onClick={() => setModal(EMPTY_RECHNUNG())}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Neu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gesamt fakturiert', value: totalGesendet,     color: 'text-white' },
          { label: 'Bezahlt',           value: totalBezahlt,      color: 'text-green-400' },
          { label: 'Ausstehend',        value: totalAusstehend,   color: 'text-blue-400' },
          { label: 'Überfällig',        value: totalUeberfaellig, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1a1d27] border border-[#2d3144] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{formatCHF(stat.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Nummer oder Kunde."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1d27] border border-[#2d3144] focus:border-[#6366f1] outline-none text-white text-sm placeholder-slate-500 transition-colors" />
        </div>
        {(['alle', 'rechnung', 'angebot', 'mahnung'] as const).map(t => (
          <button key={t} onClick={() => setTypFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typFilter === t ? 'bg-[#6366f1] text-white' : 'bg-[#1a1d27] border border-[#2d3144] text-slate-400 hover:text-white'}`}>
            {t === 'alle' ? 'Alle' : TYP_CFG[t].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Die Rechnungen werden geladen.</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">Noch keine Rechnungen.</p>
            <button onClick={() => setModal(EMPTY_RECHNUNG())} className="mt-4 text-[#6366f1] text-sm hover:underline">
              + Erste Rechnung erstellen
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3144] text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Nummer / Typ</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Kunde</th>
                <th className="text-right px-4 py-3">Betrag</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Ausgestellt</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Fällig</th>
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const StatusIcon = STATUS_CFG[r.status].icon;
                const isOverdue = r.status === 'gesendet' && r.faellig_am && new Date(r.faellig_am) < new Date();
                return (
                  <tr key={r.id} className="border-b border-[#2d3144]/50 hover:bg-[#252836] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-mono text-white text-sm">{r.rechnungsnummer}</div>
                      <div className={`text-xs font-medium ${TYP_CFG[r.typ].cls}`}>{TYP_CFG[r.typ].label}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-300">
                      {r.kunden?.firmenname || r.kunden?.kontaktperson || 'Keine Angabe.'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-white">{formatCHF(r.gesamtbetrag)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue ? STATUS_CFG['ueberfaellig'].cls : STATUS_CFG[r.status].cls}`}>
                        <StatusIcon size={10} />
                        {isOverdue ? 'Überfällig' : STATUS_CFG[r.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500">{formatDate(r.ausgestellt_am)}</td>
                    <td className={`px-4 py-3 hidden lg:table-cell text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                      {formatDate(r.faellig_am)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* PDF */}
                        <a href={`/dashboard/rechnungen/${r.id}/print`} target="_blank" rel="noopener"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors" title="PDF anzeigen">
                          <Eye size={14} />
                        </a>
                        {/* Status: Gesendet */}
                        {r.status === 'entwurf' && (
                          <button onClick={() => handleStatusChange(r.id, 'gesendet')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Als gesendet markieren">
                            <Send size={14} />
                          </button>
                        )}
                        {/* Status: Bezahlt */}
                        {(r.status === 'gesendet' || r.status === 'ueberfaellig') && (
                          <button onClick={() => handleStatusChange(r.id, 'bezahlt')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-400/10 transition-colors" title="Als bezahlt markieren">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {/* Edit */}
                        <button onClick={() => setModal(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors">
                          <Pencil size={14} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal !== false && (
        <RechnungModal
          rechnung={modal}
          kunden={kunden}
          projekte={projekte}
          nextNr={getNextNr()}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
