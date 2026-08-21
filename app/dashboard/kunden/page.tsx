'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Kunde, KundenStatus } from '@/lib/types';
import { Search, Plus, Pencil, Trash2, User } from 'lucide-react';
import { Card, Badge, Button, Input, PageHeader, EmptyState } from '@/components/dashboard/ui';
import KundeModal, { EMPTY_KUNDE, STATUS_LABEL } from '@/components/dashboard/kunden/KundeModal';

const STATUS_VARIANT: Record<KundenStatus, 'warning' | 'neutral' | 'info' | 'success'> = {
  anfrage:     'warning',
  lead:        'neutral',
  interessent: 'info',
  kunde:       'success',
  inaktiv:     'neutral',
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function KundenPage() {
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<KundenStatus | 'alle'>('alle');
  const [modal, setModal] = useState<Partial<Kunde> | false>(false);
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

  const filtered = kunden.filter((k) => {
    const matchSearch = !search || [k.kontaktperson, k.firmenname, k.email].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'alle' || k.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Kunden"
        subtitle={`${kunden.length} Kontakte insgesamt`}
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModal(EMPTY_KUNDE)}>Neuer Kunde</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-textDim" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche nach Name, Firma oder E-Mail." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['alle', ...Object.keys(STATUS_LABEL)] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as KundenStatus | 'alle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-dash-gold text-dash-bg' : 'bg-dash-surface border border-dash-border text-dash-textMuted hover:text-dash-textBright'
              }`}
            >
              {s === 'alle' ? 'Alle' : STATUS_LABEL[s as KundenStatus]}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-dash-textMuted text-sm">Die Kunden werden geladen.</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<User size={32} />}
            title="Keine Kunden gefunden."
            action={<button onClick={() => setModal(EMPTY_KUNDE)} className="text-dash-gold text-sm hover:underline">+ Ersten Kunden anlegen</button>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border text-xs text-dash-textDim uppercase tracking-wide">
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
              {filtered.map((k) => (
                <tr key={k.id} className="border-b border-dash-border/60 last:border-0 hover:bg-dash-surfaceAlt transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/kunden/${k.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-dash-gold/15 text-dash-gold flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(k.kontaktperson)}
                      </div>
                      <div>
                        <div className="text-dash-textBright font-medium group-hover:text-dash-gold transition-colors">{k.kontaktperson}</div>
                        {k.firmenname && <div className="text-dash-textDim text-xs">{k.firmenname}</div>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-dash-textMuted">
                    {k.email ? <a href={`mailto:${k.email}`} className="hover:text-dash-textBright transition-colors">{k.email}</a> : 'Keine Angabe.'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-dash-textMuted">{k.telefon || 'Keine Angabe.'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-dash-textMuted">{k.branche || 'Keine Angabe.'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[k.status]}>{STATUS_LABEL[k.status]}</Badge></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-dash-textDim">{formatDate(k.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(k)} className="p-1.5 rounded-lg text-dash-textDim hover:text-dash-textBright hover:bg-dash-border/40 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(k.id)} disabled={deleting === k.id} className="p-1.5 rounded-lg text-dash-textDim hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {modal !== false && (
        <KundeModal
          kunde={modal}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
