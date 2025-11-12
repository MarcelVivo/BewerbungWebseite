/* global React, ReactDOM */
// React SPA for MS Bewerbung

const { useEffect, useMemo, useRef, useState } = React;

// --- Utils ---
async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

function clsx(...parts) {
  return parts.filter(Boolean).join(' ');
}

// --- Scroll reveal ---
function useReveal(ref, opts = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rootMargin = opts.rootMargin || '0px 0px -10% 0px';
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-visible');
          io.unobserve(e.target);
        }
      });
    }, { root: null, threshold: 0.08, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, opts.rootMargin]);
}

function Reveal({ className, children, as: Tag = 'div', delay = 0 }) {
  const r = useRef(null);
  useReveal(r);
  return (
    <Tag ref={r} className={clsx('reveal', delay ? `reveal-delay-${delay}` : '', className)}>{children}</Tag>
  );
}

// --- Navbar ---
function Navbar({ current, onNav, role, onLogout }) {
  const items = ['home', ...(role === 'owner' ? ['projects'] : []), 'contact'];
  return (
    <header className="nav-blue sticky top-0 z-10">
      <div className="container-narrow px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="brand-name text-xl font-semibold text-slate-900">Marcel Spahr</div>
          <span className="hidden sm:inline text-slate-700 label-pill">Wirtschaftsinformatiker</span>
        </div>
        <nav className="flex items-center gap-1">
          {items.map((id) => (
            <button key={id}
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium', current === id ? 'bg-ms-600 text-white' : 'hover:bg-ms-100 text-slate-700')}
              onClick={() => onNav(id)}>
              {id === 'home' ? 'Start' : id === 'projects' ? 'Projekte' : 'Kontakt'}
            </button>
          ))}
          <button className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-ms-100 hover:bg-ms-200 text-slate-700" onClick={onLogout}>Logout</button>
        </nav>
      </div>
    </header>
  );
}

