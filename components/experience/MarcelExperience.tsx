'use client';

import Image from 'next/image';
import { Chakra_Petch } from 'next/font/google';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Bot, Check, Database, ExternalLink, Search, ShieldCheck, Users, Workflow } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { trackWebsiteEvent } from '../../app/lib/analytics';
import { PROJECTS } from '../../app/portfolio/data';
import AilaGreeting from './AilaGreeting';
import ExperienceNav from './ExperienceNav';
import MarketingDockingStation from './MarketingDockingStation';
import ProblemDockingStation from './ProblemDockingStation';
import ScrollEntity from './ScrollEntity';
import SectionDockingStation from './SectionDockingStation';
import SystemDockingStation from './SystemDockingStation';
import WebsiteDockingStation from './WebsiteDockingStation';
import { ArchitectureStack, DashboardMockup, MarketingEngine, MobilePrecisionPicker, PerspectiveBusinessFlow } from './Visuals';
import { copy, flowStepDetails, flowStepInsights, flowSteps, systemNodes } from './content';
import styles from './experience.module.css';

type HeroPhase = 'loading' | 'ignition' | 'revealed';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-chakra-petch', display: 'swap' });

function revealCompactTarget(target: HTMLElement | null) {
  if (!target || typeof window === 'undefined' || !window.matchMedia('(max-width: 1100px)').matches) return;
  const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => target.scrollIntoView({ behavior, block: 'start' }));
  });
}

const MODULES = {
  de: [
    {
      number: '01', title: 'Kundengewinnung', Icon: Search,
      description: 'Website, Inhalte, SEO, GEO, Kampagnen und Lead Capture greifen ineinander.',
      detail: 'Sichtbarkeit wird direkt mit einem strukturierten Anfrageprozess verbunden. Jeder relevante Kontakt landet mit Quelle, Interesse und nächstem Schritt im selben System.',
      components: ['Website & Landingpages', 'SEO, GEO & Content', 'Kampagnen & Lead Capture'],
      outcome: 'Aus Reichweite entstehen qualifizierte, nachvollziehbare Anfragen statt verstreuter Kontakte.',
    },
    {
      number: '02', title: 'Kunden & Verkauf', Icon: Users,
      description: 'Anfragen, Kontakte, Kommunikation, Offerten und Aufträge bleiben verbunden.',
      detail: 'Vom ersten Gespräch bis zum Auftrag begleitet ein durchgängiger Datensatz die Kundenbeziehung. Zuständigkeiten, Dokumente und nächste Schritte bleiben für alle Beteiligten sichtbar.',
      components: ['CRM & Kontakthistorie', 'Pipeline & Aktivitäten', 'Offerten & Aufträge'],
      outcome: 'Weniger Übergaben, verlässlichere Nachverfolgung und ein klarer Verkaufsprozess.',
    },
    {
      number: '03', title: 'Projekte & Betrieb', Icon: Workflow,
      description: 'Aufgaben, Termine, Dokumente, Ressourcen und Zeiten laufen in einem Prozess.',
      detail: 'Ein gewonnener Auftrag wird ohne erneute Datenerfassung zum ausführbaren Projekt. Planung, Verantwortlichkeiten, Fortschritt und Abrechnung verwenden dieselbe Grundlage.',
      components: ['Projekte & Aufgaben', 'Ressourcen & Termine', 'Zeiten & Dokumente'],
      outcome: 'Das Team arbeitet mit klaren Prioritäten und der aktuelle Projektstand bleibt jederzeit sichtbar.',
    },
    {
      number: '04', title: 'Daten & Steuerung', Icon: Database,
      description: 'Ein konsistentes Datenmodell speist Dashboards, Automationen und Entscheidungen.',
      detail: 'Informationen werden einmal sauber erfasst und kontrolliert weiterverwendet. Rollen, Schnittstellen und Automationen sorgen dafür, dass relevante Zahlen dort ankommen, wo sie gebraucht werden.',
      components: ['Zentrales Datenmodell', 'Dashboards & Kennzahlen', 'AI & Automationen'],
      outcome: 'Entscheidungen basieren auf aktuellen Daten statt auf manuell zusammengetragenen Listen.',
    },
  ],
  en: [
    {
      number: '01', title: 'Customer acquisition', Icon: Search,
      description: 'Website, content, SEO, GEO, campaigns and lead capture work together.',
      detail: 'Visibility connects directly to a structured enquiry process. Every relevant contact enters the same system with its source, interest and next useful step.',
      components: ['Website & landing pages', 'SEO, GEO & content', 'Campaigns & lead capture'],
      outcome: 'Reach becomes qualified, traceable enquiries instead of scattered contacts.',
    },
    {
      number: '02', title: 'Customers & sales', Icon: Users,
      description: 'Enquiries, contacts, communication, quotes and orders remain connected.',
      detail: 'One continuous record supports the relationship from the first conversation to the order. Ownership, documents and next steps remain visible to everyone involved.',
      components: ['CRM & contact history', 'Pipeline & activities', 'Quotes & orders'],
      outcome: 'Fewer handovers, more reliable follow-up and a clear sales process.',
    },
    {
      number: '03', title: 'Projects & operations', Icon: Workflow,
      description: 'Tasks, schedules, documents, resources and time run through one process.',
      detail: 'A won order becomes an executable project without entering the same data again. Planning, responsibilities, progress and billing use one shared foundation.',
      components: ['Projects & tasks', 'Resources & schedules', 'Time & documents'],
      outcome: 'The team works with clear priorities while the current project status stays visible.',
    },
    {
      number: '04', title: 'Data & management', Icon: Database,
      description: 'A consistent data model powers dashboards, automation and decisions.',
      detail: 'Information is captured once and reused in a controlled way. Roles, interfaces and automation deliver relevant figures wherever they are needed.',
      components: ['Shared data model', 'Dashboards & metrics', 'AI & automation'],
      outcome: 'Decisions rely on current data instead of manually assembled spreadsheets.',
    },
  ],
} as const;

