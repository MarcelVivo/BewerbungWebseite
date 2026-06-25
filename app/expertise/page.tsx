'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Mail, MapPin, Briefcase, GraduationCap, Award,
  Code2, FileText, LogOut, ChevronRight, Shield, Star, Layers,
} from 'lucide-react';

const SKILLS_TECH = [
  { name: 'KI-Integration & Agenten', level: 90 },
  { name: 'Prompt Engineering', level: 92 },
  { name: 'Next.js / React', level: 80 },
  { name: 'Supabase / PostgreSQL', level: 75 },
  { name: 'Python (Scripting / AI)', level: 65 },
  { name: 'Adobe Illustrator / PS', level: 85 },
];

const SKILLS_BUSINESS = [
  { name: 'Requirements Engineering', level: 88 },
  { name: 'Business Analysis', level: 85 },
  { name: 'Prozessoptimierung', level: 82 },
  { name: 'Stakeholder Management', level: 85 },
  { name: 'Digital Marketing', level: 78 },
  { name: 'Projektmanagement (Scrum/SAFe)', level: 80 },
];

const EXPERIENCE = [
  {
    firma: 'Swisscom AG',
    rolle: 'Digitalisierung / Business Analyst',
    zeitraum: '2021 – 2025',
    ort: 'Bern, Schweiz',
    punkte: [
      'Mitgestaltung der Digitalisierung und Automatisierung interner Prozesse mit Fokus auf Effizienz, Datenqualität und Kundenerlebnis',
      'Optimierung von Datenbereitstellung und Reporting-Pipelines; enge Abstimmung mit Fachbereichen und IT',
      'Anforderungsmanagement: Priorisierung von Backlogs, Erstellung von Use Cases und Stakeholder-Kommunikation (Scrum / SAFe)',
      'Erfolgsanalysen, Kennzahlenmonitoring und strukturierte Weiterentwicklung digitaler Abläufe',
    ],
    zeugnis: '/assets/ArbeitszeugnisSwisscomMarcelSpahr2025.pdf',
  },
  {
    firma: 'Swisscom Schweiz AG',
    rolle: 'IT-Systemadministration & Sales Support',
    zeitraum: '2015 – 2021',
    ort: 'Bern, Schweiz',
    punkte: [
      'Betreuung und Weiterentwicklung von Systemen und Abläufen im Privatkundenumfeld (1st/2nd Level)',
      'Technische Analyse komplexer Störungen sowie Erarbeitung nachhaltiger Lösungen',
      'Unterstützung von Sales- und Retention-Prozessen; Mitarbeit an Tool- und Workflow-Optimierungen',
      'Einarbeitung und Schulung neuer Mitarbeitender; Sicherstellung hoher Qualitätsstandards',
    ],
  },
  {
    firma: 'Swisscom Schweiz AG',
    rolle: 'Kundenservice Technik & Administration',
    zeitraum: '2008 – 2015',
    ort: 'Bern, Schweiz',
    punkte: [
      'Technische Kundenbetreuung (1st/2nd Level) bei komplexen ICT-Anfragen im B2C-Bereich',
      'Fehleranalyse, Eskalationsmanagement und nachhaltige Problemlösungen',
      'Hohe Serviceorientierung und effiziente Kommunikation im Kundenkontakt',
    ],
  },
  {
    firma: 'Frontwort AG Zürich / Seka Schriften Thun',
    rolle: 'Werbetechniker',
    zeitraum: '2007 – 2008',
    ort: 'Zürich / Thun',
    punkte: [
      'Umsetzung von Projekten zu Fussball EM 08 sowie Redesign der Swisscom Shops schweizweit',
    ],
  },
];

const SIDE_ACTIVITIES = [
  {
    firma: 'KI Digital Agentur – marcelspahr.ch',
    rolle: 'Inhaber / KI-Berater für KMU',
    zeitraum: '2024 – heute',
    ort: 'Bern, Schweiz',
    punkte: [
      'KI-gestützte digitale Lösungen für Schweizer KMU: Webseiten, Automatisierungen, Content-Strategien',
      'Beratung zu ChatGPT, Claude AI, n8n, Canva AI und weiteren KI-Tools',
    ],
  },
  {
    firma: 'Cube Club Bern',
    rolle: 'Inhaber & Geschäftsführer',
    zeitraum: '2018 – 2020',
    ort: 'Bern, Schweiz',
    punkte: [
      'Operative Leitung, Organisation und wirtschaftliche Verantwortung',
    ],
  },
];

