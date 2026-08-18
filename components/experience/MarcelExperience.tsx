'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Bot, Check, Database, ExternalLink, Search, ShieldCheck, Users, Workflow } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { trackWebsiteEvent } from '../../app/lib/analytics';
import { PROJECTS } from '../../app/portfolio/data';
import ExperienceNav from './ExperienceNav';
import LeadFunnel from './LeadFunnel';
import MarketingDockingStation from './MarketingDockingStation';
import ProblemDockingStation from './ProblemDockingStation';
import ScrollEntity from './ScrollEntity';
import SectionDockingStation from './SectionDockingStation';
import SystemDockingStation from './SystemDockingStation';
import WebsiteDockingStation from './WebsiteDockingStation';
import { ArchitectureStack, DashboardMockup, PerspectiveBusinessFlow } from './Visuals';
import { azItems, copy, flowStepDetails, flowSteps, systemNodes } from './content';
import styles from './experience.module.css';

type HeroPhase = 'loading' | 'ignition' | 'revealed';

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
    ['Kunden', 'Kontakte · Leads · Historie · Dokumente'], ['Verkauf', 'Pipeline · Offerten · Aufträge · Rechnungen'],
    ['Projekte', 'Aufgaben · Termine · Ressourcen · Fortschritt'], ['Mitarbeitende', 'Rollen · Rechte · Zeiten · Absenzen'],
    ['Marketing', 'Kampagnen · Attribution · Content · Conversion'], ['Management', 'KPI · Forecast · Alerts · Entscheidungen'],
  ],
  en: [
    ['Customers', 'Contacts · Leads · History · Documents'], ['Sales', 'Pipeline · Quotes · Orders · Invoices'],
    ['Projects', 'Tasks · Schedules · Resources · Progress'], ['Team', 'Roles · Rights · Time · Absence'],
    ['Marketing', 'Campaigns · Attribution · Content · Conversion'], ['Management', 'KPI · Forecast · Alerts · Decisions'],
  ],
} as const;

