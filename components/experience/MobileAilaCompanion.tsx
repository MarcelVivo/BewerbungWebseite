'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ExperienceLang } from './content';
import { trackWebsiteEvent } from '../../app/lib/analytics';
import styles from './experience.module.css';

type MobileAilaStage = 'hero' | 'nav' | 'about' | 'transit' | 'final';

const clamp = (value: number, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const ease = (progress: number) => 1 - Math.pow(1 - progress, 3);

export default function MobileAilaCompanion({ lang }: { lang: ExperienceLang }) {
  const companionRef = useRef<HTMLButtonElement | null>(null);
  const [stage, setStage] = useState<MobileAilaStage>('hero');
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const media = window.matchMedia('(max-width: 1100px)');

    const sync = () => {
      frame = 0;
      const companion = companionRef.current;
      if (!companion || !media.matches) return;

      const hero = document.querySelector<HTMLElement>('[data-mobile-aila-anchor="hero"]');
      const nav = document.querySelector<HTMLElement>('[data-mobile-aila-anchor="nav"]');
      const about = document.querySelector<HTMLElement>('[data-mobile-aila-anchor="about"]');
      const final = document.querySelector<HTMLElement>('[data-mobile-aila-anchor="final"]');
      if (!hero || !nav || !about || !final) return;

      const heroRect = hero.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const aboutRect = about.getBoundingClientRect();
      const finalRect = final.getBoundingClientRect();
      const aboutSection = document.getElementById('journey-about');
      const finalSection = document.getElementById('journey-contact');
      const finalVisible = finalRect.top < window.innerHeight * .78 && finalRect.bottom > window.innerHeight * .12;
      const aboutVisible = aboutRect.top < window.innerHeight * .76 && aboutRect.bottom > window.innerHeight * .18;
      const transitStart = aboutSection ? aboutSection.offsetTop + aboutSection.offsetHeight * .58 : Number.POSITIVE_INFINITY;
      const transitEnd = finalSection ? Math.max(transitStart + 1, finalSection.offsetTop - window.innerHeight * .18) : transitStart + 1;
      const transitProgress = ease(clamp((window.scrollY - transitStart) / (transitEnd - transitStart)));
      const inDownwardTransit = window.scrollY >= transitStart && Boolean(finalSection && window.scrollY < finalSection.offsetTop);
      const travel = ease(clamp(window.scrollY / Math.max(150, window.innerHeight * .22)));

      const navWidth = clamp(window.innerWidth * .27, 102, 132);
      const navHeight = navWidth * .79;
      const navLeft = navRect.left + navRect.width / 2 - navWidth * .52;
      const navTop = navRect.top + navRect.height / 2 - navHeight * .38;

      let nextStage: MobileAilaStage = 'nav';
      let left = mix(heroRect.left, navLeft, travel);
      let top = mix(heroRect.top, navTop, travel);
      let width = mix(heroRect.width, navWidth, travel);
      let height = mix(heroRect.height, navHeight, travel);

      if (finalVisible) {
        nextStage = 'final';
        left = finalRect.left;
        top = finalRect.top;
        width = finalRect.width;
        height = finalRect.height;
      } else if (aboutVisible) {
        nextStage = 'about';
        left = aboutRect.left;
        top = aboutRect.top;
        width = aboutRect.width;
        height = aboutRect.height;
      } else if (inDownwardTransit) {
        nextStage = 'transit';
        width = clamp(window.innerWidth * .29, 108, 136);
        height = width * .76;
        left = window.innerWidth - width - Math.max(8, window.innerWidth * .025);
        top = mix(window.innerHeight * .18, window.innerHeight * .58, transitProgress);
      } else if (travel < .96) {
        nextStage = 'hero';
      }

      companion.style.setProperty('--mobile-aila-left', `${left}px`);
      companion.style.setProperty('--mobile-aila-top', `${top}px`);
      companion.style.setProperty('--mobile-aila-width', `${width}px`);
      companion.style.setProperty('--mobile-aila-height', `${height}px`);
      companion.dataset.measured = 'true';
      setStage((current) => current === nextStage ? current : nextStage);
    };

    const requestSync = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    window.addEventListener('orientationchange', requestSync);
    window.visualViewport?.addEventListener('resize', requestSync);
    media.addEventListener('change', requestSync);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      window.removeEventListener('orientationchange', requestSync);
      window.visualViewport?.removeEventListener('resize', requestSync);
      media.removeEventListener('change', requestSync);
    };
  }, []);

  useEffect(() => {
    const handleGuideOpen = (event: Event) => {
      setGuideOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    };
    window.addEventListener('aila:guide-open-change', handleGuideOpen);
    return () => window.removeEventListener('aila:guide-open-change', handleGuideOpen);
  }, []);

  const openAila = () => {
    window.dispatchEvent(new Event('aila:prime-audio'));
    window.dispatchEvent(new Event('aila:open-sales-conversation'));
    trackWebsiteEvent('aila_opened', { station: stage === 'final' ? 'journey-contact' : stage === 'about' || stage === 'transit' ? 'journey-about' : 'journey-start', metadata: { source: `mobile_companion_${stage}` } });
  };

  return (
    <button
      ref={companionRef}
      type="button"
      className={styles.mobileAilaCompanion}
      data-stage={stage}
      data-guide-open={guideOpen ? 'true' : 'false'}
      onClick={openAila}
      aria-label={lang === 'de' ? 'Mit AILA sprechen' : 'Speak with AILA'}
      style={{ '--mobile-aila-left': '50vw', '--mobile-aila-top': '8rem' } as CSSProperties}
    >
      <span className={styles.mobileAilaAura} aria-hidden="true" />
      <span className={styles.mobileAilaNavPrompt} aria-hidden="true">
        <span>{lang === 'de' ? 'Gespräch mit AILA beginnen' : 'Start a conversation with AILA'}</span>
      </span>
      <img src="/cinematic/aila/aila-idle-v1-fallback-transparent.png" alt="" aria-hidden="true" draggable="false" />
      <span className={styles.mobileAilaSignal} aria-hidden="true"><i /><i /><i /><i /></span>
      <span className={styles.mobileAilaParticles} aria-hidden="true"><i /><i /><i /><i /><i /></span>
    </button>
  );
}
