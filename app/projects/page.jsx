"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { id: 'diploma', label: 'Diplome & EFZ', types: ['diploma', 'efz', 'cv'] },
  { id: 'certificate', label: 'Zertifikate', types: ['certificate'] },
  { id: 'reference', label: 'Arbeitszeugnisse & Referenzen', types: ['zeugnis', 'reference'] },
  { id: 'portfolio', label: 'Portfolio / Projekte', types: ['project', 'code', 'link', 'photo', 'pdf'] },
];
const TYPES = Array.from(new Set(CATEGORIES.flatMap((c) => c.types)));

export default function ProjectsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ id: null, type: 'certificate', title: '', description: '', url: '', file: null });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isEditing = Boolean(form.id);

  useEffect(() => {
    (async () => {
      try {
        const sessRes = await fetch('/api/session');
        if (!sessRes.ok) throw new Error('no session');
        const sess = await sessRes.json();
        if (sess?.user?.role !== 'owner') {
          router.replace('/');
          return;
        }
        await loadItems();
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error(await res.text().catch(() => 'Fehler beim Laden'));
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e.message || 'Konnte Einträge nicht laden');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      let payload = { ...form };
      if (form.file) {
        const fd = new FormData();
        fd.append('file', form.file);
        const up = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!up.ok) throw new Error(await up.text().catch(() => 'Upload fehlgeschlagen'));
        const uploaded = await up.json();
        payload.url = uploaded?.file?.url || '';
      }

      if (isEditing) {
        const res = await fetch(`/api/projects/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: payload.type, title: payload.title, description: payload.description, url: payload.url, code: '' }),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => 'Speichern fehlgeschlagen'));
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : items.map((it) => (it.id === form.id ? data.item : it)));
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: payload.type, title: payload.title, description: payload.description, url: payload.url, code: '' }),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => 'Speichern fehlgeschlagen'));
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : [data.item, ...items]);
      }

      setForm({ id: null, type: 'certificate', title: '', description: '', url: '', file: null });
    } catch (e) {
      setError(e.message || 'Fehler beim Speichern');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item) {
    setForm({
      id: item.id,
      type: item.type || 'certificate',
      title: item.title || '',
      description: item.description || '',
      url: item.url || '',
      file: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    if (!confirm('Eintrag wirklich löschen?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text().catch(() => 'Löschen fehlgeschlagen'));
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : items.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message || 'Fehler beim Löschen');
    } finally {
      setBusy(false);
    }
  }

  function categorize(list) {
    const buckets = {};
    CATEGORIES.forEach((c) => { buckets[c.id] = []; });
    (list || []).forEach((it) => {
      const t = (it.type || '').toLowerCase();
      const cat = CATEGORIES.find((c) => c.types.includes(t));
      const target = cat ? cat.id : 'portfolio';
      buckets[target] = buckets[target] || [];
      buckets[target].push(it);
    });
    return buckets;
  }

  const grouped = categorize(items);

  return (
    <main className="container-narrow px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-pill inline-block">Admin</div>
          <h1 className="text-2xl font-semibold text-slate-900">Dokumente bearbeiten</h1>
        </div>
        <a className="btn btn-soft px-3 py-1.5" href="/">Zurück zur Übersicht</a>
      </div>

      <div className="card p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Typ</label>
            <select className="mt-1 w-full rounded-lg border-slate-300" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Titel</label>
            <input className="mt-1 w-full rounded-lg border-slate-300" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Beschreibung</label>
            <textarea rows={2} className="mt-1 w-full rounded-lg border-slate-300" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">URL (optional)</label>
            <input className="mt-1 w-full rounded-lg border-slate-300" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            <p className="text-xs text-slate-500 mt-1">Wird überschrieben, wenn eine Datei hochgeladen wird.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Datei-Upload (optional)</label>
            <input type="file" className="mt-1 w-full" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={busy} onClick={save} className="btn btn-primary px-4 py-2 disabled:opacity-60">
            {busy ? 'Speichern…' : isEditing ? 'Änderungen speichern' : 'Anlegen'}
          </button>
          {isEditing && (
            <button className="btn btn-soft px-4 py-2" onClick={() => setForm({ id: null, type: 'certificate', title: '', description: '', url: '', file: null })}>
              Neu anlegen
            </button>
          )}
          {error ? <span className="text-sm text-red-600">{error}</span> : null}
        </div>
      </div>

      {loading ? <div className="text-sm text-slate-600">Lädt…</div> : null}
      {!loading && !items.length ? <div className="text-sm text-slate-500">Keine Dokumente vorhanden.</div> : null}

      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const docs = grouped[cat.id] || [];
          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="label-pill inline-block">{cat.label}</div>
                <div className="text-xs text-slate-500">{docs.length} Dokument{docs.length === 1 ? '' : 'e'}</div>
              </div>
              {!docs.length && <div className="text-sm text-slate-500">Noch nichts in dieser Kategorie.</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((i) => (
                  <div key={i.id} className="card aspect-square p-4 flex flex-col gap-3 justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-slate-900 font-semibold text-center w-full">{i.title || i.type}</div>
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-blue-600" onClick={() => startEdit(i)}>Bearbeiten</button>
                        <button className="text-sm text-red-600" onClick={() => remove(i.id)}>Löschen</button>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 justify-between h-full">
                      {i.url ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a className="btn btn-soft px-3 py-1.5" href={i.url} target="_blank" rel="noreferrer">Öffnen</a>
                          <a className="btn btn-primary px-3 py-1.5" href={i.url} download>Download</a>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">Kein Link</div>
                      )}
                      {i.description ? <div className="text-sm text-slate-600 flex-1 text-right">{i.description}</div> : <div className="text-xs text-slate-400 text-right">Keine Beschreibung</div>}
                    </div>
                    <div className="text-xs text-slate-500">Typ: {i.type}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
