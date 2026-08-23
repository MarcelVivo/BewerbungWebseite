'use client';

import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { Volume2, X } from 'lucide-react';
import { heroGreeting, heroGreetingReturnVariants, heroGreetingAboutVariants, heroGreetingContactVariants, type ExperienceLang } from './content';
import { attachAilaAudioLevel } from './ailaAudioLevel';
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

const loadGreetingTiming = (url: string): Promise<WordTiming[] | null> =>
  fetch(url)
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

// Several distinct sequences share the same rendering/audio/timing pipeline:
// the one-time welcome on page load, and short nudges replayed every time a
// visitor's scroll settles AILA back at the hero, "about" or "contact"
// stations. The latter three each cycle through several text variants (see
// content.ts) so she doesn't repeat herself verbatim every time - variant 0
// keeps the original unsuffixed filenames, further variants add a
// "-2"/"-3"/... suffix. Both audio and timing assets are pre-generated per
// kind+variant - see scripts/generate-aila-greeting-audio.mjs and
// scripts/generate-aila-greeting-timing.mjs.
type GreetingKind = 'welcome' | 'return' | 'about' | 'contact';

const GREETING_FILE_BASE: Record<GreetingKind, string> = {
  welcome: 'greeting',
  return: 'greeting-return',
  about: 'greeting-about',
  contact: 'greeting-contact',
};

const variantSuffix = (variant: number) => (variant > 0 ? `-${variant + 1}` : '');

const greetingAudioSrc = (kind: GreetingKind, lang: ExperienceLang, variant: number) =>
  `/cinematic/aila/${GREETING_FILE_BASE[kind]}${variantSuffix(variant)}-${lang}.mp3`;

const greetingTimingSrc = (kind: GreetingKind, lang: ExperienceLang, variant: number) =>
  `/cinematic/aila/${GREETING_FILE_BASE[kind]}${variantSuffix(variant)}-${lang}-timing.json`;

// Sampled from AILA's own head - the bright gold rim/light-strand tips for
// the regular tone, the warm copper wire-pattern/mouth-glow for her name.
const GOLD = '#d1a24e';
const COPPER_GOLD = '#c2692e';

const MOBILE_QUERY = '(max-width: 1100px)';
// The desktop grab-surface's width at its default (non-hovered, non-scaled) resting size -
// the 1x baseline every other rendered head size is compared against.
const REFERENCE_HEAD_WIDTH = 168;
const MIN_ANCHOR_SCALE = .58;
const MAX_ANCHOR_SCALE = 1.5;

type Anchor = {
  /** Where the caption starts and grows rightward from - the head's
   *  top-right corner on desktop, but its top-left on mobile (see below). */
  left: number;
  top: number;
  /** Head's bottom-left corner - the opposite side, where the controls dock
   *  so the head itself visually separates them from the moving text. */
  controlsLeft: number;
  controlsTop: number;
  scale: number;
  isMobile: boolean;
};

// On mobile the caption's left margin comes from the current section's
// eyebrow line (e.g. "... · BERN, SCHWEIZ" in the hero, "UEBER MICH" in the
// about section) rather than the head, which sits centered in a narrow
// viewport - its own left edge still isn't as far left as the page's real
// content margin. Every section has its own .eyebrow element, so this picks
// whichever one is actually on screen right now instead of always the
// hero's (relevant once greetings can also play at the about/contact
// docking stations, further down the page).
const mobileEyebrowRect = (): DOMRect | null => {
  const eyebrows = document.querySelectorAll<HTMLElement>(`.${styles.eyebrow}`);
  for (const eyebrow of eyebrows) {
    const rect = eyebrow.getBoundingClientRect();
    if (rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight) return rect;
  }
  return null;
};

// The controls dock right under the app bar/nav instead of at the head
// (straight below her chin isn't a natural spot) or the eyebrow row (too
// close to the head's own clickable area - a click there could pass
// through to the AILA-companion button underneath and open the chat,
// which isn't what tapping "sound on" should do).
const mobileHeaderRect = (): DOMRect | null => {
  const header = document.querySelector<HTMLElement>(`.${styles.mobileAppBar}`);
  const rect = header?.getBoundingClientRect();
  return rect && rect.width > 0 ? rect : null;
};

