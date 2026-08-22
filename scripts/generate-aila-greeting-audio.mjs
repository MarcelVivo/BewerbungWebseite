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

import { writeFile, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);

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
  { de: ['Ich bin nur einen Klick entfernt, falls du mich brauchst.'], en: ["I'm just one click away if you need me."] },
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
  de: 'Sprich als AILA: eine erkennbar synthetische, maschinelle KI-Stimme - geschlechtsneutral, weder eindeutig maennlich noch weiblich. Ruhig, klar und praezise, mit einer leicht monotonen, gleichmaessigen Sprechweise statt menschlicher Emotionalitaet. Neutral, nicht werblich, aber freundlich im Tonfall.',
  en: 'Speak as AILA: a distinctly synthetic, machine-like AI voice - gender-neutral, neither distinctly male nor female. Calm, clear and precise, with a slightly monotone, even delivery rather than human emotional inflection. Neutral, never salesy, but friendly in tone.',
};

// Approved after A/B testing directly on the live site (see conversation):
// presence EQ for clarity, compression, a tremolo acting as a mild ring
// modulator for an audible synthetic buzz, a heavier phaser for a
// synthetic warble, a short comb-filter echo for metallic ring, and a
// light echo-based "hall". Loudness normalization is a separate step (see
// twoPassLoudnorm below) - single-pass loudnorm measures and corrects in
// the same run, which is unreliable on short clips like these (measured as
// low as -26dB against a -15dB target on one clip) and was producing
// inconsistent volume between clips (hero quiet, other stations loud).
// Two-pass measures first, then applies the exact correction that
// measurement calls for.
const VOICE_FILTER = [
  'equalizer=f=3200:width_type=o:width=1.0:g=2.5',
  'acompressor=threshold=-18dB:ratio=2.5:attack=15:release=150:makeup=1.9',
  'tremolo=f=55:d=0.35',
  'aphaser=in_gain=0.85:out_gain=0.8:delay=3.0:decay=0.4:speed=0.4',
  'aecho=0.6:0.7:9:0.35',
  'aecho=0.75:0.6:40|70|110:0.22|0.16|0.09',
].join(',');

const LOUDNORM_TARGET = { I: -15, TP: -1.0, LRA: 11 };

async function twoPassLoudnorm(inputPath, outputPath) {
  const { I, TP, LRA } = LOUDNORM_TARGET;
  const { stderr } = await run('ffmpeg', [
    '-i', inputPath,
    '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`,
    '-f', 'null', '-',
  ], { maxBuffer: 10 * 1024 * 1024 });
  const match = stderr.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`loudnorm-Analyse ohne Ergebnis fuer ${inputPath}`);
  const stats = JSON.parse(match[0]);
  const filter = `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;
  await run('ffmpeg', ['-y', '-i', inputPath, '-af', filter, outputPath]);
}

// The echo/"hall" tail from VOICE_FILTER above doesn't reliably get enough
// room to decay to silence within the clip's own natural length, so the
// ending can sound abruptly cut off rather than trailing away naturally.
// Pads on a little extra runway and fades out over the last half second,
// guaranteeing a clean, click-free ending regardless of how much of the
// reverb tail the source clip's own length happened to leave room for.
const TAIL_PAD_S = .6;
const TAIL_FADE_S = .5;

async function finalizeTail(inputPath, outputPath) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', inputPath]);
  const paddedDuration = parseFloat(stdout.trim()) + TAIL_PAD_S;
  const fadeStart = Math.max(0, paddedDuration - TAIL_FADE_S);
  await run('ffmpeg', ['-y', '-i', inputPath, '-af', `apad=pad_dur=${TAIL_PAD_S},afade=t=out:st=${fadeStart}:d=${TAIL_FADE_S}`, outputPath]);
}

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
  const rawPath = path.join(outDir, `_raw-${fileName}`);
  const effectedPath = path.join(outDir, `_fx-${fileName}`);
  const loudPath = path.join(outDir, `_loud-${fileName}`);
  await writeFile(rawPath, buffer);
  await run('ffmpeg', ['-y', '-i', rawPath, '-af', VOICE_FILTER, effectedPath]);
  await twoPassLoudnorm(effectedPath, loudPath);
  await finalizeTail(loudPath, outPath);
  await unlink(rawPath);
  await unlink(effectedPath);
  await unlink(loudPath);
  console.log(`✓ ${outPath}`);
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
