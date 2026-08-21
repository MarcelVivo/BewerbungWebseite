'use client';

import { useEffect, useState, FormEvent, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Rechnung, RechnungPosition, RechnungStatus, RechnungTyp, Kunde, Projekt } from '@/lib/types';
import { Plus, X, Pencil, Trash2, FileText, Send, CheckCircle, Eye, Search, AlertCircle } from 'lucide-react';
import { Modal, Input, Textarea, Select, Button, Badge, Card, PageHeader, EmptyState } from '@/components/dashboard/ui';

// ── Config ────────────────────────────────────────────────

const STATUS_CFG: Record<RechnungStatus, { label: string; variant: 'neutral' | 'info' | 'success' | 'danger'; icon: React.ElementType }> = {
  entwurf:      { label: 'Entwurf',     variant: 'neutral', icon: FileText },
  gesendet:     { label: 'Gesendet',    variant: 'info',    icon: Send },
  bezahlt:      { label: 'Bezahlt',     variant: 'success', icon: CheckCircle },
  ueberfaellig: { label: 'Überfällig',  variant: 'danger',  icon: AlertCircle },
  storniert:    { label: 'Storniert',   variant: 'neutral', icon: X },
};

const TYP_CFG: Record<RechnungTyp, { label: string; cls: string }> = {
  angebot:  { label: 'Angebot',  cls: 'text-sky-400' },
  rechnung: { label: 'Rechnung', cls: 'text-dash-gold' },
  mahnung:  { label: 'Mahnung',  cls: 'text-amber-400' },
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

const EMPTY_RECHNUNG = (prefill?: { kunden_id?: string; projekt_id?: string }): Partial<Rechnung> => ({
  typ: 'rechnung',
  status: 'entwurf',
  ausgestellt_am: new Date().toISOString().slice(0, 10),
  faellig_am: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  mwst_satz: MWST,
  zahlungskonditionen: '30 Tage netto',
  positionen: [{ ...EMPTY_POSITION }],
  notizen: '',
  kunden_id: prefill?.kunden_id,
  projekt_id: prefill?.projekt_id,
});

function RechnungModal({ rechnung, kunden, projekte, nextNr, onClose, onSaved }: {
  rechnung: Partial<Rechnung>;
  kunden: Kunde[];
  projekte: Projekt[];
  nextNr: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Rechnung>>({ rechnungsnummer: nextNr, ...rechnung });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const isEdit                = !!form.id;

  function setField(field: keyof Rechnung, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setPos(idx: number, field: keyof RechnungPosition, value: any) {
    setForm((f) => {
      const pos = [...(f.positionen ?? [])];
      pos[idx] = { ...pos[idx], [field]: value };
      if (field === 'menge' || field === 'einzelpreis') {
        pos[idx].total = Number(pos[idx].menge) * Number(pos[idx].einzelpreis);
      }
      return { ...f, positionen: pos };
    });
  }

  function addRow() {
    setForm((f) => ({ ...f, positionen: [...(f.positionen ?? []), { ...EMPTY_POSITION }] }));
  }

  function removeRow(idx: number) {
    setForm((f) => ({ ...f, positionen: (f.positionen ?? []).filter((_, i) => i !== idx) }));
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

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? 'Rechnung bearbeiten' : 'Neue Rechnung / Angebot'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" type="submit" form="rechnung-form" loading={saving}>Speichern</Button>
        </>
      }
    >
      <form id="rechnung-form" onSubmit={handleSubmit} className="space-y-6">
        {!form.kunden_id && (
          <Badge variant="neutral">Kein Kunde verknüpft – wird als Alleingang geführt</Badge>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Select label="Typ" value={form.typ ?? 'rechnung'} onChange={(e) => setField('typ', e.target.value)}>
            <option value="rechnung">Rechnung</option>
            <option value="angebot">Angebot</option>
            <option value="mahnung">Mahnung</option>
          </Select>
          <Input label="Nummer" value={form.rechnungsnummer ?? ''} onChange={(e) => setField('rechnungsnummer', e.target.value)} />
          <Select label="Status" value={form.status ?? 'entwurf'} onChange={(e) => setField('status', e.target.value)}>
            {(Object.keys(STATUS_CFG) as RechnungStatus[]).map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Kunde" value={form.kunden_id ?? ''} onChange={(e) => setField('kunden_id', e.target.value || undefined)}>
            <option value="">Kein Kunde.</option>
            {kunden.map((k) => <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>)}
          </Select>
          <Select label="Projekt" value={form.projekt_id ?? ''} onChange={(e) => setField('projekt_id', e.target.value || undefined)}>
            <option value="">Kein Projekt.</option>
            {projekte.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label="Ausgestellt am" type="date" value={form.ausgestellt_am ?? ''} onChange={(e) => setField('ausgestellt_am', e.target.value)} className="[color-scheme:dark]" />
          <Input label="Fällig am" type="date" value={form.faellig_am ?? ''} onChange={(e) => setField('faellig_am', e.target.value)} className="[color-scheme:dark]" />
          <Input label="Zahlungskonditionen" value={form.zahlungskonditionen ?? ''} onChange={(e) => setField('zahlungskonditionen', e.target.value)} placeholder="30 Tage netto" />
        </div>

        {/* Positionen */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-dash-textDim font-semibold uppercase tracking-wide">Positionen</label>
            <button type="button" onClick={addRow} className="text-xs text-dash-gold hover:underline flex items-center gap-1">
              <Plus size={12} /> Zeile
            </button>
          </div>
          <div className="rounded-lg border border-dash-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dash-surfaceAlt text-xs text-dash-textDim uppercase tracking-wide">
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
                  <tr key={i} className="border-t border-dash-border">
                    <td className="px-2 py-1.5">
                      <input value={pos.beschreibung} onChange={(e) => setPos(i, 'beschreibung', e.target.value)}
                        className="w-full bg-transparent text-dash-textBright text-sm outline-none focus:bg-dash-bg rounded px-1 py-0.5" placeholder="Beschreibe die erbrachte Leistung." />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={pos.menge} onChange={(e) => setPos(i, 'menge', e.target.value)}
                        className="w-full bg-transparent text-dash-textBright text-sm text-right outline-none focus:bg-dash-bg rounded px-1 py-0.5" min="0" step="0.5" />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={pos.einheit} onChange={(e) => setPos(i, 'einheit', e.target.value)}
                        className="w-full bg-transparent text-dash-textSubtle text-sm outline-none focus:bg-dash-bg rounded px-1 py-0.5">
                        <option>Stunden</option>
                        <option>Stück</option>
                        <option>Pauschal</option>
                        <option>Tage</option>
                        <option>Monate</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={pos.einzelpreis} onChange={(e) => setPos(i, 'einzelpreis', e.target.value)}
                        className="w-full bg-transparent text-dash-textBright text-sm text-right outline-none focus:bg-dash-bg rounded px-1 py-0.5" min="0" step="0.01" />
                    </td>
                    <td className="px-3 py-1.5 text-right text-dash-textSubtle font-medium whitespace-nowrap">
                      {pos.total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="pr-2">
                      <button type="button" onClick={() => removeRow(i)} className="p-1 text-dash-textDim hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 ml-auto w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-dash-textMuted">
              <span>Zwischensumme</span>
              <span>CHF {zwischensumme.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-dash-textMuted">
              <span>MwSt. {form.mwst_satz ?? MWST}%</span>
              <span>CHF {mwst_betrag.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-dash-textBright border-t border-dash-border pt-2">
              <span>Gesamtbetrag</span>
              <span>CHF {gesamtbetrag.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <Textarea label="Notizen / Zahlungsinformationen" rows={2} value={form.notizen ?? ''} onChange={(e) => setField('notizen', e.target.value)} placeholder="IBAN: CH00 0000 0000 0000 0000 0&#10;Bank: Raiffeisen Schweiz" />

        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function RechnungenPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto text-dash-textMuted text-sm">Die Rechnungen werden geladen.</div>}>
      <RechnungenPageInner />
    </Suspense>
  );
}

function RechnungenPageInner() {
  const searchParams = useSearchParams();
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [kunden, setKunden]         = useState<Kunde[]>([]);
  const [projekte, setProjekte]     = useState<Projekt[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [typFilter, setTypFilter]   = useState<RechnungTyp | 'alle'>('alle');
  const [modal, setModal]           = useState<Partial<Rechnung> | false>(false);
  const [prefillHandled, setPrefillHandled] = useState(false);

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

  useEffect(() => {
    if (prefillHandled || loading) return;
    const kundeId = searchParams.get('kunde');
    const projektId = searchParams.get('projekt');
    if (kundeId || projektId) {
      setModal(EMPTY_RECHNUNG({ kunden_id: kundeId || undefined, projekt_id: projektId || undefined }));
    }
    setPrefillHandled(true);
  }, [searchParams, prefillHandled, loading]);

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
      .filter((r) => r.rechnungsnummer.startsWith(prefix))
      .map((r) => parseInt(r.rechnungsnummer.replace(prefix, ''), 10))
      .filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
  }

  const filtered = rechnungen.filter((r) => {
    const matchSearch = !search || [r.rechnungsnummer, r.kunden?.firmenname, r.kunden?.kontaktperson].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchTyp    = typFilter === 'alle' || r.typ === typFilter;
    return matchSearch && matchTyp;
  });

  const totalGesendet    = rechnungen.filter((r) => r.typ === 'rechnung' && r.status !== 'storniert').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);
  const totalBezahlt     = rechnungen.filter((r) => r.status === 'bezahlt').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);
  const totalAusstehend  = rechnungen.filter((r) => r.status === 'gesendet').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);
  const totalUeberfaellig = rechnungen.filter((r) => r.status === 'ueberfaellig').reduce((s, r) => s + (r.gesamtbetrag ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Rechnungen & Angebote"
        subtitle={`${rechnungen.length} Dokumente`}
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModal(EMPTY_RECHNUNG())}>Neu</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gesamt fakturiert', value: totalGesendet,     cls: 'text-dash-textBright' },
          { label: 'Bezahlt',           value: totalBezahlt,      cls: 'text-green-400' },
          { label: 'Ausstehend',        value: totalAusstehend,   cls: 'text-sky-400' },
          { label: 'Überfällig',        value: totalUeberfaellig, cls: 'text-red-400' },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <p className="text-xs text-dash-textDim mb-1">{stat.label}</p>
            <p className={`text-xl font-display ${stat.cls}`}>{formatCHF(stat.value)}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-textDim" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche nach Nummer oder Kunde." className="pl-9" />
        </div>
        {(['alle', 'rechnung', 'angebot', 'mahnung'] as const).map((t) => (
          <button key={t} onClick={() => setTypFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typFilter === t ? 'bg-dash-gold text-dash-bg' : 'bg-dash-surface border border-dash-border text-dash-textMuted hover:text-dash-textBright'}`}>
            {t === 'alle' ? 'Alle' : TYP_CFG[t].label}
          </button>
        ))}
      </div>

      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-dash-textMuted text-sm">Die Rechnungen werden geladen.</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FileText size={32} />} title="Noch keine Rechnungen." action={<button onClick={() => setModal(EMPTY_RECHNUNG())} className="text-dash-gold text-sm hover:underline">+ Erste Rechnung erstellen</button>} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border text-xs text-dash-textDim uppercase tracking-wide">
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
              {filtered.map((r) => {
                const StatusIcon = STATUS_CFG[r.status].icon;
                const isOverdue = r.status === 'gesendet' && r.faellig_am && new Date(r.faellig_am) < new Date();
                return (
                  <tr key={r.id} className="border-b border-dash-border/60 last:border-0 hover:bg-dash-surfaceAlt transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-mono text-dash-textBright text-sm">{r.rechnungsnummer}</div>
                      <div className={`text-xs font-medium ${TYP_CFG[r.typ].cls}`}>{TYP_CFG[r.typ].label}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-dash-textSubtle">
                      {r.kunden?.firmenname || r.kunden?.kontaktperson || <span className="text-dash-textDim italic">Kein Kunde verknüpft</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-dash-textBright">{formatCHF(r.gesamtbetrag)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isOverdue ? 'danger' : STATUS_CFG[r.status].variant}>
                        <StatusIcon size={10} /> {isOverdue ? 'Überfällig' : STATUS_CFG[r.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-dash-textDim">{formatDate(r.ausgestellt_am)}</td>
                    <td className={`px-4 py-3 hidden lg:table-cell text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-dash-textDim'}`}>
                      {formatDate(r.faellig_am)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`/dashboard/rechnungen/${r.id}/print`} target="_blank" rel="noopener"
                          className="p-1.5 rounded-lg text-dash-textDim hover:text-dash-textBright hover:bg-dash-border/40 transition-colors" title="PDF anzeigen">
                          <Eye size={14} />
                        </a>
                        {r.status === 'entwurf' && (
                          <button onClick={() => handleStatusChange(r.id, 'gesendet')}
                            className="p-1.5 rounded-lg text-dash-textDim hover:text-sky-400 hover:bg-sky-400/10 transition-colors" title="Als gesendet markieren">
                            <Send size={14} />
                          </button>
                        )}
                        {(r.status === 'gesendet' || r.status === 'ueberfaellig') && (
                          <button onClick={() => handleStatusChange(r.id, 'bezahlt')}
                            className="p-1.5 rounded-lg text-dash-textDim hover:text-green-400 hover:bg-green-400/10 transition-colors" title="Als bezahlt markieren">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => setModal(r)} className="p-1.5 rounded-lg text-dash-textDim hover:text-dash-textBright hover:bg-dash-border/40 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-dash-textDim hover:text-red-400 hover:bg-red-400/10 transition-colors">
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
      </Card>

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
