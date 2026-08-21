'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2, Wrench, Sparkles } from 'lucide-react';

type Role = 'user' | 'assistant';
type Message = { role: Role; content: string; actions?: string[] };

const SUGGESTIONS = [
  'Welche neuen Leads sind noch offen?',
  'Zeig mir alle überfälligen Aufgaben.',
  'Wie steht die Pipeline aktuell?',
  'Welche Rechnungen sind noch offen?',
];

const TOOL_LABELS: Record<string, string> = {
  list_kunden: 'Kunden durchsucht',
  pipeline_uebersicht: 'Pipeline abgefragt',
  offene_rechnungen: 'Rechnungen geprüft',
  faellige_tasks: 'Aufgaben geprüft',
  anstehende_termine: 'Termine geprüft',
  neue_leads: 'Neue Leads geprüft',
  task_erstellen: 'Aufgabe erstellt',
  kunde_notiz_hinzufuegen: 'Notiz hinzugefügt',
  kunde_status_aendern: 'Kundenstatus geändert',
  termin_erstellen: 'Termin erstellt',
  outreach_erfassen: 'Outreach protokolliert',
};

export default function AilaInternalPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/aila/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(0, -1).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Etwas ist schiefgelaufen.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      const actions: string[] = Array.isArray(data.actions)
        ? Array.from(new Set<string>(data.actions.map((a: { tool: string }) => TOOL_LABELS[a.tool] || a.tool)))
        : [];
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer, actions }]);
    } catch {
      setError('Verbindungsfehler. Bitte prüfe deine Internetverbindung.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6.5rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center flex-shrink-0">
          <Bot size={20} className="text-[#6366f1]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AILA – Dein Assistent</h2>
          <p className="text-xs text-slate-400">Fragt live deine Daten ab und kann Aufgaben, Notizen und Termine direkt anlegen.</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border border-[#2d3144] bg-[#1a1d27] p-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <Sparkles size={28} className="text-[#6366f1] mb-3" />
            <p className="text-sm text-slate-300 font-medium mb-1">Womit kann ich dir helfen?</p>
            <p className="text-xs text-slate-500 mb-5 max-w-sm">Ich habe Zugriff auf Kunden, Pipeline, Aufgaben, Rechnungen, Termine und neue Leads.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-2 rounded-lg border border-[#2d3144] bg-[#252836] text-slate-300 hover:border-[#6366f1]/40 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-[#6366f1] text-white rounded-br-sm'
                : 'bg-[#252836] text-slate-200 rounded-bl-sm border border-[#2d3144]'
            }`}>
              {m.role === 'assistant' && m.actions && m.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {m.actions.map((a, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5adfb] border border-[#6366f1]/25">
                      <Wrench size={9} /> {a}
                    </span>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-[#252836] border border-[#2d3144] flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={14} className="animate-spin" /> AILA prüft deine Daten …
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frag AILA etwas zu deinen Kunden, Aufgaben oder Terminen …"
          className="flex-1 rounded-xl bg-[#1a1d27] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#6366f1] hover:bg-[#5457e0] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
