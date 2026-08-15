'use client';

import { useEffect, useState } from 'react';
import type { ExperienceLang } from './content';
import { chapters } from './content';
import { trackWebsiteEvent } from '../../app/lib/analytics';
import styles from './experience.module.css';

export default function ExperienceNav({ lang }: { lang: ExperienceLang }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

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
        <ol>
          {chapters.map((chapter, index) => (
            <li key={chapter.id} className={active === index ? styles.chapterActive : ''}>
              <button type="button" onClick={() => navigate(chapter.id, index)} aria-current={active === index ? 'location' : undefined}>
                <span>{String(index + 1).padStart(2, '0')}</span><i /><b>{chapter.label[lang]}</b>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
