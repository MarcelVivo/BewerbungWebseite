'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight,
  Award,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck2,
  GraduationCap,
  Lightbulb,
  LogOut,
  Mail,
  MapPin,
  Network,
  Phone,
  Presentation,
  Rocket,
  ShieldCheck,
  Target,
  Users,
  Workflow,
} from 'lucide-react';

const NAVIGATION = [
  { id: 'profil', label: 'Profil' },
  { id: 'kompetenzen', label: 'Kompetenzen' },
  { id: 'xite', label: 'Praxisprojekt X-ITE' },
  { id: 'diplomarbeit', label: 'Diplomarbeit' },
  { id: 'laufbahn', label: 'Laufbahn' },
  { id: 'ausbildung', label: 'Ausbildung' },
  { id: 'nachweise', label: 'Nachweise' },
];

const ROLE_PROFILES = [
  {
    icon: Target,
    title: 'Business Analysis',
    text: 'Ich bringe Geschäftsziele, Bedürfnisse der Nutzer und technische Rahmenbedingungen in ein verständliches Zielbild.',
    evidence: ['Ich analysiere Stakeholder und Prozesse.', 'Ich erstelle fachliche Konzepte und setze Prioritäten.', 'Ich vermittle zwischen Business und IT.'],
  },
  {
    icon: ClipboardCheck,
    title: 'Requirements Engineering',
    text: 'Ich erhebe Anforderungen strukturiert, dokumentiere und prüfe sie und begleite sie bis zur testbaren Lösung.',
    evidence: ['Ich habe das IREB CPRE Foundation Level bestanden.', 'Ich arbeite mit User Stories und Akzeptanzkriterien.', 'Ich erstelle Testfälle, führe manuelle Tests durch und dokumentiere Fehler.'],
  },
  {
    icon: Workflow,
    title: 'Prozessdigitalisierung',
    text: 'Ich verstehe einen Ablauf zuerst, vereinfache ihn gezielt und unterstütze ihn danach mit der passenden Technik.',
    evidence: ['Ich betrachte Abläufe von Anfang bis Ende.', 'Ich nutze BPMN für Analyse und Verbesserung.', 'Ich habe einen produktiven Rollout im Swisscom Shopnetz begleitet.'],
  },
];

const COMPETENCY_GROUPS = [
  {
    title: 'Analyse und Anforderungen',
    icon: Target,
    items: [
      'Ich analysiere Stakeholder und führe Interviews.',
      'Ich unterscheide funktionale und nicht funktionale Anforderungen.',
      'Ich setze Prioritäten und grenze einen sinnvollen MVP ab.',
      'Ich dokumentiere Use Cases und User Stories nachvollziehbar.',
    ],
    proof: 'Diese Kenntnisse belege ich mit meiner IREB Zertifizierung, meiner Diplomarbeit und dem Projekt X-ITE.',
  },
  {
    title: 'Prozesse und Projekte',
    icon: Workflow,
    items: [
      'Ich nehme Prozesse auf, analysiere sie und verbessere sie.',
      'Ich arbeite mit BPMN, Scrum, SAFe und schrittweiser Umsetzung.',
      'Ich begleite Workshops und stimme mich mit Stakeholdern ab.',
      'Ich teste, analysiere Fehler und vermittle Wissen.',
    ],
    proof: 'Diese Erfahrung stammt aus meiner Arbeit bei Swisscom und wird durch PSM I und SAFe 6 Agilist ergänzt.',
  },
  {
    title: 'Technische Umsetzung',
    icon: Network,
    items: [
      'Ich arbeite mit SQL, Datenmodellen und relationalen Datenbanken.',
      'Ich entwickle Webanwendungen mit Next.js, React, Supabase und PostgreSQL.',
      'Ich verbinde Schnittstellen, Automatisierungen und KI Werkzeuge.',
      'Ich plane UX und entwickle Oberflächen für verschiedene Bildschirmgrössen.',
    ],
    proof: 'Ich habe diese Kenntnisse in eigenen und beauftragten Digitalprojekten praktisch angewendet.',
  },
  {
    title: 'Werkzeuge und Zusammenarbeit',
    icon: Users,
    items: [
      'Ich nutze Jira, Confluence und Trello aus Studium und Projektarbeiten.',
      'Ich dokumentiere meine Arbeit strukturiert mit Microsoft 365.',
      'Ich arbeite mit Adobe Illustrator und Photoshop.',
      'Ich kommuniziere klar, respektvoll und direkt.',
    ],
    proof: 'Ich wähle Werkzeuge passend zur Aufgabe und nicht, weil sie gerade im Trend liegen.',
  },
];

