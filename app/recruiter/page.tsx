'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Mail, Globe, MapPin, Phone,
  Briefcase, GraduationCap, Award, Code2, Star,
  ExternalLink, LogOut, ChevronRight, FileText, Shield, User,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────

const SKILLS_TECH = [
  { name: 'KI-Integration & Agenten',     level: 90 },
  { name: 'Next.js / React',              level: 80 },
  { name: 'Supabase / PostgreSQL',        level: 75 },
  { name: 'Python (Scripting / AI)',      level: 65 },
  { name: 'Adobe Illustrator / PS',       level: 85 },
  { name: 'Prompt Engineering',           level: 92 },
];

const SKILLS_BUSINESS = [
  { name: 'Requirements Engineering',     level: 88 },
  { name: 'Business Analysis',            level: 85 },
  { name: 'Prozessoptimierung',           level: 82 },
  { name: 'Digital Marketing',            level: 78 },
  { name: 'Projektmanagement (Scrum/SAFe)', level: 80 },
  { name: 'Stakeholder Management',       level: 85 },
];

const EXPERIENCE = [
  {
    firma:     'Swisscom AG',
    rolle:     'Informatiker / Digitalisierung',
    zeitraum:  '2022 – 2025',
    ort:       'Bern, Schweiz',
    punkte: [
      'Mitarbeit bei der Digitalisierung interner Prozesse und Tools',
      'Requirements Engineering für neue IT-Projekte',
      'Enge Zusammenarbeit mit Entwicklungsteams im agilen Umfeld (SAFe)',
      'Erstellung von Fachkonzepten, Spezifikationen und User Stories',
    ],
    zeugnis: '/assets/ArbeitszeugnisSwisscomMarcelSpahr2025.pdf',
  },
  {
    firma:     'Roth Malerei',
    rolle:     'Maler / Vorarbeiter',
    zeitraum:  '2016 – 2022',
    ort:       'Region Bern',
    punkte: [
      'Ausführung anspruchsvoller Malerarbeiten und Renovationen',
      'Koordination von Kleinteams und Qualitätskontrolle',
      'Kundenkommunikation und Projektabwicklung vor Ort',
    ],
    zeugnis: '/assets/ArbeitszeugnisRothMalerei.pdf',
  },
];

const EDUCATION = [
  {
    abschluss: 'Wirtschaftsinformatik (HF)',
    schule:    'WISS – Schule für Wirtschaft, Informatik und Immobilien',
    zeitraum:  '2022 – 2025',
    detail:    'Schwerpunkte: Software Engineering, Business Analysis, Datenbankdesign, IT-Projektmanagement',
  },
  {
    abschluss: 'Werbetechniker EFZ',
    schule:    'Berufsfachschule',
    zeitraum:  '2013 – 2016',
    detail:    'Grafik, Kommunikation, Digitalmedien, Drucktechnik',
    zeugnis:   '/assets/FaehigkeitszeugnisWerbetechniker.pdf',
  },
  {
    abschluss: 'Maler EFZ',
    schule:    'Berufsfachschule',
    zeitraum:  '2010 – 2013',
    detail:    'Fachpraxis, Materialkunde, Kundenprojekte',
    zeugnis:   '/assets/FaehigkeitszeugnisMaler.pdf',
  },
];

const CERTS = [
  { name: 'SAFe 5 Agilist',                       org: 'Scaled Agile',           file: '/assets/SAFeZertifikatMarcelSpahr.pdf',         emoji: '⚡' },
  { name: 'SCRUM Zertifikat',                      org: 'Scrum.org',              file: '/assets/SCRUMZertifikat.pdf',                   emoji: '🔄' },
  { name: 'Cambridge English A2',                  org: 'Cambridge Assessment',   file: '/assets/CambridgeEnglischA2ZertifikatMarcelSpahr.pdf', emoji: '🇬🇧' },
  { name: 'Adobe Illustrator & Photoshop',         org: 'Adobe / Weiterbildung',  file: '/assets/Illustrator&PhotoshopGrundkurs.pdf',    emoji: '🎨' },
  { name: 'Illustrator Workshop',                  org: 'Weiterbildung',          file: '/assets/IllustratorWorkshop.pdf',               emoji: '✏️' },
  { name: 'Photoshop Aufbaukurs',                  org: 'Weiterbildung',          file: '/assets/PhotoshopAufbaukurs.pdf',               emoji: '📸' },
];

