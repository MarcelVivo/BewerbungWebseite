export const FLAP_SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';

export type FlapLetter = {
  wrap: HTMLSpanElement;
  glyph: HTMLSpanElement;
  target: string;
  mode: 'spin' | 'settle';
  running: boolean;
};

function appendFlapLetter(parent: HTMLElement, character: string, letters: FlapLetter[]): void {
  const wrap = document.createElement('span');
  wrap.className = 'intro-flap-letter';
  const glyph = document.createElement('span');
  glyph.className = 'intro-flap-glyph';
  glyph.textContent = character;
  wrap.appendChild(glyph);
  parent.appendChild(wrap);
  letters.push({ wrap, glyph, target: character, mode: 'spin', running: false });
}

// Letters used to be appended flat, one flex item per character. Combined
// with .intro-flap-word's `display:flex` (nowrap by default), that gave the
// browser no valid line-break point at all — long headings simply overflowed
// and got clipped by the page's overflow-x:hidden on narrow viewports (e.g.
// the /anfrage hero title). Grouping each word's letters into their own
// inline-flex wrapper lets .intro-flap-word turn on flex-wrap: the word
// group wraps as a single unit at spaces, exactly like normal text, while
// each letter inside it stays individually animatable.
export function buildFlapWord(container: HTMLElement, text: string): FlapLetter[] {
  container.innerHTML = '';
  const letters: FlapLetter[] = [];
  const words = text.split(' ');

  words.forEach((word, wordIndex) => {
    if (word.length > 0) {
      const wordGroup = document.createElement('span');
      wordGroup.className = 'intro-flap-word-group';
      for (const character of word) appendFlapLetter(wordGroup, character, letters);
      container.appendChild(wordGroup);
    }
    if (wordIndex < words.length - 1) appendFlapLetter(container, ' ', letters);
  });

  return letters;
}

function startFlapLetter(letter: FlapLetter, reduced: boolean) {
  if (!FLAP_SCRAMBLE_CHARS.includes(letter.target)) return;
  if (reduced) {
    letter.glyph.textContent = letter.target;
    return;
  }
  if (letter.running) return;
  letter.running = true;

  const flipMs = 55 + Math.random() * 45;
  const gapMs = () => 70 + Math.random() * 150;

  function tick() {
    if (letter.mode === 'settle') {
      letter.glyph.style.transition = `transform ${flipMs.toFixed(0)}ms cubic-bezier(.5,0,.85,.35)`;
      letter.glyph.style.transform = 'scaleY(0.05)';
      window.setTimeout(() => {
        letter.glyph.textContent = letter.target;
        letter.glyph.style.transition = `transform ${flipMs.toFixed(0)}ms cubic-bezier(.2,.7,.4,1)`;
        letter.glyph.style.transform = 'scaleY(1)';
        letter.running = false;
      }, flipMs);
      return;
    }
    const nextCharacter = FLAP_SCRAMBLE_CHARS[Math.floor(Math.random() * FLAP_SCRAMBLE_CHARS.length)];
    letter.glyph.style.transition = `transform ${flipMs.toFixed(0)}ms cubic-bezier(.5,0,.85,.35)`;
    letter.glyph.style.transform = 'rotateX(90deg)';
    window.setTimeout(() => {
      letter.glyph.textContent = nextCharacter;
      letter.glyph.style.transition = `transform ${flipMs.toFixed(0)}ms cubic-bezier(.2,.7,.4,1)`;
      letter.glyph.style.transform = 'scaleY(1)';
      window.setTimeout(tick, gapMs());
    }, flipMs);
  }

  tick();
}

export function setFlapWordMode(letters: FlapLetter[], mode: 'spin' | 'settle', reduced: boolean) {
  letters.forEach((letter) => {
    letter.mode = mode;
    if (mode === 'spin' && !letter.running) startFlapLetter(letter, reduced);
  });
}