const EDUCATION = [
  {
    abschluss: 'Wirtschaftsinformatiker HF',
    schule: 'Feusi Bildungszentrum Bern',
    zeitraum: '2023 – 2026',
    punkte: [
      'Vertiefung in Prozessmanagement, Requirements Engineering, SQL, Scrum, digitale Transformation',
      'Geschäftsprozessmodellierung (BPMN), IT-Architekturen, Datenanalyse/Reporting, IT-Service-Management',
    ],
    note: 'Notendurchschnitt: 5.5 · Abschluss: Sommer 2026',
  },
];

const CERTS = [
  { name: 'IREB CPRE Foundation Level', org: 'IREB', file: '/assets/IREB_Zertifikat_Spahr_Marcel.pdf' },
  { name: 'SAFe 5 Agilist', org: 'Scaled Agile', file: '/assets/SAFeZertifikatMarcelSpahr.pdf' },
  { name: 'SCRUM Zertifikat', org: 'Scrum.org', file: '/assets/SCRUMZertifikat.pdf' },
  { name: 'Cambridge English A2', org: 'Cambridge Assessment', file: '/assets/CambridgeEnglischA2ZertifikatMarcelSpahr.pdf' },
  { name: 'Adobe Illustrator & Photoshop', org: 'Adobe / Weiterbildung', file: '/assets/Illustrator&PhotoshopGrundkurs.pdf' },
  { name: 'Illustrator Workshop', org: 'Weiterbildung', file: '/assets/IllustratorWorkshop.pdf' },
  { name: 'Photoshop Aufbaukurs', org: 'Weiterbildung', file: '/assets/PhotoshopAufbaukurs.pdf' },
];

const PORTFOLIO_DOCS = [
  {
    titel: 'Swiss COVID-19 Certificate App',
    tags: ['Software Architektur', 'Requirements', 'Sicherheit'],
    file: '/assets/SWISS_COVID_CERT_APP_SoftwareArchitektur.pdf',
    color: '#a896c8',
  },
  {
    titel: 'Software & Requirements Engineering',
    tags: ['Requirements Engineering', 'UML', 'BPMN'],
    file: '/assets/FinalArbeitSoftwareundRequirementsEngineering.pdf',
    color: '#7aada8',
  },
  {
    titel: "Olivia's Olivenpaste – Brand & Marketing",
    tags: ['Branding', 'Marketing', 'Konzept'],
    file: '/assets/OliviasOlivenpaste_MarcelSpahr.pdf',
    color: '#8fb58a',
  },
  {
    titel: 'Persönliches Führungshandbuch',
    tags: ['Leadership', 'Management'],
    file: '/assets/Personliches_Fuhrungshandbuch_MarcelSpahr.pdf',
    color: '#c4897a',
  },
];

function SkillBar({ name, level }: { name: string; level: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(level), 150); return () => clearTimeout(t); }, [level]);
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-[#d4c4a8]">{name}</span>
        <span className="text-xs text-[#7a6d5a]">{level}%</span>
      </div>
      <div className="h-1.5 bg-[#2d2820] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: 'linear-gradient(to right, #c9a84c, #d4b86a)' }}
        />
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#2d2820] bg-[#1c1912] p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] flex-shrink-0">
        <Icon size={16} />
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="flex-1 h-px bg-[#2d2820]" />
    </div>
  );
}

