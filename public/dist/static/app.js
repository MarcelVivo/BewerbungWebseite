// Vanilla JS SPA (no React)
(function () {
  'use strict';

  // --- State ---
  const state = {
    current: 'home',
    items: [],
    role: null,
    loading: true,
    docTab: 'alle',
    viewer: null,
  };

  // --- Config/Mode ---
  const STATIC = typeof window !== 'undefined' && !!window.STATIC_MODE;

  // --- Utils ---
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  async function api(path, options = {}) {
    const res = await fetch(path, options);
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
  }

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null) continue;
      if (k === 'class' || k === 'className') node.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset' && v && typeof v === 'object') Object.assign(node.dataset, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function navigate(target) {
    state.current = target;
    render();
  }

  function openPdf(item) {
    if (!item || !item.url) return;
    state.viewer = { url: item.url, title: item.title || 'Dokument' };
    navigate('viewer');
  }

  async function logout() {
    try { await fetch('/api/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login';
  }

  // --- Navbar ---
  function Navbar() {
    const container = el('header', { className: 'nav-blue sticky top-0 z-10' },
      el('div', { className: 'container-narrow px-4 py-3 flex items-center justify-between' },
        el('div', { className: 'flex items-center gap-3' },
          el('div', { className: 'brand-name text-xl font-semibold text-slate-900' }, 'Marcel Spahr'),
          el('span', { className: 'hidden sm:inline text-slate-700 label-pill' }, 'Wirtschaftsinformatiker')
        ),
        el('nav', { className: 'flex items-center gap-1' },
          ...['home', ...(state.role === 'owner' && !STATIC ? ['projects'] : []), 'contact'].map((id) =>
            el('button', {
              className: 'px-3 py-1.5 rounded-lg text-sm font-medium ' + (state.current === id ? 'bg-ms-600 text-white' : 'hover:bg-ms-100 text-slate-700'),
              onclick: () => navigate(id)
            }, id === 'home' ? 'Start' : id === 'projects' ? 'Projekte' : 'Kontakt')
          ),
          (!STATIC ? el('button', { className: 'ml-2 px-3 py-1.5 rounded-lg text-sm bg-ms-100 hover:bg-ms-200 text-slate-700', onclick: logout }, 'Logout') : null)
        )
      )
    );
    return container;
  }

  // --- Home (hero + timeline + documents) ---
  async function getAutoAvatarUrl() {
    try {
      const d = await api('/api/assets/avatar');
      return d && d.url ? d.url : null;
    } catch {
      return null;
    }
  }

  function buildAvatar(imgEl, items, autoUrl) {
    const photo = items.find((i) => i.type === 'photo');
    const candidates = [];
    if (photo && photo.url) candidates.push(photo.url);
    if (autoUrl) candidates.push(autoUrl);
    candidates.push('/assets/portrait.jpg', '/assets/portrait.jpeg', '/assets/portrait.png');
    candidates.push('/assets/marcel.jpg', '/assets/marcel.jpeg', '/assets/marcel.png');
    candidates.push('/assets/marcelspahr.jpg', '/assets/marcelspahr.jpeg');
    candidates.push('/assets/foto.jpg', '/assets/photo.jpg');
    candidates.push('https://api.dicebear.com/9.x/initials/svg?seed=Marcel%20Spahr');

    let idx = 0;
    function setNext() {
      if (idx < candidates.length) {
        imgEl.src = candidates[idx++];
      }
    }
    imgEl.addEventListener('error', setNext);
    setNext();
  }

  function Documents(items) {
    const wrap = el('section', { id: 'docs', className: 'container-narrow px-4 space-y-4' });
    wrap.appendChild(el('div', { className: 'label-pill inline-block' }, 'Zeugnisse, Nachweise & Zertifikate'));

    const tabs = [
      { id: 'alle', label: 'Alle' },
      { id: 'zertifikate', label: 'Zertifikate' },
      { id: 'sprachen', label: 'Sprachen' },
      { id: 'arbeitszeugnisse', label: 'Arbeitszeugnisse' },
      { id: 'diplome', label: 'Diplome' },
    ];
    const tabsEl = el('div', { className: 'flex gap-2' }, ...tabs.map((t) =>
      el('button', {
        className: 'px-3 py-1.5 rounded-lg text-sm font-medium ' + (state.docTab === t.id ? 'bg-ms-600 text-white' : 'hover:bg-ms-100 text-slate-700'),
        onclick: () => { state.docTab = t.id; render(); }
      }, t.label)
    ));
    wrap.appendChild(tabsEl);

    const grid = el('div', { className: 'grid sm:grid-cols-2 md:grid-cols-3 gap-4' });

    const isImg = (u = '') => /\.(png|jpe?g|webp|avif|gif)$/i.test(u);
    const isPdf = (u = '') => /\.pdf$/i.test(u);
    const classify = (it) => {
      const t = (it.type || '').toLowerCase();
      const title = (it.title || '').toLowerCase();
      if (t === 'zeugnis' || /arbeitszeugnis|zeugnis/.test(title)) return 'arbeitszeugnisse';
      if (t === 'language' || /englisch|english|language/.test(title)) return 'sprachen';
      if (t === 'diploma' || /diplom|diploma/.test(title)) return 'diplome';
      if (t === 'certificate' || /zertifikat|certificate|scrum|safe/.test(title)) return 'zertifikate';
      return 'alle';
    };

    const allDocs = items.filter((it) => {
      const t = (it.type || '').toLowerCase();
      const title = (it.title || '').toLowerCase();
      return (
        ['certificate', 'zeugnis', 'diploma', 'language', 'pdf', 'link', 'cv'].includes(t) ||
        /(lebenslauf|curriculum\s*vitae|cv|zeugnis|zertifikat|certificate|diplom|diploma|englisch|english|nachweis)/i.test(title)
      );
    });

    const present = { scrum: false, safe: false, english: false, workref: false };
    for (const it of allDocs) {
      const title = (it.title || '').toLowerCase();
      const t = (it.type || '').toLowerCase();
      if (/scrum/.test(title) || (t === 'certificate' && /scrum/.test(title))) present.scrum = true;
      if (/safe/.test(title) || /scaled\s*agile/.test(title)) present.safe = true;
      if (/englisch|english/.test(title) || t === 'language') present.english = true;
      if ((/zeugnis/.test(title) && /swisscom/.test(title)) || t === 'zeugnis') present.workref = true;
    }

    const placeholders = [
      { key: 'scrum', title: 'SCRUM Zertifikat', tabs: ['alle', 'zertifikate'], caption: 'Unter „Projekte“ als Typ „certificate“ hochladen.' },
      { key: 'english', title: 'Englisch Diplom', tabs: ['alle', 'sprachen', 'diplome'], caption: 'Als „language“ oder „pdf“ hinzufügen.' },
      { key: 'safe', title: 'SAFe Zertifikat', tabs: ['alle', 'zertifikate'], caption: 'Als „certificate“ hinzufügen.' },
      { key: 'workref', title: 'Arbeitszeugnis Swisscom', tabs: ['alle', 'arbeitszeugnisse'], caption: 'Als „zeugnis“ oder „pdf“ hinzufügen.' },
    ];

    const filtered = allDocs.filter((it) => state.docTab === 'alle' || classify(it) === state.docTab);
    const cards = [...filtered.map((it) => ({ ...it, _placeholder: false }))];
    for (const ph of placeholders) {
      if (!ph.tabs.includes(state.docTab)) continue;
      if (present[ph.key]) continue;
      cards.push({ id: `ph-${ph.key}`, title: ph.title, type: 'placeholder', url: '', _placeholder: true, caption: ph.caption });
    }

    for (const it of cards) {
      if (it._placeholder) {
        grid.appendChild(
          el('div', { className: 'card p-3 bg-white/90' },
            el('div', { className: 'flex items-center gap-3' },
              el('div', { className: 'w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-[10px] text-slate-500' }, 'Platzhalter'),
              el('div', null,
                el('div', { className: 'font-medium text-slate-800' }, it.title),
                el('div', { className: 'text-xs text-slate-500 mt-0.5' }, it.caption)
              )
            )
          )
        );
      } else {
        const pdf = isPdf(it.url);
        if (pdf) {
          grid.appendChild(
            el('div', { className: 'card p-3 hover:shadow-md transition bg-white/95 cursor-pointer', onclick: () => openPdf(it) },
              el('div', { className: 'flex items-center gap-3' },
                el('div', { className: 'w-16 h-16 rounded-lg ring-1 ring-slate-200 flex items-center justify-center overflow-hidden bg-slate-50' },
                  el('span', { className: 'text-xs font-bold text-slate-600' }, 'PDF')
                ),
                el('div', null,
                  el('div', { className: 'font-medium text-slate-800' }, it.title || 'Nachweis'),
                  el('div', { className: 'text-xs text-slate-500 mt-0.5' }, it.type || 'Dokument')
                )
              )
            )
          );
        } else {
          grid.appendChild(
            el('a', { href: it.url || '#', target: it.url ? '_blank' : null, className: 'card p-3 hover:shadow-md transition bg-white/95' },
              el('div', { className: 'flex items-center gap-3' },
                el('div', { className: 'w-16 h-16 rounded-lg ring-1 ring-slate-200 flex items-center justify-center overflow-hidden bg-slate-50' },
                  isImg(it.url)
                    ? el('img', { src: it.url, alt: it.title || 'Vorschau', className: 'w-full h-full object-cover' })
                    : el('span', { className: 'text-xs font-bold text-slate-600' }, (it.type || 'Dokument').toUpperCase())
                ),
                el('div', null,
                  el('div', { className: 'font-medium text-slate-800' }, it.title || 'Nachweis'),
                  el('div', { className: 'text-xs text-slate-500 mt-0.5' }, it.type || 'Dokument')
                )
              )
            )
          );
        }
      }
    }

    wrap.appendChild(grid);
    return wrap;
  }

  async function Home() {
    const main = el('main', { className: 'space-y-10' });
    const hero = el('section', { className: 'hero border-b border-sky-100' },
      el('div', { className: 'container-narrow px-4 py-10 grid md:grid-cols-2 gap-8 items-center' },
        el('div', null,
          el('div', { className: 'flex items-center gap-6' },
            (() => { const img = el('img', { alt: 'Foto von Marcel Spahr', className: 'w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-soft bg-white' });
                      // Fill avatar src candidates
                      getAutoAvatarUrl().then((u) => buildAvatar(img, state.items, u));
                      return img; })(),
            el('div', null,
              el('h1', { className: 'brand-name text-3xl md:text-4xl font-semibold text-slate-900' }, 'Marcel Spahr'),
              el('div', { className: 'mt-2 label-pill inline-flex' }, 'Wirtschaftsinformatiker')
            )
          ),
          el('p', { className: 'mt-5 text-slate-700 leading-relaxed max-w-2xl' }, 'Kreativer Wirtschaftsinformatiker mit ausgeprägtem technischen Verständnis, viel Empathie und digitalem Gespür.'),
          el('p', { className: 'mt-3 text-slate-700 leading-relaxed max-w-2xl' }, 'Ich verbinde analytisches Denken mit kreativen Ideen und gestalte nachhaltige digitale Lösungen. Durch meine langjährige Erfahrung bei Swisscom in Digitalisierung, Systemadministration und technischem Kundensupport verfüge ich über ein breites, praxisnahes IT-Fundament.'),
          el('p', { className: 'mt-3 text-slate-700 leading-relaxed max-w-2xl' }, 'Meine Begeisterung für digitale Innovationen treibt mich an, Prozesse zu optimieren, neue Technologien einzusetzen und mich kontinuierlich weiterzuentwickeln.'),
          el('div', { className: 'mt-4 max-w-2xl card bg-ms-50/60 p-4 shadow-sm border border-ms-100' },
            el('p', { className: 'text-ms-700 font-semibold' }, 'Aktuelles Studium Wirtschaftsinformatik HF (Feusi Bern), Abschluss Sommer 2026')
          ),
          (() => {
            const row = el('div', { className: 'mt-5 flex flex-wrap gap-2' });
            // Try to find a CV in items or a default assets/CV.pdf
            const findCv = () => {
              const byType = state.items.find((i) => (i.type || '').toLowerCase() === 'cv');
              if (byType && byType.url) return byType.url;
              const byTitle = state.items.find((i) => /lebenslauf|curriculum\s*vitae|\bcv\b/i.test(i.title || '') && /pdf|link|cv/i.test(i.type || ''));
              if (byTitle && byTitle.url) return byTitle.url;
              // fallback to conventional path
              return 'assets/CV.pdf';
            };
            const cvUrl = findCv();
            // Always render button; if file fehlt, 404 – daher Hinweis-Title bereitstellen
            row.append(
              el('a', { href: cvUrl, target: '_blank', className: 'btn btn-primary px-4 py-2' }, 'Lebenslauf (PDF)'),
              el('a', { href: '#docs', className: 'btn btn-soft px-4 py-2' }, 'Alle Dokumente ansehen')
            );
            return row;
          })()
        ),
        el('aside', { className: 'card p-5 bg-white/90 sticky-aside' },
          el('h3', { className: 'text-sm tracking-widest font-bold text-slate-700 mb-3' }, 'Kontakt'),
          el('ul', { className: 'text-slate-700 space-y-2' },
            el('li', null, 'Bern, Schweiz'),
            el('li', null, '+41 79 511 09 11'),
            el('li', null, el('a', { href: 'mailto:marcelspahr82@bluewin.ch', className: 'link-blue' }, 'marcelspahr82@bluewin.ch'))
          ),
          el('div', { className: 'mt-3 flex flex-wrap gap-2' },
            el('span', { className: 'tag' }, 'Deutsch'),
            el('span', { className: 'tag' }, 'Englisch (A2)')
          ),
          el('div', { className: 'mt-6' },
            el('div', { className: 'label-pill inline-block mb-2' }, 'Skills'),
            el('details', { className: 'accordion mb-2', open: true },
              el('summary', null, el('span', { className: 'badge' }, 'Tech Skills'), el('span', { className: 'ml-2 font-medium' }, 'Technische Kenntnisse')),
              el('div', { className: 'skills-list' },
                el('ul', null,
                  el('li', null, 'IT‑Projektmanagement (Scrum/Kanban) & Releaseplanung'),
                  el('li', null, 'KI & Prompt Engineering für effiziente Automatisierung'),
                  el('li', null, 'Datenbanken & SQL; Datenmodelle und Reporting'),
                  el('li', null, 'Geschäftsprozessmodellierung (BPMN) & Prozessoptimierung'),
                  el('li', null, 'Requirements Engineering (User Stories, Use Cases, Akzeptanzkriterien)'),
                  el('li', null, 'Grundkenntnisse Programmierung & API‑Design'),
                  el('li', null, 'Blockchain‑/Krypto‑Technologie Grundlagen'),
                  el('li', null, 'Windows, macOS, Microsoft 365')
                )
              )
            ),
            el('details', { className: 'accordion mb-2' },
              el('summary', null, el('span', { className: 'badge' }, 'Kreativität'), el('span', { className: 'ml-2 font-medium' }, 'Kreativität & Marketing')),
              el('div', { className: 'skills-list' },
                el('ul', null,
                  el('li', null, 'Videoproduktion & Storytelling für digitale Kanäle'),
                  el('li', null, 'Adobe Photoshop & Illustrator'),
                  el('li', null, 'Online‑Marketing und E‑Commerce Konzepte'),
                  el('li', null, 'Konzeption & Umsetzung digitaler Inhalte und Kampagnen')
                )
              )
            ),
            el('details', { className: 'accordion mb-2' },
              el('summary', null, el('span', { className: 'badge' }, 'Stärken'), el('span', { className: 'ml-2 font-medium' }, 'Persönliche Stärken')),
              el('div', { className: 'skills-list' },
                el('ul', null,
                  el('li', null, 'Analytisches Denken & Problemlösungsfähigkeit'),
                  el('li', null, 'Kommunikationsstark mit Stakeholdern'),
                  el('li', null, 'Organisationstalent und Priorisierung'),
                  el('li', null, 'Zuverlässig, geduldig, qualitätsorientiert'),
                  el('li', null, 'Hohe Lernbereitschaft & Eigeninitiative'),
                  el('li', null, 'Empathisch und teamorientiert')
                )
              )
            ),
            el('details', { className: 'accordion' },
              el('summary', null, el('span', { className: 'badge' }, 'Sprachen'), el('span', { className: 'ml-2 font-medium' }, 'Languages')),
              el('div', { className: 'skills-list' },
                el('ul', null,
                  el('li', null, 'Deutsch (Muttersprache)'),
                  el('li', null, 'Englisch (A2)')
                )
              )
            )
          )
        )
      )
    );
    main.appendChild(hero);
    // CV timeline directly under hero
    main.appendChild(CvSection());
    main.appendChild(Documents(state.items));
    return main;
  }

  // --- CV Section (timelines) ---
  function CvSection() {
    const section = el('section', { id: 'cv', className: 'container-narrow px-4 space-y-6' });

    // Helper to add one timeline block
    function addBlock(title, items) {
      if (title) section.appendChild(el('h3', { className: 'text-slate-800 font-semibold' }, title));
      const tl = el('div', { className: 'timeline' });
      items.forEach((it, idx) => {
        const item = el('div', { className: 'timeline-item' });
        const details = el('details', { className: 'accordion', open: idx === 0 });
      const hideChevron = (!it.bullets || !it.bullets.length) || /efz|sekundarschule|primarschule/i.test(it.title || '');
      const summary = el('summary', hideChevron ? { dataset: { noChevron: 'true' } } : null,
        el('span', { className: 'badge' }, it.period),
        el('span', { className: 'ml-2 font-medium' }, it.title),
        it.subtitle ? el('span', { className: 'ml-2 text-slate-500' }, it.subtitle) : null
      );
      const body = el('div', null,
        it.bullets && it.bullets.length
          ? el('ul', { className: 'cv-summary' }, ...it.bullets.map((b) => el('li', null, b)))
          : null
      );
      if (hideChevron) details.className += ' no-chevron';
      details.appendChild(summary);
        details.appendChild(body);
        item.appendChild(details);
        tl.appendChild(item);
      });
      section.appendChild(tl);
    }

    // Aktuelle Weiterbildung
    section.appendChild(el('div', { className: 'label-pill inline-block' }, 'Aktuelle Weiterbildung'));
    addBlock('', [
      {
        period: '2023 – 2026',
        title: 'Wirtschaftsinformatik HF, Feusi Bern',
        subtitle: 'Aktuelles Studium (Diplom Sommer 2026)',
        bullets: [
          'Vertiefung in Prozessmanagement, Requirements Engineering, SQL-Datenbanken und Projektmanagement (Scrum).',
          'Digitale Transformation, Programmierung und IT-Architekturen.',
          'Geschäftsprozessmodellierung (BPMN), Informationssysteme, Datenanalyse/Reporting, IT-Service-Management und betriebswirtschaftliche Grundlagen.'
        ]
      }
    ]);

    // Beruflicher Werdegang
    section.appendChild(el('div', { className: 'label-pill inline-block' }, 'Beruflicher Werdegang'));
    addBlock('', [
      {
        period: '2021 – 2025',
        title: 'Digitalisierung, Swisscom Schweiz AG',
        bullets: [
          'Mitgestaltung der Digitalisierung und Automatisierung interner Prozesse mit Fokus auf Effizienz, Datenqualität und Kundenerlebnis.',
          'Optimierung von Datenbereitstellung und Reporting-Pipelines; enge Abstimmung mit Fachbereichen und IT.',
          'Priorisierung von Anforderungen, Aufbereitung von Use Cases und transparente Kommunikation mit Stakeholdern.',
          'Erfolgsanalysen, Kennzahlenmonitoring und strukturierte Weiterentwicklung digitaler Abläufe.'
        ]
      },
      {
        period: '2015 – 2021',
        title: 'Systemadministration, Swisscom Schweiz AG',
        bullets: [
          'Betreuung und Weiterentwicklung von Systemen und Abläufen im Privatkundenumfeld.',
          'Technische Analyse von Störungen sowie Erarbeitung nachhaltiger Lösungen.',
          'Unterstützung von Sales- und Retention-Prozessen; Mitgestaltung von Tools und Workflows.',
          'Schulung neuer Mitarbeitender und Sicherstellung hoher Qualitätsstandards.'
        ]
      },
      {
        period: '2008 – 2015',
        title: 'Kundenservice Tech & Admin, Swisscom Schweiz AG',
        bullets: [
          'Technische Kundenbetreuung (1st/2nd Level) bei komplexen ICT-Anfragen.',
          'Fehleranalyse, Eskalationsmanagement und nachhaltige Problemlösungen.',
          'Hohe Serviceorientierung und effiziente Kommunikationsfähigkeit im Kundenkontakt.'
        ]
      },
      {
        period: '2007 – 2008',
        title: 'Werbetechniker, Frontwork Zürich / Seka Thun',
        bullets: [
          'Umsetzung von Projekten zur Fussball EM 08 und Redesign der Swisscom Shops in der Schweiz.',
          'Gestaltung, Produktion und Montage von Markenauftritten in Zusammenarbeit mit Agenturen.'
        ]
      }
    ]);

    // Ausbildungen & Diplome
    section.appendChild(el('div', { className: 'label-pill inline-block' }, 'Ausbildungen & Diplome'));
    addBlock('', [
      { period: '2025', title: 'Cambridge Englisch Zertifikat A2' },
      { period: '2025', title: 'SAFe Zertifikat' },
      { period: '2024', title: 'SCRUM Zertifikat' },
      { period: '2004 – 2007', title: 'EFZ Werbetechniker', subtitle: 'Ambühl Werbung AG Bern' },
      { period: '1999 – 2004', title: 'EFZ Maler', subtitle: 'Roth Malerei & Branger Frigerio, Solothurn' },
      { period: '1996 – 1999', title: 'Sekundarschule Bellach SO' },
      { period: '1989 – 1996', title: 'Primarschule Bellach SO' }
    ]);

    // Nebenberufliches
    section.appendChild(el('div', { className: 'label-pill inline-block' }, 'Nebenberufliche Tätigkeiten bis 2020'));
    addBlock('', [
      {
        period: '2018 – 2020',
        title: 'Inhaber & Betreiber Cube Club Bern',
        bullets: [
          'Operative Leitung, Organisation und wirtschaftliche Verantwortung; Führung von bis zu 18 Mitarbeitenden.',
          'Planung, Marketing, Budgetierung und Eventmanagement; Umsetzung digitaler und analoger Werbemassnahmen.'
        ]
      },
      {
        period: '2009 – 2020',
        title: 'Eventmanager & Organisator',
        bullets: [
          'Planung und Durchführung von Events im Gaskessel Bern und weiteren Locations.',
          'Organisation und Betrieb eines Love Mobiles (Streetparade Zürich, 2011–2015).',
          'Teamführung sowie Programm- und Eventmanagement in verschiedenen Clubs.'
        ]
      }
    ]);

    return section;
  }

  // --- Projects ---
  function Projects() {
    const main = el('main', { className: 'container-narrow px-4 py-6 space-y-6' });
    main.appendChild(el('div', { className: 'label-pill inline-block' }, 'Projekte & Dateien'));

    const form = { title: '', type: 'project', description: '', url: '', code: '' };
    let busy = false;

    const titleI = el('input', { className: 'mt-1 w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500', value: '' });
    const typeS = el('select', { className: 'mt-1 w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500' }, ...['project','photo','cv','certificate','zeugnis','diploma','language','pdf','link','code'].map((t) => el('option', { value: t }, t)));
    const descT = el('textarea', { rows: 3, className: 'mt-1 w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500' });
    const urlI  = el('input', { placeholder: '/uploads/datei.pdf oder https://…', className: 'mt-1 w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500' });
    const codeI = el('input', { placeholder: 'z. B. Snippet/Referenz', className: 'mt-1 w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500' });
    const fileI = el('input', { type: 'file' });
    const saveB = el('button', { type: 'submit', className: 'btn btn-primary px-4 py-2' }, 'Speichern');

    function syncForm() {
      form.title = titleI.value.trim();
      form.type = typeS.value;
      form.description = descT.value;
      form.url = urlI.value.trim();
      form.code = codeI.value.trim();
    }

    async function onUpload(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      busy = true; saveB.disabled = true; saveB.textContent = 'Speichern…';
      const fd = new FormData(); fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data && data.file && data.file.url) {
          urlI.value = data.file.url;
        } else {
          alert('Upload fehlgeschlagen');
        }
      } catch {
        alert('Upload fehlgeschlagen');
      }
      busy = false; saveB.disabled = false; saveB.textContent = 'Speichern';
    }

    async function onSave(e) {
      e.preventDefault();
      if (busy) return;
      syncForm();
      busy = true; saveB.disabled = true; saveB.textContent = 'Speichern…';
      try {
        const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error('Fehler beim Speichern');
        titleI.value = ''; typeS.value = 'project'; descT.value = ''; codeI.value = ''; // keep url if set
        await loadItems();
      } catch (err) {
        alert(err.message || 'Fehler');
      }
      busy = false; saveB.disabled = false; saveB.textContent = 'Speichern';
    }

    const formEl = el('form', { className: 'card p-4 space-y-3 bg-white/95', onsubmit: onSave },
      el('div', { className: 'grid sm:grid-cols-2 gap-3' },
        el('div', null, el('label', { className: 'block text-sm font-medium text-slate-700' }, 'Titel'), titleI),
        el('div', null, el('label', { className: 'block text-sm font-medium text-slate-700' }, 'Typ'), typeS),
      ),
      el('div', null, el('label', { className: 'block text-sm font-medium text-slate-700' }, 'Beschreibung'), descT),
      el('div', { className: 'grid sm:grid-cols-2 gap-3' },
        el('div', null, el('label', { className: 'block text-sm font-medium text-slate-700' }, 'URL'), urlI),
        el('div', null, el('label', { className: 'block text-sm font-medium text-slate-700' }, 'Code (optional)'), codeI),
      ),
      el('div', { className: 'flex items-center gap-3' }, fileI, saveB)
    );
    fileI.addEventListener('change', onUpload);
    main.appendChild(formEl);

    const listGrid = el('div', { className: 'grid sm:grid-cols-2 md:grid-cols-3 gap-3' });
    main.appendChild(listGrid);

    async function loadItems() {
      listGrid.innerHTML = '<div class="text-slate-600">Laden…</div>';
      try {
        const data = await api('/api/projects');
        state.items = data.items || [];
        renderList();
      } catch {
        listGrid.innerHTML = '<div class="text-red-600">Fehler beim Laden</div>';
      }
    }

    function renderList() {
      listGrid.innerHTML = '';
      for (const it of state.items) {
        listGrid.appendChild(
          el('div', { className: 'card p-3 flex items-center justify-between bg-white/95' },
            el('div', null,
              el('div', { className: 'font-medium text-slate-800' }, it.title || '(ohne Titel)'),
              el('div', { className: 'text-xs text-slate-500' }, it.type || '-')
            ),
            el('div', { className: 'flex items-center gap-2' },
              it.url ? el('a', { href: it.url, target: '_blank', className: 'text-sm link-blue' }, 'öffnen') : null,
              el('button', { className: 'text-sm text-red-600 hover:underline', onclick: async () => {
                if (!confirm('Eintrag löschen?')) return;
                await fetch(`/api/projects/${it.id}`, { method: 'DELETE' });
                await loadItems();
              }}, 'Löschen')
            )
          )
        );
      }
    }

    loadItems();
    return main;
  }

  function Contact() {
    return el('main', { className: 'container-narrow px-4 py-10' },
      el('div', { className: 'card p-6 bg-white/95' },
        el('h2', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Kontakt'),
        el('p', { className: 'text-slate-700' }, 'Sie erreichen mich unter:'),
        el('ul', { className: 'text-slate-700 mt-2 space-y-1' },
          el('li', null, 'Bern, Schweiz'),
          el('li', null, '+41 79 511 09 11'),
          el('li', null, el('a', { href: 'mailto:marcelspahr82@bluewin.ch', className: 'link-blue' }, 'marcelspahr82@bluewin.ch'))
        )
      )
    );
  }

  function PdfViewer() {
    const v = state.viewer || {};
    if (!v.url) return el('main', { className: 'container-narrow px-4 py-10' },
      el('div', { className: 'text-slate-700' }, 'Kein Dokument ausgewählt.')
    );
    return el('main', { className: 'container-narrow px-4 py-6 space-y-4' },
      el('div', { className: 'flex items-center justify-between' },
        el('div', null,
          el('h2', { className: 'text-xl font-semibold text-slate-900' }, v.title || 'Dokument')
        ),
        el('div', { className: 'flex items-center gap-2' },
          el('a', { href: v.url, target: '_blank', className: 'btn btn-soft px-3 py-2' }, 'In neuem Tab öffnen'),
          el('a', { href: v.url, download: '', className: 'btn btn-primary px-3 py-2' }, 'Download')
        )
      ),
      el('div', { className: 'card p-2 bg-white/95' },
        el('iframe', { src: v.url, className: 'pdf-frame', title: v.title || 'PDF' })
      ),
      el('div', null,
        el('button', { className: 'link-blue', onclick: () => navigate('home') }, '← Zurück')
      )
    );
  }

  function render() {
    const root = qs('#root');
    root.innerHTML = '';
    root.appendChild(Navbar());
    if (state.current === 'projects' && state.role === 'owner') {
      root.appendChild(Projects());
    } else if (state.current === 'viewer') {
      root.appendChild(PdfViewer());
    } else if (state.current === 'contact') {
      root.appendChild(Contact());
    } else {
      // default to home
      Home().then((homeEl) => { root.appendChild(homeEl); });
    }
  }

  async function init() {
    if (!STATIC) {
      try {
        const d = await api('/api/session');
        state.role = d && d.user ? d.user.role : null;
      } catch {}
      try {
        const p = await api('/api/projects');
        state.items = p.items || [];
      } catch {}
    } else {
      try {
        const p = await fetch('static/projects.json', { cache: 'no-cache' }).then((r) => r.ok ? r.json() : { items: [] });
        state.items = Array.isArray(p) ? p : (p.items || []);
      } catch {}
    }
    state.loading = false;
    render();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