// --- Hero ---
function Hero({ avatarUrl, items }) {
  function findCvUrl() {
    const byType = (items || []).find((i) => (i.type || '').toLowerCase() === 'cv');
    if (byType && byType.url) return byType.url;
    const byTitle = (items || []).find((i) => /lebenslauf|curriculum\s*vitae|\bcv\b/i.test(i.title || '') && /pdf|link|cv/i.test(i.type || ''));
    if (byTitle && byTitle.url) return byTitle.url;
    return 'assets/CV.pdf';
  }
  const cvUrl = findCvUrl();
  return (
    <section className="hero border-b border-sky-100">
      <div className="container-narrow px-4 py-10 grid md:grid-cols-2 gap-8 items-start">
        <Reveal>
          <div>
            <div className="flex items-center gap-6">
              <img src={avatarUrl || 'https://api.dicebear.com/9.x/initials/svg?seed=Marcel%20Spahr'} alt="Foto von Marcel Spahr" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-soft bg-white" />
              <div>
                <h1 className="brand-name text-3xl md:text-4xl font-semibold text-slate-900">Marcel Spahr</h1>
                <div className="mt-2 label-pill inline-flex">Wirtschaftsinformatiker</div>
              </div>
            </div>
            <p className="mt-5 text-slate-700 leading-relaxed max-w-2xl">Kreativer Wirtschaftsinformatiker mit technischem Verständnis, Empathie und digitalem Gespür.</p>
            <p className="mt-3 text-slate-700 leading-relaxed max-w-2xl">Meine Leidenschaft ist es, technisches Know-how mit kreativen Ideen zu verbinden. Mit langjähriger Erfahrung im Marketing und Online-Business gestalte ich individuelle Kundenerlebnisse. Mein Talent für strategische Planung, Organisation und vernetztes Denken erlaubt mir, effizient, kundenorientiert und wirtschaftlich sinnvoll zu handeln. Die Begeisterung für digitale Innovationen treibt mich an, mein Wissen stetig zu erweitern und Lösungen mit technologischem Fortschritt zu verbinden.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a className="btn btn-primary px-4 py-2" href={cvUrl} target="_blank" rel="noreferrer">Lebenslauf (PDF)</a>
              <a className="btn btn-soft px-4 py-2" href="#docs">Alle Dokumente ansehen</a>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <aside className="card p-5 bg-white/90 sticky-aside">
            <h3 className="text-sm tracking-widest font-bold text-slate-700 mb-3">Kontakt</h3>
            <ul className="text-slate-700 space-y-2">
              <li>Bern, Schweiz</li>
              <li>+41 79 511 09 11</li>
              <li><a className="link-blue" href="mailto:marcelspahr82@bluewin.ch">marcelspahr82@bluewin.ch</a></li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="tag">Deutsch</span>
              <span className="tag">Englisch B1</span>
            </div>

            <div className="mt-6">
              <div className="label-pill inline-block mb-2">Skills</div>

              <details className="accordion mb-2" open>
                <summary><span className="badge">Soft Skills</span><span className="ml-2 font-medium">Persönliche Stärken</span></summary>
                <div className="skills-list">
                  <ul>
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
                  </ul>
                </div>
              </details>

              <details className="accordion mb-2">
                <summary><span className="badge">Tech Skills</span><span className="ml-2 font-medium">Wirtschaftsinformatik & IT</span></summary>
                <div className="skills-list">
                  <ul>
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
                  </ul>
                </div>
              </details>

              <details className="accordion mb-2">
                <summary><span className="badge">Praxis</span><span className="ml-2 font-medium">Support & Administration</span></summary>
                <div className="skills-list">
                  <ul>
                    <li>1st/2nd Level Support</li>
                    <li>Systemadministration (Tech & Admin)</li>
                    <li>Workflow‑Optimierung im Kundenservice</li>
                    <li>Retention‑ & Sales‑Prozesse</li>
                  </ul>
                </div>
              </details>

              <details className="accordion mb-2">
                <summary><span className="badge">Kreative Skills</span><span className="ml-2 font-medium">Marketing & Content</span></summary>
                <div className="skills-list">
                  <ul>
                    <li>Videoproduktion</li>
                    <li>Adobe Photoshop & Illustrator</li>
                    <li>Marketingkenntnisse & Erfahrung</li>
                    <li>Content‑Erstellung</li>
                  </ul>
                </div>
              </details>

              <details className="accordion mb-2">
                <summary><span className="badge">Software</span><span className="ml-2 font-medium">Tools</span></summary>
                <div className="skills-list">
                  <ul>
                    <li>Windows & macOS</li>
                    <li>Microsoft Office 365</li>
                    <li>Jira & Confluence</li>
                    <li>Git & GitHub</li>
                    <li>VS Code</li>
                    <li>Power BI</li>
                    <li>Figma & Miro</li>
                  </ul>
                </div>
              </details>

              <details className="accordion">
                <summary><span className="badge">Sprachen</span><span className="ml-2 font-medium">Languages</span></summary>
                <div className="skills-list">
                  <ul>
                    <li>Deutsch (Muttersprache)</li>
                    <li>Englisch (B1)</li>
                  </ul>
                </div>
              </details>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}

// --- Documents grid (derived from items) ---
function Documents({ items, onOpen }) {
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

  return (
    <section id="docs" className="container-narrow px-4 space-y-4">
      <Reveal>
        <div className="label-pill inline-block">Zeugnisse, Nachweise & Zertifikate</div>
      </Reveal>
      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button key={c.id} onClick={() => setTab(c.id)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium', tab === c.id ? 'bg-ms-600 text-white' : 'hover:bg-ms-100 text-slate-700')}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((i) => (
          <Reveal key={i.id} className="card p-4 flex flex-col gap-2">
            <div className="text-slate-900 font-semibold">{i.title || i.type}</div>
            {i.description ? <div className="text-sm text-slate-600">{i.description}</div> : null}
            <div className="flex gap-2 mt-auto">
              {i.url ? (
                <button className="btn btn-soft px-3 py-1.5" onClick={() => onOpen(i)}>Öffnen</button>
              ) : null}
            </div>
          </Reveal>
        ))}
        {!filtered.length && (
          <div className="text-sm text-slate-500">Keine Dokumente vorhanden.</div>
        )}
      </div>
    </section>
  );
}

