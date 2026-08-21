import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAilaToolLoop } from '@/app/lib/aila/internalEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const TYP_HINWEISE: Record<string, string> = {
  analyse: 'Dein Schwerpunkt ist Potenzialanalyse: neue Leads und Kunden einordnen, Chancen und Risiken benennen, eine klare Empfehlung geben.',
  content: 'Dein Schwerpunkt ist das Erstellen von Textentwürfen: Angebote, Zusammenfassungen, Vorschläge für Beiträge. Liefere direkt einen konkreten Entwurf, keine allgemeinen Tipps.',
  sales: 'Dein Schwerpunkt ist Vertrieb: Outreach-Texte, Follow-up-Strategien, Argumentation für Gespräche. Bleib konkret und handlungsorientiert.',
  admin: 'Dein Schwerpunkt ist Organisation: Aufgaben strukturieren, Status zusammenfassen, an Fristen erinnern.',
  support: 'Dein Schwerpunkt ist Support: Probleme einordnen und konkrete, nachvollziehbare Lösungsschritte vorschlagen.',
};

function buildAgentSystemPrompt(agent: { name: string; beschreibung?: string | null; typ?: string | null; konfiguration?: Record<string, unknown> | null }) {
  const customInstructions = typeof agent.konfiguration?.instructions === 'string' ? agent.konfiguration.instructions.trim() : '';
  return `Du bist ${agent.name}, ein spezialisierter interner KI-Agent im Command Center von Marcel Spahr. Du sprichst ausschliesslich mit Marcel, nicht mit Kunden.

${agent.beschreibung ? `Deine Aufgabe laut Definition: ${agent.beschreibung}` : ''}
${agent.typ && TYP_HINWEISE[agent.typ] ? TYP_HINWEISE[agent.typ] : ''}
${customInstructions ? `Zusätzliche Anweisungen von Marcel: ${customInstructions}` : ''}

Regeln:
- Nutze die verfügbaren Werkzeuge, um echte Daten aus dem CRM/ERP abzufragen, statt zu raten. Erfinde nie Zahlen, Namen oder Status.
- Bleib bei deinem Spezialgebiet. Wenn eine Anfrage klar zu einem anderen Agenten passt, sag das kurz.
- Du kannst nichts löschen, keine Rechnungen versenden, keine E-Mails verschicken und keine Beträge ändern.
- Antworte auf Deutsch, konkret und ohne Floskeln. Kein Markdown-Overkill, es soll wie eine echte Antwort eines Kollegen wirken.`;
}

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

  let body: { agentId?: string; message?: string; history?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const agentId = typeof body.agentId === 'string' ? body.agentId : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
  if (!agentId) return NextResponse.json({ error: 'agentId fehlt.' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Bitte gib eine Nachricht ein.' }, { status: 400 });

  const { data: agent, error: agentError } = await supabase
    .from('ki_agenten')
    .select('id, name, beschreibung, typ, status, konfiguration, ausfuehrungen_total')
    .eq('id', agentId)
    .single();
  if (agentError || !agent) return NextResponse.json({ error: 'Agent nicht gefunden.' }, { status: 404 });
  if (agent.status === 'pausiert') {
    return NextResponse.json({ error: `${agent.name} ist pausiert. Aktiviere den Agenten, um mit ihm zu chatten.` }, { status: 409 });
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter((entry) => (entry?.role === 'user' || entry?.role === 'assistant') && typeof entry?.content === 'string')
        .slice(-16)
        .map((entry) => ({ role: entry.role, content: entry.content.slice(0, 2000) }))
    : [];

  const model = process.env.OPENAI_AILA_INTERNAL_MODEL || process.env.OPENAI_AILA_MODEL || 'gpt-5.6-terra';
  const systemPrompt = buildAgentSystemPrompt(agent);

  try {
    const result = await runAilaToolLoop({ supabase, systemPrompt, message, history, model });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await supabase.from('ki_agenten').update({
      letzte_ausfuehrung: new Date().toISOString(),
      ausfuehrungen_total: (agent.ausfuehrungen_total ?? 0) + 1,
    }).eq('id', agentId);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[aila:agents] failed', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json({ error: `${agent.name} ist vorübergehend nicht erreichbar.` }, { status: 500 });
  }
}
