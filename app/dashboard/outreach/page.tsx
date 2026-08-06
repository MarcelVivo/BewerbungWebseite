'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, X, ExternalLink, Mail, Phone, Users, MessageSquare,
  Search, Pencil, Trash2,
} from 'lucide-react';
import { Kunde } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────

type Kanal        = 'linkedin' | 'email' | 'telefon' | 'event';
type KontaktTyp   = 'erstkontakt' | 'follow_up' | 'angebot' | 'abschluss';
type Ergebnis     = 'kein_interesse' | 'interessiert' | 'termin' | 'angebot';

interface Outreach {
  id: string;
  kunden_id?: string;
  kanal?: Kanal;
  kontakt_typ?: KontaktTyp;
  notiz?: string;
  ergebnis?: Ergebnis;
  naechste_aktion?: string;
  created_at: string;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname'>;
}

// ── Config ─────────────────────────────────────────────────

const KANAL_CFG: Record<Kanal, { label: string; cls: string; Icon: React.ElementType }> = {
  linkedin: { label: 'LinkedIn', cls: 'bg-blue-900/50 text-blue-300', Icon: ExternalLink },
  email:    { label: 'E-Mail',   cls: 'bg-indigo-900/50 text-indigo-300', Icon: Mail },
  telefon:  { label: 'Telefon',  cls: 'bg-green-900/50 text-green-300', Icon: Phone },
  event:    { label: 'Event',    cls: 'bg-purple-900/50 text-purple-300', Icon: Users },
};

const KONTAKT_CFG: Record<KontaktTyp, { label: string; cls: string }> = {
  erstkontakt: { label: 'Erstkontakt', cls: 'text-slate-400' },
  follow_up:   { label: 'Follow-up',   cls: 'text-yellow-400' },
  angebot:     { label: 'Angebot',     cls: 'text-blue-400' },
  abschluss:   { label: 'Abschluss',   cls: 'text-green-400' },
};

const ERGEBNIS_CFG: Record<Ergebnis, { label: string; cls: string }> = {
  kein_interesse: { label: 'Kein Interesse', cls: 'bg-red-900/40 text-red-300' },
  interessiert:   { label: 'Interessiert',   cls: 'bg-yellow-900/40 text-yellow-300' },
  termin:         { label: 'Termin vereinbart', cls: 'bg-blue-900/40 text-blue-300' },
  angebot:        { label: 'Angebot läuft',  cls: 'bg-green-900/40 text-green-300' },
};

