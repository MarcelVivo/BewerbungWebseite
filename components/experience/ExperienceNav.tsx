'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import type { ExperienceLang } from './content';
import { chapters } from './content';
import { getResolvedFlightPath } from './flightPathStore';
import { MIN_TRANSIT_VIEWPORTS } from './scrollPathController';
import { trackWebsiteEvent } from '../../app/lib/analytics';
import MobileAilaCompanion from './MobileAilaCompanion';
import styles from './experience.module.css';

// Fisheye/dock-style magnification: the list item nearest the pointer (or,
// at rest, nearest the active chapter) grows in size/weight/opacity; the
// falloff below fades that out over ~2.3 rows in either direction.
const MAGNIFY_RADIUS_ROWS = 2.3;
const magnifyFalloff = (distanceInRows: number) => {
  const linear = Math.max(0, 1 - distanceInRows / MAGNIFY_RADIUS_ROWS);
  return linear * linear * (3 - 2 * linear);
};

/** Scrolls to a point safely inside a chapter's true docking "hold" window -
 *  a plain scrollIntoView({block:'start'}) only lands at the top of the
 *  (often multi-viewport-tall) section, not where the flying object is
 *  actually resting on its ring. Reads the same dockingProgress
 *  ScrollEntity.tsx itself resolved and stored, rather than recomputing the
 *  arrival scrollY independently - a parallel formula silently drifts out
 *  of sync as the page accumulates layout (each dock further down inherits
 *  more error than the last). Mirrors mapScrollToPathProgress()'s own
 *  hold-window start: the previous dock's minimum transit distance can push
 *  the true "arrived" scrollY later than this dock's raw arrivalScroll.
 *  Returns false for chapters with no docking ring (the hero) or before the
 *  route has resolved, so the caller can fall back to scrollIntoView. */
function scrollToChapterDockingRest(sectionId: string, behavior: ScrollBehavior): boolean {
  const resolved = getResolvedFlightPath();
  const docks = resolved?.dockingProgress;
  if (!resolved || !docks?.length) return false;
  const index = docks.findIndex((dock) => dock.sectionId === sectionId);
  if (index < 0) return false;
  const to = docks[index];
  const viewportHeight = resolved.viewportHeight || window.innerHeight;
  const holdStart = index === 0
    ? to.arrivalScroll
    : Math.max(docks[index - 1].departureScroll + Math.max(1, viewportHeight * MIN_TRANSIT_VIEWPORTS), to.arrivalScroll);
  const holdEnd = Number.isFinite(to.departureScroll) ? to.departureScroll : holdStart + viewportHeight;
  const margin = Math.min(viewportHeight * .12, Math.max(0, holdEnd - holdStart) / 2);
  window.scrollTo({ top: Math.max(0, holdStart + margin), behavior });
  return true;
}

