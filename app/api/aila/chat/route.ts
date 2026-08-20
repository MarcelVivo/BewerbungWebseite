import { NextRequest, NextResponse } from 'next/server';
import { AILA_KNOWLEDGE, AILA_SECTION_CONTEXT, type AilaLanguage } from '@/app/lib/ailaKnowledge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

const requests = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

function allowed(request: NextRequest) {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const recent = (requests.get(address) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  requests.set(address, recent);
  return true;
}

function outputText(payload: any) {
  if (typeof payload?.output_text === 'string') return payload.output_text.trim();
  return (payload?.output ?? [])
    .flatMap((item: any) => item?.content ?? [])
    .map((content: any) => content?.text ?? '')
    .join('\n')
    .trim();
}

export async function POST(request: NextRequest) {
  if (!allowed(request)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte kurz warten.' }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AILA ist noch nicht konfiguriert.' }, { status: 503 });

  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1200) : '';
    const sectionId = typeof body?.sectionId === 'string' ? body.sectionId : 'journey-start';
    const lang: AilaLanguage = body?.lang === 'en' ? 'en' : 'de';
    const history: HistoryMessage[] = Array.isArray(body?.history)
      ? body.history
          .filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string')
          .slice(-8)
          .map((item: any) => ({ role: item.role, content: item.content.slice(0, 1600) }))
      : [];

    if (!message) return NextResponse.json({ error: lang === 'de' ? 'Bitte stelle eine Frage.' : 'Please enter a question.' }, { status: 400 });

    const sectionContext = AILA_SECTION_CONTEXT[sectionId] ?? AILA_SECTION_CONTEXT['journey-start'];
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_AILA_MODEL || 'gpt-5.6-terra',
        instructions: `${AILA_KNOWLEDGE}\nAktueller Website-Abschnitt: ${sectionContext}\nGewuenschte Sprache: ${lang === 'de' ? 'Deutsch' : 'English'}.`,
        input: [...history, { role: 'user', content: message }],
        max_output_tokens: 500,
        store: false,
      }),
      cache: 'no-store',
    });

    const payload = await openAiResponse.json();
    if (!openAiResponse.ok) {
      console.error('AILA response error', openAiResponse.status, payload?.error?.type);
      return NextResponse.json({ error: lang === 'de' ? 'AILA kann gerade nicht antworten.' : 'AILA cannot answer right now.' }, { status: 502 });
    }

    const answer = outputText(payload);
    if (!answer) return NextResponse.json({ error: lang === 'de' ? 'AILA hat keine Antwort erhalten.' : 'AILA received no answer.' }, { status: 502 });
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('AILA chat failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'AILA ist voruebergehend nicht erreichbar.' }, { status: 500 });
  }
}

