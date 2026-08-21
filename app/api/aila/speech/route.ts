import { NextRequest, NextResponse } from 'next/server';
import { validatePublicPost } from '@/app/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
          ? 'Sprich als AILA: warme, ruhige, souveraene deutsche Stimme. Natuerliches Hochdeutsch mit dezenter Schweizer Tonalitaet, klar und nicht werblich.'
          : 'Speak as AILA with a warm, calm, assured voice. Clear, natural English, concise and never salesy.',
        response_format: 'mp3',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      console.error('AILA speech error', response.status);
      return NextResponse.json({ error: 'Sprachausgabe nicht verfuegbar.' }, { status: 502 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('AILA speech failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Sprachausgabe nicht verfuegbar.' }, { status: 500 });
  }
}
