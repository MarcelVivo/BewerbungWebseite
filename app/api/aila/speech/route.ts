import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { validatePublicPost } from '@/app/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const run = promisify(execFile);

// Kept in sync by hand with VOICE_FILTER in scripts/generate-aila-greeting-audio.mjs -
// the same treatment applied there to the pre-rendered greeting clips, applied here
// per live chat reply so AILA's voice sounds the same everywhere. If ffmpeg-static's
// binary isn't available for some reason, falls back to the raw unprocessed voice
// instead of failing the whole chat reply (see the catch below).
const VOICE_FILTER = [
  'equalizer=f=3200:width_type=o:width=1.0:g=2.5',
  'acompressor=threshold=-18dB:ratio=2.5:attack=15:release=150:makeup=1.9',
  'tremolo=f=55:d=0.35',
  'aphaser=in_gain=0.85:out_gain=0.8:delay=3.0:decay=0.4:speed=0.4',
  'aecho=0.6:0.7:9:0.35',
  'aecho=0.75:0.6:40|70|110:0.22|0.16|0.09',
  'loudnorm=I=-15:TP=-1.0:LRA=11',
].join(',');

async function applyVoiceFilter(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (!ffmpegPath) return buffer;
  const dir = await mkdtemp(path.join(tmpdir(), 'aila-speech-'));
  const rawPath = path.join(dir, 'raw.mp3');
  const outPath = path.join(dir, 'out.mp3');
  try {
    await writeFile(rawPath, Buffer.from(buffer));
    await run(ffmpegPath, ['-y', '-i', rawPath, '-af', VOICE_FILTER, outPath]);
    const processed = await readFile(outPath);
    return processed.buffer.slice(processed.byteOffset, processed.byteOffset + processed.byteLength);
  } catch (error) {
    console.error('AILA voice filter failed, using unprocessed audio', error instanceof Error ? error.message : 'unknown error');
    return buffer;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function POST(request: NextRequest) {
  const rejected = validatePublicPost(request, {
    key: 'aila-speech',
    limit: 10,
    windowMs: 60_000,
    contentTypes: ['application/json'],
    maxBytes: 8_000,
  });
  if (rejected) return rejected;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AILA ist noch nicht konfiguriert.' }, { status: 503 });

  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 2200) : '';
    const lang = body?.lang === 'en' ? 'en' : 'de';
    if (!text) return NextResponse.json({ error: 'Text fehlt.' }, { status: 400 });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_AILA_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_AILA_VOICE || 'marin',
        input: text,
        instructions: lang === 'de'
          ? 'Sprich als AILA: eine erkennbar synthetische, maschinelle KI-Stimme - geschlechtsneutral, weder eindeutig maennlich noch weiblich. Ruhig, klar und praezise, mit einer leicht monotonen, gleichmaessigen Sprechweise statt menschlicher Emotionalitaet. Neutral, nicht werblich, aber freundlich im Tonfall.'
          : 'Speak as AILA: a distinctly synthetic, machine-like AI voice - gender-neutral, neither distinctly male nor female. Calm, clear and precise, with a slightly monotone, even delivery rather than human emotional inflection. Neutral, never salesy, but friendly in tone.',
        response_format: 'mp3',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      console.error('AILA speech error', response.status);
      return NextResponse.json({ error: 'Sprachausgabe nicht verfuegbar.' }, { status: 502 });
    }

    const processed = await applyVoiceFilter(await response.arrayBuffer());
    return new NextResponse(processed, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('AILA speech failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Sprachausgabe nicht verfuegbar.' }, { status: 500 });
  }
}
