'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import {
  Bot, BarChart3, Workflow, FolderKanban,
  GraduationCap, Globe, Lightbulb,
  ChevronLeft, ChevronRight, ChevronDown, ExternalLink, Maximize2, Star, X,
  CheckCircle, Zap, Users, Award,
  MessageSquare, Search, Compass, Wrench, Heart, ClipboardList,
} from 'lucide-react';
import JourneyNavigator from './JourneyNavigator';
import BrainBackground from './BrainBackground';
import MobileHeroBrainPoster from './MobileHeroBrainPoster';
import ProjectInquiryPage from './anfrage/page';
import KiCheckPage from './ki-check/page';
import { EmbeddedForm } from './EmbeddedFormContext';
import { buildFlapWord, setFlapWordMode, type FlapLetter } from './lib/splitFlap';
import { useLanguage } from './LanguageContext';
import { T } from '../lib/translations';
import { HELIX_STEP, TEXT_START_Y, computeCameraTravel, helixAngleForWorldIndex, helixPositionForWorldIndex } from './lib/helixGeometry';
import { getEffectiveViewport, REF_WIDTH, REF_HEIGHT } from './lib/viewport';
import {
  getJourneyHref,
  navigateToJourneyDestination,
  OPEN_LEAD_FORM_EVENT,
  openJourneyLeadForm,
  scrollToJourneyDestination,
  type JourneyLeadForm,
} from './lib/journeyNavigation';
import { PROJECTS } from './portfolio/data';
import { Chakra_Petch } from 'next/font/google';
import { trackWebsiteEvent, type WebsiteFormId } from './lib/analytics';
import PublicFlapHeading from './PublicFlapHeading';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: '700', display: 'swap' });
type LeadFormId = JourneyLeadForm;

// Radius, den die reale 3D-Leistungskarte ("Karte 01") in BrainBackground.tsx
// hatte, bevor sie durch dieses DOM-Kartenpanel ersetzt wurde — dieselbe
// Weltkoordinate, kein neuer/geschätzter Wert.
const CARD_GROUP_RADIUS = 1.68;

// Radius der WebGL-Intro-Textebene für worldIndex 0 in BrainBackground.tsx
// (buildIntroSprite: textRadius=2.65) — dieselbe Weltkoordinate, damit die
// DOM-Ersatzdarstellung exakt an derselben Helix-Position sitzt.
const INTRO_TEXT_RADIUS = 2.65;
const HERO_TITLE_FLAP_REPEAT_MS = 10_000;
const HERO_SUPPORT_FLAP_REPEAT_MS = 15_000;

export const dynamic = 'force-static';

// ── Static meta (icons + slugs/urls, language-independent) ───

const SERVICE_META = [
  { icon: Lightbulb,     slug: 'corporate-design' },
  { icon: Globe,         slug: '2d-3d-websites' },
  { icon: BarChart3,     slug: 'crm-loesungen' },
  { icon: Workflow,      slug: 'erp-prozesse' },
  { icon: FolderKanban,  slug: 'datenbanken-schnittstellen' },
  { icon: Bot,           slug: 'automatisierung-ki-agenten' },
  { icon: BarChart3,     slug: 'analyse-konzept' },
  { icon: FolderKanban,  slug: 'go-live-umsetzung' },
  { icon: GraduationCap, slug: 'wartung-weiterentwicklung' },
];

const USP_ICONS = [Zap, Users, CheckCircle, Award];
const PROCESS_ICONS = [MessageSquare, Search, Compass, Wrench, Heart];
const CAMERA_ONLY_WORLD = true;
const INTRO_SEQUENCES = {
  de: [
    'Deine Idee.',
    'Deine Herausforderung.',
    'Deine Vision.',
    'Deine Lösung.',
  ],
  en: [
    'Your Idea.',
    'Your Challenge.',
    'Your Vision.',
    'Your Solution.',
  ],
} as const;
const INTRO_STOP_COUNT = INTRO_SEQUENCES.de.length;