const PORTFOLIO = [
  {
    titel:       'Swiss COVID-19 Certificate App',
    beschreibung:'Softwarearchitektur-Dokumentation für die offizielle Swiss COVID Zertifikats-App. Analyse der Systemkomponenten, Schnittstellen und Sicherheitsanforderungen.',
    tags:        ['Software Architektur', 'Requirements', 'Sicherheit'],
    file:        '/assets/SWISS_COVID_CERT_APP_SoftwareArchitektur.pdf',
    emoji:       '🏥',
  },
  {
    titel:       'Software & Requirements Engineering',
    beschreibung:'Abschlussarbeit mit vollständigen Anforderungsspezifikationen, Use Cases, Datenmodellen und Prozessdokumentation für ein reales IT-Projekt.',
    tags:        ['Requirements Engineering', 'UML', 'Analyse'],
    file:        '/assets/FinalArbeitSoftwareundRequirementsEngineering.pdf',
    emoji:       '📋',
  },
  {
    titel:       'Digital Marketing – 90s Love Mobile',
    beschreibung:'Projektarbeit im Digital Marketing: Konzeption und Umsetzung einer Mobile-Kampagne mit Social Media, Content-Strategie und KPI-Messung.',
    tags:        ['Digital Marketing', 'Social Media', 'Analyse'],
    file:        '/assets/90sLoveMobileProjektarbeit_Digital Marketing-Final.pdf',
    emoji:       '📱',
  },
  {
    titel:       "Olivia's Olivenpaste – Brand & Marketing",
    beschreibung:'Branding und Marketingkonzept für ein Start-up-Lebensmittelprodukt: Markenentwicklung, Verpackungsdesign-Strategie und Absatzkonzept.',
    tags:        ['Branding', 'Marketing', 'Konzept'],
    file:        '/assets/OliviasOlivenpaste_MarcelSpahr.pdf',
    emoji:       '🫒',
  },
  {
    titel:       'Persönliches Führungshandbuch',
    beschreibung:'Reflexion und Entwicklung des eigenen Führungsstils: Werte, Prinzipien und konkrete Führungsinstrumente für Teamarbeit und Projektleitung.',
    tags:        ['Leadership', 'Selbstreflexion', 'Management'],
    file:        '/assets/Personliches_Fuhrungshandbuch_MarcelSpahr.pdf',
    emoji:       '🎯',
  },
  {
    titel:       'Transferbericht AILA',
    beschreibung:'Transferbericht aus dem AI Leadership Accelerator: Anwendung von KI-Methoden im beruflichen Kontext und Lessons Learned.',
    tags:        ['KI', 'Leadership', 'Transfer'],
    file:        '/assets/TransferberichtMarcelSpahrAILA.pdf',
    emoji:       '🤖',
  },
];

// ── Skill Bar ─────────────────────────────────────────────

function SkillBar({ name, level }: { name: string; level: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(level), 100); return () => clearTimeout(t); }, [level]);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-700 font-medium">{name}</span>
        <span className="text-slate-400 text-xs">{level}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────

