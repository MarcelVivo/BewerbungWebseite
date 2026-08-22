#!/usr/bin/env node
/**
 * Einmaliges Entwickler-Skript: erzeugt die statischen mp3-Dateien fuer
 * AILAs Begruessung beim ersten Seitenaufruf. Läuft NIE zur Laufzeit der
 * Website - der Begrüssungstext ist für alle Besucher identisch, deshalb
 * wird er hier einmal vorab generiert statt bei jedem Seitenaufruf live
 * über die kostenpflichtige OpenAI-API.
 *
 * Aufruf: OPENAI_API_KEY=sk-... node scripts/generate-aila-greeting-audio.mjs
 * Erneut ausfuehren, falls sich der Text in HERO_GREETING unten aendert.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const HERO_GREETING = {
  de: [
    'Hallo, ich bin AILA.',
    'Ich zeige dir, wie hier alles zusammenhängt.',
    'Website, Prozesse, Daten – ein System, ein Blick.',
    'Scroll einfach weiter. Klicke auf mich, wenn du Fragen hast.',
  ],
  en: [
    "Hello, I'm AILA.",
    "I'll show you how everything here connects.",
    'Website, processes, data — one system, one view.',
    'Just keep scrolling. Click on me if you have questions.',
  ],
};

// Replayed (not the one-time welcome above) every time a visitor's scroll
// settles AILA back at the hero/about/contact stations, cycling through
// variants so she doesn't repeat herself verbatim - kept in sync with
// heroGreetingReturnVariants / heroGreetingAboutVariants /
// heroGreetingContactVariants in components/experience/content.ts.
const HERO_GREETING_RETURN_VARIANTS = [
  { de: ['Benötigst du Hilfe?', 'Klicke einfach auf mich, ich helfe dir gerne weiter.'], en: ['Need some help?', "Click on me, I'm happy to help."] },
  { de: ['Bist du noch da?', 'Ich bin nur einen Klick entfernt, falls du mich brauchst.'], en: ['Still here?', "I'm just one click away if you need me."] },
  { de: ['Falls noch Fragen offen sind,', 'sag einfach Bescheid, ich höre dir gerne zu.'], en: ['If you still have questions,', "just let me know, I'm listening."] },
];

const HERO_GREETING_ABOUT_VARIANTS = [
  { de: ['Passt das zu deinem Unternehmen?', 'Frag mich, ich schätze es kurz ein.'], en: ['Does this fit your business?', "Ask me, I'll take a quick look."] },
  { de: ['Wenn du neugierig bist, wie das bei dir aussehen würde,', 'zeige ich es dir gerne.'], en: ["If you're curious how this would look for you,", "I'm happy to show you."] },
  { de: ['Ich kenne Marcels Arbeitsweise gut,', 'also frag mich einfach danach.'], en: ["I know Marcel's approach well,", 'so just ask me about it.'] },
];

const HERO_GREETING_CONTACT_VARIANTS = [
  { de: ['Bereit für den nächsten Schritt?', 'Erzähl mir kurz, worum es geht.'], en: ['Ready for the next step?', "Tell me briefly what it's about."] },
  { de: ['Wenn du startklar bist,', 'leite ich alles direkt an Marcel weiter.'], en: ["If you're ready to get started,", "I'll pass everything on to Marcel."] },
  { de: ['Falls du noch unsicher bist,', 'frag mich einfach, ganz unverbindlich.'], en: ["If you're still unsure,", 'just ask me, no strings attached.'] },
];

const INSTRUCTIONS = {
  de: 'Sprich als AILA: warme, ruhige, souveraene deutsche Stimme. Natuerliches Hochdeutsch mit dezenter Schweizer Tonalitaet, klar und nicht werblich.',
  en: 'Speak as AILA with a warm, calm, assured voice. Clear, natural English, concise and never salesy.',
};

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY ist nicht gesetzt.');
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), 'public/cinematic/aila');

async function generate(lines, lang, fileName) {
  const text = lines[lang].join(' ');
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_AILA_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: process.env.OPENAI_AILA_VOICE || 'marin',
      input: text,
      instructions: INSTRUCTIONS[lang],
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenAI TTS fehlgeschlagen (${lang}): ${response.status} ${body}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const outPath = path.join(outDir, fileName);
  await writeFile(outPath, buffer);
  console.log(`✓ ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// Variant 0 keeps the original unsuffixed filename (already live); further
// variants add a "-2", "-3", ... suffix - mirrors variantSuffix() in
// AilaGreeting.tsx.
async function generateVariants(base, variants, lang) {
  for (const [index, lines] of variants.entries()) {
    const suffix = index > 0 ? `-${index + 1}` : '';
    await generate(lines, lang, `${base}${suffix}-${lang}.mp3`);
  }
}

for (const lang of ['de', 'en']) {
  await generate(HERO_GREETING, lang, `greeting-${lang}.mp3`);
  await generateVariants('greeting-return', HERO_GREETING_RETURN_VARIANTS, lang);
  await generateVariants('greeting-about', HERO_GREETING_ABOUT_VARIANTS, lang);
  await generateVariants('greeting-contact', HERO_GREETING_CONTACT_VARIANTS, lang);
}
console.log('Fertig.');
