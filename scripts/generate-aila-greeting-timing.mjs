#!/usr/bin/env node
/**
 * Einmaliges Entwickler-Skript: transkribiert die bereits generierten
 * AILA-Begruessungs-mp3s (public/cinematic/aila/greeting-{lang}.mp3) per
 * OpenAI Whisper und speichert die echten Wort-Zeitstempel als JSON daneben.
 * AilaGreeting.tsx nutzt diese Datei zur Laufzeit, um die Untertitel exakt
 * mit dem gesprochenen Audio zu synchronisieren, statt die Dauer nur
 * anhand der Zeichenlaenge zu schaetzen.
 *
 * Aufruf: OPENAI_API_KEY=sk-... node scripts/generate-aila-greeting-timing.mjs
 * Erneut ausfuehren, falls greeting-{lang}.mp3 neu generiert wurde.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY ist nicht gesetzt.');
  process.exit(1);
}

const dir = path.resolve(process.cwd(), 'public/cinematic/aila');

async function transcribe(lang, fileBase) {
  const mp3Path = path.join(dir, `${fileBase}.mp3`);
  const buffer = await readFile(mp3Path);

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'audio/mpeg' }), `${fileBase}.mp3`);
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('language', lang);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Whisper-Transkription fehlgeschlagen (${fileBase}): ${response.status} ${body}`);
  }

  const data = await response.json();
  const words = (data.words ?? []).map((entry) => ({ word: entry.word, start: entry.start, end: entry.end }));
  const outPath = path.join(dir, `${fileBase}-timing.json`);
  await writeFile(outPath, JSON.stringify({ words }, null, 2));
  console.log(`✓ ${outPath} (${words.length} Wörter): ${words.map((w) => w.word).join(' | ')}`);
}

// Three variants each for return/about/contact - variant 0 keeps the
// original unsuffixed filename, further variants add a "-2"/"-3" suffix.
const VARIANT_COUNT = 3;

for (const lang of ['de', 'en']) {
  await transcribe(lang, `greeting-${lang}`);
  for (const base of ['greeting-return', 'greeting-about', 'greeting-contact']) {
    for (let index = 0; index < VARIANT_COUNT; index += 1) {
      const suffix = index > 0 ? `-${index + 1}` : '';
      await transcribe(lang, `${base}${suffix}-${lang}`);
    }
  }
}
console.log('Fertig.');