function formatDate(iso?: string | null) {
  if (!iso) return 'Keine Angabe.';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(date?: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

// ── Modal ──────────────────────────────────────────────────

interface ModalProps {
  entry: Partial<Outreach>;
  kunden: Kunde[];
  onClose: () => void;
  onSaved: () => void;
}

function OutreachModal({ entry, kunden, onClose, onSaved }: ModalProps) {
  const supabase = createClient();
  const [form, setForm] = useState<Partial<Outreach>>(entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!entry.id;

  function set(k: keyof Outreach, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      kunden_id:      form.kunden_id || null,
      kanal:          form.kanal || null,
      kontakt_typ:    form.kontakt_typ || null,
      notiz:          form.notiz || null,
      ergebnis:       form.ergebnis || null,
      naechste_aktion: form.naechste_aktion || null,
    };
    const { error: err } = isEdit
      ? await supabase.from('outreach').update(payload).eq('id', entry.id!)
      : await supabase.from('outreach').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!isEdit || !confirm('Eintrag wirklich löschen?')) return;
    await supabase.from('outreach').delete().eq('id', entry.id!);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2d3144]">
          <h2 className="text-white font-semibold text-lg">
            {isEdit ? 'Outreach bearbeiten' : 'Neuer Outreach'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Kunde</label>
            <select
              value={form.kunden_id || ''}
              onChange={e => set('kunden_id', e.target.value || undefined)}
              className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Kein Kunde.</option>
              {kunden.map(k => (
                <option key={k.id} value={k.id}>
                  {k.firmenname ? `${k.firmenname}. ${k.kontaktperson}.` : k.kontaktperson}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Kanal</label>
              <select
                value={form.kanal || ''}
                onChange={e => set('kanal', e.target.value || undefined)}
                className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Bitte wählen.</option>
                {(Object.keys(KANAL_CFG) as Kanal[]).map(k => (
                  <option key={k} value={k}>{KANAL_CFG[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Typ</label>
              <select
                value={form.kontakt_typ || ''}
                onChange={e => set('kontakt_typ', e.target.value || undefined)}
                className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Bitte wählen.</option>
                {(Object.keys(KONTAKT_CFG) as KontaktTyp[]).map(k => (
                  <option key={k} value={k}>{KONTAKT_CFG[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Ergebnis</label>
            <select
              value={form.ergebnis || ''}
              onChange={e => set('ergebnis', e.target.value || undefined)}
              className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Noch offen.</option>
              {(Object.keys(ERGEBNIS_CFG) as Ergebnis[]).map(k => (
                <option key={k} value={k}>{ERGEBNIS_CFG[k].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Nächste Aktion</label>
            <input
              type="date"
              value={form.naechste_aktion || ''}
              onChange={e => set('naechste_aktion', e.target.value || undefined)}
              className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Notiz</label>
            <textarea
              rows={3}
              value={form.notiz || ''}
              onChange={e => set('notiz', e.target.value)}
              placeholder="Was wurde besprochen?"
              className="w-full bg-[#2d3144] border border-[#3d4460] rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              <button type="button" onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm">
                <Trash2 size={14} /> Löschen
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm">
                Abbrechen
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-ms-500 hover:bg-ms-600 text-white rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Ich speichere den Eintrag.' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function OutreachPage() {
  const supabase = createClient();
  const [entries, setEntries]   = useState<Outreach[]>([]);
  const [kunden, setKunden]     = useState<Kunde[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<Partial<Outreach> | null>(null);
  const [search, setSearch]     = useState('');
  const [filterKanal, setFilter] = useState<Kanal | ''>('');

  async function load() {
    setLoading(true);
    const [{ data: oe }, { data: ke }] = await Promise.all([
      supabase.from('outreach').select('*, kunden(id,kontaktperson,firmenname)').order('created_at', { ascending: false }),
      supabase.from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson'),
    ]);
    setEntries((oe as Outreach[]) || []);
    setKunden((ke as Kunde[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = entries.filter(e => {
    const name = e.kunden?.firmenname || e.kunden?.kontaktperson || '';
    const matches = (e.notiz || '').toLowerCase().includes(search.toLowerCase())
      || name.toLowerCase().includes(search.toLowerCase());
    const kanalOk = !filterKanal || e.kanal === filterKanal;
    return matches && kanalOk;
  });

  const overdue = entries.filter(e => isOverdue(e.naechste_aktion) && !e.ergebnis).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach</h1>
          <p className="text-slate-400 text-sm mt-0.5">Kontaktaktivitäten verwalten & nachverfolgen</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-2 bg-ms-500 hover:bg-ms-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Neuer Kontakt
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt', value: entries.length, cls: 'text-white' },
          { label: 'Offen', value: entries.filter(e => !e.ergebnis).length, cls: 'text-yellow-400' },
          { label: 'Termine', value: entries.filter(e => e.ergebnis === 'termin').length, cls: 'text-blue-400' },
          { label: 'Überfällig', value: overdue, cls: overdue > 0 ? 'text-red-400' : 'text-slate-400' },
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
          <input
            type="text"
            placeholder="Suche nach einer Notiz oder einem Kunden."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1e2235] border border-[#2d3144] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-500 focus:border-ms-500 outline-none"
          />
        </div>
        <select
          value={filterKanal}
          onChange={e => setFilter(e.target.value as Kanal | '')}
          className="bg-[#1e2235] border border-[#2d3144] rounded-xl px-3 py-2.5 text-white text-sm"
        >
          <option value="">Alle Kanäle</option>
          {(Object.keys(KANAL_CFG) as Kanal[]).map(k => (
            <option key={k} value={k}>{KANAL_CFG[k].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-slate-400 text-sm">Die Daten werden geladen.</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Noch keine Outreach-Einträge</p>
          <button onClick={() => setModal({})}
            className="mt-4 text-ms-400 text-sm hover:underline">Ersten Kontakt erfassen</button>
        </div>
      ) : (
        <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3144]">
                {['Datum', 'Kunde', 'Kanal', 'Typ', 'Ergebnis', 'Nächste Aktion', ''].map(h => (
                  <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const kanal   = e.kanal   ? KANAL_CFG[e.kanal]     : null;
                const typ     = e.kontakt_typ ? KONTAKT_CFG[e.kontakt_typ] : null;
                const ergebnis = e.ergebnis ? ERGEBNIS_CFG[e.ergebnis] : null;
                const overdue  = isOverdue(e.naechste_aktion) && !e.ergebnis;
                const KanalIcon = kanal?.Icon;
                return (
                  <tr key={e.id} className="border-b border-[#2d3144]/60 hover:bg-[#252a40] transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {formatDate(e.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">
                        {e.kunden?.firmenname || e.kunden?.kontaktperson || <span className="text-slate-500">Kein Kunde.</span>}
                      </p>
                      {e.kunden?.firmenname && (
                        <p className="text-slate-500 text-xs">{e.kunden.kontaktperson}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {kanal && KanalIcon ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${kanal.cls}`}>
                          <KanalIcon size={11} /> {kanal.label}
                        </span>
                      ) : <span className="text-slate-500">Keine Angabe.</span>}
                    </td>
                    <td className="px-4 py-3">
                      {typ ? (
                        <span className={`text-xs font-medium ${typ.cls}`}>{typ.label}</span>
                      ) : <span className="text-slate-500">Keine Angabe.</span>}
                    </td>
                    <td className="px-4 py-3">
                      {ergebnis ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${ergebnis.cls}`}>
                          {ergebnis.label}
                        </span>
                      ) : <span className="text-slate-500 text-xs">Offen</span>}
                    </td>
                    <td className="px-4 py-3">
                      {e.naechste_aktion ? (
                        <span className={overdue ? 'text-red-400 font-medium' : 'text-slate-300'}>
                          {overdue && '⚠ '}{formatDate(e.naechste_aktion)}
                        </span>
                      ) : <span className="text-slate-500">Keine Angabe.</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal(e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <OutreachModal
          entry={modal}
          kunden={kunden}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