const OPERATING_MODULES = {
  de: [
    {
      title: 'Kunden', summary: 'Kontakte · Leads · Historie · Dokumente',
      detail: 'Alle Kundeninformationen laufen in einer zentralen, nachvollziehbaren Akte zusammen – vom ersten Kontakt bis zur langfristigen Betreuung.',
      features: ['360°-Kundenansicht', 'Kontakt- und Aktivitätshistorie', 'Dokumente und Zuständigkeiten'],
      outcome: 'Jeder im Team kennt Kontext, Status und den nächsten sinnvollen Schritt.',
    },
    {
      title: 'Verkauf', summary: 'Pipeline · Offerten · Aufträge · Rechnungen',
      detail: 'Die komplette Verkaufsstrecke wird als verbindlicher Prozess abgebildet. Chancen, Aufgaben, Dokumente und Umsatz bleiben miteinander verknüpft.',
      features: ['Visuelle Deal-Pipeline', 'Offerten und Freigaben', 'Auftrags- und Rechnungsübergabe'],
      outcome: 'Weniger liegengebliebene Anfragen und ein planbarer Verkaufsprozess.',
    },
    {
      title: 'Projekte', summary: 'Aufgaben · Termine · Ressourcen · Fortschritt',
      detail: 'Gewonnene Aufträge werden ohne Medienbruch in planbare Projekte überführt und entlang klarer Verantwortlichkeiten umgesetzt.',
      features: ['Aufgaben und Meilensteine', 'Kapazitäten und Termine', 'Fortschritt und Projektdokumente'],
      outcome: 'Teams sehen Prioritäten, Abhängigkeiten und Lieferstatus an einem Ort.',
    },
    {
      title: 'Mitarbeitende', summary: 'Rollen · Rechte · Zeiten · Absenzen',
      detail: 'Rollen, Zugriffe und operative Personaldaten werden so verbunden, dass Mitarbeitende sicher und ohne unnötige Administration arbeiten können.',
      features: ['Rollenbasierte Zugriffe', 'Zeit- und Leistungserfassung', 'Absenzen und Verfügbarkeit'],
      outcome: 'Klare Zuständigkeiten und weniger manuelle Abstimmung im Tagesgeschäft.',
    },
    {
      title: 'Marketing', summary: 'Kampagnen · Attribution · Content · Conversion',
      detail: 'Kanäle, Inhalte und Kampagnen speisen dieselbe Datenbasis und lassen sich bis zur qualifizierten Anfrage oder zum Auftrag auswerten.',
      features: ['Kampagnen und Inhalte', 'Quellen- und Conversion-Tracking', 'Übergabe qualifizierter Leads'],
      outcome: 'Marketing wird messbar und arbeitet direkt mit dem Verkaufssystem zusammen.',
    },
    {
      title: 'Management', summary: 'KPI · Forecast · Alerts · Entscheidungen',
      detail: 'Aktuelle operative Daten werden in verständliche Kennzahlen, Prognosen und konkrete Entscheidungssignale übersetzt.',
      features: ['Live-Kennzahlen und Trends', 'Forecasts und Zielwerte', 'Automatische Hinweise bei Abweichungen'],
      outcome: 'Entscheidungen basieren auf einer aktuellen gemeinsamen Datengrundlage.',
    },
  ],
  en: [
    {
      title: 'Customers', summary: 'Contacts · Leads · History · Documents',
      detail: 'All customer information comes together in one traceable record, from the first contact through long-term service.',
      features: ['360° customer view', 'Contact and activity history', 'Documents and ownership'],
      outcome: 'Everyone knows the context, current status and next useful step.',
    },
    {
      title: 'Sales', summary: 'Pipeline · Quotes · Orders · Invoices',
      detail: 'The complete sales journey becomes a dependable process. Opportunities, tasks, documents and revenue stay connected.',
      features: ['Visual deal pipeline', 'Quotes and approvals', 'Order and invoice handover'],
      outcome: 'Fewer missed enquiries and a more predictable sales process.',
    },
    {
      title: 'Projects', summary: 'Tasks · Schedules · Resources · Progress',
      detail: 'Won orders become plannable projects without manual handovers and are delivered through clear responsibilities.',
      features: ['Tasks and milestones', 'Capacity and schedules', 'Progress and project documents'],
      outcome: 'Teams see priorities, dependencies and delivery status in one place.',
    },
    {
      title: 'Team', summary: 'Roles · Rights · Time · Absence',
      detail: 'Roles, access and operational people data are connected so employees can work securely with less administration.',
      features: ['Role-based access', 'Time and performance capture', 'Absence and availability'],
      outcome: 'Clear ownership and less manual coordination in daily operations.',
    },
    {
      title: 'Marketing', summary: 'Campaigns · Attribution · Content · Conversion',
      detail: 'Channels, content and campaigns feed the same data foundation and remain measurable through to a qualified enquiry or order.',
      features: ['Campaigns and content', 'Source and conversion tracking', 'Qualified lead handover'],
      outcome: 'Marketing becomes measurable and works directly with the sales system.',
    },
    {
      title: 'Management', summary: 'KPI · Forecast · Alerts · Decisions',
      detail: 'Current operational data is translated into understandable metrics, forecasts and concrete decision signals.',
      features: ['Live metrics and trends', 'Forecasts and targets', 'Automatic deviation alerts'],
      outcome: 'Decisions use one current and shared source of truth.',
    },
  ],
} as const;

const ABOUT_VALUE = {
  de: {
    label: 'NUTZEN FÜR DEIN UNTERNEHMEN',
    title: 'Aus Komplexität wird ein klarer, umsetzbarer Weg.',
    text: 'Strategie, Gestaltung, Technologie und KI bleiben in einer Verantwortung. Dadurch gehen weniger Informationen verloren und gute Entscheidungen werden schneller wirksam.',
  },
  en: {
    label: 'VALUE FOR YOUR BUSINESS',
    title: 'Complexity becomes a clear, actionable path.',
    text: 'Strategy, design, technology and AI stay under one accountable lead. Less context is lost and sound decisions translate into impact sooner.',
  },
} as const;