// On desktop the controls dock at a fixed horizontal spot - above roughly
// where "Unternehmen" ends in the hero heading's first line - rather than
// off the head, per an explicit request; only the horizontal position
// comes from this, the vertical stays the same head-relative height as
// before.
const desktopTitleLineRight = (): number | null => {
  const titleLine = document.querySelector<HTMLElement>(`.${styles.heroTitle} span`);
  const rect = titleLine?.getBoundingClientRect();
  return rect && rect.width > 0 ? rect.left + rect.width * .87 : null;
};

const measureAnchor = (): Anchor => {
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  const el = document.querySelector<HTMLElement>(`[data-aila-entity="${isMobile ? 'mobile' : 'desktop'}"]`);
  const rect = el?.getBoundingClientRect();
  const eyebrowRect = isMobile ? mobileEyebrowRect() : null;
  const headerRect = isMobile ? mobileHeaderRect() : null;
  const desktopControlsLeft = isMobile ? null : desktopTitleLineRight();
  // The controls dock is pinned by its own bottom-right corner (see the
  // translateY/translateX(-100%) applied where this is used), so this point
  // is where its bottom edge sits - just above the eyebrow row if that's
  // measurable, else just below the app bar - never inside either.
  const controlsAnchor = eyebrowRect
    ? { left: eyebrowRect.right, top: eyebrowRect.top - 6 }
    : headerRect
      ? { left: headerRect.right, top: headerRect.bottom + 34 }
      : null;
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    // AILA's head element isn't measurable yet (still mounting) - a sane
    // guess near its usual start position beats not showing anything.
    const left = eyebrowRect?.left ?? window.innerWidth * .58;
    const top = window.innerHeight * .16;
    return { left, top, controlsLeft: controlsAnchor?.left ?? desktopControlsLeft ?? left - 60, controlsTop: controlsAnchor?.top ?? top + 60, scale: 1, isMobile };
  }
  const scale = Math.min(MAX_ANCHOR_SCALE, Math.max(MIN_ANCHOR_SCALE, rect.width / REFERENCE_HEAD_WIDTH));
  // On mobile the caption's left margin comes from the eyebrow line, the
  // controls from the app bar - the head sits centered in a narrow
  // viewport (its own left edge still isn't as far left as the page's real
  // content margin, and straight below her chin isn't a natural spot for
  // the controls).
  const left = isMobile ? (eyebrowRect?.left ?? rect.left) : rect.right;
  return {
    left,
    top: rect.top,
    controlsLeft: controlsAnchor?.left ?? desktopControlsLeft ?? rect.left,
    controlsTop: controlsAnchor?.top ?? rect.bottom,
    scale,
    isMobile,
  };
};

// Deterministic per-word pseudo-random so a word's sideways drift stays put
// across re-renders instead of jittering every tick.
const jitterPx = (index: number) => {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  return ((x - Math.floor(x)) * 2 - 1) * 7;
};

// The fade-out is a fixed-duration CSS keyframe animation (see
// ailaWordDethrone in experience.module.css), triggered once via the
// [data-dethroned] attribute and then left to run completely on its own -
// unlike the earlier age-bucket approach, it is not re-paced by how fast
// further words keep becoming current. This function only ever supplies the
// *resting* state (pre-entrance or "currently the active word") plus the
// per-word jitter custom property the keyframes read from; once dethroned,
// the keyframe animation owns opacity/filter/transform/color/font-size
// entirely, so none of those are set here for that case.
// AILA's own name gets its own copper-gold accent instead of the regular
// gold every other word uses, both for the resting/current state below and
// (via the --word-gold custom property) the dethrone keyframe's start color.
const isAilaWord = (word: string) => displayWord(word).toUpperCase() === 'AILA';

const GOLD_GRADIENT = 'var(--gold-gradient)';
// A copper-toned mirror of that same gradient (#F6E3A1 -> #E7C56A -> #C89A3D
// -> #B8862B -> #7C5A1A), for AILA's own name.
const COPPER_GRADIENT = 'linear-gradient(135deg, #f0b978 0%, #d9823f 22%, #c2692e 48%, #a3491f 74%, #6e2f12 100%)';

