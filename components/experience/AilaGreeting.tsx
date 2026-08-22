'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Volume2, X } from 'lucide-react';
import { heroGreeting, type ExperienceLang } from './content';
import styles from './experience.module.css';

type HeroPhase = 'loading' | 'ignition' | 'revealed';

const WORDS_PER_MINUTE = 128;
const MIN_WORD_MS = 620;
const MAX_WORD_MS = 1450;
const SENTENCE_PAUSE_MS = 340;

// A bare dash used as punctuation ("System – ein Blick") splits out as its
// own space-separated token but is never spoken as a word, so Whisper's
// transcription (used for real audio timing below) never produces one
// either - dropped here so the two word lists stay index-aligned.
const buildWords = (lines: readonly string[]) =>
  lines.flatMap((line) => line.split(' ')).filter((token) => token.length > 0 && !/^[–—-]+$/.test(token));

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

// Real per-word start/end timestamps (seconds) from transcribing the actual
// greeting audio with Whisper - see scripts/generate-aila-greeting-timing.mjs.
// Falls back to the char-weighted estimate above if this ever goes missing
// or its word count drifts from buildWords() (e.g. the greeting text changes
// without re-running that script).
type WordTiming = { word: string; start: number; end: number };

const MIN_REAL_WORD_MS = 90;

const loadGreetingTiming = (lang: ExperienceLang): Promise<WordTiming[] | null> =>
  fetch(`/cinematic/aila/greeting-${lang}-timing.json`)
    .then((response) => (response.ok ? response.json() : null))
    .then((data: unknown) => {
      const words = (data as { words?: unknown } | null)?.words;
      return Array.isArray(words) ? (words as WordTiming[]) : null;
    })
    .catch(() => null);

const buildRealDurations = (timing: WordTiming[], wordCount: number): { durations: number[]; leadInMs: number } | null => {
  if (timing.length !== wordCount || wordCount === 0) return null;
  const leadInMs = Math.max(0, timing[0].start * 1000);
  const durations = timing.map((entry, index) => {
    const nextStart = index < timing.length - 1 ? timing[index + 1].start : entry.end;
    return Math.max(MIN_REAL_WORD_MS, (nextStart - entry.start) * 1000);
  });
  return { durations, leadInMs };
};

const GENERATIONS = 6;
const GOLD = '#eecb7a';
const FADE_GREY = '#dcdcd4';

const MOBILE_QUERY = '(max-width: 1100px)';
// The desktop grab-surface's width at its default (non-hovered, non-scaled) resting size -
// the 1x baseline every other rendered head size is compared against.
const REFERENCE_HEAD_WIDTH = 168;
const MIN_ANCHOR_SCALE = .58;
const MAX_ANCHOR_SCALE = 1.5;

type Anchor = {
  /** Head's top-right corner - where the caption starts and grows from. */
  left: number;
  top: number;
  /** Head's bottom-left corner - the opposite side, where the controls dock
   *  so the head itself visually separates them from the moving text. */
  controlsLeft: number;
  controlsTop: number;
  scale: number;
};

const measureAnchor = (): Anchor => {
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  const el = document.querySelector<HTMLElement>(`[data-aila-entity="${isMobile ? 'mobile' : 'desktop'}"]`);
  const rect = el?.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    // AILA's head element isn't measurable yet (still mounting) - a sane
    // guess near its usual start position beats not showing anything.
    const left = window.innerWidth * .58;
    const top = window.innerHeight * .16;
    return { left, top, controlsLeft: left - 60, controlsTop: top + 60, scale: 1 };
  }
  const scale = Math.min(MAX_ANCHOR_SCALE, Math.max(MIN_ANCHOR_SCALE, rect.width / REFERENCE_HEAD_WIDTH));
  return { left: rect.right, top: rect.top, controlsLeft: rect.left, controlsTop: rect.bottom, scale };
};

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
  // Stays legible through most of the staircase and only actually fades
  // out in the last couple of steps (bottom-right), instead of dimming
  // right from the first step after entering.
  const fadeByAge = [0, .95, .85, .62, .3, 0][age] ?? 0;
  const blurByAge = [0, .3, .7, 1.6, 3.4, 6.5][age] ?? 6.5;
  const scaleByAge = [1, .97, .93, .87, .78, .68][age] ?? .68;
  // A gentle down-right staircase, close enough that consecutive steps can
  // slightly overlap rather than being spaced far apart - wide gaps read as
  // jerky jumps once real audio timing advances several steps within one
  // transition's duration. Further right than down.
  const driftDownByAge = [0, 9, 19, 31, 45, 62][age] ?? 62;
  const driftRightByAge = [0, 18, 38, 62, 90, 125][age] ?? 125;
  return {
    opacity: fadeByAge,
    filter: `blur(${blurByAge}px)`,
    transform: `translate(${jx + driftRightByAge}px, ${driftDownByAge}px) scale(${scaleByAge})`,
    color: FADE_GREY,
    fontSize: '1.05rem',
    zIndex: GENERATIONS - age,
  };
};

