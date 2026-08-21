'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AudioLines, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ExperienceLang } from './content';
import { chapters } from './content';
import { getResolvedFlightPath } from './flightPathStore';
import { MIN_TRANSIT_VIEWPORTS } from './scrollPathController';
import { trackWebsiteEvent } from '../../app/lib/analytics';
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
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const isMobile = window.matchMedia('(max-width: 699px)').matches;
    const landedOnDock = !isMobile && scrollToChapterDockingRest(id, behavior);
    if (!landedOnDock) document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    trackWebsiteEvent('journey_navigation', { station: id, metadata: { station_index: index + 1 } });
  }

  function openAila() {
    window.dispatchEvent(new Event('aila:prime-audio'));
    window.dispatchEvent(new Event('aila:open-sales-conversation'));
    trackWebsiteEvent('aila_opened', { station: chapters[active].id, metadata: { source: 'mobile_navigation' } });
  }

  return (
    <>
      <div className={styles.topProgress} aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
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
          className={styles.mobileNavigatorAila}
          onClick={openAila}
          aria-label={lang === 'de' ? 'Mit AILA sprechen' : 'Speak with AILA'}
        >
          <AudioLines size={19} />
          <small>AILA</small>
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