function getMobileDeckIndex(deck: HTMLElement) {
  const cards = Array.from(deck.children) as HTMLElement[];
  if (!cards.length) return 0;
  const deckCenter = deck.scrollLeft + deck.clientWidth / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(cardCenter - deckCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
}

function scrollMobileDeckTo(deck: HTMLElement | null, index: number) {
  const card = deck?.children.item(index) as HTMLElement | null;
  card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function MobileDeckControls({
  activeIndex,
  count,
  label,
  lang,
  onSelect,
}: {
  activeIndex: number;
  count: number;
  label: string;
  lang: 'de' | 'en';
  onSelect: (index: number) => void;
}) {
  const previousIndex = Math.max(0, activeIndex - 1);
  const nextIndex = Math.min(count - 1, activeIndex + 1);
  return (
    <div className="mobile-deck-controls" aria-label={label}>
      <button
        type="button"
        className="mobile-deck-arrow"
        disabled={activeIndex === 0}
        aria-label={`${lang === 'de' ? 'Zurück' : 'Previous'}: ${label}`}
        onClick={() => onSelect(previousIndex)}
      >
        <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="mobile-deck-progress">
        <span>{String(activeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
        <span className="mobile-deck-dots" aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <i key={index} className={index === activeIndex ? 'is-active' : ''} />
          ))}
        </span>
      </div>
      <button
        type="button"
        className="mobile-deck-arrow"
        disabled={activeIndex === count - 1}
        aria-label={`${lang === 'de' ? 'Weiter' : 'Next'}: ${label}`}
        onClick={() => onSelect(nextIndex)}
      >
        <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}

type ValueDiagramCopy = {
  code: string;
  eyebrow: string;
  before: string;
  after: string;
  counterStart: string;
  result: string;
  resultLabel: string;
  accent: string;
  accentRgb: string;
};

const VALUE_DIAGRAMS: Record<'de' | 'en', ValueDiagramCopy[]> = {
  de: [
    {
      code: '01', eyebrow: 'MARKE',
      before: '1,0×', after: '2,5×', counterStart: '+0 %', result: '+150 %', resultLabel: 'ANFRAGEN',
      accent: '#c89a3d', accentRgb: '200,154,61',
    },
    {
      code: '02', eyebrow: 'WEB',
      before: '12 s', after: '3 s', counterStart: '1×', result: '4×', resultLabel: 'SCHNELLER',
      accent: '#4d7fbf', accentRgb: '77,127,191',
    },
    {
      code: '03', eyebrow: 'SYSTEME',
      before: '30 h', after: '8 h', counterStart: '+0 h', result: '+22 h', resultLabel: 'FREI / MONAT',
      accent: '#a6425c', accentRgb: '166,66,92',
    },
    {
      code: '04', eyebrow: 'AUTOMATION',
      before: '100 h', after: '30 h', counterStart: '−0 %', result: '−70 %', resultLabel: 'ROUTINE',
      accent: '#4dbf7f', accentRgb: '77,191,127',
    },
  ],
  en: [
    {
      code: '01', eyebrow: 'BRAND',
      before: '1.0×', after: '2.5×', counterStart: '+0%', result: '+150%', resultLabel: 'ENQUIRIES',
      accent: '#c89a3d', accentRgb: '200,154,61',
    },
    {
      code: '02', eyebrow: 'WEB',
      before: '12 s', after: '3 s', counterStart: '1×', result: '4×', resultLabel: 'FASTER',
      accent: '#4d7fbf', accentRgb: '77,127,191',
    },
    {
      code: '03', eyebrow: 'SYSTEMS',
      before: '30 h', after: '8 h', counterStart: '+0 h', result: '+22 h', resultLabel: 'FREE / MONTH',
      accent: '#a6425c', accentRgb: '166,66,92',
    },
    {
      code: '04', eyebrow: 'AUTOMATION',
      before: '100 h', after: '30 h', counterStart: '−0%', result: '−70%', resultLabel: 'ROUTINE',
      accent: '#4dbf7f', accentRgb: '77,191,127',
    },
  ],
};

type ValueInfoCopy = {
  title: string;
  summary: string;
  optimizes: string[];
  benefits: string[];
  stages: [string, string, string];
};

const VALUE_INFO: Record<'de' | 'en', ValueInfoCopy[]> = {
  de: [
    {
      title: 'Ich mache deinen Auftritt klar und wiedererkennbar.',
      summary: 'Ich kläre zuerst, wofür dein Unternehmen steht. Danach gestalte ich Logo, Farben, Typografie und Website so, dass alles zusammenpasst und dein Angebot schnell verstanden wird.',
      optimizes: ['Ich bringe Logo, Farben, Typografie und Bilder in eine klare Linie.', 'Ich formuliere die Botschaft so, dass sie an jedem Kontaktpunkt gleich verständlich bleibt.', 'Ich führe Besucher von der ersten Frage bis zur passenden Anfrage.'],
      benefits: ['Deine Kunden verstehen schneller, was du anbietest.', 'Ein einheitlicher Auftritt wirkt verlässlich und schafft Vertrauen.', 'Du erhältst eher Anfragen von Menschen, die wirklich zu deinem Angebot passen.'],
      stages: ['KLARHEIT', 'VERTRAUEN', 'ANFRAGE'],
    },
    {
      title: 'Ich baue Websites, die schnell und zuverlässig funktionieren.',
      summary: 'Ich prüfe den Aufbau, den Code und die Inhalte gemeinsam. So lädt deine Website schnell, lässt sich auf jedem Gerät gut bedienen und bleibt auch nach Erweiterungen stabil.',
      optimizes: ['Ich verkürze Ladezeiten und räume unnötigen Code auf.', 'Ich passe Darstellung und Bedienung an alle wichtigen Bildschirmgrössen an.', 'Ich schaffe eine saubere technische Grundlage für Suchmaschinen und spätere Erweiterungen.'],
      benefits: ['Besucher müssen nicht auf Inhalte warten.', 'Die Bedienung fühlt sich direkt und verständlich an.', 'Deine Website bleibt auch bei neuen Funktionen verlässlich.'],
      stages: ['ANFRAGE', 'OPTIMIERUNG', 'BEREIT'],
    },
    {
      title: 'Ich bringe deine Daten an einen verlässlichen Ort.',
      summary: 'Ich bilde Kunden, Projekte, Dokumente, Angebote und Aufgaben in einem gemeinsamen System ab. Dein Team pflegt Informationen nur einmal und findet sie danach dort, wo sie gebraucht werden.',
      optimizes: ['Ich ordne Daten, Rollen und Zugriffsrechte verständlich.', 'Ich verbinde die Arbeit von Verkauf, Projekt und Administration.', 'Ich richte Schnittstellen und Auswertungen so ein, dass sie im Alltag helfen.'],
      benefits: ['Dein Team erfasst weniger Daten doppelt und macht weniger Fehler.', 'Alle Beteiligten arbeiten mit dem gleichen aktuellen Stand.', 'Du verbringst weniger Zeit mit Suchen und mehr Zeit mit deinen Kunden.'],
      stages: ['SILOS', 'ZENTRAL', 'SYNCHRON'],
    },
    {
      title: 'Ich automatisiere Arbeit, die sich jeden Tag wiederholt.',
      summary: 'Ich prüfe zuerst, welche Schritte wirklich Zeit kosten. Danach automatisiere ich genau diese Abläufe und setze KI nur dort ein, wo sie nachvollziehbar hilft. Entscheidungen bleiben bei den Menschen.',
      optimizes: ['Ich vereinfache wiederkehrende Nachrichten, Dateneingaben und Kontrollen.', 'Ich richte KI Assistenten mit klaren Regeln und Freigaben ein.', 'Ich binde neue Abläufe in die Werkzeuge ein, die dein Team bereits nutzt.'],
      benefits: ['Dein Team erledigt weniger monotone Handarbeit.', 'Aufgaben werden schneller und mit gleichbleibender Qualität abgeschlossen.', 'Mehr Arbeit lässt sich bewältigen, ohne jeden Ablauf komplizierter zu machen.'],
      stages: ['ROUTINE', 'AI-FLOW', 'FREIRAUM'],
    },
  ],
  en: [
    {
      title: 'I make your business easy to recognise.',
      summary: 'I first clarify what your business stands for. I then design the logo, colours, typography and website so that everything fits together and people quickly understand your offer.',
      optimizes: ['I bring the logo, colours, typography and images into one clear style.', 'I write the message so that it stays clear at every point of contact.', 'I guide visitors from their first question to the right enquiry.'],
      benefits: ['Your customers understand your offer more quickly.', 'A consistent presence feels dependable and builds trust.', 'You receive more enquiries from people who are a good fit for your offer.'],
      stages: ['CLARITY', 'TRUST', 'ENQUIRY'],
    },
    {
      title: 'I build websites that load quickly and work reliably.',
      summary: 'I review the structure, code and content together. Your website loads quickly, is easy to use on every device and remains stable when new features are added.',
      optimizes: ['I reduce loading times and remove unnecessary code.', 'I adapt the layout and controls to all important screen sizes.', 'I create a sound technical basis for search engines and future additions.'],
      benefits: ['Visitors do not have to wait for the content.', 'The website feels direct and easy to use.', 'Your website remains dependable when it grows.'],
      stages: ['REQUEST', 'OPTIMIZE', 'READY'],
    },
    {
      title: 'I keep your business data in one dependable place.',
      summary: 'I bring customers, projects, documents, quotes and tasks into one shared system. Your team enters information once and finds it where it is needed.',
      optimizes: ['I organise data, roles and access rights clearly.', 'I connect the work of sales, projects and administration.', 'I set up integrations and reports that help with daily work.'],
      benefits: ['Your team enters less data twice and makes fewer mistakes.', 'Everyone works with the same current information.', 'You spend less time searching and more time with your customers.'],
      stages: ['SILOS', 'CENTRAL', 'SYNCED'],
    },
    {
      title: 'I automate work that repeats every day.',
      summary: 'I first check which steps actually take time. I then automate those tasks and only use AI where it provides a clear and understandable benefit. People remain responsible for decisions.',
      optimizes: ['I simplify recurring messages, data entry and checks.', 'I set up AI assistants with clear rules and approvals.', 'I connect new processes to the tools your team already uses.'],
      benefits: ['Your team spends less time on repetitive manual work.', 'Tasks are completed faster and with consistent quality.', 'You can handle more work without making every process more complicated.'],
      stages: ['ROUTINE', 'AI FLOW', 'CAPACITY'],
    },
  ],
};

function splitValueNumber(label: string) {
  const match = label.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return { prefix: '', value: 0, decimals: 0, suffix: label };
  const numeric = match[2];
  const separatorIndex = Math.max(numeric.lastIndexOf(','), numeric.lastIndexOf('.'));
  return {
    prefix: match[1],
    value: Number(numeric.replace(',', '.')),
    decimals: separatorIndex >= 0 ? numeric.length - separatorIndex - 1 : 0,
    suffix: match[3],
  };
}

function AnimatedValueNumber({
  fromLabel,
  label,
  delay = 0,
}: {
  fromLabel: string;
  label: string;
  delay?: number;
}) {
  const start = splitValueNumber(fromLabel);
  const target = splitValueNumber(label);
  return (
    <span
      className="value-number"
      aria-label={`${fromLabel} → ${label}`}
      data-value-number
      data-value-start={start.value}
      data-value-prefix={target.prefix}
      data-value-target={target.value}
      data-value-decimals={Math.max(start.decimals, target.decimals)}
      data-value-suffix={target.suffix}
      data-value-delay={delay}
      data-value-final={label}
    >
      {label}
    </span>
  );
}

function animateValueNumbers(root: HTMLElement, lang: 'de' | 'en', reduced: boolean) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-value-number]'));
  if (!elements.length) return () => {};

  if (reduced) {
    elements.forEach((element) => { element.textContent = element.dataset.valueFinal || ''; });
    return () => {};
  }

  const startedAt = performance.now();
  let rafId = 0;
  const cycleDuration = 6800;
  const countStart = 920;
  const countDuration = 1650;
  const resetFadeStart = 6250;

  const frame = (now: number) => {
    elements.forEach((element) => {
      const start = Number(element.dataset.valueStart || 0);
      const target = Number(element.dataset.valueTarget || 0);
      const decimals = Number(element.dataset.valueDecimals || 0);
      const delay = Number(element.dataset.valueDelay || 0);
      const elapsed = Math.max(0, now - startedAt - delay);
      const cycleTime = elapsed % cycleDuration;
      const raw = Math.max(0, Math.min(1, (cycleTime - countStart) / countDuration));
      const eased = raw * raw * (3 - 2 * raw);
      const current = start + (target - start) * eased;
      const number = current.toFixed(decimals).replace('.', lang === 'de' ? ',' : '.');
      element.textContent = `${element.dataset.valuePrefix || ''}${number}${element.dataset.valueSuffix || ''}`;
      const fadeOut = cycleTime > resetFadeStart
        ? Math.max(0, 1 - (cycleTime - resetFadeStart) / (cycleDuration - resetFadeStart))
        : 1;
      const fadeIn = Math.min(1, cycleTime / 260);
      element.style.opacity = String(Math.min(fadeIn, fadeOut));
    });

    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

function ValueDiagramGraphic({ index, lang }: { index: number; lang: 'de' | 'en' }) {
  if (index === 0) {
    const brandFragments = [
      { x: 87, y: 42, offsetX: -61, offsetY: -23, rotation: -28 },
      { x: 108, y: 42, offsetX: -34, offsetY: 34, rotation: 22 },
      { x: 87, y: 63, offsetX: -52, offsetY: 23, rotation: 31 },
      { x: 108, y: 63, offsetX: -15, offsetY: -42, rotation: -19 },
    ];
    const brandPeople = [
      { x: 190, y: 28 },
      { x: 220, y: 46 },
      { x: 253, y: 29 },
      { x: 202, y: 82 },
      { x: 244, y: 79 },
    ];

    return (
      <svg className="value-chart-svg" viewBox="0 0 280 122" aria-hidden="true">
        <path className="value-brand-guides" d="M106 13V106M56 61H156M73 28L139 94M73 94L139 28" />
        <circle className="value-brand-wave value-brand-wave--1" cx="106" cy="61" r="30" pathLength="1" />
        <circle className="value-brand-wave value-brand-wave--2" cx="106" cy="61" r="51" pathLength="1" />
        <circle className="value-brand-wave value-brand-wave--3" cx="106" cy="61" r="73" pathLength="1" />

        <g className="value-brand-core">
          <rect className="value-brand-core-frame" x="81" y="36" width="50" height="50" rx="9" />
          {brandFragments.map((fragment, fragmentIndex) => (
            <rect
              key={`${fragment.x}-${fragment.y}`}
              className={`value-brand-fragment value-brand-fragment--${fragmentIndex + 1}`}
              x={fragment.x}
              y={fragment.y}
              width="17"
              height="17"
              rx="2.5"
              style={{
                '--brand-fragment-x': `${fragment.offsetX}px`,
                '--brand-fragment-y': `${fragment.offsetY}px`,
                '--brand-fragment-r': `${fragment.rotation}deg`,
              } as CSSProperties}
            />
          ))}
          <circle className="value-brand-core-dot" cx="106" cy="61" r="4" />
        </g>

        {brandPeople.map((person, personIndex) => (
          <g
            key={`${person.x}-${person.y}`}
            className={`value-brand-person value-brand-person--${personIndex + 1}${personIndex === brandPeople.length - 1 ? ' value-brand-person--qualified' : ''}`}
          >
            <circle className="value-brand-person-head" cx={person.x} cy={person.y} r="3.8" />
            <path className="value-brand-person-body" d={`M${person.x - 6} ${person.y + 11}C${person.x - 5} ${person.y + 4},${person.x + 5} ${person.y + 4},${person.x + 6} ${person.y + 11}`} />
          </g>
        ))}

        <text className="value-chart-label" x="32" y="118" textAnchor="middle">
          {lang === 'de' ? '1,0×' : '1.0×'}
        </text>
        <text className="value-chart-label value-chart-label--accent" x="252" y="118" textAnchor="middle">
          {lang === 'de' ? '2,5×' : '2.5×'}
        </text>
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg className="value-chart-svg" viewBox="0 0 280 122" aria-hidden="true">
        <g className="value-web-browser value-web-browser--slow">
          <rect className="value-web-frame" x="9" y="23" width="92" height="69" rx="7" />
          <path className="value-web-chrome" d="M9 37H101" />
          <circle className="value-web-chrome-dot" cx="19" cy="30" r="2.3" />
          <circle className="value-web-chrome-dot" cx="27" cy="30" r="2.3" />
          <circle className="value-web-chrome-dot" cx="35" cy="30" r="2.3" />
          <rect className="value-web-slow-block value-web-slow-block--1" x="20" y="47" width="67" height="7" rx="2" />
          <rect className="value-web-slow-block value-web-slow-block--2" x="20" y="59" width="43" height="7" rx="2" />
          <rect className="value-web-slow-block value-web-slow-block--3" x="20" y="71" width="58" height="7" rx="2" />
          <rect className="value-web-progress-track" x="20" y="83" width="70" height="3" rx="1.5" />
          <rect className="value-web-slow-progress" x="20" y="83" width="70" height="3" rx="1.5" />
        </g>

        <path className="value-web-transfer-track" d="M108 58H160" />
        <path className="value-web-transfer" d="M108 58H160" pathLength="1" />
        <path className="value-web-boost" d="M136 38L125 59H137L129 79L151 52H139L147 38Z" />

        <g className="value-web-browser value-web-browser--fast">
          <rect className="value-web-frame" x="168" y="18" width="103" height="77" rx="7" />
          <path className="value-web-chrome" d="M168 32H271" />
          <circle className="value-web-chrome-dot" cx="178" cy="25" r="2.3" />
          <circle className="value-web-chrome-dot" cx="186" cy="25" r="2.3" />
          <circle className="value-web-chrome-dot" cx="194" cy="25" r="2.3" />
          <rect className="value-web-fast-block value-web-fast-block--1" x="179" y="41" width="81" height="17" rx="3" />
          <rect className="value-web-fast-block value-web-fast-block--2" x="179" y="64" width="36" height="19" rx="3" />
          <rect className="value-web-fast-block value-web-fast-block--3" x="220" y="64" width="40" height="19" rx="3" />
          <circle className="value-web-check-ring" cx="249" cy="79" r="11" pathLength="1" />
          <path className="value-web-check" d="M243 79L247 83L255 74" pathLength="1" />
        </g>

        <text className="value-chart-label" x="55" y="118" textAnchor="middle">12 s</text>
        <text className="value-chart-label value-chart-label--accent" x="251" y="118" textAnchor="middle">3 s</text>
      </svg>
    );
  }

  if (index === 2) {
    const silos = [
      { x: 12, y: 21, packetX: 39, packetY: 32, travelX: 63, travelY: 8 },
      { x: 49, y: 13, packetX: 76, packetY: 24, travelX: 26, travelY: 23 },
      { x: 12, y: 71, packetX: 39, packetY: 82, travelX: 63, travelY: -12 },
      { x: 49, y: 79, packetX: 76, packetY: 90, travelX: 26, travelY: -12 },
    ];
    const modules = [
      { x: 202, y: 20 },
      { x: 239, y: 20 },
      { x: 202, y: 72 },
      { x: 239, y: 72 },
    ];

    return (
      <svg className="value-chart-svg" viewBox="0 0 280 122" aria-hidden="true">
        <path className="value-system-input-track" d="M39 32L102 40M76 24L102 47M39 82L102 70M76 90L102 78" />
        <path className="value-system-input" d="M39 32L102 40M76 24L102 47M39 82L102 70M76 90L102 78" pathLength="1" />

        {silos.map((silo, siloIndex) => (
          <g key={`${silo.x}-${silo.y}`} className={`value-system-silo value-system-silo--${siloIndex + 1}`}>
            <rect className="value-system-silo-shell" x={silo.x} y={silo.y} width="27" height="22" rx="6" />
            <path className="value-system-silo-line" d={`M${silo.x + 4} ${silo.y + 8}C${silo.x + 9} ${silo.y + 11},${silo.x + 18} ${silo.y + 11},${silo.x + 23} ${silo.y + 8}`} />
            <circle
              className={`value-system-packet value-system-packet--${siloIndex + 1}`}
              cx={silo.packetX}
              cy={silo.packetY}
              r="3.5"
              style={{ '--system-travel-x': `${silo.travelX}px`, '--system-travel-y': `${silo.travelY}px` } as CSSProperties}
            />
          </g>
        ))}

        <g className="value-system-database">
          <path className="value-system-db-body" d="M102 27V82C102 92 158 92 158 82V27Z" />
          <ellipse className="value-system-db-top" cx="130" cy="27" rx="28" ry="9" />
          <path className="value-system-db-separator" d="M102 47C102 57 158 57 158 47M102 70C102 80 158 80 158 70" />
          <text className="value-system-db-text" x="130" y="65" textAnchor="middle">DB</text>
        </g>

        <path className="value-system-sync-track" d="M158 61H181M181 30V82M181 30H202M181 30H239M181 82H202M181 82H239" />
        <path className="value-system-sync-line" d="M158 61H181M181 30V82M181 30H202M181 30H239M181 82H202M181 82H239" pathLength="1" />
        <circle className="value-system-sync-hub" cx="181" cy="61" r="5" />

        {modules.map((module, moduleIndex) => (
          <g key={`${module.x}-${module.y}`} className={`value-system-module value-system-module--${moduleIndex + 1}`}>
            <rect className="value-system-module-shell" x={module.x} y={module.y} width="28" height="20" rx="5" />
            <path className="value-system-check" d={`M${module.x + 7} ${module.y + 10}L${module.x + 12} ${module.y + 15}L${module.x + 21} ${module.y + 6}`} pathLength="1" />
          </g>
        ))}

        <text className="value-chart-label" x="28" y="118" textAnchor="middle">30 h</text>
        <text className="value-chart-label value-chart-label--accent" x="267" y="118" textAnchor="end">8 h</text>
      </svg>
    );
  }

  return (
    <svg className="value-chart-svg" viewBox="0 0 280 122" aria-hidden="true">
      <path className="value-ai-input-track" d="M43 27H67L96 49M43 61H96M43 95H67L96 73" />
      <path className="value-ai-input value-ai-input--1" d="M43 27H67L96 49" pathLength="1" />
      <path className="value-ai-input value-ai-input--2" d="M43 61H96" pathLength="1" />
      <path className="value-ai-input value-ai-input--3" d="M43 95H67L96 73" pathLength="1" />

      {[19, 53, 87].map((y, index) => (
        <g key={y} className={`value-ai-task value-ai-task--${index + 1}`}>
          <rect className="value-ai-task-card" x="13" y={y} width="30" height="16" rx="3" />
          <path className="value-ai-task-mark" d={`M20 ${y + 6}H36M20 ${y + 11}H31`} />
        </g>
      ))}

      <g className="value-ai-core">
        <path className="value-ai-core-pins" d="M89 47H96M89 61H96M89 75H96M154 47H161M154 61H161M154 75H161" />
        <rect className="value-ai-core-shell" x="96" y="36" width="58" height="50" rx="9" />
        <text className="value-ai-core-text" x="125" y="68" textAnchor="middle">AI</text>
      </g>

      <path className="value-ai-output-track" d="M161 61H191L217 35H258" />
      <path className="value-ai-output" d="M161 61H191L217 35H258" pathLength="1" />
      <circle className="value-ai-packet" cx="161" cy="61" r="5" />
      <path className="value-ai-arrow" d="M248 25L259 35L248 45" />
      <circle className="value-ai-target" cx="258" cy="35" r="5" />

      <text className="value-chart-label" x="28" y="118" textAnchor="middle">100 h</text>
      <text className="value-chart-label value-chart-label--accent" x="258" y="118" textAnchor="end">30 h</text>
    </svg>
  );
}

function ValueInfoGraphic({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg className="value-info-svg" viewBox="0 0 420 220" aria-hidden="true">
        <path className="value-info-line--muted" d="M178 30V190M98 110H258M122 54L234 166M122 166L234 54" />
        {[48, 78, 108].map((radius) => (
          <circle key={radius} className="value-info-wave" cx="178" cy="110" r={radius} pathLength="1" />
        ))}
        <rect className="value-info-accent-line value-info-pop" x="143" y="75" width="70" height="70" rx="13" />
        {[0, 1, 2, 3].map((fragment) => (
          <rect
            key={fragment}
            className="value-info-fill value-info-pop"
            x={151 + (fragment % 2) * 28}
            y={83 + Math.floor(fragment / 2) * 28}
            width="23"
            height="23"
            rx="4"
          />
        ))}
        {[[306, 54], [344, 90], [300, 141], [366, 152]].map(([x, y], person) => (
          <g key={`${x}-${y}`} className={person === 3 ? 'value-info-person value-info-person--accent' : 'value-info-person'}>
            <circle cx={x} cy={y} r="8" />
            <path d={`M${x - 13} ${y + 24}C${x - 11} ${y + 8},${x + 11} ${y + 8},${x + 13} ${y + 24}`} />
          </g>
        ))}
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg className="value-info-svg" viewBox="0 0 420 220" aria-hidden="true">
        <g className="value-info-browser value-info-browser--slow">
          <rect className="value-info-line" x="24" y="55" width="132" height="104" rx="11" />
          <path className="value-info-line" d="M24 76H156" />
          <rect className="value-info-fill" x="40" y="91" width="92" height="10" rx="3" />
          <rect className="value-info-fill" x="40" y="110" width="56" height="10" rx="3" />
          <rect className="value-info-line--muted" x="40" y="137" width="96" height="5" rx="2.5" />
          <rect className="value-info-progress" x="40" y="137" width="96" height="5" rx="2.5" />
        </g>
        <path className="value-info-flow" d="M166 108H243" pathLength="1" />
        <path className="value-info-accent-fill value-info-pulse" d="M207 72L190 109H208L196 147L229 98H211L222 72Z" />
        <g className="value-info-browser value-info-pop">
          <rect className="value-info-line" x="255" y="40" width="142" height="122" rx="11" />
          <path className="value-info-line" d="M255 62H397" />
          <rect className="value-info-fill" x="271" y="78" width="110" height="31" rx="5" />
          <rect className="value-info-fill" x="271" y="119" width="50" height="26" rx="5" />
          <rect className="value-info-fill" x="331" y="119" width="50" height="26" rx="5" />
          <circle className="value-info-accent-line value-info-pulse" cx="368" cy="137" r="18" />
          <path className="value-info-line" d="M359 137L366 144L378 129" />
        </g>
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg className="value-info-svg" viewBox="0 0 420 220" aria-hidden="true">
        {[[26, 44], [26, 130], [88, 28], [88, 146]].map(([x, y]) => (
          <g key={`${x}-${y}`} className="value-info-pop">
            <rect className="value-info-fill" x={x} y={y} width="46" height="34" rx="8" />
            <path className="value-info-dark-line" d={`M${x + 7} ${y + 12}C${x + 17} ${y + 20},${x + 29} ${y + 20},${x + 39} ${y + 12}`} />
          </g>
        ))}
        <path className="value-info-flow" d="M72 61L158 86M134 45L158 94M72 147L158 125M134 163L158 132" pathLength="1" />
        <g className="value-info-pop">
          <path className="value-info-fill value-info-accent-line" d="M158 69V145C158 162 248 162 248 145V69Z" />
          <ellipse className="value-info-fill value-info-accent-line" cx="203" cy="69" rx="45" ry="15" />
          <path className="value-info-dark-line" d="M158 99C158 116 248 116 248 99M158 130C158 147 248 147 248 130" />
          <text className="value-info-dark-text" x="203" y="128" textAnchor="middle">DB</text>
        </g>
        <path className="value-info-flow" d="M248 111H286M286 61V161M286 61H330M286 111H330M286 161H330" pathLength="1" />
        {[48, 98, 148].map((y) => (
          <g key={y} className="value-info-pop">
            <rect className="value-info-fill" x="330" y={y} width="62" height="28" rx="7" />
            <path className="value-info-accent-line" d={`M346 ${y + 14}L354 ${y + 21}L374 ${y + 7}`} />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg className="value-info-svg" viewBox="0 0 420 220" aria-hidden="true">
      {[48, 96, 144].map((y) => (
        <g key={y} className="value-info-pop">
          <rect className="value-info-fill" x="24" y={y} width="72" height="28" rx="7" />
          <path className="value-info-dark-line" d={`M38 ${y + 10}H80M38 ${y + 19}H68`} />
        </g>
      ))}
      <path className="value-info-flow" d="M96 62L154 91M96 110H154M96 158L154 129" pathLength="1" />
      <g className="value-info-pop">
        <path className="value-info-line" d="M143 82H154M143 110H154M143 138H154M246 82H257M246 110H257M246 138H257" />
        <rect className="value-info-fill value-info-accent-line" x="154" y="65" width="92" height="90" rx="16" />
        <text className="value-info-dark-text value-info-dark-text--large" x="200" y="121" textAnchor="middle">AI</text>
      </g>
      <path className="value-info-flow" d="M257 110H300L335 76H394" pathLength="1" />
      <circle className="value-info-accent-fill value-info-pulse" cx="394" cy="76" r="10" />
      <path className="value-info-accent-line" d="M376 58L395 76L376 94" />
    </svg>
  );
}

function ValueImpactContent({
  lang,
  resetToken = 0,
}: {
  lang: 'de' | 'en';
  resetToken?: number;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const mobileDeckRef = useRef<HTMLDivElement | null>(null);
  const diagrams = VALUE_DIAGRAMS[lang];
  const infoCards = VALUE_INFO[lang];
  const [activeInfoIndex, setActiveInfoIndex] = useState<number | null>(null);
  const [mobileDeckIndex, setMobileDeckIndex] = useState(0);
  const activeDiagram = diagrams[activeInfoIndex ?? 0];
  const activeInfo = infoCards[activeInfoIndex ?? 0];

  useEffect(() => {
    setActiveInfoIndex(null);
  }, [lang, resetToken]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content?.closest('.mobile-value-impact')) return;

    let wasVisible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
        if (wasVisible && !isVisible) setActiveInfoIndex(null);
        wasVisible = isVisible;
      },
      { threshold: [0, 0.15, 0.5] },
    );
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeInfoIndex === null) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveInfoIndex(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activeInfoIndex]);

  useEffect(() => {
    if (activeInfoIndex === null) return;
    const frameId = window.requestAnimationFrame(() => {
      const card = contentRef.current?.querySelector<HTMLElement>('.value-info-card.is-open');
      if (!card) return;
      // Das Detail ersetzt das Raster im normalen Dokumentfluss. Am Anfang
      // positionieren, damit weder Titel noch Schliessen-Button oberhalb des
      // aktuellen Viewports liegen, wenn eine Karte aus der zweiten Reihe
      // geöffnet wurde.
      card.scrollIntoView({ behavior: 'auto', block: 'start' });
      card.querySelector<HTMLButtonElement>('.value-info-close')?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeInfoIndex]);

  return (
    <div ref={contentRef} className={`value-impact-content ${chakraPetch.className}`}>
      <PublicFlapHeading
        label={lang === 'de' ? 'DEIN MEHRWERT' : 'YOUR VALUE'}
        className="value-impact-flap"
        repeat={false}
      />
      <div className={`value-diagram-stage ${activeInfoIndex !== null ? 'is-info-open' : ''}`}>
        <div
          ref={mobileDeckRef}
          className="value-diagram-grid"
          aria-hidden={activeInfoIndex !== null}
          onScroll={(event) => setMobileDeckIndex(getMobileDeckIndex(event.currentTarget))}
        >
          {diagrams.map((diagram, index) => (
            <button
              key={diagram.code}
              type="button"
              className="value-diagram"
              data-value-index={index}
              aria-label={`${diagram.eyebrow}: ${diagram.before} → ${diagram.after}. ${lang === 'de' ? 'Details öffnen' : 'Open details'}`}
              aria-expanded={activeInfoIndex === index}
              tabIndex={activeInfoIndex === null ? 0 : -1}
              style={{ '--value-accent': diagram.accent, '--value-accent-rgb': diagram.accentRgb } as CSSProperties}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                event.stopPropagation();
                setActiveInfoIndex(index);
              }}
              onClick={(event) => {
                event.stopPropagation();
                setActiveInfoIndex(index);
              }}
            >
              <span className="value-diagram-header">
                <span className="value-diagram-code">{diagram.code}</span>
                <span className="value-diagram-eyebrow">{diagram.eyebrow}</span>
              </span>
              <ValueDiagramGraphic index={index} lang={lang} />
              <span className="value-diagram-result">
                <strong>
                  <AnimatedValueNumber
                    fromLabel={diagram.counterStart}
                    label={diagram.result}
                    delay={index * 90}
                  />
                </strong>
                <span>{diagram.resultLabel}</span>
              </span>
              <span
                className="value-diagram-more"
                title={lang === 'de' ? 'Details öffnen' : 'Open details'}
                aria-hidden="true"
              >
                <Maximize2 size={16} strokeWidth={2.1} />
              </span>
            </button>
          ))}
        </div>
        {activeInfoIndex === null ? (
          <MobileDeckControls
            activeIndex={mobileDeckIndex}
            count={diagrams.length}
            label={lang === 'de' ? 'Mehrwertkarten' : 'Value cards'}
            lang={lang}
            onSelect={(index) => {
              setMobileDeckIndex(index);
              scrollMobileDeckTo(mobileDeckRef.current, index);
            }}
          />
        ) : null}

        <section
          className={`value-info-card ${activeInfoIndex !== null ? 'is-open' : ''}`}
          aria-hidden={activeInfoIndex === null}
          aria-label={`${activeDiagram.eyebrow}: ${activeInfo.title}`}
          style={{ '--value-accent': activeDiagram.accent, '--value-accent-rgb': activeDiagram.accentRgb } as CSSProperties}
        >
          <button
            type="button"
            className="value-info-close"
            title={lang === 'de' ? 'Schliessen' : 'Close'}
            aria-label={lang === 'de' ? 'Infokarte schliessen' : 'Close information card'}
            tabIndex={activeInfoIndex !== null ? 0 : -1}
            onClick={() => setActiveInfoIndex(null)}
          >
            <X size={19} strokeWidth={2.2} />
          </button>

          <div className="value-info-copy">
            <div className="value-info-meta">
              <span className="value-diagram-code">{activeDiagram.code}</span>
              <span className="value-diagram-eyebrow">{activeDiagram.eyebrow}</span>
            </div>
            <h3>{activeInfo.title}</h3>
            <p>{activeInfo.summary}</p>
            <div className="value-info-columns">
              <div>
                <h4>{lang === 'de' ? 'WAS ICH OPTIMIERE' : 'WHAT I OPTIMIZE'}</h4>
                <ul>
                  {activeInfo.optimizes.map((point) => (
                    <li key={point}><CheckCircle size={14} strokeWidth={1.9} /><span>{point}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>{lang === 'de' ? 'DEIN NUTZEN' : 'YOUR BENEFIT'}</h4>
                <ul>
                  {activeInfo.benefits.map((point) => (
                    <li key={point}><CheckCircle size={14} strokeWidth={1.9} /><span>{point}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              className="value-info-cta"
              tabIndex={activeInfoIndex !== null ? 0 : -1}
              onClick={() => {
                setActiveInfoIndex(null);
                openJourneyLeadForm(activeInfoIndex === 3 ? 'ki' : 'project', {
                  travel: 'warp',
                  ctaId: `mobile_value_${activeInfoIndex ?? 0}`,
                });
              }}
            >
              {activeInfoIndex === 3
                ? <Bot size={18} strokeWidth={2} aria-hidden="true" />
                : <ClipboardList size={18} strokeWidth={2} aria-hidden="true" />}
              <span>{activeInfoIndex === 3
                ? (lang === 'de' ? 'KI-Potenzial prüfen' : 'Assess AI potential')
                : (lang === 'de' ? 'Projekt besprechen' : 'Discuss your project')}</span>
              <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="value-info-visual">
            <ValueInfoGraphic index={activeInfoIndex ?? 0} />
            <div className="value-info-stages" aria-hidden="true">
              {activeInfo.stages.map((stage, stageIndex) => (
                <span key={stage}>
                  <i>{String(stageIndex + 1).padStart(2, '0')}</i>
                  <b>{stage}</b>
                </span>
              ))}
            </div>
            <div className="value-info-result">
              <strong>{activeDiagram.result}</strong>
              <span>{activeDiagram.resultLabel}</span>
            </div>
          </div>
        </section>
      </div>
      <p className="value-impact-disclaimer">
        {lang === 'de'
          ? 'Illustratives Potenzial · abhängig von der Ausgangslage'
          : 'Illustrative potential · depends on the starting point'}
      </p>
    </div>
  );
}

function MobileValueImpact({ lang }: { lang: 'de' | 'en' }) {
  const mobileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mobile = mobileRef.current;
    if (!mobile) return;
    return animateValueNumbers(
      mobile,
      lang,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, [lang]);

  return (
    <div ref={mobileRef} className="mobile-value-impact is-revealed" id="mobile-journey-value">
      <ValueImpactContent lang={lang} />
    </div>
  );
}

function ValueImpactWorld({ lang }: { lang: 'de' | 'en' }) {
  const worldRef = useRef<HTMLDivElement | null>(null);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let wasVisible = false;
    let wasInteractive = false;
    let cancelNumberAnimation = () => {};

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cameraState = (window as any).__cardsCameraState;
      if (!cameraState) return;

      const exitProgress = Math.max(0, Math.min(1, cameraState.exitProgress || 0));
      const approachProgress = Math.max(0, Math.min(1, cameraState.approachProgress || 0));
      // Am Navigationsstopp "Dein Mehrwert" (kurz nach der Kartenstation)
      // ist die Gruppe bereits vollständig lesbar; direkt an der
      // Karten-Totalen bleibt sie trotzdem komplett hinter der Kamera. Die
      // ersten 6 % der Ausfahrt gehören ausschliesslich dem Ausblenden der
      // Lösungskarten; erst danach fährt die Mehrwert-Einheit ins Sichtfeld.
      const revealRaw = Math.max(0, Math.min(1, (exitProgress - 0.06) / 0.16));
      const reveal = revealRaw * revealRaw * (3 - 2 * revealRaw);
      const depth = exitProgress * exitProgress * (3 - 2 * exitProgress);
      const translateY = (1 - reveal) * 112;
      const rotateX = (1 - reveal) * 34;
      const overviewScale = 1.12 - depth * 0.12;
      // Der komplette Kartenüberflug liegt im ersten Drittel des neuen
      // Schlussflugs. Danach ist die DOM-Ebene vollständig verschwunden,
      // bevor das grüne WebGL-Gehirn im leeren Raum eingeblendet wird.
      const cardFlightRaw = Math.max(0, Math.min(1, approachProgress / 0.36));
      const cardFlightEase = cardFlightRaw * cardFlightRaw * (3 - 2 * cardFlightRaw);
      const approachScale = overviewScale * (1 + cardFlightEase * 1.28);
      const approachX = cardFlightEase * 44;
      const approachY = cardFlightEase * 36;
      const approachFadeRaw = Math.max(0, Math.min(1, (approachProgress - 0.2) / 0.22));
      const approachFade = 1 - approachFadeRaw * approachFadeRaw * (3 - 2 * approachFadeRaw);
      // Die Referenzen übernehmen die Bühne noch während der ruhigen
      // Ozean-Totalen. Dadurch verschwinden die Mehrwertkarten vollständig,
      // bevor die drei echten Projekte einfahren.
      const referenceTakeoverRaw = Math.max(0, Math.min(1, (exitProgress - 0.38) / 0.16));
      const referenceTakeover = referenceTakeoverRaw * referenceTakeoverRaw * (3 - 2 * referenceTakeoverRaw);
      const opacity = Math.max(0, Math.min(1, (revealRaw - 0.08) / 0.44)) * approachFade * (1 - referenceTakeover);

      world.style.opacity = opacity.toFixed(3);
      world.style.transform = `translate3d(calc(-50% + ${approachX.toFixed(2)}vw), calc(-50% + ${(translateY + approachY).toFixed(2)}vh), 0) perspective(1400px) rotateX(${rotateX.toFixed(2)}deg) scale(${approachScale.toFixed(4)})`;
      const hasOpenInfo = Boolean(world.querySelector('.value-diagram-stage.is-info-open'));
      // Die Karten bleiben bereits im vollständig lesbaren Bereich anklickbar.
      // Das grössere Toleranzfenster verhindert, dass kleine Restbewegungen der
      // gedämpften Kamera einzelne Klickflächen kurzzeitig deaktivieren.
      const isInteractive = revealRaw > 0.34
        && approachProgress < 0.22
        && referenceTakeover < 0.72;
      if (wasInteractive && !isInteractive) {
        setResetToken((token) => token + 1);
      }
      wasInteractive = isInteractive;
      world.style.pointerEvents = hasOpenInfo || isInteractive ? 'auto' : 'none';
      world.setAttribute('aria-hidden', opacity > 0.65 ? 'false' : 'true');

      if (!wasVisible && revealRaw > 0.34) {
        wasVisible = true;
        world.classList.add('is-revealed');
        cancelNumberAnimation();
        cancelNumberAnimation = animateValueNumbers(world, lang, reduced);
      } else if (wasVisible && revealRaw <= 0.02) {
        wasVisible = false;
        world.classList.remove('is-revealed');
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      cancelNumberAnimation();
    };
  }, [lang]);

  return (
    <div ref={worldRef} className="value-impact-world" aria-hidden="true">
      <ValueImpactContent
        lang={lang}
        resetToken={resetToken}
      />
    </div>
  );
}

function ReferenceCardsContent({ lang }: { lang: 'de' | 'en' }) {
  const mobileDeckRef = useRef<HTMLDivElement | null>(null);
  const [mobileDeckIndex, setMobileDeckIndex] = useState(0);

  return (
    <div className={`references-content ${chakraPetch.className}`}>
      <div className="references-heading">
        <p>{lang === 'de' ? 'AUSGEWÄHLTE ARBEITEN' : 'SELECTED WORK'}</p>
        <PublicFlapHeading label={lang === 'de' ? 'MEINE REFERENZEN' : 'MY WORK'} repeat={false} />
      </div>
      <div
        ref={mobileDeckRef}
        className="references-grid"
        onScroll={(event) => setMobileDeckIndex(getMobileDeckIndex(event.currentTarget))}
      >
        {PROJECTS.map((project, index) => {
          const copy = project[lang];
          return (
            <article
              key={project.slug}
              className="reference-card"
              style={{
                '--reference-accent': project.color,
                '--reference-accent-rgb': project.colorRgb,
                '--reference-index': index,
              } as CSSProperties}
            >
              <div className="reference-card-image">
                <Image src={project.image} alt={`${copy.title}. ${copy.tag}`} fill sizes="(min-width: 1024px) 25vw, 90vw" />
                <span className="reference-card-status">{copy.cardStatus ?? copy.status}</span>
              </div>
              <div className="reference-card-copy">
                <p className="reference-card-tag">{copy.tag}</p>
                <h3>{copy.title}</h3>
                <p className="reference-card-tagline">{copy.tagline}</p>
                <p className="reference-card-role">{copy.role}</p>
                <div className="reference-card-actions">
                  <a href={`/portfolio/${project.slug}`} className="reference-card-case-link">
                    {lang === 'de' ? 'Case ansehen' : 'View case'}
                    <ChevronRight size={15} strokeWidth={2.2} aria-hidden="true" />
                  </a>
                  {project.externalUrl ? (
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reference-card-external"
                      aria-label={`${copy.title}: ${lang === 'de' ? 'Live-Projekt öffnen' : 'Open live project'}`}
                    >
                      <ExternalLink size={15} strokeWidth={2} aria-hidden="true" />
                    </a>
                  ) : project.documentUrl ? (
                    <a
                      href={project.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reference-card-external"
                      aria-label={`${copy.title}: ${lang === 'de' ? 'Businessplan öffnen' : 'Open business plan'}`}
                    >
                      <ExternalLink size={15} strokeWidth={2} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <MobileDeckControls
        activeIndex={mobileDeckIndex}
        count={PROJECTS.length}
        label={lang === 'de' ? 'Referenzen' : 'References'}
        lang={lang}
        onSelect={(index) => {
          setMobileDeckIndex(index);
          scrollMobileDeckTo(mobileDeckRef.current, index);
        }}
      />
    </div>
  );
}

function ReferencesWorld({ lang }: { lang: 'de' | 'en' }) {
  const worldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    let rafId = 0;

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cameraState = (window as any).__cardsCameraState;
      if (!cameraState) return;

      const exitProgress = Math.max(0, Math.min(1, cameraState.exitProgress || 0));
      const approachProgress = Math.max(0, Math.min(1, cameraState.approachProgress || 0));
      const revealRaw = Math.max(0, Math.min(1, (exitProgress - 0.42) / 0.18));
      const reveal = revealRaw * revealRaw * (3 - 2 * revealRaw);
      const departureRaw = Math.max(0, Math.min(1, approachProgress / 0.22));
      const departure = departureRaw * departureRaw * (3 - 2 * departureRaw);
      const opacity = reveal * (1 - departure);
      const translateY = (1 - reveal) * 70 - departure * 34;
      const scale = 0.96 + reveal * 0.04 + departure * 0.035;

      world.style.opacity = opacity.toFixed(3);
      world.style.transform = `translate3d(-50%, calc(-50% + ${translateY.toFixed(2)}px), 0) scale(${scale.toFixed(4)})`;
      world.style.pointerEvents = opacity > 0.9 ? 'auto' : 'none';
      world.setAttribute('aria-hidden', opacity > 0.65 ? 'false' : 'true');
      world.classList.toggle('is-revealed', opacity > 0.68);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div ref={worldRef} className="references-world" aria-hidden="true">
      <ReferenceCardsContent lang={lang} />
    </div>
  );
}

function ProjectCtaContent({ lang }: { lang: 'de' | 'en' }) {
  const [activeForm, setActiveForm] = useState<LeadFormId>('overview');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [hpWebsite, setHpWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const formOpenedAtRef = useRef(Date.now());
  const consultationStartedRef = useRef(false);
  const consultationNameRef = useRef<HTMLInputElement | null>(null);
  const consultationEmailRef = useRef<HTMLInputElement | null>(null);
  const consultationMessageRef = useRef<HTMLTextAreaElement | null>(null);
  const consultationConsentRef = useRef<HTMLInputElement | null>(null);

  function showConsultationError(
    message: string,
    target: { readonly current: HTMLElement | null },
  ) {
    setError(message);
    window.requestAnimationFrame(() => {
      target.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.current?.focus({ preventScroll: true });
    });
  }

  function selectForm(form: LeadFormId, ctaId: string) {
    setActiveForm(form);
    trackWebsiteEvent('cta_click', { ctaId });
    if (form !== 'overview') trackWebsiteEvent('form_open', { formId: form as WebsiteFormId });
  }

  function markConsultationStarted() {
    if (consultationStartedRef.current) return;
    consultationStartedRef.current = true;
    trackWebsiteEvent('form_start', { formId: 'consultation', step: 1 });
  }

  useEffect(() => {
    const handleOpenForm = (event: Event) => {
      const requestedForm = (event as CustomEvent<LeadFormId>).detail;
      if (requestedForm === 'overview' || requestedForm === 'consultation' || requestedForm === 'project' || requestedForm === 'ki') {
        setActiveForm(requestedForm);
      }
    };
    window.addEventListener(OPEN_LEAD_FORM_EVENT, handleOpenForm);
    return () => window.removeEventListener(OPEN_LEAD_FORM_EVENT, handleOpenForm);
  }, []);
  const copy = lang === 'de'
    ? {
        kicker: 'PERSÖNLICH. UNVERBINDLICH. DIREKT.',
        title: 'PROJEKT BESPRECHEN.',
        text: 'Erzähl mir kurz, was du aufbauen, verbessern oder digitalisieren möchtest. Ich melde mich persönlich bei dir.',
        overviewKicker: 'DREI MÖGLICHKEITEN. DU ENTSCHEIDEST.',
        overviewTitle: 'WÄHLE DEINEN EINSTIEG.',
        overviewText: 'Wähle den Einstieg, der zu deinem aktuellen Vorhaben passt. Du kannst jederzeit zwischen den drei Wegen wechseln.',
        name: 'Name',
        email: 'E-Mail',
        message: 'Worum geht es?',
        placeholder: 'Beschreibe dein Vorhaben in wenigen Sätzen.',
        submit: 'Erstgespräch',
        send: 'Gespräch anfragen',
        project: 'Projektanfrage',
        kiCheck: 'KI-Check',
        consultationHint: 'Für ein unverbindliches erstes Gespräch.',
        projectHint: 'Für ein bereits konkretes Vorhaben.',
        kiCheckHint: 'Um dein KI-Potenzial schnell einzuordnen.',
        sending: 'Ich sende deine Anfrage.',
        successTitle: 'Vielen Dank.',
        successText: 'Deine Anfrage ist angekommen. Ich melde mich innerhalb von zwei Arbeitstagen persönlich bei dir.',
        nextTitle: 'Was jetzt passiert',
        nextItems: ['Ich prüfe deine Angaben persönlich.', 'Du erhältst innerhalb von zwei Arbeitstagen eine Rückmeldung.', 'Wir klären gemeinsam den sinnvollsten nächsten Schritt.'],
        viewReferences: 'Referenzen ansehen',
        error: 'Das Senden hat nicht funktioniert. Bitte versuche es erneut oder schreibe an kontakt@marcelspahr.ch.',
        requiredName: 'Bitte gib deinen Namen ein.',
        requiredEmail: 'Bitte gib deine E-Mail-Adresse ein.',
        invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
        requiredMessage: 'Bitte beschreibe kurz dein Vorhaben.',
        consentLead: 'Ich habe die ',
        privacyLink: 'Datenschutzerklärung',
        consentTail: ' gelesen und stimme der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage zu.',
        requiredConsent: 'Bitte bestätige die Datenschutzerklärung.',
      }
    : {
        kicker: 'PERSONAL. DIRECT. NO OBLIGATION.',
        title: 'DISCUSS YOUR PROJECT.',
        text: 'Tell me briefly what you want to build, improve or digitize. I will get back to you personally.',
        overviewKicker: 'THREE OPTIONS. YOU DECIDE.',
        overviewTitle: 'CHOOSE YOUR PATH.',
        overviewText: 'Choose the entry point that best matches your current project. You can switch between all three paths at any time.',
        name: 'Name',
        email: 'Email',
        message: 'What would you like to discuss?',
        placeholder: 'Describe your project in a few sentences.',
        submit: 'Initial conversation',
        send: 'Request a conversation',
        project: 'Project inquiry',
        kiCheck: 'AI check',
        consultationHint: 'For a no-obligation initial conversation.',
        projectHint: 'For a project that is already concrete.',
        kiCheckHint: 'To quickly assess your AI potential.',
        sending: 'I am sending your request.',
        successTitle: 'Thank you.',
        successText: 'Your request has arrived. I will contact you personally within two working days.',
        nextTitle: 'What happens next',
        nextItems: ['I personally review your information.', 'You receive a response within two business days.', 'Together, we define the most useful next step.'],
        viewReferences: 'View references',
        error: 'The message could not be sent. Please try again or email kontakt@marcelspahr.ch.',
        requiredName: 'Please enter your name.',
        requiredEmail: 'Please enter your email address.',
        invalidEmail: 'Please enter a valid email address.',
        requiredMessage: 'Please briefly describe your project.',
        consentLead: 'I have read the ',
        privacyLink: 'privacy policy',
        consentTail: ' and agree to the processing of my information for handling my inquiry.',
        requiredConsent: 'Please confirm the privacy policy.',
      };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      showConsultationError(copy.requiredName, consultationNameRef);
      return;
    }
    if (!email.trim()) {
      showConsultationError(copy.requiredEmail, consultationEmailRef);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showConsultationError(copy.invalidEmail, consultationEmailRef);
      return;
    }
    if (!message.trim()) {
      showConsultationError(copy.requiredMessage, consultationMessageRef);
      return;
    }
    if (!consent) {
      showConsultationError(copy.requiredConsent, consultationConsentRef);
      return;
    }
    setSubmitting(true);
    trackWebsiteEvent('form_submit', { formId: 'consultation', step: 1 });
    try {
      const response = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, consent, hpWebsite, startedAt: formOpenedAtRef.current }),
      });
      if (!response.ok) throw new Error('submit failed');
      trackWebsiteEvent('form_success', { formId: 'consultation', step: 1 });
      setSubmitted(true);
    } catch {
      trackWebsiteEvent('form_error', { formId: 'consultation', step: 1, metadata: { error_type: 'submit' } });
      setError(copy.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`project-cta-content ${chakraPetch.className}`} data-active-form={activeForm}>
      <PublicFlapHeading
        label={lang === 'de' ? 'DEIN PROJEKT' : 'YOUR PROJECT'}
        className="project-cta-section-flap"
        repeat={false}
      />
      <div className="project-cta-stage">
        <section
          className="project-cta-panel project-cta-overview"
          hidden={activeForm !== 'overview'}
          role="tabpanel"
          aria-label={lang === 'de' ? 'Formularauswahl' : 'Form selection'}
        >
          <p className="project-cta-kicker">{copy.overviewKicker}</p>
          <h2>{copy.overviewTitle}</h2>
          <p className="project-cta-copy">{copy.overviewText}</p>
          <div className="project-form-overview-grid">
            {([
              ['consultation', copy.submit, copy.consultationHint, MessageSquare],
              ['project', copy.project, copy.projectHint, ClipboardList],
              ['ki', copy.kiCheck, copy.kiCheckHint, Bot],
            ] as const).map(([id, label, hint, Icon]) => (
              <button
                key={id}
                type="button"
                data-form={id}
                onClick={() => selectForm(id, `contact_overview_${id}`)}
              >
                <span className="project-form-overview-icon"><Icon size={22} strokeWidth={1.8} /></span>
                <strong>{label}</strong>
                <small>{hint}</small>
                <span className="project-form-overview-arrow"><ChevronRight size={17} strokeWidth={2.2} /></span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="project-cta-panel project-cta-consultation"
          data-form="consultation"
          hidden={activeForm !== 'consultation'}
          role="tabpanel"
          aria-labelledby="project-form-tab-consultation"
        >
          <p className="project-cta-kicker">{copy.kicker}</p>
          <h2>{copy.title}</h2>
          {submitted ? (
            <div className="project-consultation-success-wrap" role="status">
              <div className="project-consultation-success">
                <CheckCircle size={24} strokeWidth={1.8} aria-hidden="true" />
                <div><strong>{copy.successTitle}</strong><p>{copy.successText}</p></div>
              </div>
              <div className="project-success-next">
                <strong>{copy.nextTitle}</strong>
                <ol>
                  {copy.nextItems.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}
                </ol>
              </div>
              <button type="button" className="project-success-reference" onClick={() => scrollToJourneyDestination('references')}>
                <span>{copy.viewReferences}</span>
                <ChevronRight size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <p className="project-cta-copy">{copy.text}</p>
              <form className="project-consultation-form" onSubmit={handleSubmit} onFocusCapture={markConsultationStarted} noValidate>
                {/* Honeypot: unsichtbar für Menschen, wird von den meisten
                    Formular-Spam-Bots automatisch ausgefüllt. */}
                <label style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
                  <span>Website</span>
                  <input
                    type="text"
                    name="hp_website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={hpWebsite}
                    onChange={(event) => setHpWebsite(event.target.value)}
                  />
                </label>
                <label>
                  <span>{copy.name}</span>
                  <input ref={consultationNameRef} value={name} onChange={(event) => { setName(event.target.value); setError(''); }} autoComplete="name" required />
                </label>
                <label>
                  <span>{copy.email}</span>
                  <input ref={consultationEmailRef} type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} autoComplete="email" required />
                </label>
                <label className="project-consultation-message">
                  <span>{copy.message}</span>
                  <textarea ref={consultationMessageRef} value={message} onChange={(event) => { setMessage(event.target.value); setError(''); }} placeholder={copy.placeholder} rows={3} required />
                </label>
                <label className="project-consent">
                  <input
                    ref={consultationConsentRef}
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => { setConsent(event.target.checked); setError(''); }}
                    required
                  />
                  <span>
                    {copy.consentLead}<a href="/datenschutz" target="_blank" rel="noreferrer">{copy.privacyLink}</a>{copy.consentTail}
                  </span>
                </label>
                {error && <p className="project-consultation-error" role="alert" aria-live="assertive">{error}</p>}
                <div className="project-consultation-actions">
                  <button type="submit" className="project-cta-button" disabled={submitting}>
                    <span>{submitting ? copy.sending : copy.send}</span>
                    <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        <section
          className="project-cta-panel project-cta-embedded"
          data-form="project"
          hidden={activeForm !== 'project'}
          role="tabpanel"
          aria-labelledby="project-form-tab-project"
        >
          <EmbeddedForm>
            <ProjectInquiryPage />
          </EmbeddedForm>
        </section>

        <section
          className="project-cta-panel project-cta-embedded"
          data-form="ki"
          hidden={activeForm !== 'ki'}
          role="tabpanel"
          aria-labelledby="project-form-tab-ki"
        >
          <EmbeddedForm>
            <KiCheckPage />
          </EmbeddedForm>
        </section>
      </div>

      <div className="project-form-tabs" role="tablist" aria-label={lang === 'de' ? 'Formular wählen' : 'Choose a form'}>
        {([
          ['consultation', copy.submit, copy.consultationHint],
          ['project', copy.project, copy.projectHint],
          ['ki', copy.kiCheck, copy.kiCheckHint],
        ] as const).map(([id, label, hint]) => (
          <button
            key={id}
            id={`project-form-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeForm === id}
            className={activeForm === id ? 'is-active' : ''}
            data-form={id}
            onClick={() => selectForm(id, `contact_tab_${id}`)}
          >
            <strong>{label}</strong>
            <small>{hint}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function StudioWebSignature() {
  const signatureRef = useRef<HTMLDivElement | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  useEffect(() => {
    const signature = signatureRef.current;
    if (!signature) return;

    const world = signature.closest('.studio-profile-world');
    if (world) {
      const update = () => setIsWriting(world.getAttribute('aria-hidden') === 'false');
      const observer = new MutationObserver(update);
      observer.observe(world, { attributes: true, attributeFilter: ['aria-hidden'] });
      update();
      return () => observer.disconnect();
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsWriting(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.7] },
    );
    observer.observe(signature);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={signatureRef} className={`studio-web-signature${isWriting ? ' is-writing' : ''}`} aria-hidden="true">
      <span className="studio-signature-ink studio-signature-ink--shadow" />
      <span className="studio-signature-ink" />
      <span className="studio-signature-pen" />
    </div>
  );
}

function StudioProfileContent({ lang }: { lang: 'de' | 'en' }) {
  const copy = lang === 'de'
    ? {
        kicker: 'DIGITALSTUDIO MARCEL SPAHR. BERN.',
        title: 'Du arbeitest direkt mit mir.',
        intro: 'Ich begleite dein Projekt selbst, von der ersten Analyse bis zur Einführung. Dadurch kennst du jederzeit den Stand und weisst, wer die Verantwortung trägt.',
        quote: '„Ich höre zuerst zu, frage nach und baue danach eine Lösung, die zu deinem Unternehmen und deinem Alltag passt.“',
        facts: [
          ['Mehr als 15 Jahre Erfahrung.', 'Ich kenne IT, Projekte, Digitalisierung, Marketing und Verkauf aus der Praxis.'],
          ['Zwei Fachrichtungen.', 'Ich verbinde Wirtschaftsinformatik HF mit meiner Ausbildung in Werbetechnik.'],
          ['Eine verantwortliche Person.', 'Ich übernehme Analyse, UX, Entwicklung und Einführung persönlich.'],
          ['Mein Standort ist Bern.', 'Ich arbeite mit Kunden in der ganzen Schweiz und im Ausland.'],
        ],
      }
    : {
        kicker: 'MARCEL SPAHR DIGITAL STUDIO. BERN.',
        title: 'You work directly with me.',
        intro: 'I look after your project myself, from the first review to its introduction. You always know where the work stands and who is responsible.',
        quote: '“I listen first, ask questions and then build a solution that fits your business and your daily work.”',
        facts: [
          ['More than 15 years of experience.', 'I know IT, projects, digitalisation, marketing and sales from practical work.'],
          ['Two disciplines.', 'I combine Business Information Technology HF with my training in advertising technology.'],
          ['One responsible person.', 'I personally handle analysis, UX, development and introduction.'],
          ['I am based in Bern.', 'I work with customers throughout Switzerland and abroad.'],
        ],
      };

  return (
    <div className={`studio-profile-composition ${chakraPetch.className}`}>
      <PublicFlapHeading
        label={lang === 'de' ? 'DEIN DIGITALPARTNER' : 'YOUR DIGITAL PARTNER'}
        className="studio-profile-section-flap"
        repeat={false}
      />
      <div className="studio-profile-content">
        <div className="studio-profile-top-row">
          <div className="studio-profile-header-image">
            <Image src="/assets/MarcelSpahrHeader.jpg" alt="Marcel Spahr in einem modernen Arbeits- und Projektraum" fill sizes="(min-width: 1024px) 50vw, 100vw" priority={false} />
          </div>
          <div className="studio-profile-header-copy">
            <blockquote>{copy.quote}</blockquote>
          </div>
          <div className="studio-profile-header-signature" aria-label="Marcel Spahr">
            <StudioWebSignature />
          </div>
        </div>
        <div className="studio-profile-positioning-row">
          <div className="studio-profile-positioning-title">
            <p className="studio-profile-kicker">{copy.kicker}</p>
            <h2>{copy.title}</h2>
          </div>
          <div className="studio-profile-action">
            <p className="studio-profile-copy">{copy.intro}</p>
            <button
              type="button"
              className="studio-profile-cta"
              onClick={(event) => {
                event.currentTarget.blur();
                openJourneyLeadForm('project', {
                  navigate: false,
                  ctaId: 'digital_partner_project',
                });

                const openProjectStation = () => navigateToJourneyDestination('contact');
                if (window.innerWidth <= 699) {
                  // Erst das Projektformular rendern, dann dessen neue mobile
                  // Zielposition bestimmen. So verwirft Safari den Sprung
                  // nicht während desselben Touch-/Layout-Zyklus.
                  window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(openProjectStation);
                  });
                  return;
                }

                openProjectStation();
              }}
            >
              <ClipboardList size={16} strokeWidth={2} aria-hidden="true" />
              <span>{lang === 'de' ? 'Projekt besprechen' : 'Discuss your project'}</span>
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="studio-profile-facts">
          {copy.facts.map(([value, label]) => (
            <div key={value} className="studio-profile-fact">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudioProfileWorld({ lang }: { lang: 'de' | 'en' }) {
  const worldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    let rafId = 0;

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cameraState = (window as any).__cardsCameraState;
      if (!cameraState) return;

      const approachProgress = Math.max(0, Math.min(1, cameraState.approachProgress || 0));
      const revealRaw = Math.max(0, Math.min(1, (approachProgress - 0.5) / 0.07));
      const fadeRaw = Math.max(0, Math.min(1, (approachProgress - 0.68) / 0.07));
      const reveal = revealRaw * revealRaw * (3 - 2 * revealRaw);
      const fade = fadeRaw * fadeRaw * (3 - 2 * fadeRaw);
      const opacity = reveal * (1 - fade);
      const translateY = (1 - reveal) * 36 - fade * 20;
      const scale = 0.975 + reveal * 0.025;

      world.style.opacity = opacity.toFixed(3);
      world.style.transform = `translate3d(-50%, calc(-50% + ${translateY.toFixed(2)}px), 0) scale(${scale.toFixed(4)})`;
      world.style.pointerEvents = opacity > 0.92 ? 'auto' : 'none';
      world.setAttribute('aria-hidden', opacity > 0.65 ? 'false' : 'true');
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div ref={worldRef} className="studio-profile-world" aria-hidden="true">
      <StudioProfileContent lang={lang} />
    </div>
  );
}

function ProjectCtaWorld({ lang }: { lang: 'de' | 'en' }) {
  const worldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    let rafId = 0;

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cameraState = (window as any).__cardsCameraState;
      if (!cameraState) return;

      const approachProgress = Math.max(0, Math.min(1, cameraState.approachProgress || 0));
      const revealRaw = Math.max(0, Math.min(1, (approachProgress - 0.86) / 0.12));
      const reveal = revealRaw * revealRaw * (3 - 2 * revealRaw);
      const translateY = (1 - reveal) * 28;
      const scale = 0.965 + reveal * 0.035;

      world.style.opacity = reveal.toFixed(3);
      world.style.transform = `translate3d(-50%, calc(-50% + ${translateY.toFixed(2)}px), 0) scale(${scale.toFixed(4)})`;
      world.style.pointerEvents = reveal > 0.92 ? 'auto' : 'none';
      world.setAttribute('aria-hidden', reveal > 0.65 ? 'false' : 'true');
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div ref={worldRef} className="project-cta-world" aria-hidden="true">
      <ProjectCtaContent lang={lang} />
    </div>
  );
}

// Split-Flap-Buchstaben-Zerhacker für alle 4 "Deine …"-Intro-Textstationen:
// jeder Buchstabe klappt unabhängig von seinen Nachbarn (eigenes Tempo,
// eigene Pausen) endlos durch zufällige Zeichen — kein Split-Flap-Kästchen
// im Hintergrund, nur der weisse Buchstabe selbst kollabiert vertikal
// (scaleY) und entfaltet sich mit dem nächsten Zeichen wieder. Bewusst
// scaleY statt einer echten 3D-rotateX-Perspektiv-Rotation: Letztere
// verzieht/staucht die Glyphen sichtbar während des Flips (abhängig von
// Schriftgrösse und Kamerawinkel), scaleY ist eine reine 2D-Transformation
// ohne jede perspektivische Verzerrungsmöglichkeit. Die Dauerschleife läuft
// permanent während gescrollt wird; steht der Scroll still, bekommen alle
// Buchstaben den Befehl, beim nächsten eigenen Taktschritt auf ihrem
// Zielbuchstaben anzuhalten ("settle"). Sobald wieder gescrollt wird, läuft
// die Dauerschleife an denselben (dann gestoppten) Buchstaben weiter ("spin").
function SpiralShowcase({ t, lang }: { t: typeof T['de']; lang: 'de' | 'en' }) {
  const introSequence = INTRO_SEQUENCES[lang];
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null);
  const [mobileServiceIndex, setMobileServiceIndex] = useState(0);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastStrandProgressRef = useRef(-1);
  const viewportRef = useRef({ width: 0, height: 0 });
  const serviceStationsRef = useRef<HTMLDivElement | null>(null);
  const cardsWorldRef = useRef<HTMLDivElement | null>(null);
  const mobileServicesRef = useRef<HTMLDivElement | null>(null);
  // Je 1 Ref-Slot pro Intro-Station (worldIndex 0..3, "Deine …") — Arrays
  // statt einzelner Refs, da alle 4 Stationen dieselbe Split-Flap-Logik in
  // derselben Schleife (IntroFlapWorld-Effekt) durchlaufen.
  const introFlapWorldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introFlapSmallRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introFlapBigRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Neural Glass Panels: die vier Karten bilden EIN zusammenstehendes
  // 2×2-Element (CardsHelixGroup), fixiert an EINER festen Helix-Position
  // (worldIndex 4, exakt derselbe Weltkoordinaten-Stopp wie zuvor die
  // erste echte 3D-Leistungskarte in BrainBackground.tsx: nach dem
  // 4. Intro-Text, vor der ersten echten 3D-Leistungskarte, Radius 1.68 — also
  // derselbe Stationsabstand wie zwischen den vorherigen Texten, da
  // HELIX_STEP zwischen allen Stopps konstant ist).
  //
  // CardsHelixWorld (cardsWorldRef) bildet AUSSCHLIESSLICH die
  // Gegenbewegung der Three.js-Kamera ab: Position, Skalierung und
  // Rotation werden jeden Frame aus derselben, bereits gedämpften
  // Kamera-Live-Daten (window.__cardsCameraState, von BrainBackground.tsx
  // im Tick veröffentlicht) über eine echte Perspektiv-Projektion
  // berechnet — keine eigene Scrollberechnung, kein zweiter Timeline.
  // CardsHelixGroup (serviceStationsRef) behält ihre feste 2×2-Anordnung
  // und alle internen Karten-Animationen unverändert; hier wird nur noch
  // Sichtbarkeit (Opacity/pointer-events/is-materialized) gesetzt.
  useEffect(() => {
    const world = cardsWorldRef.current;
    const group = serviceStationsRef.current;
    if (!world || !group) return;

    const introStopCount = INTRO_STOP_COUNT;
    const totalWorldStops = introStopCount + 4 + 4;
    const cameraTravel = computeCameraTravel(totalWorldStops);
    const worldIndex = introStopCount;
    const stationAngle = helixAngleForWorldIndex(worldIndex, cameraTravel);
    const stationPos = helixPositionForWorldIndex(worldIndex, cameraTravel, CARD_GROUP_RADIUS);
    // Feste radiale Ausrichtung nach aussen, zum Goldstrang hin orientiert
    // (dieselbe Konvention wie rotation.y=angle bei den Intro-Texten).
    const stationNormal = { x: Math.sin(stationAngle), y: 0, z: Math.cos(stationAngle) };
    // Fensterbreite in derselben Grössenordnung wie cameraRailSlowdown()s
    // Fokusfenster in BrainBackground.tsx (kein neuer, frei erfundener Wert).
    const fadeWindow = HELIX_STEP * 1.35;

    let materialized = false;
    let referenceViewZ: number | null = null;
    let rafId = 0;
    let wasInteractive = false;

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cam = (window as any).__cardsCameraState;
      if (!cam) return;

      const camPos = {
        x: typeof cam.cameraX === 'number' ? cam.cameraX : Math.sin(cam.orbit) * cam.cameraRadius,
        y: cam.cameraY,
        z: typeof cam.cameraZ === 'number' ? cam.cameraZ : Math.cos(cam.orbit) * cam.cameraRadius,
      };

      let fx = (typeof cam.cameraLookX === 'number' ? cam.cameraLookX : 0) - camPos.x;
      let fy = cam.cameraLookY - camPos.y;
      let fz = (typeof cam.cameraLookZ === 'number' ? cam.cameraLookZ : 0) - camPos.z;
      const fLen = Math.hypot(fx, fy, fz) || 1;
      fx /= fLen; fy /= fLen; fz /= fLen;

      // right = normalize(cross(forward, worldUp)); up = cross(right, forward)
      let rx = fy * 0 - fz * 1;
      let ry = fz * 0 - fx * 0;
      let rz = fx * 1 - fy * 0;
      const rLen = Math.hypot(rx, ry, rz) || 1;
      rx /= rLen; ry /= rLen; rz /= rLen;
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const relX = stationPos.x - camPos.x;
      const relY = stationPos.y - camPos.y;
      const relZ = stationPos.z - camPos.z;

      const viewX = relX * rx + relY * ry + relZ * rz;
      const viewY = relX * ux + relY * uy + relZ * uz;
      const viewZ = relX * fx + relY * fy + relZ * fz;

      const distance = Math.abs(cam.cameraLookY - stationPos.y);
      const stationVisibility = Math.max(0, Math.min(1, 1 - distance / fadeWindow));

      // Nach dem Helix-Stopp bleibt cameraLookY absichtlich auf Kartenhöhe,
      // während nur der Kameraradius wächst. Eine reine Y-Distanzprüfung
      // hielt die Karten deshalb während der gesamten Tal-Ausfahrt sichtbar.
      // Der echte Ausfahrfortschritt blendet die komplette Kartengruppe
      // inklusive "MEINE UMSETZUNG" nun aus, bevor "Dein Mehrwert" aufsteigt.
      const exitProgress = Math.max(0, Math.min(1, cam.exitProgress || 0));
      const exitFadeRaw = Math.max(0, Math.min(1, (exitProgress - 0.015) / 0.075));
      const exitFade = 1 - exitFadeRaw * exitFadeRaw * (3 - 2 * exitFadeRaw);
      const visibility = stationVisibility * exitFade;

      if (viewZ <= 0.001 || visibility <= 0) {
        group.style.opacity = '0';
        group.style.pointerEvents = 'none';
        group.classList.remove('is-interactive');
        if (wasInteractive) setActiveServiceSlug(null);
        wasInteractive = false;
        return;
      }

      // Referenztiefe bei nächster Annäherung (Kamera und Station auf
      // gleichem Winkel): Kameraradius minus Kartenradius, plus die feste
      // vertikale Kameraversetzung — aus echten Live-Kameradaten kalibriert,
      // kein geschätzter Pixelwert.
      if (referenceViewZ === null) {
        referenceViewZ = Math.hypot(cam.cameraRadius - CARD_GROUP_RADIUS, 0.24);
      }

      const tanHalfFovY = Math.tan((cam.fov * Math.PI) / 360);
      const ndcX = viewX / (viewZ * tanHalfFovY * cam.aspect);
      const ndcY = viewY / (viewZ * tanHalfFovY);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const screenX = (ndcX * 0.5 + 0.5) * vw;
      const screenY = (1 - (ndcY * 0.5 + 0.5)) * vh;
      const scale = Math.max(0.4, Math.min(1.6, referenceViewZ / viewZ));

      // Foreshortening-Yaw: feste Weltnormale der Station, ausgedrückt in
      // der live Kamerabasis — 0° wenn die Station direkt zur Kamera zeigt,
      // wächst, während die Kamera an der fixen Station vorbeifliegt.
      const dotNormalRight = stationNormal.x * rx + stationNormal.z * rz;
      const dotNormalForward = stationNormal.x * fx + stationNormal.z * fz;
      const yawRad = Math.atan2(dotNormalRight, -dotNormalForward);
      const yawDeg = (yawRad * 180) / Math.PI;

      world.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateY(${yawDeg.toFixed(3)}deg)`;

      // Die rohe 3D-Sichtbarkeit steuert weiterhin den Ein-/Ausflug. Sobald
      // die Karten jedoch ihren interaktiven Stationsbereich erreichen,
      // muss die DOM-Ebene vollständig deckend sein; andernfalls wird selbst
      // eine nahezu opake Glasfläche durch die Eltern-Opacity transparent.
      const visualOpacityRaw = Math.max(0, Math.min(1, (visibility - 0.05) / 0.5));
      const visualOpacity = visualOpacityRaw * visualOpacityRaw * (3 - 2 * visualOpacityRaw);
      group.style.opacity = visualOpacity.toFixed(3);
      const isInteractive = visibility > 0.55;
      group.style.pointerEvents = isInteractive ? 'auto' : 'none';
      group.classList.toggle('is-interactive', isInteractive);
      if (wasInteractive && !isInteractive) setActiveServiceSlug(null);
      wasInteractive = isInteractive;
      if (!materialized && visibility > 0.05) {
        materialized = true;
        group.classList.add('is-materialized');
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // IntroFlapWorld: ersetzt die WebGL-Textebenen ALLER 4 Intro-Stationen
  // ("Deine Idee.", "Deine Herausforderung.", "Deine Vision." und "Deine
  // Lösung." — worldIndex 0..3, in
  // BrainBackground.tsx wird deren Mesh-Erzeugung übersprungen) durch
  // dieselben Textstationen als DOM-Overlay in Chakra Petch mit
  // unabhängigem Split-Flap-Effekt pro Buchstabe. Position, Kamerafahrt,
  // Helix, Sichtbarkeitsfenster und Perspektiv-Projektion sind exakt
  // dieselbe Technik wie bei CardsHelixWorld oben — nur Schriftart/
  // Darstellungseffekt sind neu. Eine gemeinsame requestAnimationFrame-
  // Schleife bedient alle 4 Stationen; der Scroll-Idle-Zustand ist global
  // (ein Scroll-Stopp lässt alle sichtbaren Stationen gleichzeitig stehen).
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const totalWorldStops = INTRO_STOP_COUNT + 4 + 4;
    const cameraTravel = computeCameraTravel(totalWorldStops);
    const fadeWindow = HELIX_STEP * 1.35;

    type IntroFlapStation = {
      world: HTMLDivElement;
      stationPos: { x: number; y: number; z: number };
      stationNormal: { x: number; y: number; z: number };
      smallLetters: FlapLetter[];
      bigLetters: FlapLetter[];
      alignBigWord: () => void;
      referenceViewZ: number | null;
      settled: boolean;
    };

    const stations: IntroFlapStation[] = introSequence.map((text, worldIndex) => {
      const world = introFlapWorldRefs.current[worldIndex];
      const smallEl = introFlapSmallRefs.current[worldIndex];
      const bigEl = introFlapBigRefs.current[worldIndex];
      if (!world || !smallEl || !bigEl) return null;

      const stationAngle = helixAngleForWorldIndex(worldIndex, cameraTravel);
      const stationPos = helixPositionForWorldIndex(worldIndex, cameraTravel, INTRO_TEXT_RADIUS);
      const stationNormal = { x: Math.sin(stationAngle), y: 0, z: Math.cos(stationAngle) };

      // "Deine X." → "DEINE" (klein, oben) / "X." (3x, unten, am 3.
      // Buchstaben von DEINE ausgerichtet) — dieselbe Konvention wie bei
      // der ersten Station "Deine Idee.".
      const [firstWord, ...rest] = text.toUpperCase().split(' ');
      const smallLetters = buildFlapWord(smallEl, firstWord);
      const bigLetters = buildFlapWord(bigEl, rest.join(' '));

      function alignBigWord() {
        // offsetLeft statt getBoundingClientRect, weil offsetLeft reines
        // Layout ist und vom per-Frame gesetzten transform (scale/
        // translate) der Kamera-Projektion unberührt bleibt —
        // getBoundingClientRect würde den aktuellen Skalierungsfaktor mit
        // einrechnen und die Ausrichtung dadurch verfälschen.
        bigEl!.style.marginLeft = '0px';
        const offset = smallLetters[2].wrap.offsetLeft - bigLetters[0].wrap.offsetLeft;
        bigEl!.style.marginLeft = `${offset}px`;
      }

      setFlapWordMode(smallLetters, 'spin', reduced);
      setFlapWordMode(bigLetters, 'spin', reduced);

      return { world, stationPos, stationNormal, smallLetters, bigLetters, alignBigWord, referenceViewZ: null, settled: false };
    }).filter((s): s is IntroFlapStation => s !== null);

    if (!stations.length) return;

    // Split-Flap ersetzt die bisherige Opacity-Ein-/Ausblendung: jede
    // Station ist entweder ganz im Fenster (Buchstaben drehen endlos oder
    // stehen fest) oder ganz ausserhalb (unsichtbar) — kein sanftes
    // Überblenden. Der Effekt hängt ausschliesslich vom (globalen)
    // Scroll-Zustand ab: wird gescrollt, drehen die Buchstaben; steht der
    // Scroll still, bleibt der Text jeder gerade sichtbaren Station fest
    // stehen — unabhängig davon, wo genau sie im Bild steht.
    const SCROLL_IDLE_MS = 180;
    let lastScrollAt = performance.now() - SCROLL_IDLE_MS - 1; // vor jedem Scrollen: als "idle" gestartet
    const onScrollActivity = () => { lastScrollAt = performance.now(); };
    window.addEventListener('scroll', onScrollActivity, { passive: true });

    const alignAll = () => stations.forEach((s) => s.alignBigWord());
    alignAll();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(alignAll);
    }
    window.addEventListener('resize', alignAll);
    const mobileSolutionsStage = document.getElementById('mobile-solutions');

    let rafId = 0;
    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cam = (window as any).__cardsCameraState;
      if (!cam) return;

      const scrollIdle = performance.now() - lastScrollAt > SCROLL_IDLE_MS;

      const camPos = {
        x: typeof cam.cameraX === 'number' ? cam.cameraX : Math.sin(cam.orbit) * cam.cameraRadius,
        y: cam.cameraY,
        z: typeof cam.cameraZ === 'number' ? cam.cameraZ : Math.cos(cam.orbit) * cam.cameraRadius,
      };

      let fx = (typeof cam.cameraLookX === 'number' ? cam.cameraLookX : 0) - camPos.x;
      let fy = cam.cameraLookY - camPos.y;
      let fz = (typeof cam.cameraLookZ === 'number' ? cam.cameraLookZ : 0) - camPos.z;
      const fLen = Math.hypot(fx, fy, fz) || 1;
      fx /= fLen; fy /= fLen; fz /= fLen;

      let rx = fy * 0 - fz * 1;
      let ry = fz * 0 - fx * 0;
      let rz = fx * 1 - fy * 0;
      const rLen = Math.hypot(rx, ry, rz) || 1;
      rx /= rLen; ry /= rLen; rz /= rLen;
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const tanHalfFovY = Math.tan((cam.fov * Math.PI) / 360);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobileIntroIndex = vw <= 699
        ? Math.round((TEXT_START_Y - cam.cameraLookY) / HELIX_STEP)
        : -1;
      const mobileSolutionsTop = vw <= 699
        ? mobileSolutionsStage?.getBoundingClientRect().top
        : undefined;
      const mobileCardsEntered = typeof mobileSolutionsTop === 'number'
        && mobileSolutionsTop <= vh * 0.9;

      // Beim Verlassen der Kartenstation bleibt die Kamera auf der Höhe der
      // letzten Intro-Station. Ohne einen Ausfahr-Fade bliebe deshalb "Deine
      // Lösung." über der neuen Mehrwert-Szene stehen. Noch bevor
      // deren Split-Flap-Titel erscheint, wird die Intro-Ebene vollständig
      // ausgeblendet; beim Zurückscrollen läuft der Übergang reversibel.
      const exitProgress = Math.max(0, Math.min(1, cam.exitProgress || 0));
      const introExitRaw = Math.max(0, Math.min(1, (exitProgress - 0.01) / 0.06));
      const introExitOpacity = 1 - introExitRaw * introExitRaw * (3 - 2 * introExitRaw);

      stations.forEach((s, stationIndex) => {
        if (!s.settled && scrollIdle) {
          s.settled = true;
          setFlapWordMode(s.smallLetters, 'settle', reduced);
          setFlapWordMode(s.bigLetters, 'settle', reduced);
        } else if (s.settled && !scrollIdle) {
          s.settled = false;
          setFlapWordMode(s.smallLetters, 'spin', reduced);
          setFlapWordMode(s.bigLetters, 'spin', reduced);
        }

        const relX = s.stationPos.x - camPos.x;
        const relY = s.stationPos.y - camPos.y;
        const relZ = s.stationPos.z - camPos.z;

        const viewX = relX * rx + relY * ry + relZ * rz;
        const viewY = relX * ux + relY * uy + relZ * uz;
        const viewZ = relX * fx + relY * fy + relZ * fz;

        const distance = Math.abs(cam.cameraLookY - s.stationPos.y);
        const visibility = Math.max(0, Math.min(1, 1 - distance / fadeWindow));
        // Auf schmalen Viewports darf immer nur die räumlich nächste
        // Intro-Station sichtbar sein. So verschwindet "Deine Lösung"
        // bereits vor dem Stopp der ersten Umsetzungskarte und kann deren
        // Kapitelüberschrift nicht mehr überlagern.
        const isNearestMobileStation = vw > 699 || stationIndex === mobileIntroIndex;
        const inWindow = viewZ > 0.001
          && visibility > 0
          && introExitOpacity > 0
          && isNearestMobileStation
          && !mobileCardsEntered;

        if (!inWindow) {
          s.world.style.opacity = '0';
          return;
        }

        if (s.referenceViewZ === null) {
          s.referenceViewZ = Math.hypot(cam.cameraRadius - INTRO_TEXT_RADIUS, 0.24);
        }

        const ndcX = viewX / (viewZ * tanHalfFovY * cam.aspect);
        const ndcY = viewY / (viewZ * tanHalfFovY);
        const projectedX = (ndcX * 0.5 + 0.5) * vw;
        const projectedY = 1 - (ndcY * 0.5 + 0.5);
        // iPhone: in den tatsächlich sichtbaren Bereich unter der Safe Area
        // projizieren, damit grosse Flap-Texte oben nicht am
        // overflow:hidden der Sticky-Bühne abgeschnitten werden.
        const mobileTopInset = vw <= 699 ? Math.max(48, vh * 0.07) : 0;
        const mobileBottomInset = vw <= 699 ? Math.max(24, vh * 0.04) : 0;
        const screenY = mobileTopInset + projectedY * (vh - mobileTopInset - mobileBottomInset);
        let scale = Math.max(0.4, Math.min(1.6, s.referenceViewZ / viewZ));
        let screenX = projectedX;

        // Die seitliche Helix-Projektion darf auf Mobile erhalten bleiben,
        // aber nie Buchstaben aus dem sichtbaren Bereich schieben. Lange
        // Wörter werden zuerst auf die sichere Viewportbreite skaliert und
        // danach mitsamt ihrem echten gerenderten Halbmesser eingeklemmt.
        if (vw <= 699) {
          const composition = s.world.firstElementChild as HTMLElement | null;
          const naturalWidth = composition?.offsetWidth || 0;
          const sideInset = 16;
          const availableWidth = Math.max(1, vw - sideInset * 2);
          if (naturalWidth > 0) {
            scale = Math.min(scale, availableWidth / naturalWidth);
            const renderedHalfWidth = Math.min(availableWidth / 2, (naturalWidth * scale) / 2);
            screenX = Math.max(
              sideInset + renderedHalfWidth,
              Math.min(vw - sideInset - renderedHalfWidth, projectedX),
            );
          }
        }

        // Im "settled"-Zustand (Scroll steht still) immer frontal (0°)
        // anzeigen: der Foreshortening-Yaw hängt vom exakten Kamerawinkel
        // beim Stoppen ab — das kann ein beliebiger, teils starker Winkel
        // sein und liess die Buchstaben dann sichtbar schräg/verzerrt
        // "einfrieren". Beim Scrollen (spin) bleibt der echte, dynamische
        // Kamerawinkel unverändert bestehen.
        const dotNormalRight = s.stationNormal.x * rx + s.stationNormal.z * rz;
        const dotNormalForward = s.stationNormal.x * fx + s.stationNormal.z * fz;
        const yawDeg = s.settled ? 0 : (Math.atan2(dotNormalRight, -dotNormalForward) * 180) / Math.PI;

        s.world.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateY(${yawDeg.toFixed(3)}deg)`;
        // Split-Flap statt Opacity-Fade: innerhalb des Fensters immer voll
        // sichtbar (kein Überblenden) — die An-/Abwesenheit wird durch Spin
        // (unleserlich, beim Scrollen) vs. Settle (lesbar, im Stillstand)
        // ausgedrückt (siehe scrollIdle oben).
        s.world.style.opacity = introExitOpacity.toFixed(3);
      });
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', alignAll);
      window.removeEventListener('scroll', onScrollActivity);
    };
  }, [introSequence]);

  useEffect(() => {
    if (CAMERA_ONLY_WORLD) return;
    const section = document.getElementById('solution-spiral');
    if (!section) return;
    const items = Array.from(section.querySelectorAll<HTMLElement>('[data-spiral-item]'));
    const strandAnchors = Array.from(section.querySelectorAll<HTMLElement>('[data-spiral-strand-anchor]'));
    const continuousStrand = section.querySelector<SVGSVGElement>('[data-continuous-strand]');
    const continuousStrandPaths = continuousStrand
      ? Array.from(continuousStrand.querySelectorAll<SVGPathElement>('[data-strand-path]'))
      : [];
    const serviceItems = Array.from(section.querySelectorAll<HTMLElement>('[data-service-card]'));
    let lastRenderedProgress = Number.NaN;

    const update = () => {
      const start = section.offsetTop;
      const end = start + section.offsetHeight - window.innerHeight;
      const raw = (window.scrollY - start) / Math.max(1, end - start);
      targetProgressRef.current = Math.max(0, Math.min(1, raw));
    };

    const updateViewport = () => {
      viewportRef.current = { width: window.innerWidth, height: window.innerHeight };
    };

    const projectHelixPoint = (index: number, currentProgress: number) => {
      const angle = index * spiralAngleStep - currentProgress * rotationTravel;
      const rad = (angle * Math.PI) / 180;
      const y = index * verticalStep - currentProgress * totalTravel + spiralYOffset;
      const z = Math.cos(rad) * (radius - 24);
      const perspective = 1700;
      const depth = perspective / Math.max(420, perspective - z);
      const { width, height } = viewportRef.current;

      return {
        x: width / 2 + Math.sin(rad) * (radius - 24) * depth,
        y: height / 2 + y * depth,
      };
    };

    const renderProgress = (currentProgress: number) => {
      const rotationTravel = (spiralAngleStep * totalTravel) / verticalStep;
      items.forEach((item, i) => {
        const angle = i * spiralAngleStep - currentProgress * rotationTravel;
        const rad = (angle * Math.PI) / 180;
        const y = i * verticalStep - currentProgress * totalTravel + spiralYOffset;
        const front = Math.cos(rad);
        const visible = Math.max(0, 1 - Math.abs(y) / 690);
        const frontFocus = Math.max(0, (front + 0.18) / 1.18);
        const opacity = Math.max(0, Math.min(1, visible * frontFocus));

        item.style.transform = `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius}px) translate3d(0, ${y}px, 0) scale(1)`;
        item.style.opacity = String(opacity);
        item.style.zIndex = String(Math.round(1000 + front * 120 + visible * 240));
      });

      strandAnchors.forEach((strand, i) => {
        const strandIndex = i + 0.5;
        const angle = strandIndex * spiralAngleStep - currentProgress * rotationTravel;
        const rad = (angle * Math.PI) / 180;
        const y = strandIndex * verticalStep - currentProgress * totalTravel + spiralYOffset;
        const front = Math.cos(rad);
        const visible = Math.max(0, 1 - Math.abs(y) / 720);
        const frontFocus = Math.max(0, (front + 0.1) / 1.1);
        const opacity = Math.max(0, Math.min(0.82, visible * frontFocus * 0.82));

        strand.style.transform = `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius - 24}px) translate3d(0, ${y}px, 0)`;
        strand.dataset.strandOpacity = String(opacity);
        strand.style.zIndex = String(Math.round(960 + front * 80 + visible * 120));
      });

      if (
        continuousStrand
        && continuousStrandPaths.length
        && strandAnchors.length > 1
        && Math.abs(currentProgress - lastStrandProgressRef.current) > 0.00035
      ) {
        lastStrandProgressRef.current = currentProgress;
        const { width, height } = viewportRef.current;
        continuousStrand.setAttribute('viewBox', `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`);
        const points = strandAnchors.map((_, index) => projectHelixPoint(index + 0.5, currentProgress));
        const first = points[0];
        const second = points[1];
        const last = points[points.length - 1];
        const beforeLast = points[points.length - 2];
        const extendedPoints = [
          {
            x: first.x + (first.x - second.x) * 0.42,
            y: first.y + (first.y - second.y) * 0.42,
          },
          ...points,
          {
            x: last.x + (last.x - beforeLast.x) * 0.42,
            y: last.y + (last.y - beforeLast.y) * 0.42,
          },
        ];

        const createPath = (sourcePoints: typeof extendedPoints, offset: number, phase: number) => sourcePoints.reduce((pathData, point, index, allPoints) => {
          const tv = index / Math.max(1, allPoints.length - 1);
          const wave = Math.sin(currentProgress * 12 + tv * 6 + phase) * 7 * tv * (1 - tv * 0.18);
          const taper = 0.32 + Math.sin(Math.PI * tv) * 0.72;
          const shifted = {
            x: point.x + offset * taper + wave,
            y: point.y + Math.cos(currentProgress * 14 + tv * 9 + phase) * 5 * taper,
          };
          if (index === 0) return `M ${shifted.x.toFixed(1)} ${shifted.y.toFixed(1)}`;
          const previous = allPoints[index - 1];
          const previousTv = (index - 1) / Math.max(1, allPoints.length - 1);
          const previousTaper = 0.36 + Math.sin(Math.PI * previousTv) * 0.94;
          const previousWave = Math.sin(currentProgress * 12 + previousTv * 6 + phase) * 7 * previousTv * (1 - previousTv * 0.18);
          const shiftedPrevious = {
            x: previous.x + offset * previousTaper + previousWave,
            y: previous.y + Math.cos(currentProgress * 14 + previousTv * 9 + phase) * 5 * previousTaper,
          };
          const controlX = (shiftedPrevious.x + shifted.x) / 2;
          return `${pathData} C ${controlX.toFixed(1)} ${shiftedPrevious.y.toFixed(1)}, ${controlX.toFixed(1)} ${shifted.y.toFixed(1)}, ${shifted.x.toFixed(1)} ${shifted.y.toFixed(1)}`;
        }, '');
        const opacity = Math.max(...strandAnchors.map((anchor) => Number(anchor.dataset.strandOpacity || 0)));

        continuousStrandPaths.forEach((pathElement) => {
          const role = pathElement.dataset.strandRole || 'fiber';
          const fiberIndex = Number(pathElement.dataset.fiberIndex || 0);
          const offset = role === 'glow' || role === 'core'
            ? 0
            : role === 'aura'
              ? fiberIndex * 22
              : (fiberIndex - 5.5) * 2.2 + Math.sin(fiberIndex * 1.7) * 2.2;
          const phase = fiberIndex * 0.61;
          pathElement.setAttribute('d', createPath(extendedPoints, offset, phase));
        });
        continuousStrand.style.opacity = String(Math.min(0.82, opacity));
      }

      serviceItems.forEach((item, i) => {
        const rowDelay = i > 1 ? 0.11 : 0;
        const raw = (currentProgress - 0.56 - rowDelay) / 0.2;
        const clamped = Math.max(0, Math.min(1, raw));
        const eased = 1 - Math.pow(1 - clamped, 3);
        const y = (1 - eased) * 150;

        item.style.transform = `translate3d(0, ${y}px, 0)`;
        // Der Detailzustand wird ausschliesslich über .is-detail-open
        // ausgeblendet. Eine zweite, gedämpfte JS-Opacity konnte nach
        // mehreren Öffnungen auf 0 stehen bleiben und spätere Karten sperren.
        item.style.opacity = String(eased);
        item.style.zIndex = '1260';
      });
    };

    const animate = (time: number) => {
      const delta = Math.min(40, time - (lastFrameTimeRef.current || time));
      lastFrameTimeRef.current = time;
      const easing = 1 - Math.pow(0.006, delta / 1000);
      const next = progressRef.current + (targetProgressRef.current - progressRef.current) * easing;
      progressRef.current = Math.abs(targetProgressRef.current - next) < 0.0006
        ? targetProgressRef.current
        : next;

      // Keine Layout-/Style-Schreibvorgänge in ruhenden Frames. Die vorherige
      // Dauerschleife schrieb auch bei unverändertem Scrollstand sämtliche
      // Kartenstile neu und verursachte zusammen mit WebGL unnötige Ruckler.
      if (
        !Number.isFinite(lastRenderedProgress)
        || Math.abs(progressRef.current - lastRenderedProgress) > 0.00005
      ) {
        renderProgress(progressRef.current);
        lastRenderedProgress = progressRef.current;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      updateViewport();
      update();
    };

    updateViewport();
    update();
    renderProgress(progressRef.current);
    frameRef.current = requestAnimationFrame(animate);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!activeServiceSlug) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveServiceSlug(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeServiceSlug]);

  useEffect(() => {
    const mobileStage = document.getElementById('mobile-solutions');
    if (!mobileStage) return;

    let wasVisible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
        if (wasVisible && !isVisible) setActiveServiceSlug(null);
        wasVisible = isVisible;
      },
      { threshold: [0, 0.15, 0.5] },
    );
    observer.observe(mobileStage);
    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      kind: 'intro',
      code: 'INTRO 01',
      title: introSequence[0],
      icon: Wrench,
    },
    {
      kind: 'intro',
      code: 'INTRO 02',
      title: introSequence[1],
      icon: Users,
    },
    {
      kind: 'intro',
      code: 'INTRO 03',
      title: introSequence[2],
      icon: Compass,
    },
    {
      kind: 'intro',
      code: 'INTRO 04',
      title: introSequence[3],
      icon: Lightbulb,
    },
    {
      kind: 'service',
      slug: 'corporate-design-webauftritt',
      code: '01',
      title: lang === 'de' ? 'Corporate Design\nund Webauftritt' : 'Corporate design\nand web presence',
      body: lang === 'de'
        ? 'Ich entwickle Marke und Website gemeinsam, damit dein Auftritt überall zusammenpasst.'
        : 'I develop the brand and website together so that your presence is consistent everywhere.',
      detailTitle: lang === 'de' ? 'Ich gebe deinem Unternehmen einen klaren Auftritt.' : 'I give your business a clear appearance.',
      detailText: lang === 'de'
        ? 'Ich entwickle Logo, Farben, Typografie, Bilder, Layout und Website passend zu deinem Unternehmen. So erkennen Kunden dein Unternehmen wieder und verstehen schneller, was du anbietest.'
        : 'I develop the logo, colours, typography, images, layout and website to suit your business. Customers recognise your business and understand your offer more quickly.',
      detailPoints: lang === 'de'
        ? ['Ich definiere Corporate Design und Gestaltungsregeln.', 'Ich plane Aufbau, Texteinstieg und Bedienung der Website.', 'Ich gestalte den Auftritt passend zu deinem Unternehmen.', 'Du erhältst eine verständliche Übergabe für spätere Änderungen.']
        : ['I define the corporate design and visual rules.', 'I plan the website structure, introduction and controls.', 'I design the appearance to suit your business.', 'You receive a clear handover for later changes.'],
      accent: '#c89a3d',
      accentRgb: '200,154,61',
      icon: Star,
    },
    {
      kind: 'service',
      slug: 'websites-applikationen',
      code: '02',
      title: lang === 'de' ? '2D- und 3D-Websites\nund Applikationen' : '2D and 3D websites\nand applications',
      body: lang === 'de'
        ? 'Ich entwickle Websites und Webanwendungen, die gut aussehen und zuverlässig funktionieren.'
        : 'I develop websites and web applications that look good and work reliably.',
      detailTitle: lang === 'de' ? 'Websites und Apps, die nicht nur gut aussehen.' : 'Websites and apps that do more than look good.',
      detailText: lang === 'de'
        ? 'Ich entwickle 2D und 3D Websites, Landingpages, Portale und Webanwendungen. Ladezeit, Darstellung, Animationen, Inhalte und Bedienung plane ich gemeinsam, damit die Seite auf jedem Gerät zuverlässig funktioniert.'
        : 'I develop 2D and 3D websites, landing pages, portals and web applications. I plan loading times, layout, animation, content and controls together so the site works reliably on every device.',
      detailPoints: lang === 'de'
        ? ['Ich entwickle individuelle Websites, Landingpages und Webanwendungen.', 'Ich gestalte 2D und 3D Interaktionen mit guten Ladezeiten.', 'Ich passe die Darstellung an Computer, Tablet und Smartphone an.', 'Ich schaffe eine technische Grundlage für Suchmaschinen und Erweiterungen.']
        : ['I develop custom websites, landing pages and web applications.', 'I design 2D and 3D interactions with good loading times.', 'I adapt the layout to computers, tablets and phones.', 'I create a technical basis for search engines and future additions.'],
      accent: '#4d7fbf',
      accentRgb: '77,127,191',
      icon: Globe,
    },
    {
      kind: 'service',
      slug: 'crm-erp-datenbanken',
      code: '03',
      title: lang === 'de' ? 'CRM, ERP\nund Datenbanken' : 'CRM, ERP\nand databases',
      body: lang === 'de'
        ? 'Ich baue Systeme, die zu deinen Daten, deinem Team und deinen täglichen Abläufen passen.'
        : 'I build systems that fit your data, your team and your daily processes.',
      detailTitle: lang === 'de' ? 'Systeme, die exakt zu deinem Betrieb passen.' : 'Systems aligned exactly to your business.',
      detailText: lang === 'de'
        ? 'Ich entwickle CRM, ERP und Datenbanken passend zu deinen tatsächlichen Abläufen. Kunden, Projekte, Dokumente, Angebote, Rechnungen und Zugriffsrechte werden verständlich geordnet.'
        : 'I design and develop CRM, ERP and database solutions that reflect real workflows instead of making them more complicated. Customers, projects, documents, quotes, invoices, processes and roles are structured so your company can rely on them long term.',
      detailPoints: lang === 'de'
        ? ['Ich entwickle passende CRM und ERP Funktionen.', 'Ich ordne Datenbanken, Rollen, Rechte und Abläufe.', 'Ich baue Übersichten, Dokumente, Formulare und Auswertungen.', 'Ich verbinde vorhandene Programme und Prozesse.']
        : ['I develop suitable CRM and ERP functions.', 'I organise databases, roles, permissions and processes.', 'I build dashboards, documents, forms and reports.', 'I connect existing programs and processes.'],
      accent: '#a6425c',
      accentRgb: '166,66,92',
      icon: FolderKanban,
    },
    {
      kind: 'service',
      slug: 'ki-automation-prozesse',
      code: '04',
      title: lang === 'de' ? 'KI Automation\nund Prozesse' : 'AI automation\nand processes',
      body: lang === 'de'
        ? 'Ich automatisiere wiederkehrende Arbeit und setze KI dort ein, wo sie im Alltag wirklich hilft.'
        : 'I automate recurring work and use AI where it genuinely helps with daily tasks.',
      detailTitle: lang === 'de' ? 'KI dort einsetzen, wo sie wirklich hilft.' : 'AI where it actually helps.',
      detailText: lang === 'de'
        ? 'Ich prüfe, welche wiederkehrenden Aufgaben Zeit kosten und wo Automatisierung oder KI helfen kann. Danach setze ich die passenden Schritte um. Dein Team prüft wichtige Ergebnisse und behält die Verantwortung.'
        : 'I check which recurring tasks take time and where automation or AI can help. I then implement the suitable steps. Your team checks important results and remains responsible.',
      detailPoints: lang === 'de'
        ? ['Ich automatisiere wiederkehrende Aufgaben.', 'Ich verbinde Kommunikation, Daten und Arbeitsabläufe.', 'Ich wähle passende Werkzeuge aus und integriere sie.', 'Ich dokumentiere die Lösung verständlich und achte auf Sicherheit.']
        : ['I automate recurring tasks.', 'I connect communication, data and work processes.', 'I choose suitable tools and integrate them.', 'I document the solution clearly and pay attention to security.'],
      accent: '#4dbf7f',
      accentRgb: '77,191,127',
      icon: Bot,
    },
  ];

  const verticalStep = 210;
  const introCards = cards.filter((card) => card.kind === 'intro');
  const serviceCards = cards.filter((card) => card.kind === 'service');
  const activeService = serviceCards.find((card) => card.slug === activeServiceSlug) || null;
  const detailService = activeService || serviceCards[0];
  const detailServiceIndex = Math.max(0, serviceCards.findIndex((card) => card.slug === detailService.slug));
  const detailValueInfo = VALUE_INFO[lang][detailServiceIndex];
  const detailValueDiagram = VALUE_DIAGRAMS[lang][detailServiceIndex];
  const detailCtaLabel = detailService.slug === 'ki-automation-prozesse'
    ? (lang === 'de' ? 'KI-Potenzial prüfen' : 'Assess AI potential')
    : (lang === 'de' ? 'Projekt besprechen' : 'Discuss your project');
  const totalTravel = introCards.length * verticalStep + 780;
  const radius = 520;
  const spiralAngleStep = 58;
  const spiralYOffset = 0;
  const rotationTravel = (spiralAngleStep * totalTravel) / verticalStep;
  const progress = 0;

  return (
    <section
      id="solution-spiral"
      className="spiral-section relative z-10"
      data-active-service={activeServiceSlug || ''}
    >
      <div id="about" className="spiral-anchor top-0" />
      <div id="services" className="spiral-anchor top-[18%]" />
      <div id="references" className="spiral-anchor top-[52%]" />
      <div id="portfolio" className="spiral-anchor top-[68%]" />
      <div id="prozess-spiral" className="spiral-anchor top-[82%]" />
      <div id="journey-solutions" className="spiral-anchor top-[47%]" />
      <div id="journey-value" className="spiral-anchor top-[56%]" />
      <div id="journey-references" className="spiral-anchor top-[70%]" />
      <div id="journey-about" className="spiral-anchor top-[83.2%]" />
      <div id="journey-contact" className="spiral-anchor top-[99%]" />

      <div className="spiral-sticky">
        <div className="spiral-stage">
          {introSequence.map((text, worldIndex) => (
            <div
              key={`intro-flap-${worldIndex}`}
              ref={(el) => { introFlapWorldRefs.current[worldIndex] = el; }}
              className="intro-flap-world"
            >
              <div className="intro-flap-composition">
                <div
                  ref={(el) => { introFlapSmallRefs.current[worldIndex] = el; }}
                  className={`intro-flap-word intro-flap-word--small ${chakraPetch.className}`}
                />
                <div
                  ref={(el) => { introFlapBigRefs.current[worldIndex] = el; }}
                  className={`intro-flap-word intro-flap-word--big ${chakraPetch.className}`}
                />
              </div>
            </div>
          ))}
          {introCards.map((card, i) => {
            const angle = i * spiralAngleStep - progress * rotationTravel;
            const rad = (angle * Math.PI) / 180;
            const y = i * verticalStep - progress * totalTravel + spiralYOffset;
            const front = Math.cos(rad);
            const visible = Math.max(0, 1 - Math.abs(y) / 690);
            const frontFocus = Math.max(0, (front + 0.18) / 1.18);
            const scale = 1;
            const isIntro = card.kind === 'intro';
            const isService = card.kind === 'service';
            const opacity = Math.max(0, Math.min(1, visible * frontFocus));
            const width = isIntro ? 560 : isService ? 470 : 380;
            const Icon = card.icon;
            const accent = card.accent || '#c89a3d';
            const transform = `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius}px) translate3d(0, ${y}px, 0) scale(${scale})`;
            const content = isIntro ? (
              <div className="spiral-intro-statement">
                <span className="spiral-intro-meta">
                  <span className="spiral-intro-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="spiral-intro-icon">
                    {Icon ? <Icon size={15} strokeWidth={1.8} /> : null}
                  </span>
                </span>
                <h3 className="spiral-intro-title">{card.title}</h3>
                <span className="spiral-intro-rule" />
              </div>
            ) : isService ? (
              <div className="spiral-service-card">
                <span className="spiral-intro-meta">
                  <span className="spiral-intro-index">{card.code}</span>
                  <span className="spiral-intro-icon">
                    {Icon ? <Icon size={15} strokeWidth={1.8} /> : null}
                  </span>
                </span>
                <h3 className="spiral-service-title">{card.title}</h3>
                <p className="spiral-service-body">{card.body}</p>
                <span className="spiral-intro-rule" />
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <div className="neural-node" style={{ color: accent, borderColor: `${accent}88` }}>
                    {Icon ? <Icon size={18} /> : null}
                  </div>
                  <div className="neural-thread" style={{ background: `linear-gradient(90deg, ${accent}aa, transparent)` }} />
                  <span className="neural-code" style={{ color: accent }}>{card.code}</span>
                </div>
                <h3 className={card.kind === 'small' ? 'spiral-card-title text-2xl' : 'spiral-card-title'}>
                  {card.title}
                </h3>
                <p className="spiral-card-body">{card.body}</p>
                {card.action ? (
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#e7c56a]">
                    {card.action}
                    <ChevronRight size={14} />
                  </div>
                ) : null}
              </>
            );

            return card.href ? (
              <a
                key={`${card.code}-${i}`}
                href={card.href}
                data-spiral-item
                data-kind={card.kind}
                className={`spiral-card neural-panel ${card.kind === 'wide' ? 'spiral-card-wide' : ''}`}
                style={{ transform, opacity, width, zIndex: Math.round(1000 + front * 120 + visible * 240) }}
              >
                <div className="spiral-card-float">
                  {content}
                </div>
              </a>
            ) : (
              <div
                key={`${card.code}-${i}`}
                data-spiral-item
                data-kind={card.kind}
                className={isIntro ? 'spiral-intro-line' : isService ? 'spiral-service-line' : `spiral-card neural-panel ${card.kind === 'wide' ? 'spiral-card-wide' : ''}`}
                style={{
                  transform,
                  opacity,
                  width,
                  zIndex: Math.round(1000 + front * 120 + visible * 240),
                } as CSSProperties}
              >
                <div className="spiral-card-float">
                  {content}
                </div>
              </div>
            );
          })}
        </div>

        <ValueImpactWorld lang={lang} />
        <ReferencesWorld lang={lang} />
        <StudioProfileWorld lang={lang} />
        <ProjectCtaWorld lang={lang} />

        <div ref={cardsWorldRef} className="spiral-cards-world">
        <div
          ref={serviceStationsRef}
          className={`spiral-service-stations ${activeService ? 'is-detail-open' : ''}`}
          aria-label={lang === 'de' ? 'Meine Umsetzung' : 'My Execution'}
        >
          <PublicFlapHeading
            label={lang === 'de' ? 'MEINE UMSETZUNG' : 'MY EXECUTION'}
            className="spiral-solutions-flap"
          />
          {serviceCards.map((card, i) => {
            return (
              <button
                key={`${card.code}-service-${i}`}
                type="button"
                data-service-card
                data-service-slug={card.slug}
                className={`spiral-service-card ngp-panel ${chakraPetch.className}`}
                aria-label={`${card.title}: ${lang === 'de' ? 'Details öffnen' : 'Open details'}`}
                style={{
                  '--service-accent': card.accent,
                  '--service-accent-rgb': card.accentRgb,
                  '--value-accent': card.accent,
                  '--value-accent-rgb': card.accentRgb,
                } as CSSProperties}
                onPointerUp={(event) => {
                  if (event.pointerType !== 'mouse' || event.button === 0) {
                    setActiveServiceSlug(card.slug || null);
                  }
                }}
                onClick={(event) => {
                  if (event.detail === 0) setActiveServiceSlug(card.slug || null);
                }}
              >
                <span className="ngp-core">
                  <span className="spiral-service-header">
                    <span className="value-diagram-code">{card.code}</span>
                    <span className="value-diagram-eyebrow">{VALUE_DIAGRAMS[lang][i].eyebrow}</span>
                  </span>
                  <h3 className="spiral-service-title">{card.title}</h3>
                  <p className="spiral-service-body">{card.body}</p>
                </span>
                <span
                  className="spiral-service-more"
                  title={lang === 'de' ? 'Details öffnen' : 'Open details'}
                  aria-hidden="true"
                >
                  <Maximize2 size={16} strokeWidth={2.1} />
                </span>
              </button>
            );
          })}
          <section
            className={`spiral-detail-panel value-info-card ${chakraPetch.className} ${activeService ? 'is-open' : ''}`}
            aria-hidden={!activeService}
            aria-label={`${detailValueDiagram.eyebrow}: ${detailService.detailTitle}`}
            style={{
              '--service-accent': detailService.accent,
              '--service-accent-rgb': detailService.accentRgb,
              '--value-accent': detailService.accent,
              '--value-accent-rgb': detailService.accentRgb,
            } as CSSProperties}
          >
            <button
              type="button"
              className="value-info-close"
              title={lang === 'de' ? 'Schliessen' : 'Close'}
              aria-label={lang === 'de' ? 'Infokarte schliessen' : 'Close information card'}
              tabIndex={activeService ? 0 : -1}
              onClick={() => setActiveServiceSlug(null)}
            >
              <X size={19} strokeWidth={2.2} />
            </button>

            <div className="value-info-copy">
              <div className="value-info-meta">
                <span className="value-diagram-code">{detailService.code}</span>
                <span className="value-diagram-eyebrow">{detailValueDiagram.eyebrow}</span>
              </div>
              <h3>{detailService.detailTitle}</h3>
              <p>{detailService.detailText}</p>
              <div className="value-info-columns">
                <div>
                  <h4>{lang === 'de' ? 'LEISTUNGSUMFANG' : 'SCOPE'}</h4>
                  <ul>
                    {detailService.detailPoints?.map((point) => (
                      <li key={point}><CheckCircle size={14} strokeWidth={1.9} /><span>{point}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>{lang === 'de' ? 'DEIN NUTZEN' : 'YOUR BENEFIT'}</h4>
                  <ul>
                    {detailValueInfo.benefits.map((point) => (
                      <li key={point}><CheckCircle size={14} strokeWidth={1.9} /><span>{point}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                className="value-info-cta"
                tabIndex={activeService ? 0 : -1}
                onClick={() => {
                  setActiveServiceSlug(null);
                  openJourneyLeadForm(detailService.slug === 'ki-automation-prozesse' ? 'ki' : 'project', {
                    travel: 'warp',
                    ctaId: `desktop_service_${detailService.slug}`,
                  });
                }}
              >
                {detailService.slug === 'ki-automation-prozesse'
                  ? <Bot size={15} strokeWidth={2} aria-hidden="true" />
                  : <ClipboardList size={15} strokeWidth={2} aria-hidden="true" />}
                <span>{detailCtaLabel}</span>
                <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            <div className="value-info-visual">
              <ValueInfoGraphic index={detailServiceIndex} />
              <div className="value-info-stages" aria-hidden="true">
                {detailValueInfo.stages.map((stage, stageIndex) => (
                  <span key={stage}>
                    <i>{String(stageIndex + 1).padStart(2, '0')}</i>
                    <b>{stage}</b>
                  </span>
                ))}
              </div>
              <div className="value-info-result">
                <strong>{detailValueDiagram.result}</strong>
                <span>{detailValueDiagram.resultLabel}</span>
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>

      <div className="spiral-mobile px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {introCards.map((card, i) => {
            if (card.kind === 'intro') {
              const MobileIcon = card.icon;
              return (
                <div key={`${card.code}-mobile-${i}`} className="spiral-intro-statement py-5">
                  <span className="spiral-intro-meta">
                    <span className="spiral-intro-index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="spiral-intro-icon">
                      {MobileIcon ? <MobileIcon size={15} strokeWidth={1.8} /> : null}
                    </span>
                  </span>
                  <h3 className="text-2xl font-bold text-white leading-tight tracking-[-0.035em] drop-shadow">
                    {card.title}
                  </h3>
                  <span className="spiral-intro-rule" />
                </div>
              );
            }
            const Icon = card.icon;
            const content = (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="neural-node">
                    <Icon size={18} />
                  </div>
                  <div className="neural-thread" />
                  <span className="neural-code">{card.code}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 leading-tight">{card.title}</h3>
                <p className="text-sm text-[#b9aa8f] leading-relaxed">{card.body}</p>
              </>
            );
            return card.href ? (
              <a key={`${card.code}-mobile-${i}`} href={card.href} className="neural-panel min-h-[180px] p-5">
                {content}
              </a>
            ) : (
              <div key={`${card.code}-mobile-${i}`} className="neural-panel min-h-[180px] p-5">
                {content}
              </div>
            );
          })}
          <div
            id="mobile-solutions"
            className={`spiral-mobile-service-stage scroll-mt-24 ${activeService ? 'is-info-open' : ''}`}
          >
            <PublicFlapHeading
              label={lang === 'de' ? 'MEINE UMSETZUNG' : 'MY EXECUTION'}
              className="mobile-solutions-section-flap"
            />
            <div
              ref={mobileServicesRef}
              className="spiral-mobile-services"
              onScroll={(event) => setMobileServiceIndex(getMobileDeckIndex(event.currentTarget))}
            >
              {serviceCards.map((card, i) => (
                <button
                  key={`${card.code}-mobile-service-${i}`}
                  type="button"
                  className={`spiral-service-card ngp-panel ngp-panel-static is-materialized ${chakraPetch.className}`}
                  aria-expanded={activeServiceSlug === card.slug}
                  aria-label={`${card.title}: ${lang === 'de' ? 'Details öffnen' : 'Open details'}`}
                  style={{
                    '--service-accent': card.accent,
                    '--service-accent-rgb': card.accentRgb,
                    '--value-accent': card.accent,
                    '--value-accent-rgb': card.accentRgb,
                  } as CSSProperties}
                  onClick={() => setActiveServiceSlug(card.slug || null)}
                >
                  <span className="ngp-core">
                    <span className="spiral-service-header">
                      <span className="value-diagram-code">{card.code}</span>
                      <span className="value-diagram-eyebrow">{VALUE_DIAGRAMS[lang][i].eyebrow}</span>
                    </span>
                    <h3 className="spiral-service-title">{card.title}</h3>
                    <p className="spiral-service-body">{card.body}</p>
                  </span>
                  <span className="spiral-service-more" aria-hidden="true">
                    <Maximize2 size={16} strokeWidth={2.1} />
                  </span>
                </button>
              ))}
            </div>
            {!activeService ? (
              <MobileDeckControls
                activeIndex={mobileServiceIndex}
                count={serviceCards.length}
                label={lang === 'de' ? 'Umsetzungskarten' : 'Service cards'}
                lang={lang}
                onSelect={(index) => {
                  setMobileServiceIndex(index);
                  scrollMobileDeckTo(mobileServicesRef.current, index);
                }}
              />
            ) : null}

            <section
              className={`mobile-solution-info value-info-card ${chakraPetch.className} ${activeService ? 'is-open' : ''}`}
              aria-hidden={!activeService}
              aria-label={`${detailValueDiagram.eyebrow}: ${detailService.detailTitle}`}
              style={{
                '--value-accent': detailService.accent,
                '--value-accent-rgb': detailService.accentRgb,
              } as CSSProperties}
            >
              <button
                type="button"
                className="value-info-close"
                aria-label={lang === 'de' ? 'Infokarte schliessen' : 'Close information card'}
                tabIndex={activeService ? 0 : -1}
                onClick={() => setActiveServiceSlug(null)}
              >
                <X size={19} strokeWidth={2.2} />
              </button>
              <div className="value-info-copy">
                <div className="value-info-meta">
                  <span className="value-diagram-code">{detailService.code}</span>
                  <span className="value-diagram-eyebrow">{detailValueDiagram.eyebrow}</span>
                </div>
                <h3>{detailService.detailTitle}</h3>
                <p>{detailService.detailText}</p>
                <div className="value-info-columns">
                  <div>
                    <h4>{lang === 'de' ? 'LEISTUNGSUMFANG' : 'SCOPE'}</h4>
                    <ul>
                      {detailService.detailPoints?.map((point) => (
                        <li key={point}><CheckCircle size={14} strokeWidth={1.9} /><span>{point}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>{lang === 'de' ? 'DEIN NUTZEN' : 'YOUR BENEFIT'}</h4>
                    <ul>
                      {detailValueInfo.benefits.map((point) => (
                        <li key={point}><CheckCircle size={14} strokeWidth={1.9} /><span>{point}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  type="button"
                  className="value-info-cta"
                  tabIndex={activeService ? 0 : -1}
                  onClick={() => {
                    setActiveServiceSlug(null);
                    openJourneyLeadForm(detailService.slug === 'ki-automation-prozesse' ? 'ki' : 'project', {
                      travel: 'warp',
                      ctaId: `mobile_service_${detailService.slug}`,
                    });
                  }}
                >
                  {detailService.slug === 'ki-automation-prozesse'
                    ? <Bot size={15} strokeWidth={2} aria-hidden="true" />
                    : <ClipboardList size={15} strokeWidth={2} aria-hidden="true" />}
                  <span>{detailCtaLabel}</span>
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
              <div className="value-info-visual">
                <ValueInfoGraphic index={detailServiceIndex} />
                <div className="value-info-stages" aria-hidden="true">
                  {detailValueInfo.stages.map((stage, stageIndex) => (
                    <span key={stage}>
                      <i>{String(stageIndex + 1).padStart(2, '0')}</i>
                      <b>{stage}</b>
                    </span>
                  ))}
                </div>
                <div className="value-info-result">
                  <strong>{detailValueDiagram.result}</strong>
                  <span>{detailValueDiagram.resultLabel}</span>
                </div>
              </div>
            </section>
          </div>
          <MobileValueImpact lang={lang} />
          <div id="mobile-journey-references" className="mobile-references">
            <ReferenceCardsContent lang={lang} />
          </div>
          <div id="mobile-journey-about" className="mobile-studio-profile">
            <StudioProfileContent lang={lang} />
          </div>
          <div id="mobile-journey-contact" className="mobile-project-cta">
            <ProjectCtaContent lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── High-end 2D/3D agency journey ───────────────────────────

function HighEndAgencyJourney({ lang }: { lang: 'de' | 'en' }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  const selectAgencyService = useCallback((index: number) => {
    setActiveServiceIndex(index);
  }, []);

  const services = useMemo(() => lang === 'de'
    ? [
        {
          code: '01', eyebrow: 'MARKE', title: 'Corporate Design & Webauftritt',
          body: 'Ich entwickle Marke und Website gemeinsam, damit dein Auftritt überall zusammenpasst.',
          accent: '#c89a3d', accentRgb: '200,154,61', icon: Star,
        },
        {
          code: '02', eyebrow: 'WEB', title: '2D-/3D-Websites & Applikationen',
          body: 'Ich entwickle Websites und Webanwendungen, die gut aussehen und zuverlässig funktionieren.',
          accent: '#4d7fbf', accentRgb: '77,127,191', icon: Globe,
        },
        {
          code: '03', eyebrow: 'SYSTEME', title: 'CRM, ERP & Datenbanken',
          body: 'Ich baue Systeme, die zu deinen Daten, deinem Team und deinen täglichen Abläufen passen.',
          accent: '#a6425c', accentRgb: '166,66,92', icon: FolderKanban,
        },
        {
          code: '04', eyebrow: 'AUTOMATION', title: 'KI-Automation & Prozesse',
          body: 'Ich automatisiere wiederkehrende Arbeit und setze KI dort ein, wo sie im Alltag wirklich hilft.',
          accent: '#4dbf7f', accentRgb: '77,191,127', icon: Bot,
        },
      ]
    : [
        {
          code: '01', eyebrow: 'BRAND', title: 'Corporate design & web presence',
          body: 'I develop the brand and website together so that your presence is consistent everywhere.',
          accent: '#c89a3d', accentRgb: '200,154,61', icon: Star,
        },
        {
          code: '02', eyebrow: 'WEB', title: '2D/3D websites & applications',
          body: 'I develop websites and web applications that look good and work reliably.',
          accent: '#4d7fbf', accentRgb: '77,127,191', icon: Globe,
        },
        {
          code: '03', eyebrow: 'SYSTEMS', title: 'CRM, ERP & databases',
          body: 'I build systems that fit your data, your team and your daily processes.',
          accent: '#a6425c', accentRgb: '166,66,92', icon: FolderKanban,
        },
        {
          code: '04', eyebrow: 'AUTOMATION', title: 'AI automation & processes',
          body: 'I automate recurring work and use AI where it genuinely helps with daily tasks.',
          accent: '#4dbf7f', accentRgb: '77,191,127', icon: Bot,
        },
      ], [lang]);

  const activeService = services[activeServiceIndex];
  const activeInfo = VALUE_INFO[lang][activeServiceIndex];
  const activeDiagram = VALUE_DIAGRAMS[lang][activeServiceIndex];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chapters = Array.from(root.querySelectorAll<HTMLElement>('[data-agency-chapter]'));
    const finale = root.querySelector<HTMLElement>('.agency-finale-stage');
    let valueAnimationStarted = false;
    let valueAnimationStop = () => {};

    const revealChapter = (chapter: HTMLElement, index: number) => {
      chapter.style.setProperty('--agency-x', '0px');
      chapter.style.setProperty('--agency-y', '0px');
      chapter.style.setProperty('--agency-rotate', '0deg');
      chapter.style.setProperty('--agency-scale', '1');
      chapter.style.setProperty('--agency-visibility', '1');
      chapter.style.setProperty('--agency-section-progress', '1');
      chapter.style.setProperty('--agency-section-percent', '100%');
      chapter.style.setProperty('--agency-reveal', '1');
      chapter.style.setProperty('--agency-content-y', '0px');
      chapter.classList.add('is-agency-active', 'is-revealed');
      root.style.setProperty('--agency-story-progress', String((index + 1) / chapters.length));

      if (index === 1 && !valueAnimationStarted) {
        valueAnimationStarted = true;
        // Die Zahlen stehen sofort auf ihrem Endwert. Die frühere 60-FPS-
        // Zählschleife erzeugte beim Eintritt in den Mehrwert unnötige
        // DOM-Schreibvorgänge und sichtbare Scrollpausen.
        valueAnimationStop = animateValueNumbers(chapter, lang, true);
      }
    };

    const revealFinale = () => {
      if (!finale) return;
      finale.style.setProperty('--finale-reveal', '1');
      finale.style.setProperty('--finale-y', '0px');
      finale.style.setProperty('--finale-scale', '1');
      finale.style.setProperty('--finale-aura-scale', '1');
      finale.classList.add('is-revealed');
      finale.setAttribute('aria-hidden', 'false');
    };

    if (reduced || typeof IntersectionObserver === 'undefined') {
      chapters.forEach(revealChapter);
      revealFinale();
      return () => valueAnimationStop();
    }

    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const chapter = entry.target as HTMLElement;
        revealChapter(chapter, chapters.indexOf(chapter));
        chapterObserver.unobserve(chapter);
      });
    }, { rootMargin: '18% 0px 18% 0px', threshold: 0.01 });

    chapters.forEach((chapter) => chapterObserver.observe(chapter));

    const finaleObserver = finale ? new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      revealFinale();
      finaleObserver.disconnect();
    }, { rootMargin: '12% 0px 12% 0px', threshold: 0.01 }) : null;
    if (finale && finaleObserver) finaleObserver.observe(finale);

    return () => {
      chapterObserver.disconnect();
      finaleObserver?.disconnect();
      valueAnimationStop();
    };
  }, [lang]);

  return (
    <section ref={rootRef} id="solution-spiral" className="agency-journey" aria-label={lang === 'de' ? 'Leistungen und Zusammenarbeit' : 'Services and collaboration'}>
      <div className="agency-surface">
        <div className="agency-story-spine" aria-hidden="true">
          <span className="agency-story-spine-base" />
          <span className="agency-story-spine-progress" />
          {[0, 1, 2, 3, 4].map((index) => <i key={index} style={{ top: `${index * 25}%` }} />)}
          <b />
        </div>
        <div className="agency-surface-cap" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <span id="services" className="agency-alias-anchor" />
        <span id="mobile-solutions" className="agency-alias-anchor" />
        <section id="journey-solutions" className="agency-chapter agency-services" data-agency-chapter data-agency-index="01">
          <div className="agency-chapter-shell">
            <header className="agency-chapter-heading">
              <div>
                <span className="agency-chapter-index">01 / 04</span>
                <p>{lang === 'de' ? 'VON DER IDEE BIS ZUM BETRIEB' : 'FROM IDEA TO OPERATION'}</p>
              </div>
              <PublicFlapHeading
                label={lang === 'de' ? 'MEINE UMSETZUNG' : 'MY EXECUTION'}
                className="agency-services-title"
                repeat={false}
              />
            </header>

            <div className="agency-services-layout">
              <div className="agency-service-selector" role="tablist" aria-label={lang === 'de' ? 'Leistung auswählen' : 'Choose a service'}>
                {services.map((service, index) => {
                  const Icon = service.icon;
                  const isActive = activeServiceIndex === index;
                  return (
                    <button
                      key={service.code}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={isActive ? 'is-active' : ''}
                      style={{ '--agency-accent': service.accent, '--agency-accent-rgb': service.accentRgb } as CSSProperties}
                      onClick={() => selectAgencyService(index)}
                    >
                      <span className="agency-service-number">{service.code}</span>
                      <span className="agency-service-icon"><Icon size={18} strokeWidth={1.7} /></span>
                      <span className="agency-service-label">
                        <small>{service.eyebrow}</small>
                        <strong>{service.title}</strong>
                      </span>
                      <ChevronRight size={18} strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>

              <article
                key={`${lang}-${activeService.code}`}
                className="agency-service-focus"
                style={{ '--agency-accent': activeService.accent, '--agency-accent-rgb': activeService.accentRgb } as CSSProperties}
              >
                <div className="agency-service-focus-copy">
                  <div className="agency-service-focus-meta"><span>{activeService.code}</span><i />{activeService.eyebrow}</div>
                  <h3>{activeInfo.title}</h3>
                  <p>{activeService.body}</p>
                  <p>{activeInfo.summary}</p>
                  <div className="agency-service-columns">
                    <div>
                      <h4>{lang === 'de' ? 'WAS ICH OPTIMIERE' : 'WHAT I OPTIMIZE'}</h4>
                      <ul>{activeInfo.optimizes.map(point => <li key={point}><CheckCircle size={14} /><span>{point}</span></li>)}</ul>
                    </div>
                    <div>
                      <h4>{lang === 'de' ? 'DEIN NUTZEN' : 'YOUR BENEFIT'}</h4>
                      <ul>{activeInfo.benefits.map(point => <li key={point}><CheckCircle size={14} /><span>{point}</span></li>)}</ul>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="agency-primary-cta"
                    onClick={() => openJourneyLeadForm(activeServiceIndex === 3 ? 'ki' : 'project', {
                      travel: 'warp',
                      ctaId: `agency_service_${activeService.code}`,
                    })}
                  >
                    <span>{activeServiceIndex === 3
                      ? (lang === 'de' ? 'KI-Potenzial prüfen' : 'Assess AI potential')
                      : (lang === 'de' ? 'Projekt besprechen' : 'Discuss your project')}</span>
                    <ChevronRight size={17} />
                  </button>
                </div>
                <div className="agency-service-focus-visual">
                  <ValueInfoGraphic index={activeServiceIndex} />
                  <div className="agency-service-result"><strong>{activeDiagram.result}</strong><span>{activeDiagram.resultLabel}</span></div>
                  <div className="agency-service-stages">{activeInfo.stages.map((stage, index) => <span key={stage}><i>0{index + 1}</i>{stage}</span>)}</div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <span id="mobile-journey-value" className="agency-alias-anchor" />
        <section id="journey-value" className="agency-chapter agency-value" data-agency-chapter data-agency-index="02">
          <div className="agency-chapter-shell">
            <div className="agency-orbit-label" aria-hidden="true"><span>02</span><i /></div>
            <ValueImpactContent lang={lang} />
          </div>
        </section>

        <span id="references" className="agency-alias-anchor" />
        <span id="portfolio" className="agency-alias-anchor" />
        <span id="mobile-journey-references" className="agency-alias-anchor" />
        <section id="journey-references" className="agency-chapter agency-references" data-agency-chapter data-agency-index="03">
          <div className="agency-chapter-shell">
            <div className="agency-orbit-label" aria-hidden="true"><span>03</span><i /></div>
            <ReferenceCardsContent lang={lang} />
          </div>
        </section>

        <span id="about" className="agency-alias-anchor" />
        <span id="mobile-journey-about" className="agency-alias-anchor" />
        <section id="journey-about" className="agency-chapter agency-about" data-agency-chapter data-agency-index="04">
          <div className="agency-chapter-shell">
            <div className="agency-orbit-label" aria-hidden="true"><span>04</span><i /></div>
            <StudioProfileContent lang={lang} />
          </div>
        </section>
      </div>

      <span id="mobile-journey-contact" className="agency-alias-anchor" />
      <section id="journey-contact" className="agency-finale">
        <div className="agency-finale-stage" aria-hidden="true">
          <div className="agency-finale-aura" aria-hidden="true"><span /><span /><span /></div>
          <div className="agency-finale-card">
            <ProjectCtaContent lang={lang} />
          </div>
        </div>
      </section>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────

function AgencyPreloader({ sceneReady, lang }: { sceneReady: boolean; lang: 'de' | 'en' }) {
  const [fontsReady, setFontsReady] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let active = true;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (active) setFontsReady(true);
      }).catch(() => {
        if (active) setFontsReady(true);
      });
    } else {
      setFontsReady(true);
    }
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), reduced ? 250 : 1050);
    // WebGL darf die Seite niemals dauerhaft sperren. Schlägt die Szene auf
    // einem Gerät fehl, bleibt der DOM-Inhalt nach diesem Sicherheitsfenster
    // vollständig benutzbar.
    const fallbackTimer = window.setTimeout(() => setTimedOut(true), 8000);
    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const canComplete = minimumElapsed && ((sceneReady && fontsReady) || timedOut);
  const targetProgress = canComplete ? 100 : sceneReady ? 90 : fontsReady ? 32 : 12;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= targetProgress) return current;
        const distance = targetProgress - current;
        return Math.min(targetProgress, current + Math.max(1, Math.ceil(distance * 0.075)));
      });
    }, 34);
    return () => window.clearInterval(interval);
  }, [targetProgress]);

  useEffect(() => {
    if (progress < 100) return;
    const exitTimer = window.setTimeout(() => setExiting(true), 120);
    const removeTimer = window.setTimeout(() => setVisible(false), 720);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [progress]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (visible) {
      root.classList.add('agency-is-loading');
      body.classList.add('agency-is-loading');
    } else {
      root.classList.remove('agency-is-loading');
      body.classList.remove('agency-is-loading');
    }
    return () => {
      root.classList.remove('agency-is-loading');
      body.classList.remove('agency-is-loading');
    };
  }, [visible]);

  if (!visible) return null;

  const status = progress >= 100
    ? (lang === 'de' ? 'ERLEBNIS BEREIT' : 'EXPERIENCE READY')
    : sceneReady
      ? (lang === 'de' ? 'SCHRIFTEN & INTERFACE' : 'FONTS & INTERFACE')
      : (lang === 'de' ? '3D-SZENE WIRD AUFGEBAUT' : 'BUILDING 3D SCENE');

  return (
    <div className={`agency-preloader${exiting ? ' is-exiting' : ''}`} role="progressbar" aria-label={status} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
      <div className="agency-preloader-noise" aria-hidden="true" />
      <div className="agency-preloader-core" aria-hidden="true">
        <span className="agency-preloader-orbit agency-preloader-orbit-a"><i /></span>
        <span className="agency-preloader-orbit agency-preloader-orbit-b"><i /></span>
        <span className="agency-preloader-orbit agency-preloader-orbit-c"><i /></span>
        <span className="agency-preloader-mark">MS</span>
      </div>
      <div className="agency-preloader-readout">
        <div className="agency-preloader-meta">
          <span>DIGITAL STUDIO / BERN</span>
          <span>{status}</span>
        </div>
        <div className="agency-preloader-value">
          <span>{String(progress).padStart(2, '0')}</span><small>%</small>
        </div>
        <div className="agency-preloader-track" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { lang } = useLanguage();
  const [brainSceneReady, setBrainSceneReady] = useState(false);
  const handleBrainSceneReady = useCallback(() => setBrainSceneReady(true), []);
  useEffect(() => {
    document.title = lang === 'de'
      ? 'Digitalstudio Marcel Spahr. Weblösungen, CRM und ERP für KMU.'
      : 'Marcel Spahr Digital Studio. Web solutions, CRM and ERP for SMEs.';
  }, [lang]);
  useEffect(() => {
    const requestedForm = new URLSearchParams(window.location.search).get('lead');
    if (requestedForm !== 'overview' && requestedForm !== 'consultation' && requestedForm !== 'project' && requestedForm !== 'ki') return;
    const timer = window.setTimeout(() => openJourneyLeadForm(requestedForm, { travel: 'warp' }), 300);
    return () => window.clearTimeout(timer);
  }, []);
  // Auf schmalen Bildschirmen (<900px, dieselbe Schwelle wie
  // getEffectiveViewport()) wird die komplette Hero-Komposition (Gehirne +
  // Überschrift + Buttons) exakt wie am Desktop aufgebaut und danach
  // gleichmässig auf die echte Fensterbreite herunterskaliert, statt Text
  // und Buttons responsiv umzubrechen — dieselben Grössenverhältnisse wie
  // am Desktop bleiben dadurch überall erhalten.
  const [heroScale, setHeroScale] = useState(1);
  const heroFlapLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const heroBottomFlapLineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const updateHeroScale = () => {
      setHeroScale(getEffectiveViewport(window.innerWidth, window.innerHeight).scale);
    };
    updateHeroScale();
    window.addEventListener('resize', updateHeroScale);
    return () => window.removeEventListener('resize', updateHeroScale);
  }, []);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = lang === 'de'
      ? ['ICH BAUE DEINE DIGITALE LÖSUNG.', 'FÜR SCHWEIZER KMU UND START-UPS.']
      : ['I BUILD YOUR DIGITAL SOLUTION.', 'FOR SWISS SMES AND STARTUPS.'];
    const letters = lines.flatMap((line, index) => {
      const container = heroFlapLineRefs.current[index];
      return container ? buildFlapWord(container, line) : [];
    });
    if (!letters.length || reduced) return;

    let settleTimer = 0;
    const replay = () => {
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'spin', false);
      settleTimer = window.setTimeout(() => {
        setFlapWordMode(letters, 'settle', false);
      }, 720);
    };

    replay();
    return () => {
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'settle', false);
    };
  }, [lang]);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = lang === 'de'
      ? [
          'ICH ENTWICKLE WEBSITES, PORTALE, CRM, ERP UND AUTOMATIONEN.',
          'ICH VERBINDE SYSTEME, DATEN UND ARBEITSABLÄUFE,',
          'DAMIT SIE IM ALLTAG EINFACH FUNKTIONIEREN.',
        ]
      : [
          'I BUILD WEBSITES, PORTALS, CRM, ERP AND AUTOMATION.',
          'I CONNECT SYSTEMS, DATA AND DAILY WORKFLOWS,',
          'SO THEY WORK IN PRACTICE.',
        ];
    const letters = lines.flatMap((line, index) => {
      const container = heroBottomFlapLineRefs.current[index];
      return container ? buildFlapWord(container, line) : [];
    });
    if (!letters.length || reduced) return;

    let settleTimer = 0;
    const replay = () => {
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'spin', false);
      settleTimer = window.setTimeout(() => {
        setFlapWordMode(letters, 'settle', false);
      }, 860);
    };

    replay();
    return () => {
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'settle', false);
    };
  }, [lang]);
  const serviceWorldCards = useMemo(() => lang === 'de'
    ? [
        { code: '01', title: 'Corporate Design\nund Webauftritt', body: 'Ich entwickle Marke und Website gemeinsam, damit dein Auftritt überall zusammenpasst.', accent: '#c89a3d' },
        { code: '02', title: '2D- und 3D-Websites\nund Applikationen', body: 'Ich entwickle Websites und Webanwendungen, die gut aussehen und zuverlässig funktionieren.', accent: '#4d7fbf' },
        { code: '03', title: 'CRM, ERP\nund Datenbanken', body: 'Ich baue Systeme, die zu deinen Daten, deinem Team und deinen täglichen Abläufen passen.', accent: '#a6425c' },
        { code: '04', title: 'KI Automation\nund Prozesse', body: 'Ich automatisiere wiederkehrende Arbeit und setze KI dort ein, wo sie im Alltag wirklich hilft.', accent: '#8ebef2' },
      ]
    : [
        { code: '01', title: 'Corporate design\nand web presence', body: 'I develop the brand and website together so that your presence is consistent everywhere.', accent: '#c89a3d' },
        { code: '02', title: '2D and 3D websites\nand applications', body: 'I develop websites and web applications that look good and work reliably.', accent: '#4d7fbf' },
        { code: '03', title: 'CRM, ERP\nand databases', body: 'I build systems that fit your data, your team and your daily processes.', accent: '#a6425c' },
        { code: '04', title: 'AI automation\nand processes', body: 'I automate recurring work and use AI where it genuinely helps with daily tasks.', accent: '#8ebef2' },
      ], [lang]);

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      <AgencyPreloader sceneReady={brainSceneReady} lang={lang} />
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.style.setProperty('--hero-mobile-scale',String(Math.min(1,window.innerWidth/1512)))",
        }}
      />
      <MobileHeroBrainPoster />
      <JourneyNavigator />
      <BrainBackground introTexts={[]} serviceCards={serviceWorldCards} onReady={handleBrainSceneReady} />

      {/* ── Hero ── */}
      <section id="journey-start" className="home-hero relative z-10 min-h-screen overflow-hidden">
        <div
          className={`hero-reference-stage${heroScale !== 1 ? ' absolute left-0' : ''}`}
          style={heroScale !== 1 ? {
            top: 0,
            width: `${REF_WIDTH}px`,
            height: `${REF_HEIGHT}px`,
            transform: `scale(${heroScale})`,
            transformOrigin: 'top left',
          } : undefined}
        >
          <div className="hero-top-copy absolute inset-x-0 top-20 z-10">
            <div className="mx-auto max-w-7xl px-6">
              <div className="hero-copy hero-copy-centered ms-anim">
                <h1
                  className={`hero-title-flap max-w-6xl mx-auto text-5xl font-bold text-white leading-[0.96] tracking-[-0.055em] ${chakraPetch.className}`}
                  aria-label={lang === 'de' ? 'ICH BAUE DEINE DIGITALE LÖSUNG. FÜR SCHWEIZER KMU UND START-UPS.' : 'I BUILD YOUR DIGITAL SOLUTION. FOR SWISS SMES AND STARTUPS.'}
                >
                  <span ref={(el) => { heroFlapLineRefs.current[0] = el; }} className="hero-flap-line">
                    {lang === 'de' ? 'ICH BAUE DEINE DIGITALE LÖSUNG.' : 'I BUILD YOUR DIGITAL SOLUTION.'}
                  </span>
                  <span ref={(el) => { heroFlapLineRefs.current[1] = el; }} className="hero-flap-line">
                    {lang === 'de' ? 'FÜR SCHWEIZER KMU UND START-UPS.' : 'FOR SWISS SMES AND STARTUPS.'}
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="hero-bottom-copy absolute inset-x-0 bottom-0 z-10 pb-6">
            <div className="mx-auto max-w-7xl px-6">
              <div className="hero-copy hero-copy-centered ms-anim" style={{ animationDelay: '0.12s' }}>
                <p
                  className={`hero-bottom-flap max-w-lg mx-auto text-lg text-[#d8ccb3] leading-relaxed ${chakraPetch.className}`}
                  aria-label={lang === 'de'
                    ? 'ICH ENTWICKLE WEBSITES, PORTALE, CRM, ERP UND AUTOMATIONEN. ICH VERBINDE SYSTEME, DATEN UND ARBEITSABLÄUFE, DAMIT SIE IM ALLTAG EINFACH FUNKTIONIEREN.'
                    : 'I BUILD WEBSITES, PORTALS, CRM, ERP AND AUTOMATION. I CONNECT SYSTEMS, DATA AND DAILY WORKFLOWS, SO THEY WORK IN PRACTICE.'}
                >
                  <span ref={(el) => { heroBottomFlapLineRefs.current[0] = el; }} className="hero-bottom-flap-line">
                    {lang === 'de' ? 'ICH ENTWICKLE WEBSITES, PORTALE, CRM, ERP UND AUTOMATIONEN.' : 'I BUILD WEBSITES, PORTALS, CRM, ERP AND AUTOMATION.'}
                  </span>
                  <span ref={(el) => { heroBottomFlapLineRefs.current[1] = el; }} className="hero-bottom-flap-line">
                    {lang === 'de' ? 'ICH VERBINDE SYSTEME, DATEN UND ARBEITSABLÄUFE,' : 'I CONNECT SYSTEMS, DATA AND DAILY WORKFLOWS,'}
                  </span>
                  <span ref={(el) => { heroBottomFlapLineRefs.current[2] = el; }} className="hero-bottom-flap-line">
                    {lang === 'de' ? 'DAMIT SIE IM ALLTAG EINFACH FUNKTIONIEREN.' : 'SO THEY WORK IN PRACTICE.'}
                  </span>
                </p>
              </div>
              <div style={{ animationDelay: '0.18s' }} className="hero-action-row ms-anim mt-7 flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  className={`hero-project-cta ${chakraPetch.className}`}
                  onClick={() => openJourneyLeadForm('project', {
                    travel: 'warp',
                    ctaId: 'hero_project',
                  })}
                >
                  <span>{lang === 'de' ? 'Projekt besprechen' : 'Discuss your project'}</span>
                  <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </button>
                <a
                  href={getJourneyHref('solutions')}
                  className={`group flex flex-col items-center gap-1 text-white transition-colors hover:text-white ${chakraPetch.className}`}
                  aria-label={lang === 'de' ? 'Nach unten scrollen' : 'Scroll down'}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToJourneyDestination('solutions');
                  }}
                >
                  <span className="hero-scroll-label text-xs font-bold tracking-[0.22em]">{lang === 'de' ? 'SCROLLEN' : 'SCROLL'}</span>
                  <ChevronDown size={28} strokeWidth={1.8} className="hero-scroll-chevron transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HighEndAgencyJourney lang={lang} />

    </div>
  );
}
