'use client';

import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, FileSignature, Send, CheckCircle2,
  Pencil, Trash2, Search, AlertCircle,
} from 'lucide-react';
import { Kunde, Projekt } from '@/lib/types';
import { Modal, Input, Textarea, Select, Button, Badge, Card, PageHeader, EmptyState } from '@/components/dashboard/ui';

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

const STATUS_CFG: Record<VertragStatus, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning'; Icon: React.ElementType; next?: VertragStatus }> = {
  entwurf:       { label: 'Entwurf',       variant: 'neutral', Icon: FileSignature, next: 'gesendet' },
  gesendet:      { label: 'Gesendet',      variant: 'info',    Icon: Send,          next: 'unterzeichnet' },
  unterzeichnet: { label: 'Unterzeichnet', variant: 'success', Icon: CheckCircle2 },
  abgelaufen:    { label: 'Abgelaufen',    variant: 'warning', Icon: AlertCircle },
};

const TEMPLATE_CFG: Record<TemplateTyp, string> = {
  beratung:  'Beratungsvertrag',
  workshop:  'Workshop-Vertrag',
  umsetzung: 'Umsetzungsvertrag',
  custom:    'Individuell',
};

function formatDate(iso?: string | null) {
  if (!iso) return 'Keine Angabe.';
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

  function set(k: keyof Vertrag, v: unknown) { setForm((f) => ({ ...f, [k]: v })); }

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
    <Modal
      onClose={onClose}
      title={isEdit ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}
      size="lg"
      footer={
        <div className="w-full flex items-center justify-between">
          {isEdit
            ? <Button variant="danger" type="button" icon={<Trash2 size={14} />} onClick={handleDelete}>Löschen</Button>
            : <div />}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>Abbrechen</Button>
            <Button variant="primary" type="submit" form="vertrag-form" loading={saving}>Speichern</Button>
          </div>
        </div>
      }
    >
      <div className="flex border-b border-dash-border -mt-2 mb-4">
        {(['info', 'inhalt'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'text-dash-gold border-b-2 border-dash-gold -mb-px' : 'text-dash-textMuted hover:text-dash-textBright'
            }`}>
            {t === 'info' ? 'Informationen' : 'Vertragstext'}
          </button>
        ))}
      </div>

      <form id="vertrag-form" onSubmit={handleSubmit}>
        {tab === 'info' ? (
          <div className="space-y-4">
            <Input label="Titel" required value={form.titel || ''} onChange={(e) => set('titel', e.target.value)} placeholder="z.B. Beratungsvertrag Q3 2026" />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Kunde" value={form.kunden_id || ''} onChange={(e) => set('kunden_id', e.target.value || undefined)}>
                <option value="">Kein Kunde.</option>
                {kunden.map((k) => (
                  <option key={k.id} value={k.id}>{k.firmenname ? `${k.firmenname}. ${k.kontaktperson}.` : k.kontaktperson}</option>
                ))}
              </Select>
              <Select label="Projekt" value={form.projekt_id || ''} onChange={(e) => set('projekt_id', e.target.value || undefined)} hint={!form.projekt_id ? 'Ohne Projekt bleibt der Vertrag als Alleingang markiert.' : undefined}>
                <option value="">Kein Projekt.</option>
                {projekte.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Vorlage" value={form.template_typ || ''} onChange={(e) => set('template_typ', e.target.value || undefined)}>
                <option value="">Bitte wählen.</option>
                {(Object.keys(TEMPLATE_CFG) as TemplateTyp[]).map((k) => <option key={k} value={k}>{TEMPLATE_CFG[k]}</option>)}
              </Select>
              <Select label="Status" value={form.status || 'entwurf'} onChange={(e) => set('status', e.target.value)}>
                {(Object.keys(STATUS_CFG) as VertragStatus[]).map((k) => <option key={k} value={k}>{STATUS_CFG[k].label}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Gültig bis" type="date" value={form.gueltig_bis || ''} onChange={(e) => set('gueltig_bis', e.target.value || undefined)} className="[color-scheme:dark]" />
              <Input label="Unterzeichnet am" type="date" value={form.unterzeichnet_am ? form.unterzeichnet_am.slice(0, 10) : ''} onChange={(e) => set('unterzeichnet_am', e.target.value || undefined)} className="[color-scheme:dark]" />
            </div>
          </div>
        ) : (
          <Textarea label="Vertragstext" rows={18} value={form.inhalt || ''} onChange={(e) => set('inhalt', e.target.value)} placeholder="Gib hier den vollständigen Vertragstext ein." className="font-mono text-xs" />
        )}
        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </form>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function VertragePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto text-dash-textMuted text-sm">Die Verträge werden geladen.</div>}>
      <VertragePageInner />
    </Suspense>
  );
}

function VertragePageInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [vertraege, setVertraege]   = useState<Vertrag[]>([]);
  const [kunden, setKunden]         = useState<Kunde[]>([]);
  const [projekte, setProjekte]     = useState<Projekt[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<Partial<Vertrag> | null>(null);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState<VertragStatus | ''>('');
  const [prefillHandled, setPrefillHandled] = useState(false);

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

  // Geführt, aber flexibel: aus der Kundenkartei verlinkt (?kunde=...) öffnet
  // sich das Erstellen-Formular direkt vorausgefüllt, statt den Kunden erneut
  // manuell auswählen zu müssen.
  useEffect(() => {
    if (prefillHandled || loading) return;
    const kundeId = searchParams.get('kunde');
    const projektId = searchParams.get('projekt');
    if (kundeId || projektId) {
      setModal({ status: 'entwurf', kunden_id: kundeId || undefined, projekt_id: projektId || undefined });
    }
    setPrefillHandled(true);
  }, [searchParams, prefillHandled, loading]);

  async function advanceStatus(v: Vertrag) {
    const next = STATUS_CFG[v.status].next;
    if (!next) return;
    const extra = next === 'unterzeichnet' ? { unterzeichnet_am: new Date().toISOString() } : {};
    await supabase.from('vertraege').update({ status: next, ...extra }).eq('id', v.id);
    load();
  }

  const filtered = vertraege.filter((v) =>
    (v.titel.toLowerCase().includes(search.toLowerCase()) ||
     (v.kunden?.kontaktperson || '').toLowerCase().includes(search.toLowerCase()) ||
     (v.kunden?.firmenname || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || v.status === filterStatus)
  );

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Verträge"
        subtitle="Verträge erstellen, versenden und unterzeichnen"
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModal({ status: 'entwurf' })}>Neuer Vertrag</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gesamt',        value: vertraege.length,                                         cls: 'text-dash-textBright' },
          { label: 'Entwürfe',      value: vertraege.filter((v) => v.status === 'entwurf').length,     cls: 'text-dash-textMuted' },
          { label: 'Unterzeichnet', value: vertraege.filter((v) => v.status === 'unterzeichnet').length, cls: 'text-green-400' },
          { label: 'Läuft ab (<14 Tage)', value: vertraege.filter((v) => isExpiringSoon(v.gueltig_bis)).length,
            cls: vertraege.filter((v) => isExpiringSoon(v.gueltig_bis)).length > 0 ? 'text-amber-400' : 'text-dash-textMuted' },
        ].map((s) => (
          <Card key={s.label} padding="sm">
            <p className="text-dash-textDim text-xs mb-1">{s.label}</p>
            <p className={`font-display text-2xl ${s.cls}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-textDim" />
          <Input placeholder="Suche nach Titel oder Kunde." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilter(e.target.value as VertragStatus | '')} className="sm:w-52">
          <option value="">Alle Status</option>
          {(Object.keys(STATUS_CFG) as VertragStatus[]).map((k) => <option key={k} value={k}>{STATUS_CFG[k].label}</option>)}
        </Select>
      </div>

      {loading ? (
        <div className="text-dash-textMuted text-sm">Die Verträge werden geladen.</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileSignature size={32} />} title="Noch keine Verträge." action={<button onClick={() => setModal({ status: 'entwurf' })} className="text-dash-gold text-sm hover:underline">Ersten Vertrag erstellen</button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const cfg  = STATUS_CFG[v.status];
            const Icon = cfg.Icon;
            const expiring = isExpiringSoon(v.gueltig_bis);
            const expired  = isExpired(v.gueltig_bis, v.status);
            return (
              <Card key={v.id} padding="md" interactive>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-dash-textBright font-semibold truncate">{v.titel}</h3>
                    <p className="text-dash-textMuted text-sm mt-0.5">
                      {v.kunden?.firmenname || v.kunden?.kontaktperson || 'Kein Kunde'}
                      {v.projekte && <span className="text-dash-textDim"> · {v.projekte.name}</span>}
                    </p>
                  </div>
                  <Badge variant={cfg.variant} className="ml-3 flex-shrink-0"><Icon size={12} /> {cfg.label}</Badge>
                </div>

                {!v.projekt_id && <Badge variant="neutral" className="mb-3">Kein Projekt verknüpft</Badge>}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-textDim mb-4">
                  {v.template_typ && <span className="text-dash-gold">{TEMPLATE_CFG[v.template_typ]}</span>}
                  <span>Erstellt {formatDate(v.created_at)}</span>
                  {v.gueltig_bis && (
                    <span className={expiring ? 'text-amber-400 font-medium' : expired ? 'text-red-400' : ''}>
                      {expiring ? '⚠ Läuft ab ' : 'Bis '}{formatDate(v.gueltig_bis)}
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
                            v.status === s ? 'bg-dash-gold' : statusOrder > i ? 'bg-green-500' : 'bg-dash-border'
                          }`} />
                          {i < 3 && <div className="w-4 h-px bg-dash-border" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    {cfg.next && (
                      <button onClick={() => advanceStatus(v)}
                        className="px-3 py-1.5 bg-dash-gold/15 hover:bg-dash-gold/25 text-dash-gold rounded-lg text-xs font-medium transition-colors">
                        → {STATUS_CFG[cfg.next].label}
                      </button>
                    )}
                    <button onClick={() => setModal(v)} className="p-1.5 rounded-lg text-dash-textDim hover:text-dash-textBright hover:bg-dash-border/40 transition-colors">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              </Card>
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
