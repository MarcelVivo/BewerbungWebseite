'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Kunde, KundenStatus, Deal, Projekt, Rechnung, Termin } from '@/lib/types';
import {
  Pencil, Mail, Phone, Building2, GitBranch, FolderKanban, Receipt,
  FileText, Calendar, Megaphone, ExternalLink,
} from 'lucide-react';
import { Card, Badge, Button, PageHeader, EmptyState } from '@/components/dashboard/ui';
import KundeModal, { STATUS_LABEL } from '@/components/dashboard/kunden/KundeModal';

const STATUS_VARIANT: Record<KundenStatus, 'warning' | 'neutral' | 'info' | 'success'> = {
  anfrage: 'warning', lead: 'neutral', interessent: 'info', kunde: 'success', inaktiv: 'neutral',
};

const DEAL_STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  gewonnen: 'success', verloren: 'danger', angebot: 'warning', verhandlung: 'warning',
  erstgespraech: 'neutral', lead: 'neutral',
};

const RECHNUNG_STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  bezahlt: 'success', ueberfaellig: 'danger', gesendet: 'warning', entwurf: 'neutral', storniert: 'neutral',
};

type Vertrag = { id: string; titel: string; status: string; gueltig_bis?: string };
type Outreach = { id: string; kanal: string; kontakt_typ: string; notiz?: string; created_at: string };

