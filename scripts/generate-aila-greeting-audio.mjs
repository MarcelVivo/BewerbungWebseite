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

async function generate(lang) {
  const text = HERO_GREETING[lang].join(' ');
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
  const outPath = path.join(outDir, `greeting-${lang}.mp3`);
  await writeFile(outPath, buffer);
  console.log(`✓ ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

for (const lang of ['de', 'en']) {
  await generate(lang);
}
console.log('Fertig.');
