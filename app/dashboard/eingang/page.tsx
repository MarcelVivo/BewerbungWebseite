'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Inbox, Mail, MessageSquare, Sparkles, GitBranch, Search, ExternalLink, X, Check } from 'lucide-react';
import { Card, Badge, Button, PageHeader, EmptyState, Input } from '@/components/dashboard/ui';

// ── Normalisierte Eingangs-Zeile ─────────────────────────────

type Source = 'kontakt' | 'ki-check' | 're-anfrage' | 'aila-lead';
type NormStatus = 'neu' | 'in_bearbeitung' | 'erledigt';

type EingangItem = {
  id: string;
  source: Source;
  name: string;
  firma?: string;
  email?: string;
  betreff: string;
  status: NormStatus;
  created_at: string;
  raw: any;
};

const SOURCE_CFG: Record<Source, { label: string; icon: React.ElementType }> = {
  kontakt:    { label: 'Kontaktformular', icon: Mail },
  'ki-check': { label: 'KI-Check',        icon: Sparkles },
  're-anfrage': { label: 'Projektanfrage', icon: MessageSquare },
  'aila-lead': { label: 'AILA-Chat',       icon: GitBranch },
};

const STATUS_CFG: Record<NormStatus, { label: string; variant: 'info' | 'warning' | 'success' }> = {
  neu:            { label: 'Neu',            variant: 'info' },
  in_bearbeitung: { label: 'In Bearbeitung',  variant: 'warning' },
  erledigt:       { label: 'Erledigt',        variant: 'success' },
};

function mapKontaktStatus(s: string): NormStatus {
  if (s === 'beantwortet') return 'erledigt';
  if (s === 'gelesen') return 'in_bearbeitung';
  return 'neu';
}
function mapReAnfrageStatus(s: string): NormStatus {
  if (s === 'abgeschlossen') return 'erledigt';
  if (s === 'kontaktiert' || s === 'in_bearbeitung') return 'in_bearbeitung';
  return 'neu';
}