const CERTIFICATES = [
  {
    name: 'IREB CPRE Foundation Level',
    org: 'SAQ / IREB',
    date: 'Juni 2026',
    detail: 'Offiziell bestandene Zertifikatsprüfung',
    href: '/api/expertise-documents/ireb',
  },
  {
    name: 'Professional Scrum Master I',
    org: 'Scrum.org',
    date: 'September 2024',
    detail: 'PSM I Zertifizierung',
    href: '/api/expertise-documents/scrum',
  },
  {
    name: 'SAFe 6 Agilist',
    org: 'Scaled Agile',
    date: '2025',
    detail: 'Zertifiziert · gültig bis November 2026',
    href: '/api/expertise-documents/safe',
  },
  {
    name: 'Leading SAFe Course (6.0)',
    org: 'Kursbestätigung',
    date: 'Oktober 2025',
    detail: 'Offiziell abgeschlossener Leading-SAFe-Kurs',
    href: '/api/expertise-documents/safe-course',
  },
  {
    name: 'Cambridge English A2',
    org: 'Cambridge English',
    date: '2025',
    detail: 'Gesamtergebnis 136',
    href: '/api/expertise-documents/cambridge',
  },
];

const PROJECT_DOCUMENTS = [
  {
    title: 'Software & Requirements Engineering',
    meta: 'Anforderungen · Modellierung · Dokumentation',
    href: '/api/expertise-documents/requirements-project',
  },
  {
    title: 'Swiss COVID Certificate App',
    meta: 'Softwarearchitektur · Sicherheit · Schnittstellen',
    href: '/api/expertise-documents/covid-architecture',
  },
  {
    title: "Olivia's Olivenpaste",
    meta: 'Business Design · Prozesse · Marktkonzept',
    href: '/api/expertise-documents/olivia',
  },
  {
    title: 'Persönliches Führungshandbuch',
    meta: 'Leadership · Zusammenarbeit · Selbstreflexion',
    href: '/api/expertise-documents/leadership',
  },
];

