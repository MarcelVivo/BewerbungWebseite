import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validatePublicPost } from '@/app/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const rejected = validatePublicPost(request, {
    key: 'aila-transcribe',
    limit: 8,
    windowMs: 60_000,
    contentTypes: ['multipart/form-data'],
    maxBytes: MAX_AUDIO_BYTES + 512_000,
  });
  if (rejected) return rejected;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AILA ist noch nicht konfiguriert.' }, { status: 503 });

  try {
    const incoming = await request.formData();
    const audio = incoming.get('audio');
    const lang = incoming.get('lang') === 'en' ? 'en' : 'de';
    if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: lang === 'de' ? 'Die Aufnahme ist ungueltig oder zu gross.' : 'The recording is invalid or too large.' }, { status: 400 });
    }
    if (audio.type && !/^audio\/(webm|mpeg|mp4|ogg|wav|x-m4a|aac)$/i.test(audio.type)) {
      return NextResponse.json({ error: 'Nicht unterstütztes Audioformat.' }, { status: 415 });
    }

    const form = new FormData();
    form.append('file', audio, audio.name || 'aila-question.webm');
    form.append('model', process.env.OPENAI_AILA_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');
    form.append('language', lang);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    const payload = await response.json();
    if (!response.ok || typeof payload?.text !== 'string') {
      console.error('AILA transcription error', response.status, payload?.error?.type);
      Sentry.captureMessage('AILA transcription error', { level: 'error', extra: { status: response.status } });
      return NextResponse.json({ error: lang === 'de' ? 'Die Aufnahme konnte nicht verstanden werden.' : 'The recording could not be understood.' }, { status: 502 });
    }
    return NextResponse.json({ text: payload.text.trim() });
  } catch (error) {
    console.error('AILA transcription failed', error instanceof Error ? error.message : 'unknown error');
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Spracherkennung nicht verfuegbar.' }, { status: 500 });
  }
}
