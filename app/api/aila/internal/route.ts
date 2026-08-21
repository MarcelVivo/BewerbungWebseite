import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { INTERNAL_TOOL_DEFINITIONS, runInternalTool } from '@/app/lib/aila/internalTools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du bist AILA, Marcel Spahrs persönliche Arbeitsassistentin in seinem internen Command Center (CRM/ERP). Du sprichst nicht mit Kunden, sondern ausschliesslich mit Marcel selbst.

Aufgabe:
- Du hilfst Marcel, seine Kunden, Pipeline, Aufgaben, Rechnungen, Termine und neuen Leads zu überblicken und direkt zu bearbeiten.
- Nutze die verfügbaren Werkzeuge, um echte Daten abzufragen, statt zu raten. Erfinde nie Zahlen, Namen oder Status.
- Für Schreibaktionen (Aufgabe anlegen, Notiz hinzufügen, Status ändern, Termin anlegen) brauchst du oft zuerst die kunden_id über list_kunden.
- Fasse Ergebnisse knapp und konkret zusammen, keine Floskeln, keine Wiederholung der Frage.
- Nach jeder Schreibaktion bestätigst du kurz, was genau geändert wurde.
- Wenn eine Anfrage mehrdeutig ist (z. B. mehrere Kunden mit ähnlichem Namen gefunden), frage kurz nach, statt zu raten.
- Du kannst nichts löschen, keine Rechnungen versenden, keine E-Mails verschicken und keine Beträge ändern. Sag das offen, falls danach gefragt wird.
- Antworte immer auf Deutsch, direkt und ohne Marketingsprache – du sprichst mit Marcel, nicht mit einem Interessenten.`;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

async function assertDashboardUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 }) };

  const adminEmail = process.env.DASHBOARD_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && user.email?.toLowerCase() !== adminEmail) {
    return { supabase: null, error: NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 }) };
  }
  return { supabase, error: null };
}

function extractFunctionCalls(output: any[]): Array<{ call_id: string; name: string; arguments: string }> {
  return output.filter((item) => item?.type === 'function_call');
}

function extractOutputText(output: any[]): string {
  return output
    .filter((item) => item?.type === 'message')
    .flatMap((item) => item?.content ?? [])
    .map((content: any) => content?.text ?? '')
    .join('\n')
    .trim();
}

export async function POST(request: Request) {
  const { supabase, error } = await assertDashboardUser();
  if (error || !supabase) return error;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AILA ist noch nicht konfiguriert.' }, { status: 503 });

  let body: { message?: string; history?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
  if (!message) return NextResponse.json({ error: 'Bitte gib eine Nachricht ein.' }, { status: 400 });
  const history = Array.isArray(body.history)
    ? body.history
        .filter((entry) => (entry?.role === 'user' || entry?.role === 'assistant') && typeof entry?.content === 'string')
        .slice(-16)
        .map((entry) => ({ role: entry.role, content: entry.content.slice(0, 2000) }))
    : [];

  const input: any[] = [...history, { role: 'user', content: message }];
  const actionsPerformed: Array<{ tool: string; args: Record<string, unknown> }> = [];
  const model = process.env.OPENAI_AILA_INTERNAL_MODEL || process.env.OPENAI_AILA_MODEL || 'gpt-5.6-terra';

  try {
    for (let iteration = 0; iteration < 6; iteration += 1) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          instructions: SYSTEM_PROMPT,
          input,
          tools: INTERNAL_TOOL_DEFINITIONS,
          tool_choice: 'auto',
          max_output_tokens: 1200,
          store: false,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      });

      const payload = await response.json();
      if (!response.ok) {
        console.error('[aila:internal] OpenAI error', response.status, payload?.error?.type);
        return NextResponse.json({ error: 'AILA ist gerade nicht erreichbar. Bitte später erneut versuchen.' }, { status: 502 });
      }

      const output = Array.isArray(payload.output) ? payload.output : [];
      const functionCalls = extractFunctionCalls(output);

      if (functionCalls.length === 0) {
        const answer = extractOutputText(output) || 'Ich habe keine Antwort erhalten.';
        return NextResponse.json({ answer, actions: actionsPerformed });
      }

      input.push(...output);

      for (const call of functionCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = call.arguments ? JSON.parse(call.arguments) : {};
        } catch {
          args = {};
        }
        let outputPayload: unknown;
        try {
          outputPayload = await runInternalTool(supabase, call.name as any, args);
          actionsPerformed.push({ tool: call.name, args });
        } catch (toolError) {
          outputPayload = { error: toolError instanceof Error ? toolError.message : 'Werkzeug fehlgeschlagen.' };
        }
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(outputPayload),
        });
      }
    }

    return NextResponse.json({ error: 'Zu viele Zwischenschritte. Bitte formuliere die Anfrage genauer.' }, { status: 500 });
  } catch (err) {
    console.error('[aila:internal] failed', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json({ error: 'AILA ist vorübergehend nicht erreichbar.' }, { status: 500 });
  }
}