function Surface({
  children,
  className = '',
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-[#ffffff]/95 shadow-[0_18px_55px_rgba(25,60,90,.10)] ${
        accent ? 'border-[#2f6fad]/45' : 'border-[#d7e1ec]'
      } ${className}`}
    >
      {accent && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#245f98] to-transparent" />}
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.7fr)] lg:items-end">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.24em] text-[#245f98]">{eyebrow}</p>
        <h2 className="text-2xl font-bold tracking-[-.03em] text-[#102a43] sm:text-3xl">{title}</h2>
      </div>
      {intro && <p className="text-sm leading-6 text-[#52677d] lg:text-right">{intro}</p>}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-6 text-[#334b62]">
      <Check size={15} className="mt-1 flex-none text-[#245f98]" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function DocumentLink({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-28 items-center justify-between gap-4 rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-4 transition hover:-translate-y-0.5 hover:border-[#2f6fad]/55 hover:bg-[#edf4fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245f98]"
    >
      <div className="min-w-0">
        <p className="font-semibold text-[#102a43]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#52677d]">{meta}</p>
      </div>
      <ArrowUpRight size={18} className="flex-none text-[#65788c] transition group-hover:text-[#245f98]" aria-hidden="true" />
    </a>
  );
}

export default function BewerbungsprofilPage() {
  const [activeSection, setActiveSection] = useState('profil');

  useEffect(() => {
    const sections = NAVIGATION
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-18% 0px -66% 0px', threshold: [0, 0.15, 0.35] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.replace('/login?next=%2Fbewerbungsprofil');
  }

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div
      className="bewerbungsprofil-page min-h-screen overflow-x-hidden bg-[#f3f7fb] text-[#102a43]"
      style={{ fontFamily: 'Calibri, Carlito, Arial, sans-serif' }}
    >
      <header className="sticky top-0 z-50 border-b border-[#d7e1ec] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#2f6fad]/35 bg-[#2f6fad]/10 text-[#245f98]">
              <ShieldCheck size={17} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#102a43]">Marcel Spahr. Bewerbungsprofil.</p>
              <p className="hidden text-[11px] text-[#65788c] sm:block">Vertraulicher Bereich für autorisierte Empfänger</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-none items-center gap-2 rounded-lg border border-[#d7e1ec] px-3 py-2 text-xs font-semibold text-[#52677d] transition hover:border-[#2f6fad]/45 hover:text-[#102a43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245f98]"
          >
            <LogOut size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-10 xl:gap-10">
        <aside className="min-w-0 lg:self-start">
          <Surface accent className="p-5">
            <div className="flex items-center gap-4 lg:block">
              <div className="relative h-24 w-24 flex-none overflow-hidden rounded-full border-2 border-[#8fb8dc] bg-[#f8fafc] shadow-[0_10px_30px_rgba(47,111,173,.16)] lg:mx-auto lg:h-44 lg:w-44">
                <Image
                  src="/assets/BewerbungsFotoMarcelSpahr.jpg"
                  alt="Marcel Spahr"
                  fill
                  sizes="176px"
                  className="scale-[1.1] object-cover object-[center_18%]"
                />
              </div>
              <div className="min-w-0 lg:mt-5">
                <p className="text-xl font-bold tracking-[-.03em] text-[#102a43]">Marcel Spahr</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#245f98]">Wirtschaftsinformatik HF. Abschlussphase.</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#52677d]">
                  <MapPin size={12} aria-hidden="true" /> Bern · Schweiz
                </p>
              </div>
            </div>

            <div className="mt-5">
              <a
                href="/api/expertise-documents/cv-pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f8fc9] via-[#2f6fad] to-[#1d4f7a] px-3 py-3 text-center text-xs font-bold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Download size={14} aria-hidden="true" /> CV als PDF
              </a>
            </div>

            <div className="mt-5 space-y-2 border-t border-[#d7e1ec] pt-5 text-xs">
              <a href="mailto:kontakt@marcelspahr.ch" className="flex items-center gap-2 text-[#52677d] transition hover:text-[#245f98]">
                <Mail size={13} aria-hidden="true" /> kontakt@marcelspahr.ch
              </a>
              <a href="tel:+41795110911" className="flex items-center gap-2 text-[#52677d] transition hover:text-[#245f98]">
                <Phone size={13} aria-hidden="true" /> +41 79 511 09 11
              </a>
            </div>
          </Surface>

          <Surface className="mt-4 hidden p-3 lg:block">
            <nav aria-label="Seitennavigation" className="space-y-1">
              {NAVIGATION.map((item, index) => {
                const active = item.id === activeSection;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    aria-current={active ? 'location' : undefined}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245f98] ${
                      active ? 'bg-[#2f6fad]/12 text-[#1f5685]' : 'text-[#65788c] hover:bg-[#edf4fb] hover:text-[#334b62]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`font-mono text-[10px] ${active ? 'text-[#245f98]' : 'text-[#8b9bad]'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {item.label}
                    </span>
                    <ChevronRight size={12} className={active ? 'text-[#245f98]' : 'text-[#9aabbb]'} aria-hidden="true" />
                  </button>
                );
              })}
            </nav>
          </Surface>
        </aside>

        <main className="min-w-0 space-y-14 sm:space-y-20">
          <section id="profil" className="scroll-mt-24">
            <Surface accent className="p-6 sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2f6fad]/10 blur-3xl" />
              <div className="relative">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#2f6fad]/35 bg-[#2f6fad]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#1f5685]">
                    Ab sofort verfügbar
                  </span>
                  <span className="rounded-full border border-[#d7e1ec] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-semibold text-[#334b62]">80 bis 100 Prozent.</span>
                  <span className="rounded-full border border-[#d7e1ec] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-semibold text-[#334b62]">Bern. Hybrid. Remote.</span>
                </div>

                <p className="mt-8 text-xs font-bold uppercase tracking-[.22em] text-[#245f98]">Business und IT wirksam verbinden</p>
                <h1 className="mt-4 max-w-4xl break-words text-3xl font-bold leading-[1.04] tracking-[-.055em] text-[#102a43] sm:text-5xl xl:text-6xl">
                  Business Analysis.<br />
                  Requirements Engineering.<br />
                  <span className="text-[#2f6fad]">Prozessdigitalisierung.</span>
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-7 text-[#334b62] sm:text-lg sm:leading-8">
                  Ich verbinde Fachbereiche, Nutzerbedürfnisse und technische Umsetzung. Aus komplexen Ausgangslagen entwickle ich klare Anforderungen, tragfähige Prozesse und Lösungen, die im Alltag funktionieren.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { value: '16+', label: 'Jahre Swisscom-Praxis' },
                    { value: '5 → CH', label: 'Pilotshops bis nationaler Rollout' },
                    { value: '9', label: 'Experteninterviews Diplomarbeit' },
                    { value: '5,6', label: 'aktueller Notendurchschnitt' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#d7e1ec] bg-[#f8fafc]/75 p-4">
                      <p className="text-2xl font-bold tracking-[-.04em] text-[#102a43]">{item.value}</p>
                      <p className="mt-1 text-xs leading-5 text-[#52677d]">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/api/expertise-documents/cv-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f8fc9] via-[#2f6fad] to-[#1d4f7a] px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Download size={16} aria-hidden="true" /> Lebenslauf öffnen
                  </a>
                  <a
                    href="mailto:kontakt@marcelspahr.ch?subject=Gespräch%20zu%20Ihrem%20Bewerbungsprofil"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#b8c8d8] bg-[#f8fafc] px-5 py-3.5 text-sm font-semibold text-[#102a43] transition hover:border-[#2f6fad]/55 hover:bg-[#edf4fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245f98]"
                  >
                    <Mail size={16} aria-hidden="true" /> Gespräch vereinbaren
                  </a>
                </div>
              </div>
            </Surface>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                { label: 'Mein Profil', value: 'Analytisch · empathisch · umsetzungsstark' },
                { label: 'Mein Fokus', value: 'Verständliche Anforderungen und bessere Abläufe' },
                { label: 'Mein Mehrwert', value: 'Fachlichkeit, Technik und Menschen zusammenbringen' },
              ].map((item) => (
                <Surface key={item.label} className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#65788c]">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#203b55]">{item.value}</p>
                </Surface>
              ))}
            </div>
          </section>

          <section id="kompetenzen" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Passung für Zielrollen"
              title="Wofür ich Verantwortung übernehmen kann"
              intro="Keine Selbsteinschätzung in Prozent, sondern Kompetenzen mit nachvollziehbaren Praxis- und Ausbildungsnachweisen."
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {ROLE_PROFILES.map(({ icon: Icon, title, text, evidence }) => (
                <Surface key={title} className="flex h-full flex-col p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2f6fad]/30 bg-[#2f6fad]/10 text-[#245f98]">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-[-.03em] text-[#102a43]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#52677d]">{text}</p>
                  <ul className="mt-5 space-y-2 border-t border-[#d7e1ec] pt-5">
                    {evidence.map((item) => <Bullet key={item}>{item}</Bullet>)}
                  </ul>
                </Surface>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {COMPETENCY_GROUPS.map(({ icon: Icon, title, items, proof }) => (
                <Surface key={title} className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f6fad]/10 text-[#2f6fad]">
                      <Icon size={17} aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-[#102a43]">{title}</h3>
                  </div>
                  <ul className="mt-5 grid gap-2">
                    {items.map((item) => <Bullet key={item}>{item}</Bullet>)}
                  </ul>
                  <p className="mt-5 border-t border-[#d7e1ec] pt-4 text-xs leading-5 text-[#65788c]">{proof}</p>
                </Surface>
              ))}
            </div>
          </section>

          <section id="xite" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Praxisnachweis. Swisscom. 2023 bis 2024."
              title="X-ITE: Vom Pilotbetrieb zum schweizweiten Einsatz"
              intro="Projektmitarbeit in Requirements Engineering und Testing für eine heute produktiv eingesetzte Supportlösung."
            />
            <Surface accent className="p-6 sm:p-8">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,.85fr)_minmax(320px,1.15fr)]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#2f6fad]/30 bg-[#2f6fad]/10 px-3 py-1.5 text-xs font-semibold text-[#1f5685]">
                    <Rocket size={13} aria-hidden="true" /> Von fünf Pilotshops in alle Swisscom Shops der Schweiz.
                  </div>
                  <h3 className="mt-5 text-2xl font-bold tracking-[-.04em] text-[#102a43]">Technische Hilfe ohne Hotline-Wartezeit</h3>
                  <p className="mt-4 text-sm leading-7 text-[#334b62]">
                    Die Mitarbeitenden im Shop erfassten die technische Anfrage auf einem Tablet. Das CRM leitete den Fall an einen freien Mitarbeiter im technischen Support weiter. Dieser konnte sich vor dem Rückruf auf das Problem vorbereiten.
                  </p>
                  <div className="mt-6 rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#65788c]">Meine Rolle</p>
                    <p className="mt-2 font-semibold text-[#102a43]">Ich arbeitete im Requirements Engineering und Testing mit.</p>
                    <ul className="mt-4 space-y-2">
                      {[
                        'Ich erhob und dokumentierte Anforderungen.',
                        'Ich arbeitete User Stories und Akzeptanzkriterien aus.',
                        'Ich entwickelte Testfälle und testete die Anwendung manuell.',
                        'Ich dokumentierte Fehler und begleitete Abstimmungen.',
                      ].map((item) => <Bullet key={item}>{item}</Bullet>)}
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        icon: Building2,
                        title: 'Entlastung im Shop',
                        text: 'Die Aufnahme benötigte nur Kundennummer, strukturierten Problemtext sowie Kontakt- und Erreichbarkeitsdaten.',
                      },
                      {
                        icon: Network,
                        title: 'Gezieltes Routing',
                        text: 'Anfragen gelangten automatisiert zur passenden freien Supportstelle im zentralen CRM.',
                      },
                      {
                        icon: Phone,
                        title: 'Vorbereiteter Rückruf',
                        text: 'Der Tech Support konnte den Fall voranalysieren und den Kunden zum passenden Zeitpunkt zuhause erreichen.',
                      },
                      {
                        icon: CheckCircle2,
                        title: 'Bessere Lösbarkeit',
                        text: 'Kunden konnten bei Bedarf direkt am Router oder an der TV-Box bei der Problemlösung mitwirken.',
                      },
                    ].map(({ icon: Icon, title, text }) => (
                      <div key={title} className="rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-5">
                        <Icon size={18} className="text-[#2f6fad]" aria-hidden="true" />
                        <p className="mt-3 text-sm font-bold text-[#102a43]">{title}</p>
                        <p className="mt-2 text-xs leading-5 text-[#52677d]">{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-[#2f6fad]/30 bg-[#2f6fad]/10 p-5">
                    <p className="text-sm font-semibold text-[#1f5685]">Ergebnis</p>
                    <p className="mt-2 text-sm leading-6 text-[#385a78]">
                      Nach der Erprobung in fünf Pilotshops wurde die Lösung in der ganzen Schweiz eingeführt und wird weiterhin genutzt. Die Teams im Shop konnten sich stärker auf Beratung und Verkauf konzentrieren. Der Support erhielt besser vorbereitete Fälle.
                    </p>
                  </div>
                </div>
              </div>
            </Surface>
          </section>

          <section id="diplomarbeit" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Leitprojekt. Wirtschaftsinformatik HF. Juni 2026."
              title="Diplomarbeit: LIQUODA"
              intro="Ein praxisnahes Detailkonzept mit validierten Anforderungen und klarer MVP-Abgrenzung."
            />
            <Surface className="p-6 sm:p-8">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#d7e1ec] bg-[#f8fafc] px-3 py-1.5 text-xs text-[#334b62]">Einzelarbeit</span>
                    <span className="rounded-full border border-[#d7e1ec] bg-[#f8fafc] px-3 py-1.5 text-xs text-[#334b62]">Ich führte neun Interviews mit Experten und Stakeholdern.</span>
                    <span className="rounded-full border border-[#d7e1ec] bg-[#f8fafc] px-3 py-1.5 text-xs text-[#334b62]">Ich orientierte mich am IREB Standard.</span>
                  </div>
                  <h3 className="mt-5 max-w-3xl text-2xl font-bold leading-tight tracking-[-.04em] text-[#102a43] sm:text-3xl">
                    «Detailkonzept und Anforderungsanalyse der tokenisierten Vermittlungsplattform LIQUODA»
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-[#334b62]">
                    Die Arbeit untersucht, welche funktionalen und nicht-funktionalen Anforderungen eine tokenisierungsbasierte Vermittlungsplattform erfüllen muss, damit Emittenten und Investoren ihr vertrauen und sie aktiv nutzen.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      { value: '01', label: 'Stakeholder und Vertrauensbarrieren analysiert' },
                      { value: '02', label: 'Anforderungen erhoben, kategorisiert und priorisiert' },
                      { value: '03', label: 'MVP und Detailkonzept daraus abgeleitet' },
                    ].map((item) => (
                      <div key={item.value} className="rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-4">
                        <p className="font-mono text-xs font-bold text-[#245f98]">{item.value}</p>
                        <p className="mt-3 text-sm font-semibold leading-5 text-[#102a43]">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-[#2f6fad]/35 bg-[#2f6fad]/10 p-5">
                    <Lightbulb size={19} className="text-[#1f5685]" aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-[#102a43]">Konkretes Ergebnis</p>
                    <p className="mt-2 text-sm leading-6 text-[#385a78]">
                      Ich erstellte einen priorisierten Anforderungskatalog, leitete daraus einen MVP ab und prüfte das Detailkonzept am Fallbeispiel LIQUODA. Diese Arbeit bildet die Grundlage für den geplanten Aufbau der Plattform.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#65788c]">Fachliche Grundlagen</p>
                    <ul className="mt-3 space-y-2">
                      <Bullet>Requirements Engineering nach IREB-Standard</Bullet>
                      <Bullet>Plattformökonomie und digitale Vertrauensbildung</Bullet>
                      <Bullet>Blockchain und Tokenisierung realer Vermögenswerte</Bullet>
                    </ul>
                  </div>
                  <p className="px-1 text-xs leading-5 text-[#65788c]">
                    Vollständige Arbeit aktuell nicht veröffentlicht: Bewertung ausstehend; Präsentation und mündliche Prüfung am 4. August 2026.
                  </p>
                </div>
              </div>
            </Surface>
          </section>

          <section id="laufbahn" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Berufliche Laufbahn"
              title="Berufspraxis, Selbständigkeit und persönliche Verantwortung"
              intro="Hier zeige ich meine studienbegleitende Selbständigkeit und meine langjährige Arbeit bei Swisscom in zeitlicher Reihenfolge."
            />
            <div className="space-y-4">
              <Surface accent className="p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-[#245f98]">Seit 2025. Bern. Studienbegleitend.</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-[-.03em] text-[#102a43]">Ich bin mit dem Digitalstudio Marcel Spahr selbständig.</h3>
                    <p className="mt-1 text-sm text-[#52677d]">Ich habe eigene Projekte und Kundenprojekte parallel zum HF Studium aufgebaut.</p>
                  </div>
                  <a
                    href="https://www.marcelspahr.ch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-none items-center justify-center gap-2 rounded-lg border border-[#d7e1ec] bg-[#f8fafc] px-4 py-2.5 text-xs font-semibold text-[#334b62] transition hover:border-[#2f6fad]/45 hover:text-[#102a43]"
                  >
                    <ArrowUpRight size={14} aria-hidden="true" /> Digitalstudio ansehen
                  </a>
                </div>
                <div className="mt-7 grid gap-4 md:grid-cols-2">
                  {[
                    'Ich entwickle digitale Lösungen von der Anforderungsanalyse über UX und UI bis zu Frontend, Backend, Datenmodell, Tests und Betrieb.',
                    'Ich arbeite direkt mit Auftraggebenden zusammen und übertrage fachliche Bedürfnisse in verständliche Lösungen.',
                    'Ich trage die Verantwortung für Websites, Webanwendungen, Portale, Datenbanken und Automatisierungen.',
                    'Zu meinen ausgewählten Arbeiten gehören VeraHome, GiGi Beauty und meine eigene Plattform LIQUODA.',
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-4">
                      <CheckCircle2 size={17} className="mt-0.5 flex-none text-[#245f98]" aria-hidden="true" />
                      <p className="text-sm leading-6 text-[#334b62]">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-[#2f6fad]/25 bg-[#2f6fad]/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#2f6fad]">Einordnung für Arbeitgeber</p>
                  <p className="mt-3 text-sm leading-6 text-[#2e536f]">
                    Ich habe das Digitalstudio parallel zum HF Studium aufgebaut. Für eine Festanstellung bin ich ab sofort mit einem Pensum von 80 bis 100 Prozent verfügbar.
                  </p>
                </div>
              </Surface>

              <Surface accent className="p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-[#245f98]">Swisscom Schweiz AG. Bern.</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-[-.03em] text-[#102a43]">Customer Consultant, Bereich Specials</h3>
                    <p className="mt-1 text-sm text-[#52677d]">Diese Funktion hatte ich seit August 2016. Insgesamt war ich von September 2008 bis April 2025 bei Swisscom angestellt.</p>
                  </div>
                  <a
                    href="/api/expertise-documents/swisscom-reference"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-none items-center justify-center gap-2 rounded-lg border border-[#d7e1ec] bg-[#f8fafc] px-4 py-2.5 text-xs font-semibold text-[#334b62] transition hover:border-[#2f6fad]/45 hover:text-[#102a43]"
                  >
                    <FileCheck2 size={14} aria-hidden="true" /> Arbeitszeugnis
                  </a>
                </div>
                <div className="mt-7 grid gap-4 md:grid-cols-2">
                  {[
                    'Ich bearbeitete komplexe Kundenanliegen selbständig über Telefon, E-Mail, Brief und Chat.',
                    'Ich trug in meinem Wissensgebiet die Verantwortung von Anfang bis Ende und entwickelte individuelle Lösungen.',
                    'Ich analysierte Fehler in Prozessen und Systemen und setzte Verbesserungen um.',
                    'Ich unterstützte operative Einheiten im Projektmanagement und Prozessmanagement und vermittelte Wissen strukturiert.',
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-4">
                      <CheckCircle2 size={17} className="mt-0.5 flex-none text-[#245f98]" aria-hidden="true" />
                      <p className="text-sm leading-6 text-[#334b62]">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-[#2f6fad]/25 bg-[#2f6fad]/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#2f6fad]">Aus dem Arbeitszeugnis 2025</p>
                  <p className="mt-3 text-sm leading-6 text-[#2e536f]">
                    Mein Arbeitszeugnis hebt meine Erfahrung, Eigeninitiative, mein vernetztes und wirtschaftliches Denken, fundierte Entscheidungen und meinen klaren Wissenstransfer hervor. Ebenfalls erwähnt wird meine respektvolle Kommunikation mit Kunden und Stakeholdern.
                  </p>
                </div>
              </Surface>

              <div className="grid gap-4 md:grid-cols-2">
                <Surface className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#65788c]">September 2008 bis Juli 2016.</p>
                  <h3 className="mt-2 font-bold text-[#102a43]">Frühere Funktionen bei Swisscom</h3>
                  <p className="mt-3 text-sm leading-6 text-[#52677d]">
                    In dieser Zeit arbeitete ich in verschiedenen Funktionen im Kundenservice und im technischen Support. Dabei sammelte ich viel Erfahrung mit Fehleranalysen, Eskalationen, Kundenkommunikation und dauerhaften Lösungen.
                  </p>
                </Surface>
                <Surface className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#65788c]">2007 bis 2008.</p>
                  <h3 className="mt-2 font-bold text-[#102a43]">Werbetechnik bei Frontwork Zürich und Seka Thun.</h3>
                  <p className="mt-3 text-sm leading-6 text-[#52677d]">
                    Ich setzte zeitkritische Markenprojekte und Beschriftungen um. Dazu gehörten Arbeiten rund um die EURO 2008 und das Redesign von Swisscom Shops.
                  </p>
                </Surface>
              </div>

              <Surface className="p-6">
                <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)] md:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#65788c]">2018 bis 2020.</p>
                    <h3 className="mt-2 font-bold text-[#102a43]">Cube Club Bern</h3>
                    <p className="mt-1 text-xs text-[#52677d]">Inhaber und Geschäftsführer</p>
                  </div>
                  <p className="text-sm leading-6 text-[#334b62]">
                    Ich leitete den Betrieb und war für Organisation, Personal, Finanzen und die Kommunikation mit Partnern verantwortlich. Zeitweise führte ich bis zu 18 Mitarbeitende.
                  </p>
                </div>
              </Surface>
            </div>
          </section>

          <section id="ausbildung" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Ausbildung und Abschlussstatus"
              title="Wirtschaftsinformatik HF in der Abschlussphase"
              intro="Meine Diplomarbeit ist eingereicht und die Abschlussprüfung ist terminiert. Das Diplom führe ich erst nach dem erfolgreichen Abschluss."
            />
            <Surface accent className="p-6 sm:p-8">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2f6fad]/30 bg-[#2f6fad]/10 text-[#245f98]">
                    <GraduationCap size={23} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold tracking-[-.04em] text-[#102a43]">Wirtschaftsinformatik HF</h3>
                  <p className="mt-1 font-semibold text-[#245f98]">HF Feusi Bildungszentrum in Bern. 2023 bis 2026.</p>
                  <p className="mt-5 max-w-3xl text-sm leading-7 text-[#334b62]">
                    Meine Schwerpunkte sind Requirements Engineering, Prozessmanagement mit BPMN, SQL, Datenbanken, Projektmanagement mit Scrum, digitale Transformation, IT Architekturen, Informationssysteme, Datenanalyse, Reporting und IT Service Management.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {['Notendurchschnitt aktuell 5,6', 'Diplomarbeit eingereicht', 'Ab sofort verfügbar'].map((item) => (
                      <span key={item} className="rounded-full border border-[#d7e1ec] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#334b62]">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#d7e1ec] bg-[#f8fafc] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#65788c]">Nächste Meilensteine</p>
                  <div className="mt-5 space-y-5">
                    <div className="flex gap-3">
                      <CalendarDays size={17} className="mt-0.5 flex-none text-[#245f98]" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-bold text-[#102a43]">4. August 2026</p>
                        <p className="mt-1 text-xs leading-5 text-[#52677d]">Präsentation der Diplomarbeit und mündliche Prüfung</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Award size={17} className="mt-0.5 flex-none text-[#245f98]" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-bold text-[#102a43]">Voraussichtlich bis Ende August 2026</p>
                        <p className="mt-1 text-xs leading-5 text-[#52677d]">Diplomierung bei erfolgreichem Abschluss</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Surface>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Surface className="p-6">
                <BookOpenCheck size={19} className="text-[#2f6fad]" aria-hidden="true" />
                <h3 className="mt-3 font-bold text-[#102a43]">Werbetechniker EFZ · 2007</h3>
                <p className="mt-2 text-sm leading-6 text-[#52677d]">In dieser Ausbildung lernte ich Gestaltung, Marketing, Produktion und die genaue Umsetzung visueller Kommunikation.</p>
                <a
                  href="/api/expertise-documents/werbetechniker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#245f98] transition hover:text-[#163f68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245f98]"
                >
                  Fähigkeitszeugnis öffnen <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              </Surface>
              <Surface className="p-6">
                <BookOpenCheck size={19} className="text-[#2f6fad]" aria-hidden="true" />
                <h3 className="mt-3 font-bold text-[#102a43]">Maler EFZ · 2004</h3>
                <p className="mt-2 text-sm leading-6 text-[#52677d]">Diese Ausbildung legte die Grundlage für mein Qualitätsbewusstsein, meine handwerkliche Genauigkeit und meine verlässliche Arbeitsweise.</p>
                <a
                  href="/api/expertise-documents/maler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#245f98] transition hover:text-[#163f68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245f98]"
                >
                  Fähigkeitszeugnis öffnen <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              </Surface>
            </div>
          </section>

          <section id="nachweise" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Nachweise und Arbeitsproben"
              title="Hier findest du meine wichtigsten Nachweise."
              intro="Die wichtigsten Unterlagen sind direkt zugänglich. Weitere Nachweise stelle ich kompakt und geordnet zur Verfügung."
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {CERTIFICATES.map((certificate) => (
                <a
                  key={certificate.name}
                  href={certificate.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-52 flex-col rounded-2xl border border-[#d7e1ec] bg-[#ffffff] p-5 transition hover:-translate-y-1 hover:border-[#2f6fad]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245f98]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2f6fad]/25 bg-[#2f6fad]/10 text-[#245f98]">
                    <Award size={18} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-bold leading-5 text-[#102a43]">{certificate.name}</h3>
                  <p className="mt-2 text-xs font-semibold text-[#245f98]">{certificate.org} · {certificate.date}</p>
                  <p className="mt-2 text-xs leading-5 text-[#52677d]">{certificate.detail}</p>
                  <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-[#65788c] transition group-hover:text-[#1f5685]">
                    Zertifikat öffnen <ArrowUpRight size={13} aria-hidden="true" />
                  </span>
                </a>
              ))}
            </div>

            <Surface className="mt-5 p-6">
              <div className="flex flex-col justify-between gap-4 border-b border-[#d7e1ec] pb-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#65788c]">Ausgewählte Projektarbeiten</p>
                  <h3 className="mt-2 text-xl font-bold text-[#102a43]">Methodik und Umsetzung im Detail</h3>
                </div>
                <p className="max-w-md text-xs leading-5 text-[#65788c] sm:text-right">Dokumente öffnen in einem neuen Tab. Die vollständige LIQUODA-Diplomarbeit folgt erst nach Bewertung und Freigabeklärung.</p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {PROJECT_DOCUMENTS.map((document) => <DocumentLink key={document.title} {...document} />)}
              </div>
            </Surface>

            <Surface accent className="mt-5 p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#245f98]">Bereit für den nächsten Schritt</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#102a43]">Lernen wir uns persönlich kennen.</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52677d]">
                    Ich bin ab sofort für eine Position mit einem Pensum von 80 bis 100 Prozent verfügbar. In Bern und Umgebung arbeite ich vor Ort. Schweizweit ist auch eine hybride oder vollständig digitale Zusammenarbeit möglich.
                  </p>
                </div>
                <a
                  href="mailto:kontakt@marcelspahr.ch?subject=Einladung%20zum%20Kennenlernen"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f8fc9] via-[#2f6fad] to-[#1d4f7a] px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Presentation size={16} aria-hidden="true" /> Gespräch vereinbaren
                </a>
              </div>
            </Surface>
          </section>

          <footer className="border-t border-[#d7e1ec] py-6 text-center text-xs leading-5 text-[#65788c]">
            © {new Date().getFullYear()} Marcel Spahr. Vertrauliches Bewerbungsprofil.{' '}
            <a href="mailto:kontakt@marcelspahr.ch" className="text-[#334b62] hover:text-[#245f98]">kontakt@marcelspahr.ch</a>
          </footer>
        </main>
      </div>
    </div>
  );
}
