'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ExperienceLang } from './content';
import { chapters } from './content';
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
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    trackWebsiteEvent('journey_navigation', { station: id, metadata: { station_index: index + 1 } });
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
    </>
  );
}
