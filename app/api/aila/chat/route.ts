import { NextRequest, NextResponse } from 'next/server';
import type { AilaLanguage } from '@/app/lib/ailaKnowledge';
import {
  buildFallbackAilaResponse,
  createInitialAilaSalesContext,
  mergeAilaSalesContext,
  sanitizeAilaSalesContext,
} from '@/app/lib/aila/engine';
import { buildAilaSalesInstructions } from '@/app/lib/aila/prompt';
import {
  AILA_RESPONSE_JSON_SCHEMA,
  parseAilaModelOutput,
} from '@/app/lib/aila/responseSchema';
import type { AilaAnimationState, AilaUiAction } from '@/app/lib/aila/types';
import { validatePublicPost } from '@/app/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

function outputText(payload: any) {
  if (typeof payload?.output_text === 'string') return payload.output_text.trim();
  return (payload?.output ?? [])
    .flatMap((item: any) => item?.content ?? [])
    .map((content: any) => content?.text ?? '')
    .join('\n')
    .trim();
}

export async function POST(request: NextRequest) {
  const rejected = validatePublicPost(request, {
    key: 'aila-chat',
    limit: 12,
    windowMs: 60_000,
    contentTypes: ['application/json'],
    maxBytes: 32_000,
  });
  if (rejected) return rejected;

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
          .slice(-10)
          .map((item: any) => ({ role: item.role, content: item.content.slice(0, 1600) }))
      : [];
    const historyLength = history.reduce((sum, entry) => sum + entry.content.length, 0);
    if (historyLength > 12_000) {
      return NextResponse.json({ error: 'Gespräch ist zu lang. Bitte starte eine neue Sitzung.' }, { status: 413 });
    }
    const currentContext = sanitizeAilaSalesContext(
      body?.context,
      createInitialAilaSalesContext(),
    );

    if (!message) return NextResponse.json({ error: lang === 'de' ? 'Bitte stelle eine Frage.' : 'Please enter a question.' }, { status: 400 });

    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_AILA_MODEL || 'gpt-5.6-terra',
        instructions: buildAilaSalesInstructions({
          sectionId,
          language: lang,
          context: currentContext,
        }),
        input: [...history, { role: 'user', content: message }],
        max_output_tokens: 1200,
        reasoning: { effort: 'low' },
        text: {
          format: {
            type: 'json_schema',
            name: 'aila_sales_response',
            strict: true,
            schema: AILA_RESPONSE_JSON_SCHEMA,
          },
        },
        store: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });

    const payload = await openAiResponse.json();
    if (!openAiResponse.ok) {
      console.error('AILA response error', openAiResponse.status, payload?.error?.type);
      const fallback = buildFallbackAilaResponse(currentContext, lang);
      return NextResponse.json({
        answer: fallback.message,
        ...fallback,
        degraded: true,
      });
    }

    const output = outputText(payload);
    if (!output) return NextResponse.json({ error: lang === 'de' ? 'AILA hat keine Antwort erhalten.' : 'AILA received no answer.' }, { status: 502 });

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(output);
    } catch {
      parsedJson = null;
    }

    const parsed = parseAilaModelOutput(parsedJson);
    if (!parsed) {
      const fallback = buildFallbackAilaResponse(currentContext, lang);
      return NextResponse.json({ answer: fallback.message, ...fallback, degraded: true });
    }

    if (parsed.scope === 'off_topic') {
      const message = lang === 'de'
        ? 'Dabei bin ich nicht die richtige Assistentin. Ich helfe bei Website, Kundengewinnung, CRM, Prozessen, Daten, KI und Automatisierung – was möchtest du in deinem Unternehmen verbessern?'
        : 'I am not the right assistant for that. I can help with websites, customer acquisition, CRM, processes, data, AI and automation—what would you like to improve in your business?';
      const quickReplies = lang === 'de'
        ? ['Mehr qualifizierte Anfragen', 'Abläufe vereinfachen', 'Noch nicht sicher']
        : ['More qualified enquiries', 'Simplify workflows', 'Not sure yet'];

      return NextResponse.json({
        answer: message,
        message,
        context: currentContext,
        recommendation: null,
        uiActions: [],
        animationState: 'speaking',
        quickReplies,
        shouldHandover: false,
      });
    }

    const mergedContext = mergeAilaSalesContext(currentContext, {
      ...parsed.extractedContext,
      currentStage: parsed.stage,
      nextBestAction: parsed.nextBestAction,
      recommendedServices:
        parsed.recommendation?.services.map((service) => service.serviceId) ??
        parsed.extractedContext.recommendedServices,
    });
    const uiActions: AilaUiAction[] = parsed.recommendation
      ? parsed.uiActions
      : parsed.uiActions.filter(
          (action) =>
            action.type !== 'SHOW_SOLUTION' &&
            action.type !== 'SHOW_RECOMMENDATION',
        );
    const animationState: AilaAnimationState = parsed.recommendation
      ? 'presenting'
      : parsed.animationState;
    const response = {
      message: parsed.message,
      context: mergedContext,
      recommendation: parsed.recommendation,
      uiActions,
      animationState,
      quickReplies: parsed.quickReplies,
      shouldHandover:
        parsed.shouldHandover || mergedContext.currentStage === 'handover',
    };

    return NextResponse.json(
      { answer: response.message, ...response },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('AILA chat failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'AILA ist voruebergehend nicht erreichbar.' }, { status: 500 });
  }
}
