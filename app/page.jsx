"use client";
import { useEffect, useRef, useState } from 'react';

function useReveal(ref, opts = {}) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('reveal-visible'); io.unobserve(e.target); } });
    }, { root: null, threshold: 0.08, rootMargin: opts.rootMargin || '0px 0px -10% 0px' });
    io.observe(el); return () => io.disconnect();
  }, [ref, opts.rootMargin]);
}

function Reveal({ as: Tag = 'div', children, className = '' }) {
  const r = useRef(null); useReveal(r);
  return <Tag ref={r} className={`reveal ${className}`}>{children}</Tag>;
}

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [avatar, setAvatar] = useState('/assets/portrait.jpg');
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const categories = [
    { id: 'diploma', label: 'Diplome & EFZ', types: ['diploma', 'efz', 'cv'] },
    { id: 'certificate', label: 'Zertifikate', types: ['certificate'] },
    { id: 'reference', label: 'Arbeitszeugnisse & Referenzen', types: ['zeugnis', 'reference'] },
    { id: 'portfolio', label: 'Portfolio / Projekte', types: ['project', 'code', 'link', 'photo', 'pdf'] },
  ];
  const quickDocs = [
    { label: 'SCRUM Zertifikat', url: '/assets/SCRUMZertifikat.pdf' },
    { label: 'SAFe Zertifikat', url: '/assets/SAFeZertifikatMarcelSpahr.pdf' },
    { label: 'Englisch Zertifikat', url: '/assets/CambridgeEnglischA2ZertifikatMarcelSpahr.pdf' },
    { label: 'Arbeitszeugnis Swisscom', url: '/assets/ArbeitszeugnisMarcelSpahr2025.pdf' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const sess = await fetch('/api/session');
        if (!sess.ok) throw new Error('no session');
        const data = await sess.json();
        setRole(data?.user?.role || 'viewer');
      } catch {
        window.location.href = '/login';
        return;
      }

      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('load failed');
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        fetch('/assets/projects.json')
          .then((r) => r.json())
          .then((j) => setItems(Array.isArray(j) ? j : (j.items || [])))
          .catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function logout() {
    fetch('/api/logout', { method: 'POST' }).finally(() => { window.location.href = '/login'; });
  }

  function categorize(list) {
    const buckets = {};
    categories.forEach((c) => { buckets[c.id] = []; });
    (list || []).forEach((it) => {
      const t = (it.type || '').toLowerCase();
      const cat = categories.find((c) => c.types.includes(t));
      const target = cat ? cat.id : 'portfolio';
      buckets[target] = buckets[target] || [];
      buckets[target].push(it);
    });
    return buckets;
  }

const categorized = categorize(items);
const docUrl = (u) => {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/api/upload?file=')) return u;
  if (u.startsWith('/api/uploads/')) return `/api/upload?file=${encodeURIComponent(u.replace(/^\\/api\\/uploads\\//, ''))}`;
  if (u.startsWith('/uploads/')) return `/api/upload?file=${encodeURIComponent(u.replace(/^\\/uploads\\//, ''))}`;
  if (u.startsWith('/')) return u;
  return `/api/upload?file=${encodeURIComponent(u)}`;
};

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Lädt…</div>;

  return (
    <>
      <header className="nav-blue sticky top-0 z-10">
        <div className="container-narrow px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="brand-name text-xl font-semibold text-slate-900">Marcel Spahr</div>
            <span className="hidden sm:inline text-slate-700 label-pill">Wirtschaftsinformatiker</span>
          </div>
          <nav className="flex items-center gap-2">
            <a className="px-3 py-1.5 rounded-lg text-sm hover:bg-ms-100" href="#dokumente">Dokumente</a>
            {role === 'owner' ? <a className="px-3 py-1.5 rounded-lg text-sm hover:bg-ms-100" href="/projects">Dokumente bearbeiten</a> : null}
            <button className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-ms-100 hover:bg-ms-200" onClick={logout}>Logout</button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero border-b border-sky-100">
          <div className="container-narrow px-4 py-10 grid md:grid-cols-2 gap-8 items-start">
            <Reveal>
              <div>
                <div className="flex items-center gap-6 sticky top-16">
                  <img src={avatar} alt="Foto von Marcel Spahr" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-soft bg-white" />
                  <div>
                    <h1 className="brand-name text-3xl md:text-4xl font-semibold text-slate-900">Marcel Spahr</h1>
                    <div className="mt-2 label-pill inline-flex">Wirtschaftsinformatiker</div>
                  </div>
                </div>
                <div className="mt-6 max-w-2xl card bg-white/80 p-5 shadow-sm">
                  <p className="text-slate-700 leading-relaxed">Kreativer Wirtschaftsinformatiker mit viel Verstand, Empathie & digitalem Gespür. Technisches Know-how mit kreativen Ideen zu verknüpfen, ist meine Leidenschaft.</p>
                  <p className="mt-3 text-slate-700 leading-relaxed">Mit viel Erfahrung in Marketing und Online-Business sowie als langjähriger Kundenberater schaffe ich individuelle Kundenerlebnisse. Mein Talent für strategische Planung, Organisation und vernetztes Denken ermöglicht es mir, effizient, kundenorientiert und wirtschaftlich sinnvoll zu handeln. Meine Begeisterung für digitale Innovationen treibt mich an, mein Wissen kontinuierlich zu erweitern und kreative Lösungen mit technologischem Fortschritt zu verbinden.</p>
                </div>
              </div>
            </Reveal>
            <div className="space-y-3 sticky top-24">
              <Reveal>
                <aside className="card p-5 bg-white/90">
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
                </aside>
              </Reveal>
              <Reveal>
                <div className="card p-4 bg-white/90">
                  <div className="label-pill inline-block mb-2">Top Dokumente</div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickDocs.map((d) => (
                      <a key={d.label} className="card p-3 text-sm font-semibold text-slate-800 hover:bg-ms-50" href={d.url} target="_blank" rel="noreferrer">
                        {d.label}
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <ResumeAndSkills />

        <section id="dokumente" className="container-narrow px-4 py-10">
          <Reveal>
            <h2 className="text-2xl font-semibold mb-6">Dokumente & Zertifikate</h2>
          </Reveal>
          <div className="space-y-8">
            {categories.map((cat) => {
              const docs = categorized[cat.id] || [];
              return (
                <Reveal key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="label-pill inline-block">{cat.label}</div>
                    <div className="text-xs text-slate-500">{docs.length} Dokument{docs.length === 1 ? '' : 'e'}</div>
                  </div>
                  {!docs.length && <div className="text-sm text-slate-500">Noch keine Dokumente hinterlegt.</div>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {docs.map((i, idx) => (
                      <div key={i.id || i.url || idx} className="card aspect-square p-4 flex flex-col gap-3">
                        <div className="font-medium text-slate-900 text-center">{prettyTitle(i)}</div>
                        <div className="flex-1 flex items-center justify-center text-sm text-slate-600 text-center">
                          {i.description ? i.description : <span className="text-xs text-slate-400">Keine Beschreibung</span>}
                        </div>
                        <div className="mt-auto flex items-center justify-center gap-2">
                          {i.url ? (
                            <>
                              <a className="btn btn-soft px-3 py-1.5" href={docUrl(i.url)} target="_blank" rel="noreferrer">Öffnen</a>
                              <a className="btn btn-primary px-3 py-1.5" href={docUrl(i.url)} download>Download</a>
                            </>
                          ) : (
                            <div className="text-sm text-slate-500">Kein Link hinterlegt</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      </main>
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

function ResumeAndSkills() {
  const resume = [
    { period: '2021 – 2025', title: 'Digitalisierung · Swisscom Schweiz AG', bullets: [
      'Mitgestaltung der Digitalisierung und Automatisierung interner Prozesse (z. B. In-House Chat-Formular) mit Fokus auf Effizienz und Kundenerlebnis.',
      'Optimierung von Datenbereitstellung und Reporting-Pipelines; enge Abstimmung mit Fachbereichen und IT.',
      'Priorisierung von Anforderungen, Erfolgsmessung und transparente Kommunikation mit Stakeholdern.'
    ]},
    { period: '2015 – 2021', title: 'Systemadministration · Swisscom Schweiz AG', bullets: [
      'Systemadministration für Privatkunden, Stabilität und Sicherheit im operativen Betrieb sichergestellt.',
      'Kontinuierliche Verbesserung von Support- und Service-Workflows; Wissenstransfer ins Team.',
      'Betreuung von Retention- und Sales-Prozessen, Schnittstelle zwischen Business und IT.'
    ]},
    { period: '2008 – 2015', title: 'Kundenservice Tech & Admin · Swisscom Schweiz AG', bullets: [
      'Analyse und Lösung technischer Kundenprobleme im First- und Second-Level-Support.',
      'Brücke zwischen Kundendienst und Technik, saubere Dokumentation und Coaching neuer Mitarbeitender.',
      'Verbesserung von Abläufen im Kundendienst, um Wartezeiten und Eskalationen zu reduzieren.'
    ]},
    { period: '2007 – 2008', title: 'Werbetechniker · Frontwork Zürich / Seka Thun', bullets: [
      'Umsetzung diverser Projekte zur Fussball EM 08.',
      'Redesign der Swisscom Shops in der Schweiz.',
      'Eventplanung, Organisation und Betreuung.',
      'Marketing, Ticketing, Verkauf und Merchandise.'
    ]},
    { period: '2004 – 2007', title: 'EFZ Werbetechniker · Ambühl Werbung AG Bern' },
    { period: '2001 – 2004', title: 'EFZ Maler · Roth Malerei AG Solothurn' },
    { period: '1996 – 1999', title: 'Sekundarschule Bellach' },
    { period: '1989 – 1996', title: 'Primarschule Bellach' },
  ];

  const sideJobs = [
    { period: '2018 – 2020', title: 'Inhaber & Betreiber Cube Club Bern', bullets: [
      'Vollständige Organisation, Leitung, wirtschaftliche Verantwortung und Führung von bis zu 18 Mitarbeitenden.',
      'Marketing, Online-Auftritt, Eventplanung und Budgetierung.'
    ]},
    { period: '2009 – 2020', title: 'Eventmanager (nebenberuflich)', bullets: [
      'Planung und Durchführung von Events im Gaskessel Bern und weiteren Locations.',
      'Organisation eines Love Mobiles an der Streetparade Zürich (2011–2015).',
      'Programm- und Eventmanagement im Babette Club Zürich.'
    ]},
  ];

  const skills = [
    { label: 'Technische Kompetenzen', bullets: [
      'IT-Projektmanagement, agile Arbeitsweisen (Scrum/Kanban), klare Backlogs und Priorisierung.',
      'Requirements Engineering: User Stories, Akzeptanzkriterien, BPMN-Prozessmodelle.',
      'Datenbanken & SQL: Modellierung, Joins/Views, Performance-Basics, saubere Datenpipelines.',
      'Grundlagen in Programmierung & APIs, Verständnis für saubere Schnittstellen und Versionierung.',
      'Tooling: Git/GitHub, Jira/Confluence, VS Code, Windows & macOS, Office 365.'
    ]},
    { label: 'Kreativität & Marketing', bullets: [
      'Videoproduktion und Content-Erstellung mit Adobe Photoshop/Illustrator.',
      'Online-Marketing und E-Commerce: Kampagnen, Landingpages und Performance-Tracking.',
      'Konzeption und Umsetzung digitaler Inhalte, abgestimmt auf Zielgruppen und Customer Journey.'
    ]},
    { label: 'Persönliche Stärken', bullets: [
      'Analytisches und vernetztes Denken, schnelle Auffassungsgabe.',
      'Ausgeprägte Problemlösungs- und Kommunikationsfähigkeit, auch in komplexen Situationen.',
      'Organisationstalent, strukturierte Arbeitsweise und Priorisierung in Projekten.',
      'Zuverlässig, geduldig, teamorientiert und empathisch im Umgang mit Stakeholdern.',
      'Hohe Lernbereitschaft und Freude an neuen Technologien.'
    ]},
  ];

  return (
    <section id="profil" className="container-narrow px-4 py-10 grid md:grid-cols-[1.4fr_1fr] gap-6">
      <div className="space-y-4">
        <Reveal><div className="label-pill inline-block">Beruflicher Werdegang</div></Reveal>
        {resume.map((r, idx) => (
          <Reveal key={idx}>
            <details className="accordion" open={idx === 0}>
              <summary>
                <span className="badge">{r.period}</span>
                <span className="ml-2 font-medium">{r.title}</span>
              </summary>
              <div>{r.bullets?.length ? <ul className="cv-summary">{r.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul> : null}</div>
            </details>
          </Reveal>
        ))}
        <Reveal><div className="label-pill inline-block">Nebenberufliche Tätigkeiten</div></Reveal>
        {sideJobs.map((r, idx) => (
          <Reveal key={`side-${idx}`}>
            <details className="accordion" open={idx === 0}>
              <summary>
                <span className="badge">{r.period}</span>
                <span className="ml-2 font-medium">{r.title}</span>
              </summary>
              <div>{r.bullets?.length ? <ul className="cv-summary">{r.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul> : null}</div>
            </details>
          </Reveal>
        ))}
      </div>
      <div className="space-y-4">
        <Reveal><div className="label-pill inline-block">Skills & Stärken</div></Reveal>
        {skills.map((s, idx) => (
          <Reveal key={idx}>
            <details className="accordion" open={idx === 0}>
              <summary>
                <span className="badge">{s.label}</span>
                <span className="ml-2 text-slate-700 font-medium">Details</span>
              </summary>
              <div>{s.bullets?.length ? <ul className="cv-summary">{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul> : null}</div>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