export default function EingangPage() {
  const [items, setItems] = useState<EingangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<NormStatus | 'alle'>('alle');
  const [selected, setSelected] = useState<EingangItem | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: kontakte }, { data: kiChecks }, { data: reAnfragen }, { data: ailaLeads }] = await Promise.all([
      supabase.from('kontaktanfragen').select('*').order('created_at', { ascending: false }),
      supabase.from('kunden').select('*').eq('status', 'anfrage').order('created_at', { ascending: false }),
      supabase.from('re_anfragen').select('*').order('created_at', { ascending: false }),
      supabase.from('deals').select('*').eq('status', 'lead').ilike('titel', 'AILA-Anfrage%').order('created_at', { ascending: false }),
    ]);

    const normalized: EingangItem[] = [
      ...(kontakte ?? []).map((k: any): EingangItem => ({
        id: k.id, source: 'kontakt', name: k.name, email: k.email,
        betreff: k.nachricht || 'Keine Nachricht.', status: mapKontaktStatus(k.status),
        created_at: k.created_at, raw: k,
      })),
      ...(kiChecks ?? []).map((k: any): EingangItem => ({
        id: k.id, source: 'ki-check', name: k.kontaktperson, firma: k.firmenname, email: k.email,
        betreff: k.notizen || 'KI-Check ausgefüllt.', status: 'neu',
        created_at: k.created_at, raw: k,
      })),
      ...(reAnfragen ?? []).map((r: any): EingangItem => ({
        id: r.id, source: 're-anfrage', name: r.name, firma: r.firma, email: r.email,
        betreff: r.projekttyp || 'Projektanfrage', status: mapReAnfrageStatus(r.status),
        created_at: r.created_at, raw: r,
      })),
      ...(ailaLeads ?? []).map((d: any): EingangItem => ({
        id: d.id, source: 'aila-lead', name: d.titel.replace(/^AILA-Anfrage\s*[·•:-]+\s*/i, ''), firma: undefined, email: undefined,
        betreff: d.notizen || 'Über AILA-Chat gestartet.', status: 'neu',
        created_at: d.created_at, raw: d,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setItems(normalized);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateKontaktStatus(id: string, status: 'neu' | 'gelesen' | 'beantwortet') {
    await createClient().from('kontaktanfragen').update({ status }).eq('id', id);
    await load();
  }

  const filtered = useMemo(() => items.filter((item) => {
    const matchesSearch = !search || [item.name, item.firma, item.email, item.betreff].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'alle' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [items, search, statusFilter]);

  const neuCount = items.filter((i) => i.status === 'neu').length;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Eingang"
        subtitle={`${items.length} Anfragen insgesamt · ${neuCount} neu · aus Kontaktformular, KI-Check, Projektanfragen und AILA-Chat`}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-textDim" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche nach Name, Firma oder E-Mail." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['alle', 'neu', 'in_bearbeitung', 'erledigt'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-dash-gold text-dash-bg' : 'bg-dash-surface border border-dash-border text-dash-textMuted hover:text-dash-textBright'
              }`}
            >
              {s === 'alle' ? 'Alle' : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-dash-textMuted text-sm">Die Anfragen werden geladen.</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Inbox size={32} />} title="Keine Anfragen gefunden." description="Neue Anfragen aus Kontaktformular, KI-Check, Projektanfragen und AILA-Chat erscheinen hier automatisch." />
        ) : (
          <div className="divide-y divide-dash-border">
            {filtered.map((item) => {
              const SourceIcon = SOURCE_CFG[item.source].icon;
              return (
                <button
                  key={`${item.source}-${item.id}`}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-dash-surfaceAlt transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-dash-gold/10 border border-dash-gold/20 flex items-center justify-center flex-shrink-0 text-dash-gold">
                    <SourceIcon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dash-textBright truncate">{item.name}</span>
                      {item.firma && <span className="text-xs text-dash-textDim truncate">· {item.firma}</span>}
                    </div>
                    <p className="text-xs text-dash-textMuted truncate mt-0.5">{item.betreff}</p>
                  </div>
                  <Badge variant="neutral" className="flex-shrink-0 hidden sm:inline-flex">{SOURCE_CFG[item.source].label}</Badge>
                  <Badge variant={STATUS_CFG[item.status].variant} className="flex-shrink-0">{STATUS_CFG[item.status].label}</Badge>
                  <span className="text-xs text-dash-textDim flex-shrink-0 hidden md:inline">
                    {new Date(item.created_at).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-dash-surface border-l border-dash-border h-full overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Badge variant="neutral">{SOURCE_CFG[selected.source].label}</Badge>
              <button onClick={() => setSelected(null)} className="text-dash-textMuted hover:text-dash-textBright"><X size={20} /></button>
            </div>

            <div>
              <p className="font-display text-lg text-dash-textBright">{selected.name}</p>
              {selected.firma && <p className="text-sm text-dash-textMuted">{selected.firma}</p>}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="text-sm text-dash-gold hover:underline flex items-center gap-1 mt-1">
                  {selected.email} <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div>
              <p className="text-xs text-dash-textDim uppercase tracking-wide mb-2">Inhalt</p>
              <Card variant="alt" padding="sm">
                <p className="text-sm text-dash-textSubtle whitespace-pre-wrap leading-relaxed">{selected.betreff}</p>
              </Card>
            </div>

            {selected.source === 'kontakt' && (
              <div className="space-y-2">
                <p className="text-xs text-dash-textDim uppercase tracking-wide">Status</p>
                {(['neu', 'gelesen', 'beantwortet'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateKontaktStatus(selected.id, s)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selected.raw.status === s ? 'bg-dash-gold/15 text-dash-gold' : 'bg-dash-surfaceAlt border border-dash-border text-dash-textMuted hover:text-dash-textBright'
                    }`}
                  >
                    {s === 'neu' ? 'Neu' : s === 'gelesen' ? 'Gelesen' : 'Beantwortet'}
                    {selected.raw.status === s && <Check size={14} />}
                  </button>
                ))}
                {selected.email && (
                  <a href={`mailto:${selected.email}?subject=Re: Ihre Anfrage auf marcelspahr.ch`} onClick={() => updateKontaktStatus(selected.id, 'beantwortet')}>
                    <Button variant="primary" fullWidth icon={<Mail size={14} />} className="mt-2">Per E-Mail antworten</Button>
                  </a>
                )}
              </div>
            )}

            {selected.source === 're-anfrage' && (
              <Link href="/dashboard/re-interview"><Button variant="primary" fullWidth>Im RE-Interview öffnen</Button></Link>
            )}
            {selected.source === 'ki-check' && (
              <Link href="/dashboard/kunden"><Button variant="primary" fullWidth>Kunde bearbeiten</Button></Link>
            )}
            {selected.source === 'aila-lead' && (
              <Link href="/dashboard/pipeline"><Button variant="primary" fullWidth>In Pipeline öffnen</Button></Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
