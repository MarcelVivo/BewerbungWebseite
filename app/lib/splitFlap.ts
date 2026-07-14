export const FLAP_SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';

export type FlapLetter = {
  wrap: HTMLSpanElement;
  glyph: HTMLSpanElement;
  target: string;
  mode: 'spin' | 'settle';
  running: boolean;
};

export function buildFlapWord(container: HTMLElement, text: string): FlapLetter[] {
  container.innerHTML = '';
  const letters: FlapLetter[] = [];
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    const wrap = document.createElement('span');
    wrap.className = 'intro-flap-letter';
    const glyph = document.createElement('span');
    glyph.className = 'intro-flap-glyph';
    glyph.textContent = character;
    wrap.appendChild(glyph);
    container.appendChild(wrap);
    letters.push({ wrap, glyph, target: character, mode: 'spin', running: false });
  }
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
