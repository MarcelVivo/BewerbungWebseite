'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Kunde, KundenStatus } from '@/lib/types';
import { Modal, Input, Textarea, Select, Button } from '@/components/dashboard/ui';

export const STATUS_LABEL: Record<KundenStatus, string> = {
  anfrage: 'Anfrage', lead: 'Lead', interessent: 'Interessent', kunde: 'Kunde', inaktiv: 'Inaktiv',
};

export const EMPTY_KUNDE: Partial<Kunde> = { kontaktperson: '', firmenname: '', email: '', telefon: '', branche: '', status: 'lead', notizen: '' };

export default function KundeModal({ kunde, onClose, onSaved }: {
  kunde: Partial<Kunde>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Kunde>>(kunde);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!form.id;

  function set(field: keyof Kunde, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? 'Kunde bearbeiten' : 'Neuer Kunde'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">Abbrechen</Button>
          <Button variant="primary" type="submit" form="kunde-form" loading={saving}>Speichern</Button>
        </>
      }
    >
      <form id="kunde-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Kontaktperson" required value={form.kontaktperson ?? ''} onChange={(e) => set('kontaktperson', e.target.value)} placeholder="Max Muster" />
          <Input label="Firma" value={form.firmenname ?? ''} onChange={(e) => set('firmenname', e.target.value)} placeholder="Muster GmbH" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="E-Mail" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="max@firma.ch" />
          <Input label="Telefon" value={form.telefon ?? ''} onChange={(e) => set('telefon', e.target.value)} placeholder="+41 79 123 45 67" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Branche" value={form.branche ?? ''} onChange={(e) => set('branche', e.target.value)} placeholder="IT, Handel, ..." />
          <Select label="Status" value={form.status ?? 'lead'} onChange={(e) => set('status', e.target.value)}>
            {(Object.keys(STATUS_LABEL) as KundenStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </div>
        <Textarea label="Notizen" rows={3} value={form.notizen ?? ''} onChange={(e) => set('notizen', e.target.value)} placeholder="Interne Notizen..." />
        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </Modal>
  );
}