const SEARCH_FEATURES = {
  de: ['Technische SEO', 'Strukturierte Daten', 'Semantische Inhalte', 'Lokale Auffindbarkeit', 'Schnelle Seiten', 'AI Search / GEO'],
  en: ['Technical SEO', 'Structured data', 'Semantic content', 'Local discoverability', 'Fast pages', 'AI search / GEO'],
};

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
  const [activeModule, setActiveModule] = useState(0);
  const [activeFlow, setActiveFlow] = useState(0);
  const [activeLetter, setActiveLetter] = useState(0);
  const [heroPhase, setHeroPhase] = useState<HeroPhase>('loading');
  const [heroLoadProgress, setHeroLoadProgress] = useState(0);
  const selectedProjects = useMemo(() => [PROJECTS[0], PROJECTS[3], PROJECTS[1]].filter(Boolean), []);
  const activeModuleData = MODULES[lang][activeModule];
  const ActiveModuleIcon = activeModuleData.Icon;

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
  }, [lang]);

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
    if (flightEditorActive || reducedMotion || window.scrollY > 12) {
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
    <div ref={rootRef} className={`${styles.experience} experience-root`} data-hero-phase={heroPhase}>
      <a className={styles.skipLink} href="#main-content">{c.skip}</a>
      <ExperienceNav lang={lang} />
      <ScrollEntity rootRef={rootRef} />

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
                src="/cinematic/hero-swiss-precision/swiss-precision-awakening.mp4"
                poster="/cinematic/hero-swiss-precision/swiss-alpine-organic-dormant-v2.png"
                muted
                playsInline
                preload="auto"
              />
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
                <h1 className={styles.heroTitle}>
                  <span data-text={c.heroTitleA}>{c.heroTitleA}</span>
                  <em data-text={c.heroTitleB}>{c.heroTitleB}</em>
                </h1>
                <p className={styles.heroLead}>{c.heroText}</p>
                <div className={styles.heroActions}>
                  <a href="#journey-contact" className={styles.primaryButton} onClick={() => trackWebsiteEvent('cta_click', { ctaId: 'hero_project' })}>{c.project}<ArrowRight size={17} /></a>
                  <a href="#fragmentierung" className={styles.textButton}>{c.discover}<ArrowDown size={16} /></a>
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
                src="/cinematic/02-connected-system-scroll.mp4"
                poster="/cinematic/02-fragmented-start.png"
                muted
                playsInline
                preload="metadata"
              />
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
                  sizes="(min-width: 961px) 86vw, 94vw"
                />
                <video
                  ref={systemVideoRef}
                  className={styles.systemArchitectureVideo}
                  src="/cinematic/system/connected-system-architecture-scroll.mp4"
                  poster="/cinematic/system/connected-system-architecture-scroll-poster.jpg"
                  muted
                  playsInline
                  preload="metadata"
                />
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
                    <button key={number} type="button" role="tab" aria-selected={activeModule === index} className={activeModule === index ? styles.moduleActive : ''} onClick={() => setActiveModule(index)}>
                      <i><Icon size={16} /></i><strong>{title}</strong><span>{number}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.moduleDetail} role="tabpanel" aria-live="polite">
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
                <SystemDockingStation />
              </div>
            </div>
            <div className={styles.systemPrinciple}><p>{c.systemPrinciple}</p><a href="#journey-contact">{c.systemCta}<ArrowUpRight size={16} /></a></div>
          </div>
        </section>

        <section ref={salesSectionRef} id="verkaufssystem" className={`${styles.section} ${styles.flowSection} ${styles.layoutLeft}`}>
          <div className={styles.salesSticky}>
            <div className={styles.salesVideoLayer} aria-hidden="true">
              <video
                ref={salesVideoRef}
                className={styles.salesVideo}
                src="/cinematic/03-sales-system-scroll.mp4"
                poster="/cinematic/03-sales-system-start.png"
                muted
                playsInline
                preload="metadata"
              />
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
              active={activeFlow}
              onSelect={setActiveFlow}
              label={c.flowLabel}
              hint={c.flowHint}
              detailLabel={lang === 'de' ? 'PROZESSSCHRITT' : 'PROCESS STEP'}
              closeLabel={c.close}
            />
          </div>
        </section>

        <section ref={marketingSectionRef} id="marketing-engine" className={`${styles.section} ${styles.marketingSection} ${styles.layoutRight}`}>
          <div className={styles.marketingSticky}>
            <div className={styles.marketingVideoLayer} aria-hidden="true">
              <video
                ref={marketingVideoRef}
                className={styles.marketingVideo}
                src="/cinematic/04-marketing-engine-scroll.mp4"
                poster="/cinematic/04-marketing-engine-start.png"
                muted
                playsInline
                preload="metadata"
              />
            </div>
            <MarketingDockingStation />
            <div className={`${styles.sectionCopy} ${styles.marketingHeader}`} data-reveal="right">
              <p className={styles.eyebrow}><span />{c.marketingEyebrow}</p>
              <h2>{c.marketingTitle}</h2>
              <p className={styles.sectionLead}>{c.marketingText}</p>
            </div>
            <article className={`${styles.searchCard} ${styles.marketingSearchHud}`} data-reveal="up">
              <div className={styles.searchCardTop}><Search size={20} /><span>SEARCH / ANSWER SYSTEMS</span><i>INDEXABLE</i></div>
              <div className={styles.marketingSearchCopy}><h3>{c.geoTitle}</h3><p>{c.geoText}</p></div>
              <div className={styles.searchFeatures}>{SEARCH_FEATURES[lang].map((feature) => <span key={feature}><Check size={12} />{feature}</span>)}</div>
              <div className={styles.marketingSequenceStatus} aria-hidden="true"><span>MULTI-CHANNEL</span><i><b /></i><span>QUALIFIED PIPELINE</span></div>
            </article>
          </div>
        </section>

        <span id="mobile-journey-value" className={styles.aliasAnchor} />
        <section id="business-os" className={`${styles.section} ${styles.osSection} ${styles.layoutLeft}`}>
          <SectionDockingStation station="process" />
          <span id="journey-value" className={styles.aliasAnchor} />
          <div className={styles.pauseSticky}>
            <div className={styles.pauseFit} data-fit>
              <div className={styles.sectionHeader} data-reveal="left">
                <p className={styles.eyebrow}><span />{c.osEyebrow}</p>
                <h2>{c.osTitle}</h2>
                <p>{c.osText}</p>
              </div>
              <div className={styles.osLayout}>
                <div className={styles.operatingModules} data-reveal="left">
                  {OPERATING_MODULES[lang].map(([title, detail], index) => <div key={title}><span>0{index + 1}</span><div><strong>{title}</strong><small>{detail}</small></div><i /></div>)}
                </div>
                <div data-reveal="right"><DashboardMockup lang={lang} /></div>
              </div>
              <div className={styles.dashboardCopy} data-reveal="up"><p>{c.dashboardEyebrow}</p><h3>{c.dashboardTitle}</h3><span>{c.dashboardText}</span></div>

              <div className={styles.azExperience} data-reveal="up">
                <div className={styles.azCopy}><p className={styles.eyebrow}><span />{c.azEyebrow}</p><h3>{c.azTitle}</h3><p>{c.azText}</p></div>
                <div className={styles.azPicker}>
                  <div className={styles.azLetters} role="tablist" aria-label={c.azTitle}>
                    {azItems[lang].map(([letter, title], index) => <button key={letter} type="button" role="tab" aria-selected={activeLetter === index} title={title} className={activeLetter === index ? styles.azActive : ''} onMouseEnter={() => setActiveLetter(index)} onFocus={() => setActiveLetter(index)} onClick={() => setActiveLetter(index)}>{letter}</button>)}
                  </div>
                  <div className={styles.azDetail} role="tabpanel"><span>{azItems[lang][activeLetter][0]}</span><div><small>{String(activeLetter + 1).padStart(2, '0')} / 26</small><h4>{azItems[lang][activeLetter][1]}</h4><p>{azItems[lang][activeLetter][2]}</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="daten-intelligenz" className={`${styles.section} ${styles.dataSection} ${styles.layoutRight}`}>
          <SectionDockingStation station="data" />
          <div className={styles.pauseSticky}>
            <div className={styles.pauseFit} data-fit>
              <div className={styles.dataLayout}>
                <div className={styles.sectionCopy} data-reveal="right">
                  <p className={styles.eyebrow}><span />{c.dataEyebrow}</p>
                  <h2>{c.dataTitle}</h2>
                  <p className={styles.sectionLead}>{c.dataText}</p>
                  <ArchitectureStack lang={lang} />
                </div>
                <div className={styles.trustCards}>
                  <article data-reveal="up"><span><ShieldCheck size={22} /></span><p>SECURITY BY DESIGN</p><h3>{c.securityTitle}</h3><div>{c.securityText}</div><footer>{['AUTH', 'ROLES', 'RLS', 'BACKUP', 'LOG'].map((item) => <i key={item}>{item}</i>)}</footer></article>
                  <article data-reveal="up"><span><Bot size={22} /></span><p>CONTROLLED AI FLOW</p><h3>{c.aiTitle}</h3><div>{c.aiText}</div><footer>{['CLASSIFY', 'DRAFT', 'REVIEW', 'ACT'].map((item) => <i key={item}>{item}</i>)}</footer></article>
                </div>
              </div>
              <dl className={styles.machineReadable} data-reveal="up">
                <div><dt>{lang === 'de' ? 'Was baut marcelspahr.ch?' : 'What does marcelspahr.ch build?'}</dt><dd>{lang === 'de' ? 'Individuelle digitale Unternehmenssysteme aus Website, Marketing, Software, Daten und Automationen.' : 'Custom digital business systems combining websites, marketing, software, data and automation.'}</dd></div>
                <div><dt>{lang === 'de' ? 'Für wen?' : 'For whom?'}</dt><dd>{lang === 'de' ? 'Für Schweizer KMU und Start-ups, die digitale Werkzeuge und Prozesse zu einem verlässlichen System verbinden wollen.' : 'For Swiss SMEs and startups that want to connect digital tools and processes into one dependable system.'}</dd></div>
                <div><dt>{lang === 'de' ? 'Wie beginnt ein Projekt?' : 'How does a project begin?'}</dt><dd>{lang === 'de' ? 'Mit einer Analyse von Unternehmen, Zielen, Menschen, Engpässen, Daten und bestehenden Systemen.' : 'With an analysis of the company, goals, people, bottlenecks, data and existing systems.'}</dd></div>
              </dl>
            </div>
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
                        <footer><a href={`/portfolio/${project.slug}`}>{c.caseCta}<ArrowRight size={15} /></a>{project.externalUrl && <a href={project.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={`${c.live}: ${projectCopy.title}`}><ExternalLink size={15} /></a>}</footer>
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
          <SectionDockingStation station="about" />
          <div id="about" className={styles.aliasAnchor} />
          <div className={styles.pauseSticky}>
            <div className={styles.pauseFit} data-fit>
              <div className={styles.aboutLayout}>
                <div className={styles.aboutImage} data-reveal="left">
                  <Image src="/assets/MarcelSpahrHeader.jpg" alt="Marcel Spahr im Arbeits- und Projektraum" fill sizes="(min-width: 1000px) 42vw, 94vw" />
                  <div className={styles.imagePlate}><span>MS / BERN</span><strong>BUSINESS × DESIGN × TECH</strong></div>
                </div>
                <div className={styles.sectionCopy} data-reveal="right">
                  <p className={styles.eyebrow}><span />{c.aboutEyebrow}</p>
                  <h2>{c.aboutTitle}</h2>
                  <p className={styles.sectionLead}>{c.aboutText}</p>
                  <blockquote>"{c.aboutQuote}"</blockquote>
                </div>
              </div>
              <div className={styles.factGrid} data-reveal="up">{c.facts.map(([value, label]) => <div key={value}><strong>{value}</strong><span>{label}</span></div>)}</div>
            </div>
          </div>
        </section>

        <span id="mobile-journey-contact" className={styles.aliasAnchor} />
        <section id="journey-contact" className={`${styles.section} ${styles.finalSection}`}>
          <SectionDockingStation station="contact" />
          <div className={styles.pauseSticky}>
            <div className={styles.pauseFit} data-fit>
              <div className={styles.finalGlow} aria-hidden="true" />
              <div className={styles.finalHeader} data-reveal="up"><p>{c.finalA}</p><h2>{c.finalB}</h2><span>{c.finalText}</span></div>
              <div className={styles.funnelFrame} data-reveal="up"><LeadFunnel lang={lang} /></div>
              <footer className={styles.footer}>
                <div><span className={styles.footerMark}>MS</span><p><strong>Marcel Spahr</strong><small>{c.footerLine}</small></p></div>
                <div><a href="mailto:kontakt@marcelspahr.ch">kontakt@marcelspahr.ch</a><a href="tel:+41795110911">+41 79 511 09 11</a></div>
                <div><a href="/datenschutz">{c.privacy}</a><a href="/impressum">{c.imprint}</a><span>© {new Date().getFullYear()}</span></div>
              </footer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
