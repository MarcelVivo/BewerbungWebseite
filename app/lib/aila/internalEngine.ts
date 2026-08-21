import type { SupabaseClient } from '@supabase/supabase-js';
import { INTERNAL_TOOL_DEFINITIONS, runInternalTool } from './internalTools';

// ─────────────────────────────────────────────────────────────
// Gemeinsame Tool-Calling-Schleife für alle internen KI-Assistenten
// (AILA im Command Center, jeder KI-Agent aus /dashboard/ki-agenten).
// Trennung von der öffentlichen Sales-AILA ist bewusst: andere
// Zielgruppe, andere Werkzeuge, andere Sicherheitsregeln.
// ─────────────────────────────────────────────────────────────

type ChatMessage = { role: 'user' | 'assistant'; content: string };

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

export async function runAilaToolLoop({
  supabase,
  systemPrompt,
  message,
  history = [],
  model,
}: {
  supabase: SupabaseClient;
  systemPrompt: string;
  message: string;
  history?: ChatMessage[];
  model: string;
}): Promise<{ answer: string; actions: Array<{ tool: string; args: Record<string, unknown> }> } | { error: string; status: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'AILA ist noch nicht konfiguriert.', status: 503 };

  const input: any[] = [...history, { role: 'user', content: message }];
  const actionsPerformed: Array<{ tool: string; args: Record<string, unknown> }> = [];

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
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
      console.error('[aila:internal-engine] OpenAI error', response.status, payload?.error?.type);
      return { error: 'AILA ist gerade nicht erreichbar. Bitte später erneut versuchen.', status: 502 };
    }

    const output = Array.isArray(payload.output) ? payload.output : [];
    const functionCalls = extractFunctionCalls(output);

    if (functionCalls.length === 0) {
      const answer = extractOutputText(output) || 'Ich habe keine Antwort erhalten.';
      return { answer, actions: actionsPerformed };
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

  return { error: 'Zu viele Zwischenschritte. Bitte formuliere die Anfrage genauer.', status: 500 };
}