export default function MarcelExperience() {
  const { lang } = useLanguage();
  const c = copy[lang];
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const problemSectionRef = useRef<HTMLElement | null>(null);
  const problemVideoRef = useRef<HTMLVideoElement | null>(null);
  const systemSectionRef = useRef<HTMLElement | null>(null);
  const systemVideoRef = useRef<HTMLVideoElement | null>(null);
  const salesSectionRef = useRef<HTMLElement | null>(null);
  const salesVideoRef = useRef<HTMLVideoElement | null>(null);
  const marketingSectionRef = useRef<HTMLElement | null>(null);
  const marketingVideoRef = useRef<HTMLVideoElement | null>(null);
  const moduleDetailRef = useRef<HTMLDivElement | null>(null);
  const operatingModuleDetailRef = useRef<HTMLElement | null>(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeFlow, setActiveFlow] = useState(0);
  const [activeOperatingModule, setActiveOperatingModule] = useState(0);
  const [heroPhase, setHeroPhase] = useState<HeroPhase>('loading');
  const [heroLoadProgress, setHeroLoadProgress] = useState(0);
  const [ailaReturnTrigger, setAilaReturnTrigger] = useState(0);
  const [ailaAboutTrigger, setAilaAboutTrigger] = useState(0);
  const [ailaContactTrigger, setAilaContactTrigger] = useState(0);
  const selectedProjects = useMemo(() => [PROJECTS[0], PROJECTS[3], PROJECTS[1]].filter(Boolean), []);
  const activeModuleData = MODULES[lang][activeModule];
  const ActiveModuleIcon = activeModuleData.Icon;
  const selectedOperatingModule = OPERATING_MODULES[lang][activeOperatingModule];

  useEffect(() => {
    document.title = lang === 'de'
      ? 'Marcel Spahr · Digitale Unternehmenssysteme aus einer Hand'
      : 'Marcel Spahr · Connected digital business systems';
  }, [lang]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (reduced || typeof IntersectionObserver === 'undefined') {
      elements.forEach((element) => element.setAttribute('data-visible', 'true'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute('data-visible', 'true');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [lang]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-fit]'));
    if (!items.length) return;

    const applyFitScale = () => {
      items.forEach((content) => {
        const wrapper = content.parentElement;
        if (!wrapper) return;
        content.style.setProperty('--fit-offset', '0px');
        const wrapperStyle = window.getComputedStyle(wrapper);
        const verticalPadding = parseFloat(wrapperStyle.paddingTop) + parseFloat(wrapperStyle.paddingBottom);
        const available = wrapper.clientHeight - verticalPadding;
        const natural = content.scrollHeight;
        const scale = natural > available ? Math.max(.55, available / natural) : 1;
        const offset = Math.max(0, (available - natural * scale) / 2);
        content.style.setProperty('--fit-scale', scale.toFixed(4));
        content.style.setProperty('--fit-offset', `${offset.toFixed(1)}px`);
      });
    };

    applyFitScale();
    const settleTimer = window.setTimeout(applyFitScale, 400);
    window.addEventListener('resize', applyFitScale);
    return () => {
      window.removeEventListener('resize', applyFitScale);
      window.clearTimeout(settleTimer);
    };
  }, [lang, activeOperatingModule]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('lead');
    const hashTarget = window.location.hash.slice(1);
    if (!requested && !hashTarget) return;
    const target = requested ? 'journey-contact' : hashTarget;
    const timer = window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'auto', block: 'start' }), 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const flightEditorActive = new URLSearchParams(window.location.search).get('flight-editor') === '1';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactExperience = window.matchMedia('(max-width: 1100px)').matches;
    if (flightEditorActive || reducedMotion || compactExperience || window.scrollY > 12) {
      setHeroLoadProgress(100);
      setHeroPhase('revealed');
      document.documentElement.classList.remove('hero-intro-locked');
      return;
    }

    document.documentElement.classList.add('hero-intro-locked');
    const startedAt = performance.now();
    let frame = 0;
    let ignitionTimer = 0;
    let revealTimer = 0;

    const updateLoader = (now: number) => {
      const elapsed = now - startedAt;
      const normalized = Math.min(1, elapsed / 2350);
      const eased = 1 - Math.pow(1 - normalized, 3);
      const staged = normalized < .72 ? eased * 91 : 91 + ((normalized - .72) / .28) * 9;
      setHeroLoadProgress(Math.min(100, Math.round(staged)));

      if (normalized < 1) {
        frame = window.requestAnimationFrame(updateLoader);
        return;
      }

      setHeroLoadProgress(100);
      ignitionTimer = window.setTimeout(() => setHeroPhase('ignition'), 210);
      revealTimer = window.setTimeout(() => {
        setHeroPhase('revealed');
        document.documentElement.classList.remove('hero-intro-locked');
      }, 1320);
    };

    frame = window.requestAnimationFrame(updateLoader);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(ignitionTimer);
      window.clearTimeout(revealTimer);
      document.documentElement.classList.remove('hero-intro-locked');
    };
  }, []);

  useEffect(() => {
    const section = heroSectionRef.current;
    const video = heroVideoRef.current;
    if (!section || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;

    const syncVideoToScroll = () => {
      animationFrame = 0;
      if (reducedMotion.matches || !Number.isFinite(video.duration) || video.duration <= 0) return;

      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollDistance));
      const targetTime = progress * Math.max(video.duration - .04, 0);

      section.style.setProperty('--hero-progress', progress.toFixed(4));
      section.style.setProperty('--hero-tilt', `${-1.4 + progress * 2.8}deg`);
      section.style.setProperty('--hero-metal-shift', `${progress * 100}%`);
      section.style.setProperty('--hero-sheen-shift', `${-35 + progress * 155}%`);

      if (Math.abs(video.currentTime - targetTime) > .025) video.currentTime = targetTime;
    };

    const requestSync = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(syncVideoToScroll);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) video.currentTime = 0;
      else requestSync();
    };

    if (heroPhase === 'loading') {
      video.pause();
      video.currentTime = 0;
    } else {
      if (heroPhase === 'ignition') video.currentTime = 0;
      void video.play().catch(() => undefined);
    }
    video.addEventListener('loadedmetadata', requestSync);
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    reducedMotion.addEventListener('change', handleMotionPreference);
    requestSync();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      video.removeEventListener('loadedmetadata', requestSync);
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    };
  }, [heroPhase]);

  // Drives AILA's scroll-triggered nudges beyond the one-time welcome:
  // replays a short "need help?" hint whenever a visitor scrolls well past
  // the hero and then back up to it, and replays two further nudges every
  // time her scroll-docking settles her at the "about" and "contact"
  // stations further down the page again - not just the first time, so a
  // visitor can hear them again by scrolling away and back.
  useEffect(() => {
    const section = heroSectionRef.current;
    if (!section || heroPhase !== 'revealed') return;

    let frame = 0;
    let leftHero = false;
    let nearAbout = false;
    let nearContact = false;

    // "Substantially in view" (enter) vs. "fully out of view" (exit, before
    // it re-arms) are deliberately different bands - a visitor idly
    // scrolling a little within a station shouldn't retrigger it on every
    // small wobble near the edge of the enter band; she has to actually
    // leave the station before coming back to it counts as arriving again.
    const isSubstantiallyVisible = (rect: DOMRect) =>
      rect.top < window.innerHeight * .7 && rect.bottom > window.innerHeight * .3;
    const isFullyOutOfView = (rect: DOMRect) =>
      rect.bottom <= 0 || rect.top >= window.innerHeight;

    const check = () => {
      frame = 0;
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const y = window.scrollY;
      if (!leftHero && y > top + height * 1.4) {
        leftHero = true;
      } else if (leftHero && y < top + height * .6) {
        leftHero = false;
        setAilaReturnTrigger((value) => value + 1);
      }

      const aboutRect = document.getElementById('journey-about')?.getBoundingClientRect();
      if (aboutRect) {
        if (!nearAbout && isSubstantiallyVisible(aboutRect)) {
          nearAbout = true;
          setAilaAboutTrigger((value) => value + 1);
        } else if (nearAbout && isFullyOutOfView(aboutRect)) {
          nearAbout = false;
        }
      }

      const contactRect = document.getElementById('journey-contact')?.getBoundingClientRect();
      if (contactRect) {
        if (!nearContact && isSubstantiallyVisible(contactRect)) {
          nearContact = true;
          setAilaContactTrigger((value) => value + 1);
        } else if (nearContact && isFullyOutOfView(contactRect)) {
          nearContact = false;
        }
      }
    };

    const requestCheck = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };

    window.addEventListener('scroll', requestCheck, { passive: true });
    check();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestCheck);
    };
  }, [heroPhase]);

  useEffect(() => {
    const section = problemSectionRef.current;
    const video = problemVideoRef.current;
    if (!section || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;

    const syncVideoToScroll = () => {
      animationFrame = 0;
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollDistance));
      const approach = Math.min(1, Math.max(0, (progress - .1) / .2));
      const release = Math.min(1, Math.max(0, (progress - .78) / .16));
      const engaged = approach * (1 - release);
      const charge = Math.min(1, Math.max(0, (progress - .28) / .34)) * (1 - release);

      section.style.setProperty('--problem-progress', progress.toFixed(4));
      section.style.setProperty('--problem-dock-engaged', engaged.toFixed(4));
      section.style.setProperty('--problem-dock-charge', charge.toFixed(4));
      section.style.setProperty('--problem-dock-release', release.toFixed(4));
      section.dataset.dockPhase = progress < .28 ? 'approach' : progress < .78 ? 'charging' : 'release';

      if (reducedMotion.matches || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const targetTime = progress * Math.max(video.duration - .04, 0);
      if (Math.abs(video.currentTime - targetTime) > .025) video.currentTime = targetTime;
    };

    const requestSync = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(syncVideoToScroll);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) video.currentTime = 0;
      else requestSync();
    };

    video.pause();
    video.addEventListener('loadedmetadata', requestSync);
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    reducedMotion.addEventListener('change', handleMotionPreference);
    requestSync();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      video.removeEventListener('loadedmetadata', requestSync);
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    };
  }, []);

  useEffect(() => {
    const section = systemSectionRef.current;
    const video = systemVideoRef.current;
    if (!section || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;

    const syncVideoToScroll = () => {
      animationFrame = 0;
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollDistance));
      section.style.setProperty('--system-progress', progress.toFixed(4));

      if (reducedMotion.matches || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const targetTime = progress * Math.max(video.duration - .04, 0);
      if (Math.abs(video.currentTime - targetTime) > .025) video.currentTime = targetTime;
    };

    const requestSync = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(syncVideoToScroll);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) video.currentTime = 0;
      else requestSync();
    };

    video.pause();
    video.addEventListener('loadedmetadata', requestSync);
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    reducedMotion.addEventListener('change', handleMotionPreference);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(requestSync);
    resizeObserver?.observe(section);
    void document.fonts?.ready.then(requestSync);
    requestSync();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      video.removeEventListener('loadedmetadata', requestSync);
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    const section = salesSectionRef.current;
    const video = salesVideoRef.current;
    if (!section || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;

    const syncVideoToScroll = () => {
      animationFrame = 0;
      if (reducedMotion.matches || !Number.isFinite(video.duration) || video.duration <= 0) return;

      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollDistance));
      const targetTime = progress * Math.max(video.duration - .04, 0);
      const flowStep = Math.min(flowSteps[lang].length - 1, Math.floor(progress * flowSteps[lang].length));

      section.style.setProperty('--sales-progress', progress.toFixed(4));
      setActiveFlow((current) => current === flowStep ? current : flowStep);
      if (Math.abs(video.currentTime - targetTime) > .025) video.currentTime = targetTime;
    };

    const requestSync = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(syncVideoToScroll);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) video.currentTime = 0;
      else requestSync();
    };

    video.pause();
    video.addEventListener('loadedmetadata', requestSync);
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    reducedMotion.addEventListener('change', handleMotionPreference);
    requestSync();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      video.removeEventListener('loadedmetadata', requestSync);
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    };
  }, [lang]);

  useEffect(() => {
    const section = marketingSectionRef.current;
    const video = marketingVideoRef.current;
    if (!section || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;

    const syncVideoToScroll = () => {
      animationFrame = 0;
      if (reducedMotion.matches || !Number.isFinite(video.duration) || video.duration <= 0) return;

      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollDistance));
      const targetTime = progress * Math.max(video.duration - .04, 0);

      section.style.setProperty('--marketing-progress', progress.toFixed(4));
      if (Math.abs(video.currentTime - targetTime) > .025) video.currentTime = targetTime;
    };

    const requestSync = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(syncVideoToScroll);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) video.currentTime = 0;
      else requestSync();
    };

    video.pause();
    video.addEventListener('loadedmetadata', requestSync);
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    reducedMotion.addEventListener('change', handleMotionPreference);
    requestSync();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      video.removeEventListener('loadedmetadata', requestSync);
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    };
  }, []);

  function onHeroPointer(event: React.PointerEvent<HTMLElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    event.currentTarget.style.setProperty('--pointer-x', x.toFixed(3));
    event.currentTarget.style.setProperty('--pointer-y', y.toFixed(3));
  }

  return (
    <div ref={rootRef} className={`${styles.experience} experience-root ${chakraPetch.variable}`} data-hero-phase={heroPhase}>
      <a className={styles.skipLink} href="#main-content">{c.skip}</a>
      <ExperienceNav lang={lang} />
      <ScrollEntity rootRef={rootRef} lang={lang} />
      <AilaGreeting
        lang={lang}
        heroPhase={heroPhase}
        returnTrigger={ailaReturnTrigger}
        aboutTrigger={ailaAboutTrigger}
        contactTrigger={ailaContactTrigger}
      />

      <main id="main-content">
        <section ref={heroSectionRef} id="journey-start" className={styles.hero} onPointerMove={onHeroPointer}>
          <div className={styles.heroSticky}>
            <SectionDockingStation station="hero" />
            <div className={styles.heroLoader} aria-hidden={heroPhase !== 'loading'}>
              <div className={styles.heroLoaderReadout}>
                <span>SYSTEM WIRD VERBUNDEN</span>
                <strong>{String(heroLoadProgress).padStart(2, '0')}<small>%</small></strong>
                <div className={styles.heroLoaderTrack}><i style={{ transform: `scaleX(${heroLoadProgress / 100})` }} /></div>
                <p><b>SWISS PRECISION SYSTEM</b><em>{heroLoadProgress < 100 ? 'SYNCHRONISIERT' : 'BEREIT'}</em></p>
              </div>
            </div>
            <div className={styles.heroIgnition} aria-hidden="true">
              <i /><i /><i />
              <span />
            </div>
            <div className={styles.heroNoise} aria-hidden="true" />
            <div className={styles.heroGlow} aria-hidden="true" />
            <div className={styles.heroVideoLayer} aria-hidden="true">
              <video
                ref={heroVideoRef}
                className={styles.heroVideo}
                poster="/cinematic/hero-swiss-precision/swiss-alpine-organic-dormant-v2.png"
                muted
                playsInline
                preload="auto"
              >
                <source media="(min-width: 1101px)" src="/cinematic/hero-swiss-precision/swiss-precision-awakening.mp4" type="video/mp4" />
              </video>
              <img
                className={`${styles.heroAlpineFrame} ${styles.heroAlpineDormant}`}
                src="/cinematic/hero-swiss-precision/swiss-alpine-organic-dormant-v2.png"
                alt=""
                draggable="false"
              />
              <img
                className={`${styles.heroAlpineFrame} ${styles.heroAlpineAwakened}`}
                src="/cinematic/hero-swiss-precision/swiss-alpine-organic-awakened-v2.png"
                alt=""
                draggable="false"
              />
              <div className={styles.heroVisualMeta}><span>CONNECTED BUSINESS ARCHITECTURE</span><i /> <strong>ONLINE</strong></div>
            </div>
            <div className={styles.heroLayout}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}><span />{c.heroEyebrow}</p>
                <div className={styles.mobileAilaHeroDock} data-mobile-aila-anchor="hero" aria-hidden="true" />
                <h1 className={styles.heroTitle}>
                  <span data-text={c.heroTitleA}>{c.heroTitleA}</span>
                  <em data-text={c.heroTitleB}>{c.heroTitleB}</em>
                </h1>
                <p className={styles.heroLead}>{c.heroText}</p>
                <div className={styles.heroActions}>
                  <a href="#journey-contact" className={styles.primaryButton} onClick={() => trackWebsiteEvent('cta_click', { ctaId: 'hero_project' })}><span>{c.project}</span><ArrowRight size={17} /></a>
                  <a href="#fragmentierung" className={styles.textButton}><span>{c.discover}</span><ArrowDown size={16} /></a>
                </div>
                <div className={styles.heroTrust}><span><Check size={12} /></span>{c.heroNote}</div>
              </div>
            </div>
            <a href="#fragmentierung" className={styles.scrollCue} aria-label={c.discover}><span>SCROLL TO ACTIVATE</span><i /></a>
          </div>
        </section>

        <section ref={problemSectionRef} id="fragmentierung" className={`${styles.section} ${styles.problemSection}`}>
          <div className={styles.problemSticky}>
            <div className={styles.problemVideoLayer} aria-hidden="true">
              <video
                ref={problemVideoRef}
                className={styles.problemVideo}
                poster="/cinematic/02-fragmented-start.png"
                muted
                playsInline
                preload="auto"
              >
                <source media="(min-width: 1101px)" src="/cinematic/02-connected-system-scroll.mp4" type="video/mp4" />
              </video>
            </div>
            <ProblemDockingStation />
            <div className={`${styles.sectionGrid} ${styles.problemContent}`}>
              <div className={styles.sectionCopy} data-reveal="left">
                <p className={styles.eyebrow}><span />{c.problemEyebrow}</p>
                <h2>{c.problemTitle}<br /><em>{c.problemTitleGold}</em></h2>
                <p className={styles.sectionLead}>{c.problemText}</p>
                <blockquote>{c.problemQuote}</blockquote>
              </div>
              <div className={styles.problemSequenceStatus} aria-hidden="true">
                <span><b>01</b> FRAGMENTED</span>
                <i><b /></i>
                <span><b>02</b> ORCHESTRATED</span>
              </div>
            </div>
          </div>
        </section>

        <span id="mobile-solutions" className={styles.aliasAnchor} />
        <section ref={systemSectionRef} id="journey-solutions" className={`${styles.section} ${styles.systemSection} ${styles.layoutRight}`}>
          <div className={styles.systemPauseSticky}>
            <div className={styles.systemComposer} data-reveal="right">
              <div className={styles.systemArchitectureArt} aria-hidden="true">
                <Image
                  src="/cinematic/system/connected-system-architecture.png"
                  alt=""
                  fill
                  sizes="(min-width: 1101px) 86vw, 94vw"
                />
                <video
                  ref={systemVideoRef}
                  className={styles.systemArchitectureVideo}
                  poster="/cinematic/system/connected-system-architecture-scroll-poster.jpg"
                  muted
                  playsInline
                  preload="auto"
                >
                  <source media="(min-width: 1101px)" src="/cinematic/system/connected-system-architecture-scroll.mp4" type="video/mp4" />
                </video>
                <span className={styles.systemArchitectureHalo} />
              </div>
              <div className={styles.systemControlColumn}>
                <div className={styles.sectionHeader}>
                  <p className={styles.eyebrow}><span />{c.systemEyebrow}</p>
                  <h2>{c.systemTitle}</h2>
                  <p>{c.systemText}</p>
                </div>
                <div className={styles.moduleTabs} role="tablist" aria-label={lang === 'de' ? 'Systembereich wählen' : 'Choose system area'}>
                  {MODULES[lang].map(({ number, title, Icon }, index) => (
                    <button key={number} type="button" role="tab" aria-selected={activeModule === index} className={activeModule === index ? styles.moduleActive : ''} onClick={() => {
                      setActiveModule(index);
                      revealCompactTarget(moduleDetailRef.current);
                    }}>
                      <i><Icon size={16} /></i><strong>{title}</strong><span>{number}</span>
                    </button>
                  ))}
                </div>
                <MobilePrecisionPicker
                  items={MODULES[lang].map((module) => ({ label: module.title, meta: module.number }))}
                  activeIndex={activeModule}
                  onSelect={setActiveModule}
                  ariaLabel={lang === 'de' ? 'Systembereich auswählen' : 'Select a system area'}
                />
                <div key={activeModule} ref={moduleDetailRef} className={styles.moduleDetail} role="tabpanel" aria-live="polite">
                  <header>
                    <span>{activeModuleData.number}<small>/ 04</small></span>
                    <div><i><ActiveModuleIcon size={20} /></i><strong>{activeModuleData.title}</strong></div>
                  </header>
                  <p className={styles.moduleDetailLead}>{activeModuleData.detail}</p>
                  <div className={styles.moduleDetailBody}>
                    <div>
                      <small>{lang === 'de' ? 'VERBUNDENE BAUSTEINE' : 'CONNECTED COMPONENTS'}</small>
                      <ul>{activeModuleData.components.map((item) => <li key={item}><Check size={12} />{item}</li>)}</ul>
                    </div>
                    <div className={styles.moduleOutcome}>
                      <small>{lang === 'de' ? 'WIRKUNG' : 'OUTCOME'}</small>
                      <p>{activeModuleData.outcome}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${styles.composerVisual} ${styles.systemDockVisual}`} style={{ '--active-module': activeModule } as CSSProperties}>
                <div className={styles.systemVisualBrief}>
                  <span>{lang === 'de' ? 'SYSTEMLOGIK · 01—04' : 'SYSTEM LOGIC · 01—04'}</span>
                  <h3>
                    {lang === 'de' ? 'Ein Eingang. Ein Datenfluss.' : 'One entry. One data flow.'}
                    <em>{lang === 'de' ? ' Ein klarer nächster Schritt.' : ' One clear next step.'}</em>
                  </h3>
                  <p>
                    {lang === 'de'
                      ? 'AILA hält Kontext, Zuständigkeit und Fortschritt zusammen – damit aus einzelnen Werkzeugen ein steuerbares Unternehmen entsteht.'
                      : 'AILA keeps context, ownership and progress connected—turning separate tools into one manageable business system.'}
                  </p>
                  <div>
                    {(lang === 'de'
                      ? ['Erfassen', 'Verbinden', 'Steuern']
                      : ['Capture', 'Connect', 'Control']
                    ).map((step, index) => (
                      <span key={step}><b>{String(index + 1).padStart(2, '0')}</b><small>{step}</small></span>
                    ))}
                  </div>
                </div>
                <SystemDockingStation />
              </div>
            </div>
            <div className={styles.systemPrinciple}><p>{c.systemPrinciple}</p><a href="#journey-contact" className={styles.primaryButton}><span>{c.systemCta}</span><ArrowUpRight size={16} /></a></div>
          </div>
        </section>

        <section ref={salesSectionRef} id="verkaufssystem" className={`${styles.section} ${styles.flowSection} ${styles.layoutLeft}`}>
          <div className={styles.salesSticky}>
            <div className={styles.salesVideoLayer} aria-hidden="true">
              <video
                ref={salesVideoRef}
                className={styles.salesVideo}
                poster="/cinematic/03-sales-system-start.png"
                muted
                playsInline
                preload="auto"
              >
                <source media="(min-width: 1101px)" src="/cinematic/03-sales-system-scroll.mp4" type="video/mp4" />
              </video>
            </div>
            <WebsiteDockingStation />
            <div className={`${styles.sectionHeader} ${styles.salesHeader}`} data-reveal="left">
              <p className={styles.eyebrow}><span />{c.webEyebrow}</p>
              <h2>{c.webTitle}<br /><em>{c.webTitleGold}</em></h2>
              <p>{c.webText}</p>
            </div>
            <PerspectiveBusinessFlow
              steps={flowSteps[lang]}
              details={flowStepDetails[lang]}
              insights={flowStepInsights[lang]}
              active={activeFlow}
              onSelect={setActiveFlow}
              detailLabel={lang === 'de' ? 'PROZESSSCHRITT' : 'PROCESS STEP'}
              closeLabel={c.close}
              lang={lang}
            />
          </div>
        </section>

        <section ref={marketingSectionRef} id="marketing-engine" className={`${styles.section} ${styles.marketingSection} ${styles.layoutRight}`}>
          <div className={styles.marketingSticky}>
            <div className={styles.marketingVideoLayer} aria-hidden="true">
              <video
                ref={marketingVideoRef}
                className={styles.marketingVideo}
                poster="/cinematic/04-marketing-engine-start.png"
                muted
                playsInline
                preload="auto"
              >
                <source media="(min-width: 1101px)" src="/cinematic/04-marketing-engine-scroll.mp4" type="video/mp4" />
              </video>
            </div>
            <MarketingDockingStation />
            <div className={styles.marketingExperience}>
              <div className={`${styles.sectionCopy} ${styles.marketingHeader}`} data-reveal="right">
                <p className={styles.eyebrow}><span />{c.marketingEyebrow}</p>
                <h2>{c.marketingTitle}</h2>
                <p className={styles.sectionLead}>{c.marketingText}</p>
                <div className={styles.marketingMetrics} aria-label={lang === 'de' ? 'Marketing-System in Zahlen' : 'Marketing system at a glance'}>
                  <span><b>05</b><small>{lang === 'de' ? 'Wege zur Anfrage' : 'Paths to an enquiry'}</small></span>
                  <span><b>01</b><small>{lang === 'de' ? 'Gemeinsamer Eingang' : 'Shared entry point'}</small></span>
                  <span><b>100%</b><small>{lang === 'de' ? 'Quelle nachvollziehbar' : 'Source traceable'}</small></span>
                </div>
              </div>
              <div className={styles.marketingSystemVisual} data-reveal="left">
                <MarketingEngine lang={lang} />
              </div>
            </div>
          </div>
        </section>

        <span id="mobile-journey-value" className={styles.aliasAnchor} />
        <section id="business-os" className={`${styles.section} ${styles.osSection} ${styles.layoutLeft}`}>
          <span id="journey-value" className={styles.aliasAnchor} />
          <div className={styles.pauseSticky}>
            <div className={styles.pauseFit}>
              <div className={`${styles.sectionHeader} ${styles.osHeader}`} data-reveal="left">
                <p className={styles.eyebrow}><span />{c.osEyebrow}</p>
                <h2>{c.osTitle}</h2>
                <div className={styles.ailaBay}>
                  <SectionDockingStation station="process" />
                </div>
                <p className={styles.osIntroText}>{c.osText}</p>
                <div className={styles.osHeaderMetrics} aria-label={lang === 'de' ? 'Business OS Übersicht' : 'Business OS overview'}>
                  <span><b>06</b><small>{lang === 'de' ? 'Module nach Bedarf' : 'Modules as needed'}</small></span>
                  <span><b>01</b><small>{lang === 'de' ? 'Gemeinsame Datenbasis' : 'Shared data foundation'}</small></span>
                  <span><b>LIVE</b><small>{lang === 'de' ? 'Steuerung im Alltag' : 'Everyday control'}</small></span>
                </div>
              </div>
              <div className={styles.osLayout}>
                <div className={styles.operatingModules} data-reveal="left">
                  <div className={styles.operatingModuleRail} role="group" aria-label={lang === 'de' ? 'Unternehmensmodul wählen' : 'Choose business module'}>
                    {OPERATING_MODULES[lang].map((module, index) => {
                      const isSelected = activeOperatingModule === index;
                      return (
                        <article key={module.title} className={`${styles.operatingModule} ${isSelected ? styles.operatingModuleOpen : ''}`}>
                          <button
                            type="button"
                            className={styles.operatingModuleToggle}
                            aria-pressed={isSelected}
                            aria-controls="operating-module-detail"
                            onClick={() => {
                              setActiveOperatingModule(index);
                              revealCompactTarget(operatingModuleDetailRef.current);
                            }}
                          >
                            <span>0{index + 1}</span>
                            <span><strong>{module.title}</strong><small>{module.summary}</small></span>
                            <i aria-hidden="true"><ArrowRight size={15} /></i>
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <MobilePrecisionPicker
                    items={OPERATING_MODULES[lang].map((module) => ({ label: module.title, meta: module.summary }))}
                    activeIndex={activeOperatingModule}
                    onSelect={setActiveOperatingModule}
                    ariaLabel={lang === 'de' ? 'Unternehmensmodul auswählen' : 'Select a business module'}
                  />
                  <section key={activeOperatingModule} ref={operatingModuleDetailRef} id="operating-module-detail" className={styles.operatingModuleDetailPanel} aria-live="polite">
                    <header><small>0{activeOperatingModule + 1} · {lang === 'de' ? 'AUSGEWÄHLTES MODUL' : 'SELECTED MODULE'}</small><strong>{selectedOperatingModule.title}</strong></header>
                    <p>{selectedOperatingModule.detail}</p>
                    <ul>{selectedOperatingModule.features.map((feature) => <li key={feature}><Check size={12} />{feature}</li>)}</ul>
                    <footer><small>{lang === 'de' ? 'WIRKUNG' : 'OUTCOME'}</small><strong>{selectedOperatingModule.outcome}</strong></footer>
                  </section>
                </div>
                <div className={styles.osDashboardStage} data-reveal="right"><DashboardMockup lang={lang} /></div>
              </div>
            </div>
          </div>
        </section>

        <section id="daten-intelligenz" className={`${styles.section} ${styles.dataSection} ${styles.layoutRight}`}>
          <div className={styles.dataViewport}>
            <header className={styles.dataHeader} data-reveal="up">
              <div className={styles.dataHeaderMain}>
                <p className={styles.eyebrow}><span />{c.dataEyebrow}</p>
                <h2>{c.dataTitle}</h2>
              </div>
              <div className={styles.dataHeaderSide}>
                <p>{c.dataText}</p>
                <div className={styles.dataHeaderMetrics} aria-label={lang === 'de' ? 'Datenarchitektur in Zahlen' : 'Data architecture at a glance'}>
                  <span><b>04</b><small>{lang === 'de' ? 'verbundene Ebenen' : 'connected layers'}</small></span>
                  <span><b>01</b><small>{lang === 'de' ? 'kontrollierter Datenfluss' : 'controlled data flow'}</small></span>
                  <span><b>HUMAN</b><small>{lang === 'de' ? 'Kontrolle bei AI' : 'control over AI'}</small></span>
                </div>
              </div>
            </header>

            <div className={styles.dataWorkspace}>
              <div className={styles.dataAilaBay} aria-hidden="true">
                <SectionDockingStation station="data" />
              </div>
              <ArchitectureStack lang={lang} />
              <div className={`${styles.trustCards} ${styles.dataAssurance}`}>
                <article className={styles.dataAssuranceCard} data-reveal="up"><span><ShieldCheck size={21} /></span><p>SECURITY BY DESIGN</p><h3>{c.securityTitle}</h3><div>{c.securityText}</div><footer>{['AUTH', 'ROLES', 'RLS', 'BACKUP', 'LOG'].map((item) => <i key={item}>{item}</i>)}</footer></article>
                <article className={styles.dataAssuranceCard} data-reveal="up"><span><Bot size={21} /></span><p>CONTROLLED AI FLOW</p><h3>{c.aiTitle}</h3><div>{c.aiText}</div><footer>{['CLASSIFY', 'DRAFT', 'REVIEW', 'ACT'].map((item) => <i key={item}>{item}</i>)}</footer></article>
              </div>
            </div>

            <dl className={styles.dataContextRail} data-reveal="up">
              <div><dt>{lang === 'de' ? 'System' : 'System'}</dt><dd>{lang === 'de' ? 'Website, Marketing, Software, Daten und Automationen greifen auf dieselbe Grundlage zu.' : 'Website, marketing, software, data and automation use the same foundation.'}</dd></div>
              <div><dt>{lang === 'de' ? 'Geeignet für' : 'Designed for'}</dt><dd>{lang === 'de' ? 'Schweizer KMU und Start-ups mit verbundenen Werkzeugen und Prozessen.' : 'Swiss SMEs and startups connecting tools and processes.'}</dd></div>
              <div><dt>{lang === 'de' ? 'Projektstart' : 'Project start'}</dt><dd>{lang === 'de' ? 'Analyse von Zielen, Menschen, Engpässen, Daten und bestehenden Systemen.' : 'Analysis of goals, people, bottlenecks, data and existing systems.'}</dd></div>
            </dl>
          </div>
        </section>

        <span id="mobile-journey-references" className={styles.aliasAnchor} />
        <section id="journey-references" className={`${styles.section} ${styles.casesSection} ${styles.layoutLeft}`}>
          <SectionDockingStation station="projects" />
          <div id="references" className={styles.aliasAnchor} />
          <div id="portfolio" className={styles.aliasAnchor} />
          <div className={styles.pauseSticky}>
            <div className={styles.pauseFit} data-fit>
              <div className={styles.sectionHeader} data-reveal="left">
                <p className={styles.eyebrow}><span />{c.casesEyebrow}</p>
                <h2>{c.casesTitle}</h2>
                <p>{c.casesText}</p>
              </div>
              <div className={styles.caseGrid}>
                {selectedProjects.map((project, index) => {
                  const projectCopy = project[lang];
                  return (
                    <article key={project.slug} className={styles.caseCard} data-reveal="up" style={{ '--case-accent': project.color, '--case-index': index } as CSSProperties}>
                      <div className={styles.caseImage}>
                        <Image src={project.image} alt={`${projectCopy.title}. ${projectCopy.tag}`} fill sizes="(min-width: 1000px) 33vw, 92vw" />
                        <span>{String(index + 1).padStart(2, '0')}</span><i>{projectCopy.cardStatus ?? projectCopy.status}</i>
                      </div>
                      <div className={styles.caseBody}><p>{projectCopy.tag}</p><h3>{projectCopy.title}</h3><div>{projectCopy.tagline}</div><small>{projectCopy.role}</small>
                        <footer><a href={`/portfolio/${project.slug}`} className={styles.primaryButton}><span>{c.caseCta}</span><ArrowRight size={15} /></a>{project.externalUrl && <a href={project.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={`${c.live}: ${projectCopy.title}`}><ExternalLink size={15} /></a>}</footer>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <span id="mobile-journey-about" className={styles.aliasAnchor} />
        <section id="journey-about" className={`${styles.section} ${styles.aboutSection} ${styles.layoutRight}`}>
          <div id="about" className={styles.aliasAnchor} />
          <div className={styles.aboutViewport}>
            <div className={styles.aboutEditorial}>
              <div className={styles.aboutVisualStage} data-reveal="left">
                <figure className={styles.aboutPortrait}>
                  <Image src="/assets/marcel-spahr-aila-editorial-v1.png" alt={lang === 'de' ? 'Marcel Spahr an seinem Arbeitsplatz in Bern' : 'Marcel Spahr at his workspace in Bern'} fill sizes="(min-width: 1000px) 68vw, 94vw" priority={false} />
                  <figcaption><span>Marcel Spahr</span><small>{lang === 'de' ? 'Urteilskraft × KI-Werkzeuge · Bern' : 'Judgement × AI tools · Bern'}</small></figcaption>
                </figure>

                <div className={styles.aboutAlliance} aria-hidden="true">
                  <span>{lang === 'de' ? 'ERFAHRUNG × KI' : 'EXPERIENCE × AI'}</span>
                  <strong>{lang === 'de' ? 'Mehr Klarheit. Mehr Tempo. Eine Verantwortung.' : 'More clarity. More speed. One accountable partner.'}</strong>
                </div>

                <div className={styles.mobileAilaAboutDock} data-mobile-aila-anchor="about" aria-hidden="true" />

                <div className={styles.aboutAilaBay} aria-hidden="true">
                  <SectionDockingStation station="about" />
                </div>
              </div>

              <article className={styles.aboutStory} data-reveal="right">
                <p className={styles.eyebrow}><span />{c.aboutEyebrow}</p>
                <h2>{c.aboutTitle}</h2>
                <p>{c.aboutText}</p>
                <blockquote>“{c.aboutQuote}”</blockquote>
                <div className={styles.aboutValue}>
                  <span>{ABOUT_VALUE[lang].label}</span>
                  <strong>{ABOUT_VALUE[lang].title}</strong>
                  <p>{ABOUT_VALUE[lang].text}</p>
                </div>
              </article>
            </div>

            <dl className={styles.aboutCredentials} data-reveal="up">
              {c.facts.map(([value, label]) => <div key={value}><dt>{value}</dt><dd>{label}</dd></div>)}
            </dl>
          </div>
        </section>

        <span id="mobile-journey-contact" className={styles.aliasAnchor} />
        <section id="journey-contact" className={`${styles.section} ${styles.finalSection}`}>
          <SectionDockingStation station="contact" />
          <div className={styles.pauseSticky}>
            <div className={styles.pauseFit}>
              <div className={styles.finalGlow} aria-hidden="true" />
              <div className={styles.finalAilaStage}>
                <div className={styles.finalAilaHeader} data-reveal="up">
                  <p>{c.finalA}</p>
                  <h2>{c.finalB}</h2>
                  <span>{c.finalText}</span>
                </div>
                <div className={styles.finalAilaSpace} aria-hidden="true">
                  <div className={styles.mobileAilaFinalDock} data-mobile-aila-anchor="final" />
                </div>
                <button
                  type="button"
                  className={styles.finalAilaLaunch}
                  onClick={() => {
                    trackWebsiteEvent('cta_click', { ctaId: 'aila_sales_conversation' });
                    window.dispatchEvent(new Event('aila:open-sales-conversation'));
                  }}
                >
                  <span>AILA · LIVE</span>
                  <strong>{lang === 'de' ? 'Gespräch mit AILA beginnen' : 'Start a conversation with AILA'}</strong>
                  <small>{lang === 'de' ? 'Per Text oder Stimme. Dein Gespräch wird bei Interesse vollständig an Marcel übergeben.' : 'By text or voice. If you are interested, the full conversation is handed over to Marcel.'}</small>
                  <ArrowRight size={18} />
                </button>
              </div>
              <footer className={styles.footer}>
                <div><span className={styles.footerMark}>MS</span><p><strong>Marcel Spahr</strong><small>{c.footerLine}</small></p></div>
                <div><a href="mailto:kontakt@marcelspahr.ch">kontakt@marcelspahr.ch</a><a href="tel:+41795110911">+41 79 511 09 11</a></div>
                <div><a href="/blog">Insights</a><a href="/datenschutz">{c.privacy}</a><a href="/impressum">{c.imprint}</a><span>© {new Date().getFullYear()}</span></div>
              </footer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
