import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

function clsx(...parts) { return parts.filter(Boolean).join(' '); }

function useReveal(ref, opts = {}) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const rootMargin = opts.rootMargin || '0px 0px -10% 0px';
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('reveal-visible'); io.unobserve(e.target); } });
    }, { root: null, threshold: 0.08, rootMargin });
    io.observe(el); return () => io.disconnect();
  }, [ref, opts.rootMargin]);
}

function Reveal({ className, children, as: Tag = 'div', delay = 0 }) {
  const r = useRef(null); useReveal(r);
  return <Tag ref={r} className={clsx('reveal', delay ? `reveal-delay-${delay}` : '', className)}>{children}</Tag>;
}

function Navbar({ role }) {
  const nav = useNavigate();
  const items = ['/', ...(role === 'owner' ? ['/projects'] : []), '/contact'];
  const label = (p) => (p === '/' ? 'Start' : p === '/projects' ? 'Projekte' : 'Kontakt');
  return (
    <header className="nav-blue sticky top-0 z-10">
      <div className="container-narrow px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="brand-name text-xl font-semibold text-slate-900">Marcel Spahr</div>
          <span className="hidden sm:inline text-slate-700 label-pill">Wirtschaftsinformatiker</span>
        </div>
        <nav className="flex items-center gap-1">
          {items.map((p) => (
            <button key={p} onClick={() => nav(p)} className={'px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-ms-100 text-slate-700'}>{label(p)}</button>
          ))}
          {role === 'owner' && (
            <button className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-ms-100 hover:bg-ms-200 text-slate-700" onClick={async () => { try { await fetch('/api/logout', { method: 'POST' }); } finally { window.location.href = '/login'; } }}>Logout</button>
          )}
        </nav>
      </div>
    </header>
  );
}

