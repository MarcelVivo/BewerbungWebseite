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
  const items = ['/', '/contact'];
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
          <button className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-ms-100 hover:bg-ms-200 text-slate-700" onClick={async () => { try { await fetch('/api/logout', { method: 'POST' }); } finally { window.location.href = '/login'; } }}>Logout</button>
        </nav>
      </div>
    </header>
  );
}

// Hauptseite zeigt Arbeitsweise und Nachweise (kein Marketing, nur Haltung).
function SystemsThinkingPage({ items, avatar }) {
  const quickDocs = [
    { label: 'SCRUM Zertifikat', url: '/assets/SCRUMZertifikat.pdf' },
    { label: 'SAFe Zertifikat', url: '/assets/SAFeZertifikatMarcelSpahr.pdf' },
    { label: 'Englisch Zertifikat', url: '/assets/CambridgeEnglischA2ZertifikatMarcelSpahr.pdf' },
    { label: 'Arbeitszeugnis Swisscom', url: '/assets/ArbeitszeugnisMarcelSpahr2025.pdf' },
  ];
  const cvDoc = (items || []).find((i) => (i.type || '').toLowerCase() === 'cv') || (items || []).find((i) => /lebenslauf|cv/i.test(i.title || ''));
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
                  <div className="mt-2 label-pill inline-flex">Denkt in Systemen, Prozessen und Wirkung</div>
                </div>
              </div>
              <div className="mt-5 max-w-2xl card bg-white/80 p-5 shadow-sm space-y-3">
                <p className="text-slate-700 leading-relaxed">Ich arbeite als Wirtschaftsinformatiker, der Fachlichkeit, Daten und Menschen zusammenbringt. Entscheidungen stütze ich auf Fakten und beobachtbare Wirkung.</p>
                <p className="text-slate-700 leading-relaxed">Langjährige Praxis bei Swisscom in Support, Systembetrieb und Prozessdigitalisierung zeigt: stabile Services entstehen, wenn Abläufe klar sind und Verantwortung bekannt ist. Genau das treibt mich an.</p>
                <p className="text-slate-700 leading-relaxed">Ich lerne weiter: Wirtschaftsinformatik HF (Feusi Bern), Abschluss geplant Sommer 2026. Fokus auf Umsetzung, nicht auf Schlagworte.</p>
              </div>
              <div className="mt-4 max-w-2xl card bg-ms-50/60 p-4 shadow-sm border border-ms-100 space-y-2">
                <div className="text-slate-800 font-semibold">Wie ich arbeite</div>
                <ul className="list-disc ml-4 text-slate-700 space-y-1">
                  <li>Prozesse zuerst verstehen, dann vereinfachen und erst danach digitalisieren.</li>
                  <li>Business und IT in Sprache, Bildern und Zahlen zusammenbringen.</li>
                  <li>Schrittweise liefern, Risiken klein halten, Ergebnisse messen.</li>
                  <li>Transparente Kommunikation, saubere Dokumentation, klare Zuständigkeiten.</li>
                  <li>Lernen als Dauerzustand: Feedback aufnehmen, Hypothesen testen.</li>
                </ul>
              </div>
              <div className="mt-4 max-w-2xl card bg-white/80 p-4 shadow-sm border border-slate-100 space-y-2">
                <div className="text-slate-800 font-semibold">Warum Wirtschaftsinformatik</div>
                <p className="text-slate-700">Ich habe früh gemerkt, dass gute IT nur wirkt, wenn Prozesse und Menschen mitgehen. Als Wirtschaftsinformatiker halte ich beide Seiten zusammen: fachliche Ziele, stabile Systeme, verständliche Lösungen.</p>
              </div>
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
            <div className="label-pill inline-block mb-2">Dokumente & Praktische Arbeiten</div>
            <div className="grid grid-cols-2 gap-2">
              <a className="card p-3 text-sm font-semibold text-slate-800 hover:bg-ms-50" href="#cat-diplome">DIPLOME & EFZ</a>
              <a className="card p-3 text-sm font-semibold text-slate-800 hover:bg-ms-50" href="#cat-zertifikate">ZERTIFIKATE</a>
              <a className="card p-3 text-sm font-semibold text-slate-800 hover:bg-ms-50" href="#cat-arbeitszeugnisse">ARBEITSZEUGNISSE</a>
              <a className="card p-3 text-sm font-semibold text-slate-800 hover:bg-ms-50" href="#cat-portfolio">PROJEKT PORTFOLIO</a>
            </div>
          </div>
          <div>
            <div className="label-pill inline-block mb-2">Lebenslauf</div>
            {cvDoc ? (
              <div className="space-y-3">
                <div className="text-slate-900 font-semibold">{prettyTitle(cvDoc)}</div>
                {cvDoc.description ? <div className="text-sm text-slate-600">{cvDoc.description}</div> : null}
                <div className="flex gap-2">
                  <a className="btn btn-soft px-3 py-1.5" href={docUrl(cvDoc.url)} target="_blank" rel="noreferrer">Öffnen</a>
                  <a className="btn btn-primary px-3 py-1.5" href={docUrl(cvDoc.url)} download>Download</a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Noch kein Lebenslauf hinterlegt.</div>
            )}
          </div>
          <div>
            <div className="label-pill inline-block mb-2">Skills</div>
            <details className="accordion mb-2" open>
              <summary><span className="badge">Tech Skills</span><span className="ml-2 font-medium">Technische Kenntnisse</span></summary>
              <div className="skills-list"><ul>
                <li>IT‑Projektmanagement (Scrum/Kanban) & Releaseplanung</li>
                <li>KI & Prompt Engineering für effiziente Automatisierung</li>
                <li>Datenbanken & SQL; Datenmodelle und Reporting</li>
                <li>Geschäftsprozessmodellierung (BPMN) & Prozessoptimierung</li>
                <li>Requirements Engineering (User Stories, Use Cases, Akzeptanzkriterien)</li>
                <li>Grundkenntnisse Programmierung & API‑Design</li>
                <li>Blockchain‑/Krypto‑Technologie Grundlagen</li>
                <li>Windows, macOS, Microsoft 365</li>
              </ul></div>
            </details>
            <details className="accordion mb-2">
              <summary><span className="badge">Kreativität</span><span className="ml-2 font-medium">Kreativität & Marketing</span></summary>
              <div className="skills-list"><ul>
                <li>Videoproduktion & Storytelling für digitale Kanäle</li>
                <li>Adobe Photoshop & Illustrator</li>
                <li>Online‑Marketing und E‑Commerce Konzepte</li>
                <li>Konzeption & Umsetzung digitaler Inhalte und Kampagnen</li>
              </ul></div>
            </details>
            <details className="accordion mb-2">
              <summary><span className="badge">Stärken</span><span className="ml-2 font-medium">Persönliche Stärken</span></summary>
              <div className="skills-list"><ul>
                <li>Analytisches Denken & Problemlösungsfähigkeit</li>
                <li>Kommunikationsstark mit Stakeholdern</li>
                <li>Organisationstalent und Priorisierung</li>
                <li>Zuverlässig, geduldig, qualitätsorientiert</li>
                <li>Hohe Lernbereitschaft & Eigeninitiative</li>
                <li>Empathisch und teamorientiert</li>
              </ul></div>
            </details>
            <details className="accordion">
              <summary><span className="badge">Sprachen</span><span className="ml-2 font-medium">Languages</span></summary>
              <div className="skills-list"><ul>
                <li>Deutsch (Muttersprache)</li>
                <li>Englisch (A2)</li>
              </ul></div>
            </details>
          </div>
        </aside>
      </Reveal>
    </div>
  </section>
      {/* Projektlogik zeigt, wie Entscheidungen getroffen wurden. */}
      <section className="container-narrow px-4 py-8 space-y-4">
        <div className="label-pill inline-block">Arbeitsbeispiele</div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              title: 'Serviceprozesse stabilisieren (Swisscom)',
              bullets: [
                'Ausgangslage: wiederkehrende Eskalationen im Support und unklare Verantwortungen.',
                'Rolle: 1st/2nd Level, Aufbau von Prozessklarheit und Wissensbasis.',
                'Denkansatz: wenige, messbare Schritte definieren, Engpaesse sichtbar machen, Wissen teilen.',
                'Wirkung: kuerzere Eskalationsketten, nachvollziehbare Loesungen, ruhigerer Betrieb.'
              ]
            },
            {
              title: 'Digitale Abläufe nachschaerfen',
              bullets: [
                'Ausgangslage: verstreute Tools und Medienbrueche im Kundenkontakt.',
                'Rolle: Prozessunterstuetzung und Dokumentation, Vermittler zwischen Fach und IT.',
                'Denkansatz: erst Prozess skizzieren, dann Tooling vereinfachen, danach automatisieren.',
                'Wirkung: weniger Nacharbeiten, klarere Zuständigkeiten, messbare Durchlaufzeiten.'
              ]
            },
            {
              title: 'Eventbetrieb mit Verantwortung',
              bullets: [
                'Ausgangslage: Personal, Sicherheit, Budget und Zeitdruck im Clubbetrieb.',
                'Rolle: Leitung, Finanzen, Einsatzplanung, Kommunikation mit Partnern.',
                'Denkansatz: Risiken klein schneiden, Rollen definieren, ruhige Kommunikation.',
                'Wirkung: planbare Events, entlastete Teams, stabile Zahlen.'
              ]
            },
            {
              title: 'Warum Wirtschaftsinformatik',
              bullets: [
                'Ausgangslage: IT greift nur, wenn Menschen, Prozesse und Daten zusammenpassen.',
                'Rolle: Uebersetzer zwischen Fachziel und technischer Umsetzung.',
                'Denkansatz: Klarheit schaffen, Verantwortung sichtbar machen, Daten nutzen.',
                'Wirkung: loesungsorientierte Entscheidungen statt Tool-Glaeubigkeit.'
              ]
            }
          ].map((c, idx) => (
            <div key={idx} className="card p-4 space-y-2">
              <div className="text-slate-900 font-semibold">{c.title}</div>
              <ul className="cv-summary">
                {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <RealWorldExperience />
      <ProofOfWorkLibrary items={items.filter((i) => ['certificate','language','reference','diploma','pdf','zeugnis'].includes(i.type))} />
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

function ProofOfWorkLibrary({ items }) {
  const categories = [
    { id: 'alle', label: 'Alle' },
    { id: 'cv', label: 'Lebenslauf', match: (i) => /^(cv)$/i.test(i.type || '') || /lebenslauf|cv/i.test(i.title || '') },
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
    if (u.startsWith('/api/upload?file=')) return u;
    if (u.startsWith('/api/uploads/')) return `/api/upload?file=${encodeURIComponent(u.replace('/api/uploads/', ''))}`;
    if (u.startsWith('/uploads/')) return `/api/upload?file=${encodeURIComponent(u.replace('/uploads/', ''))}`;
    if (u.startsWith('/')) return u;
    return `/api/upload?file=${encodeURIComponent(u)}`;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id={`cat-${tab === 'alle' ? 'alle' : tab}`}>
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
              <button className="btn btn-soft px-3 py-1.5" onClick={() => setViewer(null)}>Schliessen</button>
            </div>
          </div>
          <iframe className="pdf-frame" src={docUrl(viewer.url)}></iframe>
        </div>
      ) : null}
    </section>
  );
}

// Laufbahn als Prozess: Ausgangslage, Rolle, Denkansatz, Wirkung.
function RealWorldExperience() {
  const blocks = [
    { label: 'Berufliche Praxis', items: [
      { period: '2008 - 2025', title: 'Swisscom Schweiz AG', subtitle: 'Support, Systembetrieb, Prozessarbeit', bullets: [
        'Ausgangslage: hoher Kundendruck, heterogene Systeme.',
        'Rolle: 1st/2nd Level, später Systemadministration und Prozessdigitalisierung.',
        'Denkansatz: Abläufe erst stabilisieren, dann automatisieren; Messpunkte definieren.',
        'Wirkung: weniger Eskalationen, nachvollziehbare Workflows, klares Wissen im Team.'
      ]},
      { period: '2007 - 2008', title: 'Freelance Werbetechnik', subtitle: 'Frontwork Zürich; Seka Thun', bullets: [
        'Ausgangslage: zeitkritische Projekte (EM 08) und Shop-Redesigns.',
        'Rolle: Umsetzung vor Ort, Qualitätssicherung, Koordination.',
        'Denkansatz: klare Absprachen, saubere Übergaben, sichtbare Ergebnisse.',
        'Wirkung: termingerechte Installationen, konsistente Markenauftritte.'
      ]}
    ] },
    { label: 'Ausbildung und Studium', items: [
      { period: '2023 - heute', title: 'Wirtschaftsinformatik HF, Feusi Bern', subtitle: '4. Semester', bullets: [
        'Motivation: Brücke zwischen Fachbereich und IT stärken.',
        'Fokus: Prozesse, Daten, Requirements Engineering, Projektsteuerung.',
        'Status: noch im Studium, Praxis bleibt Leitplanke.'
      ]},
      { period: '2004 - 2007', title: 'EFZ Werbetechniker', subtitle: 'Ambühl Werbung AG Bern', bullets: [
        'Ausgangslage: handwerkliche Fertigung mit engen Timelines.',
        'Wirkung: sorgfaeltige Arbeit unter Zeitdruck, klare Kundenkommunikation.'
      ]},
      { period: '2002 - 2004', title: 'EFZ Maler', subtitle: 'Roth Malerei AG Solothurn', bullets: [
        'Ausgangslage: praezise Ausführung und Teamarbeit.',
        'Wirkung: Sorgfalt und Verantwortung als Routine.'
      ]},
      { period: '1999 - 2001', title: 'EFZ Maler', subtitle: 'Branger & Frigerio Solothurn' },
      { period: '1996 - 1999', title: 'Sekundarschule Bellach SO' },
      { period: '1989 - 1996', title: 'Primarschule Bellach SO' },
    ] },
    { label: 'Nebenberufliche Praxis', items: [
      { period: '2018 - 2020', title: 'Cube Club Bern', subtitle: 'Inhaber, Betreiber', bullets: [
        'Ausgangslage: Eventbetrieb mit Personal- und Budgetverantwortung.',
        'Rolle: Leitung, Finanzen, Personalführung (bis 18 Personen).',
        'Denkansatz: klare Rollen, einfache Prozesse, transparente Zahlen.',
        'Wirkung: planbare Ablaeufe, nachvollziehbare Entscheide.'
      ]},
      { period: '2009 - 2020', title: 'Eventorganisation', subtitle: 'Bern, Streetparade, Clubs', bullets: [
        'Ausgangslage: wechselnde Locations, Sicherheits- und Zeitvorgaben.',
        'Rolle: Planung, Betrieb, Teamsteuerung.',
        'Denkansatz: Risiken klein halten, Szenarien durchspielen, ruhige Kommunikation.',
        'Wirkung: Events sicher durchgefuehrt, Teams entlastet, Gaeste zufrieden.'
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
      <Reveal><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-900">Admin - Inhalte</h2></div></Reveal>
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
  const [avatar, setAvatar] = useState('/assets/portrait.jpg');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/assets/projects.json')
      .then(r => r.ok ? r.json() : { items: [] })
      .then((fallback) => {
        const arr = Array.isArray(fallback) ? fallback : (fallback.items || []);
        setItems(arr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Lädt…</div>;
  return (
    <>
      <Navbar role={null} />
      <Routes>
        <Route path="/" element={<SystemsThinkingPage items={items} avatar={avatar} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<SystemsThinkingPage items={items} avatar={avatar} />} />
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
