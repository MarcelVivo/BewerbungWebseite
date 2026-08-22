'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { heroGreeting, type ExperienceLang } from './content';
import { getFlightPathDraft } from './flightPathStore';
import styles from './experience.module.css';

type HeroPhase = 'loading' | 'ignition' | 'revealed';

const WORDS_PER_MINUTE = 128;
const MIN_WORD_MS = 620;
const MAX_WORD_MS = 1450;
const SENTENCE_PAUSE_MS = 340;

const buildWords = (lines: readonly string[]) => lines.flatMap((line) => line.split(' ').filter(Boolean));

// Trailing punctuation reads oddly on an isolated floating word, so it is
// stripped for display only; the original word (with punctuation) still
// drives the sentence-boundary pause below.
const displayWord = (word: string) => word.replace(/[.,!?;:—–]+$/, '');

const distributeDurations = (words: readonly string[], totalMs: number) => {
  const totalChars = words.reduce((sum, word) => sum + word.length, 0) || 1;
  return words.map((word) => {
    const share = Math.min(MAX_WORD_MS, Math.max(MIN_WORD_MS, (word.length / totalChars) * totalMs));
    return /[.!?—]$/.test(word) ? share + SENTENCE_PAUSE_MS : share;
  });
};

const estimateSilentTotalMs = (words: readonly string[]) =>
  Math.max(words.length * MIN_WORD_MS, (words.length / WORDS_PER_MINUTE) * 60_000);

const GENERATIONS = 3;
const GOLD = '#eecb7a';
const FADE_GREY = '#dcdcd4';

// Deterministic per-word pseudo-random so a word's sideways drift stays put
// across re-renders instead of jittering every tick.
const jitterPx = (index: number) => {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  return ((x - Math.floor(x)) * 2 - 1) * 7;
};

const wordStyle = (wordIndex: number, age: number, entered: boolean): CSSProperties => {
  const jx = jitterPx(wordIndex);
  if (!entered) {
    // A word is only ever new (unentered) the instant it becomes current,
    // so the resting values it fades in toward are always the age-0 ones.
    return {
      opacity: 0,
      filter: 'blur(7px)',
      transform: `translate(${jx}px, 8px) scale(.88)`,
      color: GOLD,
      fontSize: '2.05rem',
      zIndex: GENERATIONS,
    };
  }
  if (age === 0) {
    return {
      opacity: 1,
      filter: 'blur(0px)',
      transform: `translate(${jx}px, 0) scale(1)`,
      color: GOLD,
      fontSize: '2.05rem',
      zIndex: GENERATIONS,
    };
  }
  const fadeByAge = [0, .34, 0][age] ?? 0;
  const blurByAge = [0, 2.4, 5][age] ?? 5;
  const scaleByAge = [1, .8, .68][age] ?? .68;
  const liftByAge = [0, -4, -9][age] ?? -9;
  return {
    opacity: fadeByAge,
    filter: `blur(${blurByAge}px)`,
    transform: `translate(${jx}px, ${liftByAge}px) scale(${scaleByAge})`,
    color: FADE_GREY,
    fontSize: '1.05rem',
    zIndex: GENERATIONS - age,
  };
};

export default function AilaGreeting({ lang, heroPhase }: { lang: ExperienceLang; heroPhase: HeroPhase }) {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [enteredIndices, setEnteredIndices] = useState<ReadonlySet<number>>(new Set());
  const startedRef = useRef(false);
  const dismissRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (activeIndex < 0) return;
    const frame = requestAnimationFrame(() => {
      setEnteredIndices((prev) => (prev.has(activeIndex) ? prev : new Set(prev).add(activeIndex)));
    });
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  useEffect(() => {
    if (startedRef.current || heroPhase !== 'revealed') return;
    startedRef.current = true;

    const words = buildWords(heroGreeting[lang]);
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
        if (index >= words.length) { finish(); return; }
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
            : estimateSilentTotalMs(words);
          runSequence(distributeDurations(words, totalMs), token);
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
    runSequence(distributeDurations(words, estimateSilentTotalMs(words)), sequenceToken);

    return () => {
      mode = 'done';
      cleanupAll();
    };
  }, [heroPhase, lang]);

  if (!visible || activeIndex < 0) return null;

  const start = getFlightPathDraft().start;
  const words = buildWords(heroGreeting[lang]);
  const generations = Array.from({ length: GENERATIONS }, (_, age) => activeIndex - age).filter((i) => i >= 0);

  return (
    <div
      className={styles.ailaGreetingBubble}
      style={{ '--aila-greeting-x': `${start.x}vw`, '--aila-greeting-y': `${start.y}vh` } as CSSProperties}
      aria-live="polite"
    >
      <div className={styles.ailaGreetingWords}>
        {generations.map((wordIndex) => {
          const age = activeIndex - wordIndex;
          return (
            <div
              key={wordIndex}
              className={styles.ailaGreetingWord}
              style={wordStyle(wordIndex, age, enteredIndices.has(wordIndex))}
            >
              {displayWord(words[wordIndex])}
            </div>
          );
        })}
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