export default function ExperienceNav({ lang }: { lang: ExperienceLang }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef<HTMLOListElement | null>(null);
  const hoverYRef = useRef<number | null>(null);
  const magnifyFrameRef = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, window.scrollY / max));
      const probe = window.scrollY + window.innerHeight * .42;
      let current = 0;
      chapters.forEach((chapter, index) => {
        const element = document.getElementById(chapter.id);
        if (element && element.offsetTop <= probe) current = index;
      });
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);

  const applyMagnify = (activeIndex: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.children) as HTMLElement[];
    const pointerY = hoverYRef.current;
    const listRect = list.getBoundingClientRect();
    const pitch = items.length > 1 ? listRect.height / items.length : 1;
    const pointerRowY = pointerY === null ? null : pointerY - listRect.top;
    items.forEach((item, index) => {
      const distanceInRows = pointerRowY === null
        ? Math.abs(index - activeIndex)
        : Math.abs((item.offsetTop + item.offsetHeight / 2) - pointerRowY) / pitch;
      item.style.setProperty('--mag', magnifyFalloff(distanceInRows).toFixed(3));
    });
  };

  useEffect(() => { applyMagnify(active); }, [active]);

  useEffect(() => {
    if (!menuOpen) return;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo({ top: scrollY, behavior: 'auto' });
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLOListElement>) => {
    hoverYRef.current = event.clientY;
    if (magnifyFrameRef.current) return;
    magnifyFrameRef.current = window.requestAnimationFrame(() => {
      magnifyFrameRef.current = 0;
      applyMagnify(active);
    });
  };

  const handlePointerLeave = () => {
    hoverYRef.current = null;
    applyMagnify(active);
  };

  function navigate(id: string, index: number) {
    setActive(index);
    setMenuOpen(false);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const isMobile = window.matchMedia('(max-width: 1100px)').matches;
    const landedOnDock = !isMobile && scrollToChapterDockingRest(id, behavior);
    if (!landedOnDock) document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    trackWebsiteEvent('journey_navigation', { station: id, metadata: { station_index: index + 1 } });
  }

  function openAila() {
    setMenuOpen(false);
    window.dispatchEvent(new Event('aila:prime-audio'));
    window.dispatchEvent(new Event('aila:open-sales-conversation'));
    trackWebsiteEvent('aila_opened', { station: chapters[active].id, metadata: { source: 'mobile_navigation' } });
  }

  return (
    <>
      <div className={styles.topProgress} aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
      <header className={styles.mobileAppBar}>
        <button type="button" className={styles.mobileAppBrand} data-mobile-aila-boundary="brand" onClick={() => navigate(chapters[0].id, 0)} aria-label={lang === 'de' ? 'Zum Seitenanfang' : 'Back to top'}>
          <span>MS</span>
          <span>
            <strong>Marcel Spahr</strong>
            <small>{chapters[active].label[lang]}</small>
          </span>
        </button>
        <div className={styles.mobileAppActions}>
          <span className={styles.mobileAppAilaDock} data-mobile-aila-anchor="nav" aria-hidden="true" />
          <button type="button" className={styles.mobileAppMenuButton} data-mobile-aila-boundary="menu" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-controls="mobile-experience-menu" aria-label={menuOpen ? (lang === 'de' ? 'Menü schliessen' : 'Close menu') : (lang === 'de' ? 'Menü öffnen' : 'Open menu')}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
      <MobileAilaCompanion lang={lang} />

      <div id="mobile-experience-menu" className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`} aria-hidden={!menuOpen}>
        <button type="button" className={styles.mobileMenuBackdrop} onClick={() => setMenuOpen(false)} aria-label={lang === 'de' ? 'Menü schliessen' : 'Close menu'} tabIndex={menuOpen ? 0 : -1} />
        <nav className={styles.mobileMenuPanel} role="dialog" aria-modal="true" aria-label={lang === 'de' ? 'Hauptnavigation' : 'Main navigation'}>
          <header>
            <div>
              <span>{lang === 'de' ? 'DEINE REISE' : 'YOUR JOURNEY'}</span>
              <strong>{lang === 'de' ? 'Ein Unternehmen. Ein System.' : 'One business. One system.'}</strong>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label={lang === 'de' ? 'Menü schliessen' : 'Close menu'} tabIndex={menuOpen ? 0 : -1}><X size={20} /></button>
          </header>
          <div className={styles.mobileMenuProgress} aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
          <ol>
            {chapters.map((chapter, index) => (
              <li key={chapter.id}>
                <button type="button" className={active === index ? styles.mobileChapterActive : ''} onClick={() => navigate(chapter.id, index)} aria-current={active === index ? 'location' : undefined} tabIndex={menuOpen ? 0 : -1}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{chapter.label[lang]}</strong>
                  <small>{chapter.short}</small>
                </button>
              </li>
            ))}
          </ol>
          <footer>
            <button type="button" className={styles.mobileMenuAila} onClick={openAila} tabIndex={menuOpen ? 0 : -1}>
              <img src="/cinematic/aila/aila-idle-v1-fallback-transparent.png" alt="" aria-hidden="true" />
              <span><strong>{lang === 'de' ? 'Mit AILA sprechen' : 'Speak with AILA'}</strong><small>{lang === 'de' ? 'Eigener Gesprächsraum' : 'Dedicated conversation space'}</small></span>
              <ArrowRight size={19} />
            </button>
            <button type="button" className={styles.mobileMenuProject} onClick={() => navigate('journey-contact', chapters.length - 1)} tabIndex={menuOpen ? 0 : -1}>
              {lang === 'de' ? 'Projekt starten' : 'Start a project'} <ArrowRight size={18} />
            </button>
          </footer>
        </nav>
      </div>
      <nav className={styles.chapterRail} aria-label="Seitenposition">
        <span className={styles.railLine}><i style={{ height: `${progress * 100}%` }} /></span>
        <ol ref={listRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
          {chapters.map((chapter, index) => (
            <li key={chapter.id} className={active === index ? styles.chapterActive : ''}>
              <button type="button" onClick={() => navigate(chapter.id, index)} aria-current={active === index ? 'location' : undefined}>
                <b><span className={styles.chapterLabelFull}>{chapter.label[lang]}</span><span className={styles.chapterLabelShort}>{chapter.short}</span></b>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <nav className={styles.mobileNavigator} aria-label={lang === 'de' ? 'Mobile Seitennavigation' : 'Mobile page navigation'}>
        <button
          type="button"
          disabled={active === 0}
          onClick={() => navigate(chapters[Math.max(0, active - 1)].id, Math.max(0, active - 1))}
          aria-label={lang === 'de' ? 'Vorheriger Abschnitt' : 'Previous section'}
        >
          <ChevronLeft size={19} />
        </button>
        <button
          type="button"
          className={styles.mobileNavigatorCurrent}
          onClick={() => navigate(chapters[active].id, active)}
          aria-current="location"
        >
          <small>{String(active + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</small>
          <strong>{chapters[active].label[lang]}</strong>
        </button>
        <button
          type="button"
          disabled={active === chapters.length - 1}
          onClick={() => navigate(chapters[Math.min(chapters.length - 1, active + 1)].id, Math.min(chapters.length - 1, active + 1))}
          aria-label={lang === 'de' ? 'Nächster Abschnitt' : 'Next section'}
        >
          <ChevronRight size={19} />
        </button>
      </nav>
    </>
  );
}