function formatCHF(v?: number) {
  if (!v) return '–';
  return `CHF ${v.toLocaleString('de-CH')}`;
}
function formatDate(iso?: string) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Section({ icon, title, count, children, action }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-dash-gold/10 border border-dash-gold/20 flex items-center justify-center text-dash-gold flex-shrink-0">
            {icon}
          </div>
          <h3 className="font-display text-sm text-dash-textBright">{title} <span className="text-dash-textDim font-sans font-normal">({count})</span></h3>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export default function KundenkarteiPage() {
  const params = useParams();
  const id = params.id as string;

  const [kunde, setKunde] = useState<Kunde | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [vertraege, setVertraege] = useState<Vertrag[]>([]);
  const [termine, setTermine] = useState<Termin[]>([]);
  const [outreach, setOutreach] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [
      { data: k }, { data: d }, { data: p }, { data: r }, { data: v }, { data: t }, { data: o },
    ] = await Promise.all([
      supabase.from('kunden').select('*').eq('id', id).single(),
      supabase.from('deals').select('*').eq('kunden_id', id).order('created_at', { ascending: false }),
      supabase.from('projekte').select('*').eq('kunden_id', id).order('created_at', { ascending: false }),
      supabase.from('rechnungen').select('*').eq('kunden_id', id).order('created_at', { ascending: false }),
      supabase.from('vertraege').select('id, titel, status, gueltig_bis').eq('kunden_id', id).order('created_at', { ascending: false }),
      supabase.from('termine').select('*').eq('kunden_id', id).order('start_zeit', { ascending: false }),
      supabase.from('outreach').select('id, kanal, kontakt_typ, notiz, created_at').eq('kunden_id', id).order('created_at', { ascending: false }),
    ]);
    setKunde((k as Kunde) ?? null);
    setDeals((d as Deal[]) ?? []);
    setProjekte((p as Projekt[]) ?? []);
    setRechnungen((r as Rechnung[]) ?? []);
    setVertraege((v as Vertrag[]) ?? []);
    setTermine((t as Termin[]) ?? []);
    setOutreach((o as Outreach[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-16 text-center text-dash-textMuted text-sm">Die Kundenkartei wird geladen.</div>;
  if (!kunde) return <div className="py-16 text-center text-dash-textMuted text-sm">Kunde nicht gefunden.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        backHref="/dashboard/kunden"
        backLabel="Alle Kunden"
        title={kunde.kontaktperson}
        subtitle={kunde.firmenname}
        actions={<Button variant="secondary" icon={<Pencil size={14} />} onClick={() => setEditing(true)}>Bearbeiten</Button>}
      />

      <Card padding="md" className="mb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Badge variant={STATUS_VARIANT[kunde.status]}>{STATUS_LABEL[kunde.status]}</Badge>
          {kunde.email && <a href={`mailto:${kunde.email}`} className="flex items-center gap-1.5 text-dash-textMuted hover:text-dash-textBright transition-colors"><Mail size={13} /> {kunde.email}</a>}
          {kunde.telefon && <span className="flex items-center gap-1.5 text-dash-textMuted"><Phone size={13} /> {kunde.telefon}</span>}
          {kunde.branche && <span className="flex items-center gap-1.5 text-dash-textMuted"><Building2 size={13} /> {kunde.branche}</span>}
        </div>
        {kunde.notizen && <p className="mt-4 text-sm text-dash-textSubtle whitespace-pre-wrap border-t border-dash-border pt-4">{kunde.notizen}</p>}
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Section icon={<GitBranch size={15} />} title="Deals" count={deals.length} action={<Link href="/dashboard/pipeline" className="text-xs text-dash-gold hover:underline">Pipeline ↗</Link>}>
          {deals.length === 0 ? <EmptyState title="Noch keine Deals." /> : (
            <div className="space-y-2">
              {deals.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-dash-textSubtle truncate">{d.titel}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {d.wert && <span className="text-dash-textDim text-xs">{formatCHF(d.wert)}</span>}
                    <Badge variant={DEAL_STATUS_VARIANT[d.status] ?? 'neutral'}>{d.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={<FolderKanban size={15} />} title="Projekte" count={projekte.length} action={<Link href="/dashboard/projekte" className="text-xs text-dash-gold hover:underline">Übersicht ↗</Link>}>
          {projekte.length === 0 ? <EmptyState title="Noch keine Projekte." /> : (
            <div className="space-y-2">
              {projekte.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-dash-textSubtle truncate">{p.name}</span>
                  <Badge variant={p.status === 'aktiv' ? 'success' : p.status === 'abgebrochen' ? 'danger' : 'neutral'}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          icon={<Receipt size={15} />} title="Rechnungen" count={rechnungen.length}
          action={<Link href={`/dashboard/rechnungen?kunde=${id}`} className="text-xs text-dash-gold hover:underline">+ Neu</Link>}
        >
          {rechnungen.length === 0 ? <EmptyState title="Noch keine Rechnungen." /> : (
            <div className="space-y-2">
              {rechnungen.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-dash-textSubtle truncate">{r.rechnungsnummer} · {r.typ}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-dash-textDim text-xs">{formatCHF(r.gesamtbetrag)}</span>
                    <Badge variant={RECHNUNG_STATUS_VARIANT[r.status] ?? 'neutral'}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          icon={<FileText size={15} />} title="Verträge" count={vertraege.length}
          action={<Link href={`/dashboard/vertrage?kunde=${id}`} className="text-xs text-dash-gold hover:underline">+ Neu</Link>}
        >
          {vertraege.length === 0 ? <EmptyState title="Noch keine Verträge." /> : (
            <div className="space-y-2">
              {vertraege.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-dash-textSubtle truncate">{v.titel}</span>
                  <Badge variant={v.status === 'unterzeichnet' ? 'success' : v.status === 'abgelaufen' ? 'danger' : 'neutral'}>{v.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={<Calendar size={15} />} title="Termine" count={termine.length}>
          {termine.length === 0 ? <EmptyState title="Noch keine Termine." /> : (
            <div className="space-y-2">
              {termine.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-dash-textSubtle truncate">{t.titel}</span>
                  <span className="text-dash-textDim text-xs flex-shrink-0">{formatDate(t.start_zeit)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={<Megaphone size={15} />} title="Outreach-Log" count={outreach.length}>
          {outreach.length === 0 ? <EmptyState title="Noch kein Kontaktversuch protokolliert." /> : (
            <div className="space-y-2">
              {outreach.slice(0, 6).map((o) => (
                <div key={o.id} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-dash-textSubtle">{o.kanal} · {o.kontakt_typ}</span>
                    <span className="text-dash-textDim text-xs flex-shrink-0">{formatDate(o.created_at)}</span>
                  </div>
                  {o.notiz && <p className="text-xs text-dash-textDim mt-0.5 truncate">{o.notiz}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {editing && (
        <KundeModal kunde={kunde} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
      )}
    </div>
  );
}
