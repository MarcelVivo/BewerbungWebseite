'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { heroGreeting, type ExperienceLang } from './content';
import { getFlightPathDraft } from './flightPathStore';
import styles from './experience.module.css';

type HeroPhase = 'loading' | 'ignition' | 'revealed';

const WORDS_PER_MINUTE = 128;
const LINE_MIN_MS = 1500;
const LINE_MAX_MS = 4200;
const LINE_PAUSE_MS = 300;

const distributeDurations = (lines: readonly string[], totalMs: number) => {
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0) || 1;
  return lines.map((line) => {
    const share = Math.min(LINE_MAX_MS, Math.max(LINE_MIN_MS, (line.length / totalChars) * totalMs));
    return share + LINE_PAUSE_MS;
  });
};

const estimateSilentTotalMs = (lines: readonly string[]) => {
  const wordCount = lines.reduce((sum, line) => sum + line.split(' ').filter(Boolean).length, 0);
  return Math.max(lines.length * LINE_MIN_MS, (wordCount / WORDS_PER_MINUTE) * 60_000);
};

export default function AilaGreeting({ lang, heroPhase }: { lang: ExperienceLang; heroPhase: HeroPhase }) {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const startedRef = useRef(false);
  const dismissRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (startedRef.current || heroPhase !== 'revealed') return;
    startedRef.current = true;

    const lines = heroGreeting[lang];
    let mode: 'silent' | 'audio' | 'done' = 'silent';
    let holdTimer = 0;
    let sequenceToken = 0;

    const audio = new Audio(`/cinematic/aila/greeting-${lang}.mp3`);
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');

    const clearTimers = () => {
      if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = 0; }
    };

    const dispatchGuideState = (state: 'speaking' | 'idle') => {
      window.dispatchEvent(new CustomEvent('aila:guide-state', { detail: { state } }));
    };

    const cleanupAll = () => {
      clearTimers();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('aila:guide-open-change', handleGuideOpen);
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      audio.pause();
      audio.removeAttribute('src');
    };

    const finish = () => {
      if (mode === 'done') return;
      mode = 'done';
      cleanupAll();
      dispatchGuideState('idle');
      setVisible(false);
      setActiveIndex(-1);
    };
    dismissRef.current = finish;

    const runSequence = (durations: number[], token: number) => {
      const advance = (index: number) => {
        if (token !== sequenceToken || mode === 'done') return;
        if (index >= lines.length) { finish(); return; }
        setActiveIndex(index);
        holdTimer = window.setTimeout(() => advance(index + 1), durations[index]);
      };
      advance(0);
    };

    const handleScroll = () => {
      if (window.scrollY > 16) finish();
    };

    const handleGuideOpen = (event: Event) => {
      if ((event as CustomEvent<{ open?: boolean }>).detail?.open) finish();
    };

    const handleGesture = () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      if (mode !== 'silent') return;
      window.dispatchEvent(new Event('aila:prime-audio'));
      audio.play().then(() => {
        if (mode !== 'silent') { audio.pause(); return; }
        mode = 'audio';
        sequenceToken += 1;
        const token = sequenceToken;
        clearTimers();
        dispatchGuideState('speaking');
        audio.addEventListener('ended', finish, { once: true });
        const applyRealTiming = () => {
          const totalMs = Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration * 1000
            : estimateSilentTotalMs(lines);
          runSequence(distributeDurations(lines, totalMs), token);
        };
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          applyRealTiming();
        } else {
          audio.addEventListener('loadedmetadata', applyRealTiming, { once: true });
        }
      }).catch(() => undefined);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('aila:guide-open-change', handleGuideOpen);
    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);
    window.addEventListener('keydown', handleGesture);

    setVisible(true);
    runSequence(distributeDurations(lines, estimateSilentTotalMs(lines)), sequenceToken);

    return () => {
      mode = 'done';
      cleanupAll();
    };
  }, [heroPhase, lang]);

  if (!visible || activeIndex < 0) return null;

  const start = getFlightPathDraft().start;
  const lines = heroGreeting[lang];

  return (
    <div
      className={styles.ailaGreetingBubble}
      style={{ '--aila-greeting-x': `${start.x}vw`, '--aila-greeting-y': `${start.y}vh` } as CSSProperties}
      aria-live="polite"
    >
      <div className={styles.ailaGreetingLines}>
        {lines.map((line, index) => (
          <p key={index} className={styles.ailaGreetingLine} data-active={index === activeIndex}>
            {line}
          </p>
        ))}
      </div>
      <button
        type="button"
        className={styles.ailaGreetingDismiss}
        onClick={(event) => { event.stopPropagation(); dismissRef.current(); }}
        aria-label={lang === 'de' ? 'Begrüssung schliessen' : 'Dismiss greeting'}
      >
        <X size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}
