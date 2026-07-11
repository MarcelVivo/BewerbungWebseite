'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Bot, BarChart3, Workflow, FolderKanban,
  GraduationCap, Globe, Lightbulb, Mail, MapPin, Phone,
  ChevronRight, ExternalLink, Star,
  CheckCircle, Zap, Users, Award,
  MessageSquare, Search, Compass, Wrench, Heart, ClipboardList,
} from 'lucide-react';
import HomeNavBar from './HomeNavBar';
import BrainBackground from './BrainBackground';
import ContactFormClient from './ContactFormClient';
import { useLanguage } from './LanguageContext';
import { T } from '../lib/translations';

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

const PORTFOLIO_META = [
  { slug: 'covid-certificate',         color: '#a896c8' },
  { slug: 'digitalisierung-swisscom',  color: '#7a9bb5' },
  { slug: 'olivias-olivenpaste',       color: '#8fb58a' },
  { slug: 'requirements-engineering',  color: '#7aada8' },
];

const USP_ICONS = [Zap, Users, CheckCircle, Award];
const PROCESS_ICONS = [MessageSquare, Search, Compass, Wrench, Heart];

function SpiralShowcase({ t, lang }: { t: typeof T['de']; lang: 'de' | 'en' }) {
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const activeLayoutProgressRef = useRef(0);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastStrandProgressRef = useRef(-1);

  useEffect(() => {
    const section = document.getElementById('solution-spiral');
    if (!section) return;
    const items = Array.from(section.querySelectorAll<HTMLElement>('[data-spiral-item]'));
    const strandAnchors = Array.from(section.querySelectorAll<HTMLElement>('[data-spiral-strand-anchor]'));
    const continuousStrand = section.querySelector<SVGSVGElement>('[data-continuous-strand]');
    const continuousStrandPaths = continuousStrand
      ? Array.from(continuousStrand.querySelectorAll<SVGPathElement>('[data-strand-path]'))
      : [];
    const serviceItems = Array.from(section.querySelectorAll<HTMLElement>('[data-service-card]'));

    const update = () => {
      const start = section.offsetTop;
      const end = start + section.offsetHeight - window.innerHeight;
      const raw = (window.scrollY - start) / Math.max(1, end - start);
      targetProgressRef.current = Math.max(0, Math.min(1, raw));
    };

    const renderProgress = (currentProgress: number, activeLayoutProgress: number) => {
      const rotationTravel = (spiralAngleStep * totalTravel) / verticalStep;
      if (section.dataset.activeService && (currentProgress < 0.61 || currentProgress > 0.97)) {
        section.dataset.activeService = '';
        setActiveServiceSlug(null);
      }

      items.forEach((item, i) => {
        const angle = i * spiralAngleStep - currentProgress * rotationTravel;
        const rad = (angle * Math.PI) / 180;
        const y = i * verticalStep - currentProgress * totalTravel + spiralYOffset;
        const front = Math.cos(rad);
        const visible = Math.max(0, 1 - Math.abs(y) / 690);
        const frontFocus = Math.max(0, (front + 0.18) / 1.18);
        const opacity = Math.max(0, Math.min(1, visible * frontFocus));
        const scale = 0.78 + 0.22 * Math.max(0, Math.min(1, visible * frontFocus));

        item.style.transform = `translate3d(-50%, -50%, 0) rotateY(${-angle}deg) translateZ(${radius}px) translate3d(0, ${y}px, 0) scale(${scale})`;
        item.style.opacity = String(opacity);
        item.style.zIndex = String(Math.round(1000 + front * 120 + visible * 240));
      });

      strandAnchors.forEach((strand, i) => {
        const strandIndex = i;
        const angle = strandIndex * spiralAngleStep - currentProgress * rotationTravel;
        const rad = (angle * Math.PI) / 180;
        const y = strandIndex * verticalStep - currentProgress * totalTravel + spiralYOffset;
        const front = Math.cos(rad);
        const visible = Math.max(0, 1 - Math.abs(y) / 720);
        const frontFocus = Math.max(0, (front + 0.1) / 1.1);
        const opacity = Math.max(0, Math.min(0.82, visible * frontFocus * 0.82));

        strand.style.transform = `translate3d(-50%, -50%, 0) rotateY(${-angle}deg) translateZ(${radius - 18}px) translate3d(0, ${y}px, 0)`;
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
        const strandRect = continuousStrand.getBoundingClientRect();
        continuousStrand.setAttribute('viewBox', `0 0 ${strandRect.width.toFixed(1)} ${strandRect.height.toFixed(1)}`);
        const points = strandAnchors.map((anchor) => {
          const rect = anchor.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2 - strandRect.left,
            y: rect.top + rect.height / 2 - strandRect.top,
          };
        });
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
            : (fiberIndex - 5.5) * 2.2 + Math.sin(fiberIndex * 1.7) * 2.2;
          const phase = fiberIndex * 0.61;
          pathElement.setAttribute('d', createPath(extendedPoints, offset, phase));
        });
        continuousStrand.style.opacity = String(Math.min(0.82, opacity));
      }

      serviceItems.forEach((item, i) => {
        const activeSlug = section.dataset.activeService || '';
        const isSelected = item.dataset.serviceSlug === activeSlug;
        const side = item.dataset.side || (i % 2 === 0 ? 'left' : 'right');
        const rowDelay = i > 1 ? 0.11 : 0;
        const raw = (currentProgress - 0.56 - rowDelay) / 0.2;
        const clamped = Math.max(0, Math.min(1, raw));
        const eased = 1 - Math.pow(1 - clamped, 3);
        const y = (1 - eased) * 150;
        const direction = side === 'left' ? -1 : 1;
        const x = direction * (isSelected ? 220 : 330) * activeLayoutProgress;
        const z = (isSelected ? 150 : 96) * activeLayoutProgress;
        const rotateY = direction * -42 * activeLayoutProgress;

        item.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg)`;
        item.style.opacity = String(Math.max(eased, activeLayoutProgress));
        item.style.zIndex = String(isSelected ? 1280 : 1260);
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

      const activeTarget = section.dataset.activeService ? 1 : 0;
      const activeNext = activeLayoutProgressRef.current + (activeTarget - activeLayoutProgressRef.current) * easing;
      activeLayoutProgressRef.current = Math.abs(activeTarget - activeNext) < 0.0008 ? activeTarget : activeNext;

      renderProgress(progressRef.current, activeLayoutProgressRef.current);

      frameRef.current = requestAnimationFrame(animate);
    };

    update();
    renderProgress(progressRef.current, activeLayoutProgressRef.current);
    frameRef.current = requestAnimationFrame(animate);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const cards = [
    {
      kind: 'intro',
      code: 'INTRO 01',
      title: lang === 'de' ? 'Ich baue\ndie passende Lösung.' : 'I build\nthe right solution.',
      icon: Wrench,
    },
    {
      kind: 'intro',
      code: 'INTRO 02',
      title: lang === 'de' ? 'für\nDein Unternehmen' : 'for\nyour company',
      icon: Users,
    },
    {
      kind: 'intro',
      code: 'INTRO 03',
      title: lang === 'de' ? 'Deine\nHerausforderung.' : 'Your\nchallenge.',
      icon: Compass,
    },
    {
      kind: 'intro',
      code: 'INTRO 04',
      title: lang === 'de' ? 'Meine\nLösung.' : 'My\nsolution.',
      icon: Lightbulb,
    },
    {
      kind: 'intro',
      code: 'INTRO 05',
      title: lang === 'de' ? 'Alles Individuell.\nAlles aus einem Guss.' : 'Fully custom.\nBuilt as one system.',
      icon: Workflow,
    },
    {
      kind: 'service',
      slug: 'corporate-design-webauftritt',
      code: '01',
      title: lang === 'de' ? 'Corporate Design\n& Webauftritt' : 'Corporate design\n& web presence',
      body: lang === 'de'
        ? 'Marke, Gestaltung, Wirkung und digitale Präsentation sauber aus einem System gedacht.'
        : 'Brand, design, impact and digital presentation built as one coherent system.',
      detailTitle: lang === 'de' ? 'Ein Auftritt, der sofort seriös wirkt.' : 'A presence that feels credible immediately.',
      detailText: lang === 'de'
        ? 'Ich entwickle ein visuelles Fundament, das zu deinem Unternehmen passt: Logo, Farben, Typografie, Bildsprache, Layoutsystem und Website-Auftritt. Ziel ist kein austauschbares Design, sondern ein professioneller digitaler Eindruck, der Vertrauen schafft und dein Angebot verständlich macht.'
        : 'I build a visual foundation that fits your company: logo, colors, typography, imagery, layout system and web presence. The goal is not generic design, but a credible digital impression that builds trust and explains your offer clearly.',
      detailPoints: lang === 'de'
        ? ['Corporate Design und visuelle Leitplanken', 'Website-Struktur, Texteinstieg und Nutzerführung', 'Moderne Gestaltung mit klarer Wirkung', 'Saubere Übergabe für langfristige Weiterentwicklung']
        : ['Corporate design and visual guidelines', 'Website structure, copy entry and user flow', 'Modern design with clear impact', 'Clean handover for long-term evolution'],
      accent: '#d6b75a',
      accentRgb: '214,183,90',
      icon: Star,
    },
    {
      kind: 'service',
      slug: 'websites-applikationen',
      code: '02',
      title: lang === 'de' ? '2D-/3D-Websites\n& Applikationen' : '2D/3D websites\n& applications',
      body: lang === 'de'
        ? 'Moderne Websites und Web-Apps, die hochwertig aussehen und technisch belastbar sind.'
        : 'Modern websites and web apps that look premium and hold up technically.',
      detailTitle: lang === 'de' ? 'Websites und Apps, die nicht nur gut aussehen.' : 'Websites and apps that do more than look good.',
      detailText: lang === 'de'
        ? 'Ich baue moderne 2D- und 3D-Websites, Landingpages, Portale und Web-Applikationen mit sauberer Architektur. Performance, Responsivität, Animationen, Inhalte und Bedienbarkeit werden zusammen geplant, damit die Lösung stabil, schnell und überzeugend funktioniert.'
        : 'I build modern 2D and 3D websites, landing pages, portals and web applications with clean architecture. Performance, responsiveness, animation, content and usability are planned together so the solution is stable, fast and convincing.',
      detailPoints: lang === 'de'
        ? ['Individuelle Websites, Landingpages und Web-Apps', '2D-/3D-Interaktionen mit Fokus auf Performance', 'Responsive Umsetzung für Desktop und Mobile', 'Technisch saubere Basis für SEO und Erweiterungen']
        : ['Custom websites, landing pages and web apps', '2D/3D interactions with performance focus', 'Responsive implementation for desktop and mobile', 'Clean technical base for SEO and extensions'],
      accent: '#5fb4ff',
      accentRgb: '95,180,255',
      icon: Globe,
    },
    {
      kind: 'service',
      slug: 'crm-erp-datenbanken',
      code: '03',
      title: lang === 'de' ? 'CRM, ERP\n& Datenbanken' : 'CRM, ERP\n& databases',
      body: lang === 'de'
        ? 'Individuelle Systeme, exakt auf Abläufe, Teams, Daten und Wachstum abgestimmt.'
        : 'Custom systems aligned to workflows, teams, data and long-term growth.',
      detailTitle: lang === 'de' ? 'Systeme, die exakt zu deinem Betrieb passen.' : 'Systems aligned exactly to your business.',
      detailText: lang === 'de'
        ? 'Ich konzipiere und entwickle CRM-, ERP- und Datenbanklösungen, die reale Abläufe abbilden statt sie komplizierter zu machen. Kunden, Projekte, Dokumente, Angebote, Rechnungen, Prozesse und Rechte werden so strukturiert, dass dein Unternehmen damit langfristig arbeiten kann.'
        : 'I design and develop CRM, ERP and database solutions that reflect real workflows instead of making them more complicated. Customers, projects, documents, quotes, invoices, processes and roles are structured so your company can rely on them long term.',
      detailPoints: lang === 'de'
        ? ['CRM- und ERP-Funktionen nach Maß', 'Datenbanken, Rollen, Rechte und Workflows', 'Dashboards, Dokumente, Formulare und Auswertungen', 'Schnittstellen zu bestehenden Tools und Prozessen']
        : ['Custom CRM and ERP functions', 'Databases, roles, permissions and workflows', 'Dashboards, documents, forms and reporting', 'Interfaces to existing tools and processes'],
      accent: '#c28cff',
      accentRgb: '194,140,255',
      icon: FolderKanban,
    },
    {
      kind: 'service',
      slug: 'ki-automation-prozesse',
      code: '04',
      title: lang === 'de' ? 'KI-Automation\n& Prozesse' : 'AI automation\n& processes',
      body: lang === 'de'
        ? 'Sinnvolle KI-Lösungen, die Arbeit vereinfachen, Prozesse beschleunigen und Qualität sichern.'
        : 'Practical AI solutions that simplify work, accelerate processes and protect quality.',
      detailTitle: lang === 'de' ? 'KI dort einsetzen, wo sie wirklich hilft.' : 'AI where it actually helps.',
      detailText: lang === 'de'
        ? 'Ich analysiere, wo Automatisierung und KI in deinem Unternehmen konkret Nutzen bringen: weniger manuelle Arbeit, bessere Antworten, schnellere Prozesse, klarere Daten und weniger Fehler. Statt Tool-Chaos entsteht eine passende Lösung, die kontrollierbar und seriös bleibt.'
        : 'I analyze where automation and AI create concrete value in your company: less manual work, better answers, faster processes, clearer data and fewer errors. Instead of tool chaos, you get a fitting solution that remains controlled and professional.',
      detailPoints: lang === 'de'
        ? ['KI-Workflows für wiederkehrende Aufgaben', 'Automatisierung von Kommunikation, Daten und Abläufen', 'Tool-Auswahl und Integration ohne KI-Chaos', 'Sichere, nachvollziehbare und wartbare Umsetzung']
        : ['AI workflows for recurring tasks', 'Automation of communication, data and operations', 'Tool selection and integration without AI chaos', 'Safe, explainable and maintainable implementation'],
      accent: '#5ee6c4',
      accentRgb: '94,230,196',
      icon: Bot,
    },
  ];

  const verticalStep = 210;
  const introCards = cards.filter((card) => card.kind === 'intro');
  const serviceCards = cards.filter((card) => card.kind === 'service');
  const activeService = serviceCards.find((card) => card.slug === activeServiceSlug) || null;
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

      <div className="spiral-sticky">
        <div className="spiral-cylinder" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <div className="spiral-stage">
          <svg
            data-continuous-strand
            className="spiral-continuous-strand"
            aria-hidden
            focusable="false"
          >
            <defs>
              <linearGradient id="spiralStrandGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d6b75a" stopOpacity="0.16" />
                <stop offset="23%" stopColor="#5fb4ff" stopOpacity="0.12" />
                <stop offset="47%" stopColor="#c28cff" stopOpacity="0.13" />
                <stop offset="69%" stopColor="#5ee6c4" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#d6b75a" stopOpacity="0.14" />
              </linearGradient>
              <linearGradient id="spiralStrandA" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d6b75a" />
                <stop offset="18%" stopColor="#5ee6c4" />
                <stop offset="39%" stopColor="#5fb4ff" />
                <stop offset="63%" stopColor="#c28cff" />
                <stop offset="82%" stopColor="#d6b75a" />
                <stop offset="100%" stopColor="#5fb4ff" />
              </linearGradient>
              <linearGradient id="spiralStrandB" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5fb4ff" />
                <stop offset="21%" stopColor="#d6b75a" />
                <stop offset="44%" stopColor="#c28cff" />
                <stop offset="71%" stopColor="#5ee6c4" />
                <stop offset="100%" stopColor="#d6b75a" />
              </linearGradient>
              <linearGradient id="spiralStrandC" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c28cff" />
                <stop offset="16%" stopColor="#5fb4ff" />
                <stop offset="37%" stopColor="#d6b75a" />
                <stop offset="58%" stopColor="#5ee6c4" />
                <stop offset="79%" stopColor="#c28cff" />
                <stop offset="100%" stopColor="#d6b75a" />
              </linearGradient>
              <linearGradient id="spiralStrandD" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5ee6c4" />
                <stop offset="25%" stopColor="#c28cff" />
                <stop offset="48%" stopColor="#d6b75a" />
                <stop offset="66%" stopColor="#5fb4ff" />
                <stop offset="100%" stopColor="#5ee6c4" />
              </linearGradient>
            </defs>
            <path data-strand-path data-strand-role="glow" className="strand-glow" />
            <path data-strand-path data-strand-role="core" className="strand-core" />
            {Array.from({ length: 12 }).map((_, fiberIndex) => (
              <path
                key={`strand-fiber-${fiberIndex}`}
                data-strand-path
                data-strand-role="fiber"
                data-fiber-index={fiberIndex}
                className={`strand-fiber strand-fiber-tone-${fiberIndex % 4} ${fiberIndex % 4 === 0 ? 'strand-fiber-dim' : ''}`}
              />
            ))}
          </svg>

          {introCards.map((_, i) => (
            <div
              key={`intro-strand-${i}`}
              data-spiral-strand-anchor
              className="spiral-strand-anchor"
              aria-hidden
            />
          ))}

          {introCards.map((card, i) => {
            const angle = i * spiralAngleStep - progress * rotationTravel;
            const rad = (angle * Math.PI) / 180;
            const y = i * verticalStep - progress * totalTravel + spiralYOffset;
            const front = Math.cos(rad);
            const visible = Math.max(0, 1 - Math.abs(y) / 690);
            const frontFocus = Math.max(0, (front + 0.18) / 1.18);
            const scale = 0.78 + 0.22 * Math.max(0, Math.min(1, visible * frontFocus));
            const isIntro = card.kind === 'intro';
            const isService = card.kind === 'service';
            const opacity = Math.max(0, Math.min(1, visible * frontFocus));
            const width = isIntro ? 560 : isService ? 470 : 380;
            const Icon = card.icon;
            const accent = card.accent || '#c9a84c';
            const transform = `translate3d(-50%, -50%, 0) rotateY(${-angle}deg) translateZ(${radius}px) translate3d(0, ${y}px, 0) scale(${scale})`;
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
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#d4b86a]">
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

        <div
          className={`spiral-detail-panel ${activeService ? 'is-open' : ''}`}
          aria-hidden={!activeService}
          style={activeService ? {
            '--service-accent': activeService.accent,
            '--service-accent-rgb': activeService.accentRgb,
          } as CSSProperties : undefined}
        >
          {activeService ? (
            <>
              <button
                type="button"
                className="spiral-detail-close"
                onClick={() => setActiveServiceSlug(null)}
                aria-label={lang === 'de' ? 'Detail schließen' : 'Close detail'}
              >
                ×
              </button>
              <span className="spiral-intro-meta">
                <span className="spiral-intro-index">{activeService.code}</span>
                <span className="spiral-intro-icon">
                  {activeService.icon ? <activeService.icon size={15} strokeWidth={1.8} /> : null}
                </span>
              </span>
              <h3 className="spiral-detail-title">{activeService.detailTitle}</h3>
              <p className="spiral-detail-text">{activeService.detailText}</p>
              <div className="spiral-detail-list">
                {activeService.detailPoints?.map((point) => (
                  <span key={point}>{point}</span>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div
          className={`spiral-service-grid ${activeService ? 'has-active-service' : ''}`}
          aria-label={lang === 'de' ? 'Service Leistungen' : 'Services'}
        >
          {serviceCards.map((card, i) => {
            const Icon = card.icon;
            const isSelected = activeServiceSlug === card.slug;
            return (
              <button
                key={`${card.code}-service-${i}`}
                type="button"
                data-service-card
                data-service-slug={card.slug}
                data-side={i % 2 === 0 ? 'left' : 'right'}
                className={`spiral-service-card ${isSelected ? 'is-selected' : ''}`}
                style={{
                  '--service-accent': card.accent,
                  '--service-accent-rgb': card.accentRgb,
                } as CSSProperties}
                onClick={() => setActiveServiceSlug(card.slug)}
              >
                <span className="spiral-intro-meta">
                  <span className="spiral-intro-index">{card.code}</span>
                  <span className="spiral-intro-icon">
                    {Icon ? <Icon size={15} strokeWidth={1.8} /> : null}
                  </span>
                </span>
                <h3 className="spiral-service-title">{card.title}</h3>
                <p className="spiral-service-body">{card.body}</p>
                <span className="spiral-intro-rule" />
              </button>
            );
          })}
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
          {serviceCards.map((card, i) => {
            const MobileIcon = card.icon;
            return (
              <div
                key={`${card.code}-mobile-service-${i}`}
                className="spiral-service-card"
                style={{
                  '--service-accent': card.accent,
                  '--service-accent-rgb': card.accentRgb,
                } as CSSProperties}
              >
                <span className="spiral-intro-meta">
                  <span className="spiral-intro-index">{card.code}</span>
                  <span className="spiral-intro-icon">
                    {MobileIcon ? <MobileIcon size={15} strokeWidth={1.8} /> : null}
                  </span>
                </span>
                <h3 className="spiral-service-title">{card.title}</h3>
                <p className="spiral-service-body">{card.body}</p>
                <span className="spiral-intro-rule" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessTimeline({ lang }: { lang: 'de' | 'en' }) {
  const steps = [
    {
      Icon: MessageSquare,
      number: '01',
      title: lang === 'de' ? 'Erstgespräch' : 'First call',
      badge: lang === 'de' ? 'Tag 1' : 'Day 1',
      subtitle: lang === 'de' ? 'Kennenlernen & Ziele verstehen' : 'Understand goals and context',
      body: lang === 'de'
        ? 'Wir sprechen 30 Minuten über dein Unternehmen, deine aktuellen Herausforderungen und was du erreichen möchtest. Ohne Verpflichtung – ich höre zu, bevor ich etwas vorschlage.'
        : 'We talk for 30 minutes about your company, current challenges and what you want to achieve. No obligation — I listen before proposing anything.',
    },
    {
      Icon: Search,
      number: '02',
      title: lang === 'de' ? 'Analyse' : 'Analysis',
      badge: lang === 'de' ? 'Woche 1' : 'Week 1',
      subtitle: lang === 'de' ? 'Verstehen, wo du stehst' : 'Understand where you stand',
      body: lang === 'de'
        ? 'Ich analysiere Prozesse, Daten, Systeme und Potenziale mit KI-Unterstützung schnell und präzise. Damit wir von Anfang an das Richtige angehen – ohne Zeit mit falschen Lösungen zu verlieren.'
        : 'I analyze processes, data, systems and potential quickly and precisely with AI support, so we solve the right problems from the start.',
    },
    {
      Icon: Compass,
      number: '03',
      title: lang === 'de' ? 'Konzept & Strategie' : 'Concept & strategy',
      badge: lang === 'de' ? 'Woche 1' : 'Week 1',
      subtitle: lang === 'de' ? 'Den richtigen Weg definieren' : 'Define the right path',
      body: lang === 'de'
        ? 'Ich entwickle einen massgeschneiderten Plan mit konkreten Massnahmen, klaren Prioritäten und einem kompakten 3-Wochen-Fahrplan – transparent und gemeinsam mit dir validiert.'
        : 'I develop a tailored plan with concrete actions, clear priorities and a compact 3-week roadmap — transparent and validated with you.',
    },
    {
      Icon: Wrench,
      number: '04',
      title: lang === 'de' ? 'Umsetzung' : 'Implementation',
      badge: lang === 'de' ? 'Woche 2–3' : 'Week 2–3',
      subtitle: lang === 'de' ? 'Konkret und zügig handeln' : 'Act clearly and quickly',
      body: lang === 'de'
        ? 'Die Lösung wird fokussiert umgesetzt – ob Website, CRM, ERP, Datenbank, Prozessoptimierung oder KI-Automation. Durch KI-gestützte Entwicklung arbeiten wir schneller, ohne die Qualität zu senken.'
        : 'The solution is implemented with focus — website, CRM, ERP, database, process optimization or AI automation. AI-supported development lets us move faster without lowering quality.',
    },
    {
      Icon: Heart,
      number: '05',
      title: lang === 'de' ? 'Begleitung' : 'Support',
      badge: lang === 'de' ? 'bis Woche 3' : 'by week 3',
      subtitle: lang === 'de' ? 'Fertiges Produkt & Übergabe' : 'Finished product & handover',
      body: lang === 'de'
        ? 'Nach maximal drei Wochen steht eine nutzbare, professionelle Lösung. Danach begleite ich dich bei Feinschliff, Erweiterungen und laufender Optimierung, damit alles langfristig trägt.'
        : 'Within a maximum of three weeks, you have a usable, professional solution. After that, I support refinement, extensions and ongoing optimization.',
    },
  ];

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-process-reveal]'));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="prozess" className="process-section relative z-10 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div data-process-reveal className="process-heading text-center">
          <span className="process-pill">{lang === 'de' ? 'Ablauf' : 'Process'}</span>
          <h2>
            {lang === 'de' ? (
              <>So arbeiten <span>wir zusammen</span></>
            ) : (
              <>How <span>we work together</span></>
            )}
          </h2>
          <p>
            {lang === 'de'
              ? 'Mensch und KI Hand in Hand – strukturiert, transparent und in maximal drei Wochen zum fertigen Produkt.'
              : 'Human expertise and AI working together — structured, transparent and moving to a finished product within three weeks.'}
          </p>
        </div>

        <div className="process-timeline">
          <div className="process-line" aria-hidden />
          {steps.map((step, index) => {
            const Icon = step.Icon;
            const side = index % 2 === 0 ? 'left' : 'right';
            return (
              <div
                key={step.number}
                data-process-reveal
                className={`process-row process-row-${side}`}
                style={{ '--process-delay': `${index * 110}ms` } as CSSProperties}
              >
                <article className="process-card">
                  <div className="process-icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="process-card-title">
                      <h3>{step.title}</h3>
                      <span>{step.badge}</span>
                    </div>
                    <strong>{step.subtitle}</strong>
                    <p>{step.body}</p>
                  </div>
                </article>
                <div className="process-marker" aria-hidden>{step.number}</div>
              </div>
            );
          })}
        </div>

        <div data-process-reveal className="process-cta">
          <a href="#contact">
            {lang === 'de' ? 'Jetzt Erstgespräch buchen' : 'Book first call'}
            <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function HomePage() {
  const { lang } = useLanguage();
  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      <HomeNavBar />
      <BrainBackground />

      {/* ── Hero ── */}
      <section className="home-hero relative z-10 min-h-screen overflow-hidden pt-16">
        <div className="absolute inset-x-0 bottom-0 z-10 pb-10 sm:pb-16 lg:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="hero-copy ms-anim">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#c9a84c]">
                Weblösungen · CRM · ERP · KI
              </p>
              <h1 className="max-w-xl text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[0.96] tracking-[-0.055em]">
                {lang === 'de' ? 'Digitale Lösungen aus einem Guss.' : 'Digital solutions built as one system.'}
              </h1>
              <p className="mt-5 max-w-lg text-base sm:text-lg text-[#d8ccb3] leading-relaxed">
                {lang === 'de'
                  ? 'Websites, Systeme, Datenbanken, Automatisierung und KI – sauber geplant, schnell umgesetzt und langfristig tragfähig.'
                  : 'Websites, systems, databases, automation and AI — clearly planned, fast to build and made to last.'}
              </p>
            </div>
            <div style={{ animationDelay: '0.18s' }} className="ms-anim mt-7 flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4">
              <a href="#contact" className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/30">
                {t.hero.cta}
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#about" className="px-6 py-3 rounded-xl border border-[#f4edd8]/25 hover:border-[#f4edd8]/60 text-[#f4edd8] font-medium text-center transition-all backdrop-blur-sm">
                {t.hero.more}
              </a>
            </div>
          </div>
        </div>
      </section>

      <SpiralShowcase t={t} lang={lang} />

      <ProcessTimeline lang={lang} />

      {/* ── Kontakt ── */}
      <section id="contact" className="contact-section py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.contact.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.contact.heading}</h2>
          </div>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-10">
            <div className="space-y-5">
              {[
                { Icon: MapPin, text: t.contact.location,          href: undefined },
                { Icon: Phone,  text: '+41 79 511 09 11',          href: undefined },
                { Icon: Mail,   text: 'kontakt@marcelspahr.ch',    href: 'mailto:kontakt@marcelspahr.ch' },
              ].map(({ Icon, text, href }, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#d4b86a]">
                    <Icon size={18} />
                  </div>
                  {href ? (
                    <a href={href} className="text-[#d4c4a8] hover:text-white transition-colors text-sm">{text}</a>
                  ) : (
                    <span className="text-[#d4c4a8] text-sm">{text}</span>
                  )}
                </div>
              ))}
            </div>
            <ContactFormClient />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="faq-section py-24 px-4 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: T.de.faq.items.map(item => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          })}}
        />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.faq.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.faq.heading}</h2>
          </div>
          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <details key={`${lang}-${i}`} className="group rounded-xl border border-[#2d2820] bg-[#1c1912] overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none hover:bg-[#231e15] transition-colors">
                  <span className="font-medium text-white text-sm sm:text-base">{item.q}</span>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-[#2d2820] flex items-center justify-center text-[#c9a84c] text-lg leading-none group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <div className="px-6 pb-5 pt-1">
                  <p className="text-sm text-[#a89880] leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2d2820] bg-[#100d09] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-[#7a6d5a]">{t.footer.copy}</span>
          <div className="flex items-center gap-6">
            <a href="/impressum"  className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{t.footer.imprint}</a>
            <a href="/datenschutz" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{t.footer.privacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
