import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAilaToolLoop } from '@/app/lib/aila/internalEngine';

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

export async function POST(request: Request) {
  const { supabase, error } = await assertDashboardUser();
  if (error || !supabase) return error;

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

  const model = process.env.OPENAI_AILA_INTERNAL_MODEL || process.env.OPENAI_AILA_MODEL || 'gpt-5.6-terra';

  try {
    const result = await runAilaToolLoop({ supabase, systemPrompt: SYSTEM_PROMPT, message, history, model });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[aila:internal] failed', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json({ error: 'AILA ist vorübergehend nicht erreichbar.' }, { status: 500 });
  }
}