function Home({ items, avatar }) {
  const quickDocs = [
    { label: 'SCRUM Zertifikat', url: '/assets/SCRUMZertifikat.pdf' },
    { label: 'SAFe Zertifikat', url: '/assets/SAFeZertifikatMarcelSpahr.pdf' },
    { label: 'Englisch Zertifikat', url: '/assets/CambridgeEnglischA2ZertifikatMarcelSpahr.pdf' },
    { label: 'Arbeitszeugnis Swisscom', url: '/assets/ArbeitszeugnisMarcelSpahr2025.pdf' },
  ];
  function findCvUrl() {
    const byType = (items || []).find((i) => (i.type || '').toLowerCase() === 'cv');
    if (byType && byType.url) return byType.url;
    const byTitle = (items || []).find((i) => /lebenslauf|curriculum\s*vitae|\bcv\b/i.test(i.title || '') && /pdf|link|cv/i.test(i.type || ''));
    if (byTitle && byTitle.url) return byTitle.url;
    return 'assets/CV.pdf';
  }
  const cvUrl = findCvUrl();
  return (
    <>
      <section className="hero border-b border-sky-100">
        <div className="container-narrow px-4 py-10 grid md:grid-cols-2 gap-8 items-start">
          <Reveal>
            <div>
              <div className="flex items-center gap-6">
                <img src={avatar || 'https://api.dicebear.com/9.x/initials/svg?seed=Marcel%20Spahr'} alt="Foto von Marcel Spahr" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-soft bg-white" />
                <div>
                  <h1 className="brand-name text-3xl md:text-4xl font-semibold text-slate-900">Marcel Spahr</h1>
                  <div className="mt-2 label-pill inline-flex">Wirtschaftsinformatiker</div>
                </div>
              </div>
              <p className="mt-5 text-slate-700 leading-relaxed max-w-2xl">Kreativer Wirtschaftsinformatiker mit viel Verstand, Empathie & digitalem Gespür. Technisches Know-how mit kreativen Ideen zu verknüpfen, ist meine Leidenschaft.</p>
              <p className="mt-3 text-slate-700 leading-relaxed max-w-2xl">Mit viel Erfahrung in Marketing und Online-Business sowie als langjähriger Kundenberater schaffe ich individuelle Kundenerlebnisse. Mein Talent für strategische Planung, Organisation und vernetztes Denken ermöglicht es mir, effizient, kundenorientiert und wirtschaftlich sinnvoll zu handeln. Meine Begeisterung für digitale Innovationen treibt mich an, mein Wissen kontinuierlich zu erweitern und kreative Lösungen mit technologischem Fortschritt zu verbinden.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a className="btn btn-primary px-4 py-2" href={cvUrl} target="_blank" rel="noreferrer">Lebenslauf (PDF)</a>
                <a className="btn btn-soft px-4 py-2" href="#docs">Alle Dokumente ansehen</a>
              </div>
        </div>
      </Reveal>
      <Reveal>
        <aside className="card p-5 bg-white/90 sticky-aside space-y-4">
          <div>
            <h3 className="text-sm tracking-widest font-bold text-slate-700 mb-3">Kontakt</h3>
            <ul className="text-slate-700 space-y-2">
              <li>Bern, Schweiz</li>
              <li>+41 79 511 09 11</li>
              <li><a className="link-blue" href="mailto:kontakt@marcelspahr.ch">kontakt@marcelspahr.ch</a></li>
              <li><a className="link-blue" href="https://www.marcelspahr.ch" target="_blank" rel="noreferrer">www.marcelspahr.ch</a></li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="tag">Deutsch (Muttersprache)</span>
              <span className="tag">Englisch (A2)</span>
              <span className="tag">Führerausweis Kat. B</span>
            </div>
          </div>
          <div>
            <div className="label-pill inline-block mb-2">Top Dokumente</div>
            <div className="grid grid-cols-2 gap-2">
              {quickDocs.map((d) => (
                <a key={d.label} className="card p-3 text-sm font-semibold text-slate-800 hover:bg-ms-50" href={d.url} target="_blank" rel="noreferrer">
                  {d.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="label-pill inline-block mb-2">Skills</div>
            <details className="accordion mb-2" open>
              <summary><span className="badge">Soft Skills</span><span className="ml-2 font-medium">Persönliche Stärken</span></summary>
              <div className="skills-list"><ul>
                <li>Analytisches Denken & Problemlösung</li>
                <li>Kommunikationsstark</li>
                <li>Organisationstalent</li>
                <li>Geduldig und zuverlässig</li>
                <li>Stakeholder‑Management & Schnittstellenkommunikation</li>
                <li>Strukturiertes Arbeiten & Priorisierung</li>
                <li>Moderation von Workshops & Meetings</li>
                <li>Kunden‑ und Serviceorientierung</li>
                <li>Selbstorganisation & Zeitmanagement</li>
                <li>Lernbereitschaft & Neugier</li>
                <li>Verantwortungsbewusstsein & Entscheidungsfreude</li>
              </ul></div>
            </details>
            <details className="accordion mb-2">
              <summary><span className="badge">Tech Skills</span><span className="ml-2 font-medium">Wirtschaftsinformatik & IT</span></summary>
              <div className="skills-list"><ul>
                <li>Requirements Engineering (User Stories, Use Cases, Akzeptanzkriterien)</li>
                <li>IT‑Projektmanagement & Agile Methoden (Scrum/Kanban, Backlog, Estimation)</li>
                <li>Geschäftsprozessanalyse & ‑modellierung (BPMN 2.0)</li>
                <li>UML‑Diagramme (Klassendiagramm, Aktivitäts‑ & Sequenzdiagramm)</li>
                <li>Datenmodellierung (ERM), Normalisierung</li>
                <li>Relationale Datenbanken & SQL (Joins, Views, Transaktionen, Indexe)</li>
                <li>Datenanalyse & Reporting (Power BI/Tableau, Excel Pivot)</li>
                <li>ETL/ELT & Data Warehousing (Star/Snowflake Schema)</li>
                <li>API‑Grundlagen (REST/HTTP, JSON, OpenAPI/Swagger)</li>
                <li>Web‑Grundlagen & Prototyping (HTML/CSS/JavaScript)</li>
                <li>Versionsverwaltung (Git/GitHub)</li>
              </ul></div>
            </details>
            <details className="accordion mb-2">
              <summary><span className="badge">Praxis</span><span className="ml-2 font-medium">Support & Administration</span></summary>
              <div className="skills-list"><ul>
                <li>1st/2nd Level Support</li>
                <li>Systemadministration (Tech & Admin)</li>
                <li>Workflow‑Optimierung im Kundenservice</li>
                <li>Retention‑ & Sales‑Prozesse</li>
              </ul></div>
            </details>
            <details className="accordion mb-2">
              <summary><span className="badge">Kreative Skills</span><span className="ml-2 font-medium">Marketing & Content</span></summary>
              <div className="skills-list"><ul>
                <li>Videoproduktion</li>
                <li>Adobe Photoshop & Illustrator</li>
                <li>Marketingkenntnisse & Erfahrung</li>
                <li>Content‑Erstellung</li>
              </ul></div>
            </details>
            <details className="accordion mb-2">
              <summary><span className="badge">Software</span><span className="ml-2 font-medium">Tools</span></summary>
              <div className="skills-list"><ul>
                <li>Windows & macOS</li>
                <li>Microsoft Office 365</li>
                <li>Jira & Confluence</li>
                <li>Git & GitHub</li>
                <li>VS Code</li>
                <li>Power BI</li>
                <li>Figma & Miro</li>
              </ul></div>
            </details>
            <details className="accordion">
              <summary><span className="badge">Sprachen</span><span className="ml-2 font-medium">Languages</span></summary>
              <div className="skills-list"><ul>
                <li>Deutsch (Muttersprache)</li>
                <li>Englisch (B1)</li>
              </ul></div>
            </details>
          </div>
        </aside>
      </Reveal>
    </div>
  </section>
      <CvSection />
      <Documents items={items.filter((i) => ['certificate','language','reference','diploma','pdf','zeugnis'].includes(i.type))} />
    </>
  );
}

function prettyTitle(i) {
  const base = (i.title && i.title.trim()) || (i.url ? (i.url.split('/').pop() || '') : '');
  let s = base.replace(/\.[^.]+$/, '');
  s = s.replace(/^\s*\d+[\s_\-]*/,'');
  s = s.replace(/[\-_]+/g,' ');
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  return s.trim() || (i.type || 'Dokument');
}

function Documents({ items }) {
  const categories = [
    { id: 'alle', label: 'Alle' },
    { id: 'zertifikate', label: 'Zertifikate', match: (i) => /^(certificate)$/i.test(i.type || '') },
    { id: 'sprachen', label: 'Sprachen', match: (i) => /^(language)$/i.test(i.type || '') },
    { id: 'arbeitszeugnisse', label: 'Arbeitszeugnisse', match: (i) => /^(reference|zeugnis)$/i.test(i.type || '') },
    { id: 'diplome', label: 'Diplome', match: (i) => /^(diploma)$/i.test(i.type || '') },
  ];
  const [tab, setTab] = useState('alle');
  const filtered = useMemo(() => {
    const cat = categories.find((c) => c.id === tab);
    if (!cat || tab === 'alle') return items;
    return items.filter((i) => cat.match?.(i));
  }, [items, tab]);
  const docUrl = (u) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/api/uploads/')) return u;
    if (u.startsWith('/uploads/')) return `/api/uploads/${u.replace(/^\\/uploads\\//, '')}`;
    if (u.startsWith('/')) return u;
    return `/api/uploads/${u}`;
  };
  const [viewer, setViewer] = useState(null);
  return (
    <section id="docs" className="container-narrow px-4 space-y-4">
      <Reveal><div className="label-pill inline-block">Zeugnisse, Nachweise & Zertifikate</div></Reveal>
      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button key={c.id} onClick={() => setTab(c.id)} className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium', tab === c.id ? 'bg-ms-600 text-white' : 'hover:bg-ms-100 text-slate-700')}>{c.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((i) => (
          <Reveal key={i.id} className="card p-4 flex flex-col gap-2">
            <div className="text-slate-900 font-semibold">{prettyTitle(i)}</div>
            {i.description ? <div className="text-sm text-slate-600">{i.description}</div> : null}
            <div className="flex gap-2 mt-auto">
              {i.url ? (
                <>
                  <button className="btn btn-soft px-3 py-1.5" onClick={() => setViewer({ ...i, url: docUrl(i.url) })}>Öffnen</button>
                  <a className="btn btn-primary px-3 py-1.5" href={docUrl(i.url)} download>Download</a>
                </>
              ) : null}
            </div>
          </Reveal>
        ))}
        {!filtered.length && (<div className="text-sm text-slate-500">Keine Dokumente vorhanden.</div>)}
      </div>
      {viewer ? (
        <div className="card p-2">
          <div className="flex items-center justify-between p-2">
            <div className="text-slate-900 font-semibold">{viewer.title || 'Dokument'}</div>
            <div className="flex items-center gap-2">
              <a className="btn btn-soft px-3 py-1.5" target="_blank" rel="noreferrer" href={docUrl(viewer.url)}>In neuem Tab öffnen</a>
              <a className="btn btn-primary px-3 py-1.5" download href={docUrl(viewer.url)}>Download</a>
              <button className="btn btn-soft px-3 py-1.5" onClick={() => setViewer(null)}>Schließen</button>
            </div>
          </div>
          <iframe className="pdf-frame" src={docUrl(viewer.url)}></iframe>
        </div>
      ) : null}
    </section>
  );
}

