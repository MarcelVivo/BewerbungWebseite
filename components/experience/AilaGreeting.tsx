'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { heroGreeting, type ExperienceLang } from './content';
import { getFlightPathDraft } from './flightPathStore';
import styles from './experience.module.css';

type HeroPhase = 'loading' | 'ignition' | 'revealed';
type WordPhase = 'enter' | 'exit';

const WORDS_PER_MINUTE = 145;
const WORD_EXIT_MS = 300;
const MIN_WORD_MS = 420;
const MAX_WORD_MS = 1500;
const SENTENCE_PAUSE_MS = 260;

const sessionKey = (lang: ExperienceLang) => `ms-aila-greeting-${lang}`;

const alreadyShown = (lang: ExperienceLang) => {
  try {
    return window.sessionStorage.getItem(sessionKey(lang)) === '1';
  } catch {
    return false;
  }
};

const markShown = (lang: ExperienceLang) => {
  try {
    window.sessionStorage.setItem(sessionKey(lang), '1');
  } catch {
    // ignore
  }
};

const buildWords = (lines: readonly string[]) => lines.flatMap((line) => line.split(' ').filter(Boolean));

const distributeDurations = (words: readonly string[], totalMs: number) => {
  const totalChars = words.reduce((sum, word) => sum + word.length, 0) || 1;
  return words.map((word) => {
    const share = Math.min(MAX_WORD_MS, Math.max(MIN_WORD_MS, (word.length / totalChars) * totalMs));
    return /[.!?—]$/.test(word) ? share + SENTENCE_PAUSE_MS : share;
  });
};

const estimateSilentTotalMs = (words: readonly string[]) =>
  Math.max(words.length * MIN_WORD_MS, (words.length / WORDS_PER_MINUTE) * 60_000);

export default function AilaGreeting({ lang, heroPhase }: { lang: ExperienceLang; heroPhase: HeroPhase }) {
  const [visible, setVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(-1);
  const [wordPhase, setWordPhase] = useState<WordPhase>('enter');
  const startedRef = useRef(false);
  const dismissRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (startedRef.current || heroPhase !== 'revealed' || alreadyShown(lang)) return;
    startedRef.current = true;

    const words = buildWords(heroGreeting[lang]);
    let mode: 'silent' | 'audio' | 'done' = 'silent';
    let holdTimer = 0;
    let exitTimer = 0;
    let sequenceToken = 0;

    const audio = new Audio(`/cinematic/aila/greeting-${lang}.mp3`);
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');

    const clearTimers = () => {
      if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = 0; }
      if (exitTimer) { window.clearTimeout(exitTimer); exitTimer = 0; }
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
      setWordIndex(-1);
      markShown(lang);
    };
    dismissRef.current = finish;

    const runSequence = (durations: number[], token: number) => {
      const advance = (index: number) => {
        if (token !== sequenceToken || mode === 'done') return;
        if (index >= words.length) { finish(); return; }
        setWordIndex(index);
        setWordPhase('enter');
        holdTimer = window.setTimeout(() => {
          if (token !== sequenceToken || mode === 'done') return;
          setWordPhase('exit');
          exitTimer = window.setTimeout(() => advance(index + 1), WORD_EXIT_MS);
        }, durations[index]);
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

  // Stable per-word floating jitter: recomputed only when the word itself changes,
  // so it doesn't reshuffle on unrelated re-renders while the word is on screen.
  const jitter = useMemo(() => ({
    left: 14 + Math.random() * 60,
    top: 12 + Math.random() * 58,
    rot: (Math.random() - 0.5) * 7,
  }), [wordIndex]);

  if (!visible || wordIndex < 0) return null;

  const start = getFlightPathDraft().start;
  const words = buildWords(heroGreeting[lang]);

  return (
    <div
      className={styles.ailaGreetingBubble}
      style={{ '--aila-greeting-x': `${start.x}vw`, '--aila-greeting-y': `${start.y}vh` } as CSSProperties}
      aria-live="polite"
    >
      <span
        key={wordIndex}
        className={styles.ailaGreetingWord}
        data-phase={wordPhase}
        style={{ left: `${jitter.left}%`, top: `${jitter.top}%`, '--word-rot': `${jitter.rot}deg` } as CSSProperties}
      >
        {words[wordIndex]}
      </span>
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