function ExperienceCard({ job }: { job: typeof EXPERIENCE[0] }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-white">{job.rolle}</h3>
          <p className="text-[#c9a84c] font-medium text-sm">{job.firma}</p>
          <p className="text-[#7a6d5a] text-xs mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {job.ort} · {job.zeitraum}
          </p>
        </div>
        {'zeugnis' in job && job.zeugnis && (
          <a
            href={job.zeugnis as string}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 text-xs text-[#a89880] hover:text-[#c9a84c] bg-[#100d09] hover:bg-[#c9a84c]/10 px-3 py-1.5 rounded-lg border border-[#2d2820] hover:border-[#c9a84c]/30 transition-all flex-shrink-0"
          >
            <FileText size={11} /> Zeugnis
          </a>
        )}
      </div>
      <ul className="space-y-2">
        {job.punkte.map((p, j) => (
          <li key={j} className="flex items-start gap-2.5 text-sm text-[#a89880]">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#c9a84c]/60 flex-shrink-0" />
            {p}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ExpertisePage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const NAV = [
    { id: 'profil', label: 'Profil' },
    { id: 'erfahrung', label: 'Erfahrung' },
    { id: 'nebenberuflich', label: 'Nebenberuflich' },
    { id: 'ausbildung', label: 'Ausbildung' },
    { id: 'skills', label: 'Skills' },
    { id: 'zertifikate', label: 'Zertifikate' },
    { id: 'dokumente', label: 'Dokumente' },
  ];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      {/* Top bar */}
      <div className="bg-[#c9a84c] text-[#0c0a06] text-xs py-2 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Shield size={12} />
          <span>Vertraulich – Geschützter Expertise-Bereich · marcelspahr.ch</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <LogOut size={12} /> Abmelden
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 lg:flex lg:gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Profile card */}
            <Card>
              <div className="h-16 -mx-6 -mt-6 mb-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #b8943a 100%)' }} />
              <div className="-mt-12 mb-3 w-40 h-40 rounded-full border-4 border-[#1c1912] overflow-hidden flex-shrink-0 shadow-lg shadow-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/MarcelSpahrOffice.PNG" alt="Marcel Spahr" className="w-full h-full object-cover object-top" />
              </div>
              <h1 className="text-lg font-bold text-white">Marcel Spahr</h1>
              <p className="text-[#c9a84c] text-sm font-medium">Wirtschaftsinformatiker & KI-Berater</p>
              <p className="text-[#7a6d5a] text-xs mt-1.5 flex items-center gap-1">
                <MapPin size={10} /> Bern, Schweiz
              </p>
              <div className="mt-4 space-y-1.5 text-sm">
                <a href="mailto:kontakt@marcelspahr.ch" className="flex items-center gap-2 text-[#a89880] hover:text-[#c9a84c] transition-colors">
                  <Mail size={12} className="text-[#c9a84c]/60" /> kontakt@marcelspahr.ch
                </a>
              </div>
              <div className="mt-5 space-y-2">
                <a
                  href="/assets/LebenslaufMarcelSpahrNeu1.pdf"
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] text-sm font-bold transition-colors"
                >
                  <Download size={14} /> Lebenslauf (PDF)
                </a>
                <a
                  href="mailto:kontakt@marcelspahr.ch"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#2d2820] hover:border-[#c9a84c]/40 text-[#a89880] hover:text-[#f4edd8] text-sm font-medium transition-colors"
                >
                  <Mail size={14} /> Kontakt
                </a>
              </div>
            </Card>

            {/* Navigation */}
            <Card className="p-4">
              <p className="text-xs font-bold text-[#7a6d5a] uppercase tracking-wider mb-3">Navigation</p>
              <nav className="space-y-0.5">
                {NAV.map(n => (
                  <button
                    key={n.id}
                    onClick={() => scrollTo(n.id)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#a89880] hover:text-[#c9a84c] hover:bg-[#c9a84c]/5 transition-colors group"
                  >
                    {n.label}
                    <ChevronRight size={12} className="text-[#2d2820] group-hover:text-[#c9a84c] transition-colors" />
                  </button>
                ))}
              </nav>
            </Card>

            {/* Auf einen Blick */}
            <Card className="p-4">
              <p className="text-xs font-bold text-[#7a6d5a] uppercase tracking-wider mb-3">Auf einen Blick</p>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Verfügbar ab', value: 'Nach Vereinbarung' },
                  { label: 'Arbeitspensum', value: '80–100%' },
                  { label: 'Arbeitsort', value: 'Bern + Remote' },
                  { label: 'Sprachen', value: 'DE (C2) · EN (B1+)' },
                ].map(s => (
                  <div key={s.label}>
                    <span className="text-[#7a6d5a] text-xs">{s.label}</span>
                    <p className="text-[#d4c4a8] font-medium text-sm">{s.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-10">

          {/* Profil */}
          <section id="profil" className="scroll-mt-6">
            <SectionHeading icon={Star} title="Über mich" />
            <Card>
              <p className="text-[#d4c4a8] leading-relaxed mb-4">
                Kreativer Wirtschaftsinformatiker mit über 15 Jahren Erfahrung bei Swisscom. Technisches Know-how mit kreativen Ideen zu verknüpfen, ist meine Leidenschaft.
              </p>
              <p className="text-[#d4c4a8] leading-relaxed mb-4">
                Mit fundierter Erfahrung in Digitalisierung, Prozessautomatisierung und Stakeholder-Management schaffe ich nachhaltige Lösungen. Mein Talent für strategische Planung, Datenanalyse und KI-gestützte Innovation treibt mich an, Wissen kontinuierlich weiterzuentwickeln.
              </p>
              <p className="text-[#d4c4a8] leading-relaxed">
                Als selbständiger KI-Berater unterstütze ich Schweizer KMU dabei, KI-Werkzeuge gewinnbringend einzusetzen – wirklich zu Ende gedacht, ohne Stolpersteine.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['KI-Beratung', 'Business Analysis', 'Requirements Engineering', 'Prozessautomatisierung', 'Agile / SAFe', 'Datenanalyse', 'Next.js / React', 'Supabase'].map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-[#c9a84c]/10 text-[#d4b86a] rounded-full text-xs font-medium border border-[#c9a84c]/20">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </section>

          {/* Berufserfahrung */}
          <section id="erfahrung" className="scroll-mt-6">
            <SectionHeading icon={Briefcase} title="Berufserfahrung" />
            <div className="space-y-4">
              {EXPERIENCE.map((job, i) => (
                <ExperienceCard key={i} job={job} />
              ))}
            </div>
          </section>

          {/* Nebenberufliche Tätigkeiten */}
          <section id="nebenberuflich" className="scroll-mt-6">
            <SectionHeading icon={Layers} title="Nebenberufliche Tätigkeiten" />
            <div className="space-y-4">
              {SIDE_ACTIVITIES.map((job, i) => (
                <ExperienceCard key={i} job={job} />
              ))}
            </div>
          </section>

          {/* Ausbildung */}
          <section id="ausbildung" className="scroll-mt-6">
            <SectionHeading icon={GraduationCap} title="Aktuelle Weiterbildung" />
            <div className="space-y-4">
              {EDUCATION.map((edu, i) => (
                <Card key={i}>
                  <h3 className="font-bold text-white">{edu.abschluss}</h3>
                  <p className="text-[#c9a84c] font-medium text-sm">{edu.schule}</p>
                  <p className="text-[#7a6d5a] text-xs mt-0.5">{edu.zeitraum}</p>
                  <ul className="mt-3 space-y-2">
                    {edu.punkte.map((p, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-[#a89880]">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#c9a84c]/60 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  {edu.note && (
                    <p className="mt-3 text-xs text-[#c9a84c] font-medium bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-lg px-3 py-2">
                      {edu.note}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section id="skills" className="scroll-mt-6">
            <SectionHeading icon={Code2} title="Skills & Kompetenzen" />
            <div className="grid md:grid-cols-2 gap-5">
              <Card>
                <h3 className="text-sm font-semibold text-[#d4c4a8] mb-5">💻 Technisch</h3>
                {SKILLS_TECH.map(s => <SkillBar key={s.name} {...s} />)}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-[#d4c4a8] mb-5">📊 Business & Management</h3>
                {SKILLS_BUSINESS.map(s => <SkillBar key={s.name} {...s} />)}
              </Card>
            </div>
          </section>

          {/* Zertifikate */}
          <section id="zertifikate" className="scroll-mt-6">
            <SectionHeading icon={Award} title="Zertifikate & Weiterbildungen" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CERTS.map((c, i) => (
                <a
                  key={i}
                  href={c.file}
                  target="_blank"
                  rel="noopener"
                  className="group flex flex-col rounded-xl border border-[#2d2820] bg-[#1c1912] hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5 p-5 transition-all"
                >
                  <h3 className="font-semibold text-white text-sm mb-1 leading-snug flex-1">{c.name}</h3>
                  <p className="text-[#7a6d5a] text-xs mb-3">{c.org}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#a89880] group-hover:text-[#c9a84c] transition-colors">
                    <Download size={11} /> PDF herunterladen
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Portfolio Dokumente */}
          <section id="dokumente" className="scroll-mt-6">
            <SectionHeading icon={FileText} title="Projektdokumente & Arbeitsproben" />
            <div className="grid sm:grid-cols-2 gap-4">
              {PORTFOLIO_DOCS.map((p, i) => (
                <a
                  key={i}
                  href={p.file}
                  target="_blank"
                  rel="noopener"
                  className="group flex flex-col rounded-xl border border-[#2d2820] bg-[#1c1912] hover:border-[#c9a84c]/40 p-5 transition-all"
                >
                  <div className="h-0.5 w-8 rounded-full mb-4 transition-all group-hover:w-16" style={{ background: p.color }} />
                  <h3 className="font-bold text-white mb-3 leading-snug flex-1">{p.titel}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-[#100d09] text-[#7a6d5a] rounded-full border border-[#2d2820]">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#a89880] group-hover:text-[#c9a84c] transition-colors">
                    <Download size={11} /> PDF herunterladen
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-[#2d2820] text-center">
            <p className="text-xs text-[#7a6d5a]">
              © {new Date().getFullYear()} Marcel Spahr · Vertraulich – nur für autorisierte Personen ·{' '}
              <a href="mailto:kontakt@marcelspahr.ch" className="text-[#c9a84c] hover:underline">kontakt@marcelspahr.ch</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