// Every word reads as a small gradient wordmark while active rather than a
// flat solid color - regular words in gold, "AILA" in copper with wider
// tracking so her name still stands apart from the rest. Gradients can't be
// smoothly color-animated though, so this only applies pre-dethrone; once
// fading out, everything falls back to the same solid-color keyframe (via
// --word-gold).
const gradientTextStyle = (gradient: string, letterSpacing?: string): CSSProperties => ({
  backgroundImage: gradient,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  ...(letterSpacing ? { letterSpacing } : {}),
});

const wordStyle = (wordIndex: number, word: string, dethroned: boolean, entered: boolean): CSSProperties => {
  const jx = jitterPx(wordIndex);
  const isAila = isAilaWord(word);
  const tone = isAila ? COPPER_GOLD : GOLD;
  const gradient = isAila ? COPPER_GRADIENT : GOLD_GRADIENT;
  // --word-gradient lets the dethrone keyframe open on the exact same
  // gradient-clip look the word had a moment before, instead of hard-cutting
  // to a flat solid color right at the handoff from this inline style to
  // the CSS animation - that cut was reading as the word "restarting".
  const base = { '--jx': `${jx}px`, '--word-gold': tone, '--word-gradient': gradient, zIndex: wordIndex + 1 } as CSSProperties;
  if (dethroned) return base;
  const wordmark = gradientTextStyle(gradient, isAila ? '.08em' : undefined);
  if (!entered) {
    return {
      ...base,
      ...wordmark,
      opacity: 0,
      filter: 'blur(7px)',
      transform: `translate(${jx}px, 8px) scale(.88)`,
      fontSize: '1.37rem',
    };
  }
  return {
    ...base,
    ...wordmark,
    opacity: 1,
    filter: 'blur(0px)',
    transform: `translate(${jx}px, 0) scale(1)`,
    fontSize: '1.37rem',
  };
};

type SequenceHandles = {
  setVisible: (value: boolean) => void;
  setActiveIndex: (value: number) => void;
  setEnteredIndices: Dispatch<SetStateAction<ReadonlySet<number>>>;
  // Whether *this* sequence currently has working audio - reset to false
  // at the start of every sequence and drives the "Ton an" hint's
  // visibility, so it correctly reappears if a later sequence's no-gesture
  // autoplay attempt gets silently rejected (a real, not-uncommon
  // possibility - browsers don't uniformly honor "unlocked once this
  // session" forever). Distinct from markEverUnlocked below.
  setAudioUnlocked: (value: boolean) => void;
  // Persists for the rest of the page's lifetime once audio has played
  // successfully at least once - read back as `initiallyUnlocked` by later
  // sequences to decide whether to attempt playing immediately without
  // waiting for a fresh gesture.
  markEverUnlocked: () => void;
  setActiveWords: (value: string[]) => void;
  dismissRef: MutableRefObject<() => void>;
  unlockRef: MutableRefObject<() => void>;
};

// Runs one full greeting sequence (silent char-paced captions until a real
// gesture unlocks audio, then real Whisper-timed captions synced to it) and
// returns a stop function. Shared by both the one-time welcome sequence and
// the "return to hero" nudge - the two only differ in which words/audio/timing
// assets they use, everything else about how a greeting plays is identical.

// The video AILA switches to for the 'speaking' mode (see AilaVideoAvatar.tsx
// and ScrollEntity.tsx) only starts loading once that mode switch actually
// happens - right as her audio starts - so on a fresh page load the browser
// is still fetching/decoding it for a moment while the audio is already
// playing, and her mouth-glow only starts once that catches up partway
// through the first sentence. Warmed into the HTTP cache the instant any
// sequence begins (well before the audio itself is unlocked/started) so
// it's normally already there by the time the mode switch needs it.
let speakingVideoWarmed = false;
const warmSpeakingVideo = () => {
  if (speakingVideoWarmed) return;
  speakingVideoWarmed = true;
  fetch('/cinematic/aila/aila-speaking-v1-greenscreen.mp4', { cache: 'force-cache' }).catch(() => undefined);
};

