import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { AilaLanguage } from '@/app/lib/ailaKnowledge';
import { buildAilaRealtimeInstructions } from '@/app/lib/aila/prompt';
import { validatePublicPost } from '@/app/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clientAddress(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export async function POST(request: NextRequest) {
  const rejected = validatePublicPost(request, {
    key: 'aila-realtime',
    limit: 6,
    windowMs: 5 * 60_000,
    contentTypes: ['application/sdp'],
    maxBytes: 120_000,
  });
  if (rejected) return rejected;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AILA ist noch nicht konfiguriert.' }, { status: 503 });
  }

  const sdp = await request.text();
  if (!sdp || sdp.length > 120_000) {
    return NextResponse.json({ error: 'Ungültige Audiositzung.' }, { status: 400 });
  }

  const lang: AilaLanguage = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'de';
  const sectionId = (request.nextUrl.searchParams.get('sectionId') || 'journey-start').slice(0, 80);
  const session = {
    type: 'realtime',
    model: process.env.OPENAI_AILA_REALTIME_MODEL || 'gpt-realtime-2.1',
    instructions: buildAilaRealtimeInstructions({ sectionId, language: lang }),
    output_modalities: ['audio'],
    max_output_tokens: 700,
    audio: {
      input: {
        transcription: {
          model: 'gpt-4o-mini-transcribe',
          language: lang,
        },
        turn_detection: {
          type: 'semantic_vad',
          eagerness: 'medium',
          create_response: true,
          interrupt_response: true,
        },
      },
      output: { voice: 'marin' },
    },
  };

  const form = new FormData();
  form.set('sdp', sdp);
  form.set('session', JSON.stringify(session));
  const safetyIdentifier = createHash('sha256')
    .update(`aila:${clientAddress(request)}`)
    .digest('hex');

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'OpenAI-Safety-Identifier': safetyIdentifier,
      },
      body: form,
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    });
    const answerSdp = await response.text();
    if (!response.ok) {
      console.error('AILA realtime session error', response.status, answerSdp.slice(0, 240));
      return NextResponse.json({ error: 'Die Live-Verbindung konnte nicht aufgebaut werden.' }, { status: response.status });
    }
    return new NextResponse(answerSdp, {
      status: 200,
      headers: { 'Content-Type': 'application/sdp', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('AILA realtime failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'AILA Live ist vorübergehend nicht erreichbar.' }, { status: 502 });
  }
}