export default function AilaGreeting({ lang, heroPhase }: { lang: ExperienceLang; heroPhase: HeroPhase }) {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [enteredIndices, setEnteredIndices] = useState<ReadonlySet<number>>(new Set());
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const startedRef = useRef(false);
  const dismissRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (activeIndex < 0) return;
    const frame = requestAnimationFrame(() => {
      setEnteredIndices((prev) => (prev.has(activeIndex) ? prev : new Set(prev).add(activeIndex)));
    });
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  // Anchored to AILA's actual rendered head element (desktop entity or mobile
  // companion, whichever is live at the current breakpoint) rather than a
  // fixed offset, so the greeting stays glued to the head's top-right corner
  // and scales with it across mobile/tablet/desktop. Re-measured on scroll
  // too (rAF-throttled) since she keeps moving along the flight path while
  // speaking now instead of the greeting being cut short.
  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setAnchor(measureAnchor());
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('orientationchange', requestUpdate);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      window.removeEventListener('orientationchange', requestUpdate);
    };
  }, [visible]);

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
    // Fetched now (not on gesture) so it's ready the instant audio unlocks,
    // instead of adding fetch latency to the click-to-speaking response.
    const timingPromise = loadGreetingTiming(lang);

    const clearTimers = () => {
      if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = 0; }
    };

    const dispatchGuideState = (state: 'speaking' | 'idle') => {
      window.dispatchEvent(new CustomEvent('aila:guide-state', { detail: { state } }));
    };

    const cleanupAll = () => {
      clearTimers();
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

    const runSequence = (durations: number[], token: number, leadInMs = 0) => {
      const advance = (index: number) => {
        if (token !== sequenceToken || mode === 'done') return;
        if (index >= words.length) { finish(); return; }
        setActiveIndex(index);
        holdTimer = window.setTimeout(() => advance(index + 1), durations[index]);
      };
      if (leadInMs > 0) holdTimer = window.setTimeout(() => advance(0), leadInMs);
      else advance(0);
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
        setAudioUnlocked(true);
        sequenceToken += 1;
        const token = sequenceToken;
        clearTimers();
        dispatchGuideState('speaking');
        audio.addEventListener('ended', finish, { once: true });
        const applyRealTiming = () => {
          timingPromise.then((timing) => {
            if (token !== sequenceToken || mode === 'done') return;
            const real = timing && buildRealDurations(timing, words.length);
            if (real) {
              runSequence(real.durations, token, real.leadInMs);
              return;
            }
            const totalMs = Number.isFinite(audio.duration) && audio.duration > 0
              ? audio.duration * 1000
              : estimateSilentTotalMs(words);
            runSequence(distributeDurations(words, totalMs), token);
          });
        };
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          applyRealTiming();
        } else {
          audio.addEventListener('loadedmetadata', applyRealTiming, { once: true });
        }
      }).catch(() => undefined);
    };

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

  if (!visible || activeIndex < 0 || !anchor) return null;

  const words = buildWords(heroGreeting[lang]);
  const generations = Array.from({ length: GENERATIONS }, (_, age) => activeIndex - age).filter((i) => i >= 0);
  const gap = 12 * anchor.scale;
  const lift = 20 * anchor.scale;

  return (
    <>
      <div
        className={styles.ailaGreetingBubble}
        style={{
          left: `${anchor.left + gap}px`,
          top: `${anchor.top - lift}px`,
          '--aila-greeting-scale': anchor.scale,
        } as CSSProperties}
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
      </div>
      <div
        className={styles.ailaGreetingControls}
        style={{
          left: `${anchor.controlsLeft - 6 * anchor.scale}px`,
          top: `${anchor.controlsTop + 8 * anchor.scale}px`,
        } as CSSProperties}
      >
        {!audioUnlocked && (
          <div className={styles.ailaGreetingSoundHint}>
            <Volume2 size={11} strokeWidth={2.4} />
            <span>{lang === 'de' ? 'Ton' : 'Sound'}</span>
          </div>
        )}
        <button
          type="button"
          className={styles.ailaGreetingDismiss}
          onClick={(event) => { event.stopPropagation(); dismissRef.current(); }}
          aria-label={lang === 'de' ? 'Begrüssung schliessen' : 'Dismiss greeting'}
        >
          <X size={12} strokeWidth={2.2} color="#e7c56a" />
        </button>
      </div>
    </>
  );
}