function CvSection() {
  const blocks = [
    { label: 'Beruflicher Werdegang', items: [
      { period: '2008 – 2025', title: 'Swisscom Schweiz AG', subtitle: 'IT-Support, Systemadministration & Prozessdigitalisierung', bullets: [
        'Mitarbeit bei der Digitalisierung interner Prozesse (z. B. Projekt X‑ITE) und Verbesserung der Kundenkommunikation.',
        '1st/2nd Level Support und Systemadministration für Privatkunden (Tech & Admin).',
        'Analyse und Lösung von IT‑Problemen, Optimierung von Workflows im Kundenservice.',
        'Betreuung von Retention‑ und Sales‑Management‑Prozessen.'
      ]},
      { period: '2007 – 2008', title: 'Freelance Einsätze als Werbetechniker', subtitle: 'Frontwork Zürich; Seka Thun', bullets: [
        'Umsetzung diverser Projekte zur Fussball EM 08.',
        'Redesign der Swisscom Shops in der Schweiz.',
        'Eventplanung, Organisation und Betreuung.',
        'Marketing, Ticketing, Verkauf und Merchandise.'
      ]}
    ] },
    { label: 'Schulausbildung, Lehrabschlüsse (EFZ) & aktuelles Studium', items: [
      { period: '2023 – heute', title: 'Feusi HF Wankdorf Bern', subtitle: 'Studium Wirtschaftsinformatik (4. Semester)', bullets: [
        'Fokus: Datenanalyse, Prozessoptimierung, IT‑Systeme und Digitalisierung.',
        'Erlernte Konzepte: E‑Marketing, Datenbanken, BPMN, IT‑Projektmanagement, KI & Requirements Engineering.',
        'Notenschnitt ca. 5.5 (bisher).'
      ]},
      { period: '2004 – 2007', title: 'Ambühl Werbung AG Bern', subtitle: 'Lehre mit EFZ als Werbetechniker' },
      { period: '2002 – 2004', title: 'Roth Malerei AG Solothurn', subtitle: '2. & 3. Lehrjahr Maler, Abschluss EFZ' },
      { period: '2001 – 2002', title: 'Rekrutenschule und Temporäre Arbeit als Maler' },
      { period: '1999 – 2001', title: 'Branger & Frigerio Solothurn', subtitle: '1. & 2. Lehrjahr als Maler' },
      { period: '1996 – 1999', title: 'Sekundarschule Bellach SO' },
      { period: '1989 – 1996', title: 'Primarschule Bellach SO' },
    ] },
    { label: 'Nebenberufliche Tätigkeiten bis 2020', items: [
      { period: '2018 – 2020', title: 'Inhaber & Betreiber Cube Club Bern', bullets: [
        'Vollständige Organisation, Leitung, wirtschaftliche Verantwortung und Führung von bis zu 18 Mitarbeitenden.',
        'Marketing, Online‑Auftritt, Eventplanung und Budgetierung.'
      ]},
      { period: '2009 – 2020', title: 'Organisation und Durchführung diverser Events', bullets: [
        'Planung und Durchführung von Events im Gaskessel Bern und weiteren Locations.',
        'Organisation eines Love Mobiles an der Streetparade Zürich (2011–2015).',
        'Programm‑ und Eventmanagement im Babette Club Zürich.'
      ]}
    ] },
  ];
  return (
    <section id="cv" className="container-narrow px-4 space-y-6">
      {blocks.map((b, bi) => (
        <div key={bi}>
          <div className="label-pill inline-block">{b.label}</div>
          <div className="timeline mt-2">
            {b.items.map((it, idx) => (
              <div className="timeline-item" key={idx}>
                <details className="accordion" open={idx === 0}>
                  <summary>
                    <span className="badge">{it.period}</span>
                    <span className="ml-2 font-medium">{it.title}</span>
                    {it.subtitle ? <span className="ml-2 text-slate-500">{it.subtitle}</span> : null}
                  </summary>
                  <div>
                    {Array.isArray(it.bullets) && it.bullets.length ? (
                      <ul className="cv-summary">{it.bullets.map((bb, i) => <li key={i}>{bb}</li>)}</ul>
                    ) : null}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ProjectsAdmin({ items, setItems }) {
  const [form, setForm] = useState({ type: 'certificate', title: '', description: '', url: '', file: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function createItem() {
    setBusy(true); setErr('');
    try {
      let payload = { ...form };
      if (form.file) {
        const fd = new FormData(); fd.append('file', form.file);
        const up = await api('/api/upload', { method: 'POST', body: fd });
        payload.url = up.file.url;
      }
      const res = await api('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: payload.type, title: payload.title, description: payload.description, url: payload.url || '', code: '' }) });
      setItems((prev) => [res.item, ...prev]);
      setForm({ type: 'certificate', title: '', description: '', url: '', file: null });
    } catch (e) { setErr(String(e.message || e)); } finally { setBusy(false); }
  }
  async function remove(id) {
    if (!confirm('Eintrag wirklich löschen?')) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((x) => x.id !== id));
  }
  return (
    <section className="container-narrow px-4 space-y-6">
      <Reveal><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-900">Admin – Inhalte</h2></div></Reveal>
      <Reveal className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Typ</label>
            <select className="mt-1 w-full rounded-lg border-slate-300" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {['project','photo','cv','certificate','zeugnis','diploma','language','pdf','link','code'].map((t) => <option key={t} value={t}>{t}</option>)}
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
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Datei-Upload (optional)</label>
            <input type="file" className="mt-1 w-full" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button disabled={busy} onClick={createItem} className="btn btn-primary px-4 py-2 disabled:opacity-60">{busy ? 'Speichern…' : 'Speichern'}</button>
          {err ? <div className="text-sm text-red-600">{err}</div> : null}
        </div>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <Reveal key={i.id} className="card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-slate-900 font-semibold">{i.title || i.type}</div>
                <div className="text-xs text-slate-500">Typ: {i.type}</div>
              </div>
              <button className="text-red-600 text-sm" onClick={() => remove(i.id)}>Löschen</button>
            </div>
            {i.description ? <div className="text-sm text-slate-600">{i.description}</div> : null}
            {i.url ? <a className="link-blue text-sm" href={i.url} target="_blank" rel="noreferrer">Öffnen</a> : null}
          </Reveal>
        ))}
        {!items.length && (<div className="text-sm text-slate-500">Noch keine Einträge vorhanden.</div>)}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="kontakt" className="container-narrow px-4 py-10">
      <Reveal><div className="label-pill inline-block">Kontakt</div></Reveal>
      <Reveal className="mt-3">
        <div className="card p-5">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Kontakt</h2>
          <ul className="text-slate-700 space-y-2">
            <li>Bern, Schweiz</li>
            <li>+41 79 511 09 11</li>
            <li><a className="link-blue" href="mailto:kontakt@marcelspahr.ch">kontakt@marcelspahr.ch</a></li>
            <li><a className="link-blue" href="https://www.marcelspahr.ch" target="_blank" rel="noreferrer">www.marcelspahr.ch</a></li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="tag">Deutsch (Muttersprache)</span>
            <span className="tag">Englisch (A2)</span>
            <span className="tag">Führerausweis Kat. B</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function AppShell() {
  const [items, setItems] = useState([]);
  const [role, setRole] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        // Try backend session first (dynamic mode)
        const sess = await api('/api/session');
        setRole(sess?.user?.role || null);
        const p = await api('/api/projects');
        setItems(p.items || []);
        try { const av = await api('/api/assets/avatar'); if (av && av.url) setAvatar(av.url); } catch {}
      } catch (e) {
        // Static fallback (no backend): public viewer + static data
        try {
          setRole('viewer');
          const fallback = await fetch('/assets/projects.json').then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] }));
          const arr = Array.isArray(fallback) ? fallback : (fallback.items || []);
          setItems(arr);
        } catch {}
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Lädt…</div>;
  return (
    <>
      <Navbar role={role} />
      <Routes>
        <Route path="/" element={<Home items={items} avatar={avatar} />} />
        {role === 'owner' ? <Route path="/projects" element={<ProjectsAdmin items={items} setItems={setItems} />} /> : null}
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home items={items} avatar={avatar} />} />
      </Routes>
      <footer className="container-narrow px-4 py-10 text-xs text-slate-500">© {new Date().getFullYear()} Marcel Spahr</footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