const startGreetingSequence = (
  words: string[],
  audioSrc: string,
  timingUrl: string,
  handles: SequenceHandles,
  initiallyUnlocked: boolean,
): (() => void) => {
  const { setVisible, setActiveIndex, setEnteredIndices, setAudioUnlocked, markEverUnlocked, setActiveWords, dismissRef, unlockRef } = handles;
  // A previous sequence may have left this true - a fresh sequence hasn't
  // proven its own audio works yet, so the "Ton an" hint should be able to
  // reappear for it if needed (see setAudioUnlocked's doc comment above).
  setAudioUnlocked(false);
  warmSpeakingVideo();
  let mode: 'silent' | 'audio' | 'done' = 'silent';
  let holdTimer = 0;
  let sequenceToken = 0;
  let detachAudioLevel = () => undefined as void;

  const audio = new Audio(audioSrc);
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  // Fetched now (not on gesture) so it's ready the instant audio unlocks,
  // instead of adding fetch latency to the click-to-speaking response.
  const timingPromise = loadGreetingTiming(timingUrl);

  const clearTimers = () => {
    if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = 0; }
  };

  const dispatchGuideState = (state: 'speaking' | 'idle') => {
    window.dispatchEvent(new CustomEvent('aila:guide-state', { detail: { state } }));
  };

  const cleanupAll = () => {
    clearTimers();
    detachAudioLevel();
    window.removeEventListener('aila:guide-open-change', handleGuideOpen);
    window.removeEventListener('click', handleGesture);
    window.removeEventListener('touchstart', handleGesture);
    window.removeEventListener('touchend', handleGesture);
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

  // Natural completion (last word spoken, audio ended) shouldn't yank the
  // whole caption away instantly - the last word deserves the same fade
  // every earlier word gets once superseded (ailaWordDethrone, 4.5s CSS
  // animation), not an abrupt cut mid-glow. Setting activeIndex one past
  // the last word index marks every word - including the last - as
  // dethroned via the existing `wordIndex < activeIndex` check in the
  // render below, then finish() itself is delayed until that animation has
  // had time to play out. Manual dismissal (the X button, or the mobile
  // stage-change guard) intentionally skips this and calls finish()
  // directly - the visitor asked for it to go now.
  //
  // dispatchGuideState('idle') fires here immediately, not delayed with the
  // rest of finish() - that event is what switches AILA's video out of
  // "speaking" mode (mouth motion), and audio has genuinely stopped by the
  // time this runs (natural completion only ever happens via the audio's
  // own 'ended' event or the last word's own duration elapsing). Leaving it
  // inside the delayed finish() kept her video mouth animating for the
  // entire 4.5s text fade after the sound had already ended. finish()
  // redispatches 'idle' again once it actually runs, which is a harmless
  // no-op transition.
  let finishing = false;
  const beginFinish = () => {
    if (finishing || mode === 'done') return;
    finishing = true;
    clearTimers();
    dispatchGuideState('idle');
    setActiveIndex(words.length);
    holdTimer = window.setTimeout(finish, 4500);
  };

  // Opening the chat while this sequence is only silently pacing (no real
  // gesture has unlocked its audio yet) cuts it off immediately - the same
  // click that opened the chat would otherwise also satisfy this
  // sequence's own gesture listener below, unlocking its audio at the same
  // moment the chat starts speaking its own welcome. Once real audio is
  // actually playing (mode === 'audio'), that race can't happen - let her
  // finish that sentence uninterrupted instead; AilaGuide.tsx waits for the
  // resulting 'idle' aila:guide-state before speaking its own welcome.
  const handleGuideOpen = (event: Event) => {
    if ((event as CustomEvent<{ open?: boolean }>).detail?.open && mode !== 'audio') finish();
  };

  const runSequence = (durations: number[], token: number, leadInMs = 0) => {
    const advance = (index: number) => {
      if (token !== sequenceToken || mode === 'done') return;
      if (index >= words.length) { beginFinish(); return; }
      setActiveIndex(index);
      holdTimer = window.setTimeout(() => advance(index + 1), durations[index]);
    };
    if (leadInMs > 0) holdTimer = window.setTimeout(() => advance(0), leadInMs);
    else advance(0);
  };

  // Shared by both the real-gesture path (handleGesture below) and the
  // no-gesture autoplay attempt made when a previous sequence already
  // unlocked audio this session (see initiallyUnlocked) - browsers that have
  // seen one real user-gesture-triggered play() on the page generally allow
  // further JS-initiated play() calls without a fresh gesture. Does not
  // touch the gesture listeners itself; the caller decides when those are
  // no longer needed.
  const attemptPlay = () => {
    if (mode !== 'silent') return;
    window.dispatchEvent(new Event('aila:prime-audio'));
    audio.play().then(() => {
      if (mode !== 'silent') { audio.pause(); return; }
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('touchend', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      mode = 'audio';
      setAudioUnlocked(true);
      markEverUnlocked();
      detachAudioLevel = attachAilaAudioLevel(audio);
      sequenceToken += 1;
      const token = sequenceToken;
      clearTimers();
      dispatchGuideState('speaking');
      audio.addEventListener('ended', beginFinish, { once: true });
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

  const handleGesture = () => {
    window.removeEventListener('click', handleGesture);
    window.removeEventListener('touchstart', handleGesture);
    window.removeEventListener('touchend', handleGesture);
    window.removeEventListener('keydown', handleGesture);
    attemptPlay();
  };
  unlockRef.current = handleGesture;

  window.addEventListener('aila:guide-open-change', handleGuideOpen);
  window.addEventListener('click', handleGesture);
  window.addEventListener('touchstart', handleGesture);
  // iOS Safari has, across versions, been inconsistent about which touch
  // event actually carries "user activation" for HTMLMediaElement.play() -
  // touchstart alone isn't reliably enough there (this is why a real iPhone
  // tap/scroll still left AILA silent even though touchstart is registered
  // above and works fine on every other engine tested). touchend is the
  // other commonly-required one; keeping both covers the actual range of
  // iOS Safari behavior instead of guessing which single event is "right".
  window.addEventListener('touchend', handleGesture);
  window.addEventListener('keydown', handleGesture);

  setActiveWords(words);
  setEnteredIndices(new Set());
  setVisible(true);
  runSequence(distributeDurations(words, estimateSilentTotalMs(words)), sequenceToken);

  // A previous sequence in this session already turned an explicit gesture
  // into a successful audio.play() - browsers treat that as durable
  // permission for the rest of the page's lifetime, so this sequence can
  // just start talking immediately instead of asking the visitor to
  // re-unlock sound for every replay. Falls back to the gesture listeners
  // above (still registered) if this particular attempt is rejected.
  if (initiallyUnlocked) attemptPlay();

  return () => {
    mode = 'done';
    cleanupAll();
  };
};

export default function AilaGreeting({
  lang,
  heroPhase,
  returnTrigger,
  aboutTrigger,
  contactTrigger,
}: {
  lang: ExperienceLang;
  heroPhase: HeroPhase;
  returnTrigger: number;
  aboutTrigger: number;
  contactTrigger: number;
}) {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [enteredIndices, setEnteredIndices] = useState<ReadonlySet<number>>(new Set());
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [activeWords, setActiveWords] = useState<string[]>([]);
  const startedRef = useRef(false);
  const dismissRef = useRef<() => void>(() => undefined);
  const unlockRef = useRef<() => void>(() => undefined);
  const stopSequenceRef = useRef<() => void>(() => undefined);
  const langRef = useRef(lang);
  const lastReturnTriggerRef = useRef(returnTrigger);
  const lastAboutTriggerRef = useRef(aboutTrigger);
  const lastContactTriggerRef = useRef(contactTrigger);
  // Cycle through each station's text variants (see content.ts) instead of
  // always playing the first one, so she doesn't repeat herself verbatim
  // every time a visitor leaves and returns to the same station.
  const returnVariantRef = useRef(0);
  const aboutVariantRef = useRef(0);
  const contactVariantRef = useRef(0);
  // True forever once ANY sequence's audio has actually played - read as
  // `initiallyUnlocked` by later sequences to decide whether to attempt
  // playing immediately without a fresh gesture. Deliberately not the same
  // thing as the `audioUnlocked` state below: that one is reset per
  // sequence and drives the "Ton an" hint, so it can come back if a later
  // no-gesture autoplay attempt gets silently rejected - browsers don't
  // uniformly honor "unlocked once this session" forever, and previously
  // there was no way to recover the hint once audioUnlocked ever went true,
  // which read as AILA randomly staying silent with no visible cause.
  const everUnlockedRef = useRef(false);
  // Mirrors `visible` in a ref so the trigger effects can check "is she
  // still mid-sentence right now" without a stale closure - if a visitor
  // floats from one station into the next while she's still finishing the
  // previous one, the new station's request is simply dropped instead of
  // cutting her off. Deliberately not queued for later either: a visitor
  // scrolling quickly through several stations while she's still busy would
  // otherwise pile all of them up to play back-to-back once she's free,
  // long after the visitor has scrolled elsewhere - a disconnected,
  // non-stop monologue completely unrelated to where they actually are.
  const isPlayingRef = useRef(false);
  langRef.current = lang;

  const handles = {
    setVisible,
    setActiveIndex,
    setEnteredIndices,
    setAudioUnlocked,
    markEverUnlocked: () => { everUnlockedRef.current = true; },
    setActiveWords,
    dismissRef,
    unlockRef,
  };

  const playSequence = (words: string[], audioSrc: string, timingSrc: string) => {
    stopSequenceRef.current();
    window.dispatchEvent(new CustomEvent('aila:guide-state', { detail: { state: 'idle' } }));
    stopSequenceRef.current = startGreetingSequence(words, audioSrc, timingSrc, handles, everUnlockedRef.current);
  };

  const requestSequence = (words: string[], audioSrc: string, timingSrc: string) => {
    if (isPlayingRef.current) return;
    playSequence(words, audioSrc, timingSrc);
  };

  useEffect(() => {
    isPlayingRef.current = visible;
  }, [visible]);

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
      // Every sequence runs to completion regardless of where the visitor
      // scrolls to meanwhile, on both mobile and desktop - the caption
      // keeps tracking wherever she currently is via measureAnchor() below.
      // Welcome/return used to be dismissed the instant mobile's
      // MobileAilaCompanion stage moved away from 'hero' (she'd otherwise
      // look broken pinned next to her now-icon-sized nav-dock self), but
      // even a small, early scroll flips that stage - cutting the one-time
      // welcome off mid-sentence just because the visitor started scrolling
      // a little before she'd finished. Same call already made for
      // about/contact: finishing the sentence matters more than avoiding
      // that visual mismatch in the rarer case where it actually happens.
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

  // One-time welcome sequence, triggered the moment the hero has finished
  // revealing on page load.
  useEffect(() => {
    if (startedRef.current || heroPhase !== 'revealed') return;
    startedRef.current = true;
    const words = buildWords(heroGreeting[langRef.current]);
    playSequence(words, greetingAudioSrc('welcome', langRef.current, 0), greetingTimingSrc('welcome', langRef.current, 0));
  }, [heroPhase]);

  // Short "need help?" nudge, replayed every time MarcelExperience detects
  // the visitor scrolled well past the hero and then back up to it -
  // signalled by returnTrigger incrementing. Never fires before the welcome
  // sequence has at least started once.
  useEffect(() => {
    if (returnTrigger === lastReturnTriggerRef.current) return;
    lastReturnTriggerRef.current = returnTrigger;
    if (!startedRef.current) return;
    const variant = returnVariantRef.current % heroGreetingReturnVariants.length;
    returnVariantRef.current += 1;
    const words = buildWords(heroGreetingReturnVariants[variant][langRef.current]);
    requestSequence(words, greetingAudioSrc('return', langRef.current, variant), greetingTimingSrc('return', langRef.current, variant));
  }, [returnTrigger]);

  // Nudge replayed every time AILA's scroll-docking settles her at the
  // "about" station (journey-about) again, after having left it -
  // signalled by aboutTrigger incrementing from MarcelExperience.
  useEffect(() => {
    if (aboutTrigger === lastAboutTriggerRef.current) return;
    lastAboutTriggerRef.current = aboutTrigger;
    if (!startedRef.current) return;
    const variant = aboutVariantRef.current % heroGreetingAboutVariants.length;
    aboutVariantRef.current += 1;
    const words = buildWords(heroGreetingAboutVariants[variant][langRef.current]);
    requestSequence(words, greetingAudioSrc('about', langRef.current, variant), greetingTimingSrc('about', langRef.current, variant));
  }, [aboutTrigger]);

  // Nudge replayed every time AILA's scroll-docking settles her at the
  // "contact" station (journey-contact) again, after having left it -
  // signalled by contactTrigger incrementing from MarcelExperience.
  useEffect(() => {
    if (contactTrigger === lastContactTriggerRef.current) return;
    lastContactTriggerRef.current = contactTrigger;
    if (!startedRef.current) return;
    const variant = contactVariantRef.current % heroGreetingContactVariants.length;
    contactVariantRef.current += 1;
    const words = buildWords(heroGreetingContactVariants[variant][langRef.current]);
    requestSequence(words, greetingAudioSrc('contact', langRef.current, variant), greetingTimingSrc('contact', langRef.current, variant));
  }, [contactTrigger]);

  useEffect(() => () => stopSequenceRef.current(), []);

  if (!visible || activeIndex < 0 || !anchor) return null;

  const words = activeWords;
  const gap = 12 * anchor.scale;
  const lift = (anchor.isMobile ? 12 : 20) * anchor.scale;

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
          {words.slice(0, activeIndex + 1).map((word, wordIndex) => {
            const dethroned = wordIndex < activeIndex;
            return (
              <div
                key={wordIndex}
                className={styles.ailaGreetingWord}
                data-dethroned={dethroned ? 'true' : undefined}
                data-aila-name={isAilaWord(word) ? 'true' : undefined}
                style={wordStyle(wordIndex, word, dethroned, enteredIndices.has(wordIndex))}
              >
                {displayWord(word)}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className={styles.ailaGreetingControls}
        style={
          anchor.isMobile
            // Pinned by its own bottom-right corner (not top-left) to a
            // point just above the eyebrow row, so it can never overlap
            // that text regardless of the controls' own rendered height -
            // no need to measure it, translateY(-100%) does that for free.
            ? { left: `${anchor.controlsLeft}px`, top: `${anchor.controlsTop}px`, transform: 'translate(-100%, -100%)' } as CSSProperties
            : { left: `${anchor.controlsLeft - 6 * anchor.scale}px`, top: `${anchor.controlsTop + 8 * anchor.scale}px` } as CSSProperties
        }
      >
        {!audioUnlocked && (
          <button
            type="button"
            className={styles.ailaGreetingSoundHint}
            // Handles the unlock directly instead of relying on the click
            // bubbling to the window-level listener that normally does it -
            // stopPropagation here guarantees nothing else on the page
            // (e.g. AILA's own avatar button, if it happens to sit
            // underneath) can also react to this same click. Also stopped on
            // touchstart itself (not just the later click) since that is
            // what actually reaches the window-level gesture listener first
            // on touch devices.
            onTouchStart={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); unlockRef.current(); }}
            aria-label={lang === 'de' ? 'Ton einschalten' : 'Turn sound on'}
          >
            <Volume2 size={11} strokeWidth={2.4} />
            <span>{lang === 'de' ? 'Ton' : 'Sound'}</span>
          </button>
        )}
        <button
          type="button"
          className={styles.ailaGreetingDismiss}
          onTouchStart={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); dismissRef.current(); }}
          aria-label={lang === 'de' ? 'Begrüssung schliessen' : 'Dismiss greeting'}
        >
          <X size={12} strokeWidth={2.2} color="#e7c56a" />
        </button>
      </div>
    </>
  );
}