// --- Admin: Projects list + create ---
function AdminProjects({ items, setItems }) {
  const [form, setForm] = useState({ type: 'certificate', title: '', description: '', url: '', file: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function createItem() {
    setBusy(true); setErr('');
    try {
      let payload = { ...form };
      if (form.file) {
        const fd = new FormData();
        fd.append('file', form.file);
        const up = await api('/api/upload', { method: 'POST', body: fd });
        payload.url = up.file.url;
      }
      const res = await api('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          type: payload.type, title: payload.title, description: payload.description, url: payload.url || '', code: ''
        })
      });
      setItems((prev) => [res.item, ...prev]);
      setForm({ type: 'certificate', title: '', description: '', url: '', file: null });
    } catch (e) {
      setErr(String(e.message || e));
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Eintrag wirklich löschen?')) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <section className="container-narrow px-4 space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Admin – Inhalte</h2>
        </div>
      </Reveal>
      <Reveal className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Typ</label>
            <select className="mt-1 w-full rounded-lg border-slate-300" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="certificate">Zertifikat</option>
              <option value="language">Sprache</option>
              <option value="reference">Arbeitszeugnis</option>
              <option value="diploma">Diplom</option>
              <option value="pdf">PDF</option>
              <option value="link">Link</option>
              <option value="photo">Foto</option>
              <option value="project">Projekt</option>
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
        {!items.length && (
          <div className="text-sm text-slate-500">Noch keine Einträge vorhanden.</div>
        )}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="kontakt" className="container-narrow px-4 py-10">
      <Reveal>
        <div className="label-pill inline-block">Kontakt</div>
      </Reveal>
      <Reveal className="mt-3">
        <div className="card p-5">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Kontakt</h2>
          <ul className="text-slate-700 space-y-2">
            <li>Bern, Schweiz</li>
            <li>+41 79 511 09 11</li>
            <li><a className="link-blue" href="mailto:marcelspahr82@bluewin.ch">marcelspahr82@bluewin.ch</a></li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="tag">Deutsch</span>
            <span className="tag">Englisch B1</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Viewer({ file, onBack }) {
  return (
    <section className="container-narrow px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-slate-900">{file?.title || 'Dokument'}</h2>
        <div className="flex items-center gap-2">
          {file?.url ? <a href={file.url} target="_blank" rel="noreferrer" className="btn btn-soft px-3 py-1.5">In neuem Tab öffnen</a> : null}
          {file?.url ? <a href={file.url} download className="btn btn-primary px-3 py-1.5">Download</a> : null}
          <button className="btn btn-soft px-3 py-1.5" onClick={onBack}>Zurück</button>
        </div>
      </div>
      <div className="card p-2">
        {file?.url ? (
          <iframe className="pdf-frame" src={file.url}></iframe>
        ) : (
          <div className="p-6 text-slate-600">Keine Datei.</div>
        )}
      </div>
    </section>
  );
}

function CvSection() {
  const blocks = [
    {
      label: 'Beruflicher Werdegang',
      items: [
        {
          period: '2008 – 2025',
          title: 'Swisscom Schweiz AG',
          subtitle: 'IT-Support, Systemadministration & Prozessdigitalisierung',
          bullets: [
            'Mitarbeit bei der Digitalisierung interner Prozesse (z. B. Projekt X‑ITE) und Verbesserung der Kundenkommunikation.',
            '1st/2nd Level Support und Systemadministration für Privatkunden (Tech & Admin).',
            'Analyse und Lösung von IT‑Problemen, Optimierung von Workflows im Kundenservice.',
            'Betreuung von Retention‑ und Sales‑Management‑Prozessen.'
          ]
        },
        {
          period: '2007 – 2008',
          title: 'Freelance Einsätze als Werbetechniker',
          subtitle: 'Frontwork Zürich; Seka Thun',
          bullets: [
            'Umsetzung von Markenauftritten und Shop‑Redesigns (u. a. Swisscom Shops Schweiz).',
            'Event‑/Sportproduktion (EM 2008 Projekte).'
          ]
        }
      ]
    },
    {
      label: 'Schulausbildung, Lehrabschlüsse (EFZ) & aktuelles Studium',
      items: [
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
      ]
    },
    {
      label: 'Nebenberufliche Tätigkeiten bis 2020',
      items: [
        { period: '2018 – 2020', title: 'Inhaber & Betreiber Cube Club Bern', bullets: [
          'Eventplanung, ‑organisation und ‑durchführung; Budget & Marketing (Ticketing, Getränke, Merchandise).',
          'Leitung mit Personalverantwortung (bis 18 Mitarbeitende).',
          'Erstellung & Betrieb der Webseite cube.club.'
        ]},
        { period: '2009 – 2020', title: 'Organisation und Durchführung diverser Events', bullets: [
          'Mehrere Events in Gaskessel Bern und anderen Lokalen.',
          '2011–2015: Organisation Love Mobile / Streetparade Zürich.',
          'Event‑ und Programm‑Management im Babette Club Zürich.'
        ]}
      ]
    }
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
                      <ul className="cv-summary">
                        {it.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
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

// --- App ---
function App() {
  const [route, setRoute] = useState('home');
  const [items, setItems] = useState([]);
  const [role, setRole] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sess = await api('/api/session');
        setRole(sess?.user?.role || null);
        const p = await api('/api/projects');
        setItems(p.items || []);
        try {
          const av = await api('/api/assets/avatar');
          if (av && av.url) setAvatar(av.url);
        } catch {}
      } catch (e) {
        // Not authenticated → redirect to login
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openItem(i) {
    if (!i || !i.url) return;
    setViewer({ url: i.url, title: i.title || 'Dokument' });
    setRoute('viewer');
  }

  async function logout() {
    try { await fetch('/api/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">Lädt…</div>
    );
  }

  return (
    <div>
      <Navbar current={route} onNav={setRoute} role={role} onLogout={logout} />
      {route === 'home' && (
        <>
          <Hero avatarUrl={avatar} items={items} />
          <div className="h-6" />
          <CvSection />
          <Documents items={items.filter((i) => ['certificate','language','reference','diploma','pdf','zeugnis'].includes(i.type))} onOpen={openItem} />
        </>
      )}
      {route === 'projects' && role === 'owner' && (
        <AdminProjects items={items} setItems={setItems} />
      )}
      {route === 'contact' && (
        <Contact />
      )}
      {route === 'viewer' && (
        <Viewer file={viewer} onBack={() => setRoute('home')} />
      )}
      <footer className="container-narrow px-4 py-10 text-xs text-slate-500">
        © {new Date().getFullYear()} Marcel Spahr
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