function Section({ id, icon: Icon, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Icon size={16} className="text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="flex-1 h-px bg-slate-100 ml-2" />
      </div>
      {children}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function RecruiterPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/recruiter', { method: 'DELETE' });
    router.push('/recruiter/login');
    router.refresh();
  }

  const NAV = [
    { id: 'profil',         label: 'Profil' },
    { id: 'erfahrung',      label: 'Erfahrung' },
    { id: 'ausbildung',     label: 'Ausbildung' },
    { id: 'skills',         label: 'Skills' },
    { id: 'zertifikate',    label: 'Zertifikate' },
    { id: 'portfolio',      label: 'Portfolio' },
  ];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="recruiter-theme min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-indigo-600 text-white text-xs py-2 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={12} />
          <span>Vertraulicher Recruiter-Zugang · marcelspahr.ch</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
          <LogOut size={12} /> Abmelden
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 lg:flex lg:gap-8">

        {/* ── Sidebar ── */}
        <aside className="lg:w-72 flex-shrink-0 mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600" />
              <div className="px-6 pb-6 -mt-10">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md mb-3 bg-indigo-50 flex items-center justify-center">
                  <User size={36} className="text-indigo-500" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Marcel Spahr</h1>
                <p className="text-indigo-600 font-medium text-sm mt-0.5">Wirtschaftsinformatiker & KI-Berater</p>
                <p className="text-slate-500 text-xs mt-2 flex items-center gap-1.5">
                  <MapPin size={11} /> Bern, Schweiz
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <a href="mailto:kontakt@marcelspahr.ch" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
                    <Mail size={13} className="flex-shrink-0 text-indigo-400" /> kontakt@marcelspahr.ch
                  </a>
                  <a href="https://www.marcelspahr.ch" target="_blank" rel="noopener" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
                    <Globe size={13} className="flex-shrink-0 text-indigo-400" /> marcelspahr.ch
                  </a>
                </div>

                <div className="mt-5 space-y-2">
                  <a
                    href="/assets/LebenslaufMarcelSpahrNeu1.pdf"
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-200"
                  >
                    <Download size={14} /> Lebenslauf (PDF)
                  </a>
                  <a
                    href="mailto:kontakt@marcelspahr.ch"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                  >
                    <Mail size={14} /> Kontakt aufnehmen
                  </a>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Navigation</p>
              <nav className="space-y-0.5">
                {NAV.map(n => (
                  <button key={n.id} onClick={() => scrollTo(n.id)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors group">
                    {n.label}
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Auf einen Blick</p>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Verfügbar ab',    value: 'Nach Vereinbarung' },
                  { label: 'Arbeitspensum',   value: '80–100%' },
                  { label: 'Arbeitsort',      value: 'Bern + Remote' },
                  { label: 'Sprachen',        value: 'Deutsch (C2), Englisch (A2+)' },
                ].map(s => (
                  <div key={s.label}>
                    <span className="text-slate-400 text-xs">{s.label}</span>
                    <p className="text-slate-700 font-medium">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0">

          {/* Profil */}
          <Section id="profil" icon={Star} title="Über mich">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-slate-700 leading-relaxed mb-4">
                Ich bin Wirtschaftsinformatiker (HF) mit Abschluss 2025 und bringe eine ungewöhnliche Kombination mit:
                technisches IT-Know-how, unternehmerisches Denken und kreatives Designverständnis aus meiner
                Ausbildung als Werbetechniker.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                Mein Fokus liegt auf der praktischen Anwendung von KI-Technologien im Unternehmenskontext –
                von der Prozessanalyse über die Auswahl geeigneter Tools bis zur konkreten Implementierung
                von KI-Agenten und Automatisierungslösungen für Schweizer KMU.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Bei Swisscom konnte ich zuletzt Erfahrungen in der Digitalisierung, im Requirements Engineering
                und in der agilen Projektarbeit (SAFe) sammeln. Ich suche jetzt eine Stelle, in der ich
                dieses Wissen einsetzen und weiterentwickeln kann – idealerweise an der Schnittstelle
                zwischen Business und Technologie.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {['KI-Beratung', 'Business Analysis', 'Requirements Engineering', 'Prozessoptimierung',
                  'Agile / SAFe', 'Digital Marketing', 'Next.js / React', 'Supabase'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{tag}</span>
                ))}
              </div>
            </div>
          </Section>

          {/* Erfahrung */}
          <Section id="erfahrung" icon={Briefcase} title="Berufserfahrung">
            <div className="space-y-4">
              {EXPERIENCE.map((job, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{job.rolle}</h3>
                      <p className="text-indigo-600 font-medium text-sm">{job.firma}</p>
                      <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin size={10} /> {job.ort} · {job.zeitraum}
                      </p>
                    </div>
                    {job.zeugnis && (
                      <a href={job.zeugnis} target="_blank" rel="noopener"
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200 flex-shrink-0">
                        <FileText size={12} /> Zeugnis
                      </a>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {job.punkte.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* Ausbildung */}
          <Section id="ausbildung" icon={GraduationCap} title="Ausbildung">
            <div className="space-y-4">
              {EDUCATION.map((edu, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{edu.abschluss}</h3>
                      <p className="text-indigo-600 font-medium text-sm">{edu.schule}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{edu.zeitraum}</p>
                      <p className="text-slate-600 text-sm mt-2">{edu.detail}</p>
                    </div>
                    {edu.zeugnis && (
                      <a href={edu.zeugnis} target="_blank" rel="noopener"
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200 flex-shrink-0">
                        <FileText size={12} /> Zeugnis
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Skills */}
          <Section id="skills" icon={Code2} title="Skills & Kompetenzen">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">💻</span> Technisch
                </h3>
                {SKILLS_TECH.map(s => <SkillBar key={s.name} {...s} />)}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">📊</span> Business & Management
                </h3>
                {SKILLS_BUSINESS.map(s => <SkillBar key={s.name} {...s} />)}
              </div>
            </div>
          </Section>

          {/* Zertifikate */}
          <Section id="zertifikate" icon={Award} title="Zertifikate & Weiterbildungen">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CERTS.map((c, i) => (
                <a
                  key={i}
                  href={c.file}
                  target="_blank"
                  rel="noopener"
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md shadow-sm p-5 transition-all flex flex-col"
                >
                  <div className="text-2xl mb-3">{c.emoji}</div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1 leading-snug flex-1">{c.name}</h3>
                  <p className="text-slate-400 text-xs">{c.org}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-indigo-500 group-hover:text-indigo-700 transition-colors">
                    <FileText size={11} /> PDF anzeigen <ExternalLink size={10} className="ml-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </Section>

          {/* Portfolio */}
          <Section id="portfolio" icon={FileText} title="Portfolio & Arbeitsproben">
            <div className="grid sm:grid-cols-2 gap-4">
              {PORTFOLIO.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                  <div className="text-2xl mb-3">{p.emoji}</div>
                  <h3 className="font-bold text-slate-800 mb-2 leading-snug">{p.titel}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-3">{p.beschreibung}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t}</span>
                    ))}
                  </div>
                  <a
                    href={p.file}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    <ExternalLink size={13} /> Arbeit ansehen
                  </a>
                </div>
              ))}
            </div>
          </Section>

          {/* Contact CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Bereit für das Gespräch</h2>
            <p className="text-indigo-200 mb-6 max-w-md mx-auto">
              Ich freue mich auf ein persönliches Kennenlernen und beantworte gerne alle Fragen zu meiner
              Erfahrung und meinen Zielen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:kontakt@marcelspahr.ch"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
                <Mail size={16} /> kontakt@marcelspahr.ch
              </a>
              <a href="/assets/LebenslaufMarcelSpahrNeu1.pdf" target="_blank" rel="noopener"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-semibold transition-colors border border-indigo-500">
                <Download size={16} /> Lebenslauf herunterladen
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 pb-6">
            © {new Date().getFullYear()} Marcel Spahr · Vertraulich – nur für autorisierte Recruiter
          </p>
        </main>
      </div>
    </div>
  );
}
