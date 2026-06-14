'use client';

import { useEffect, useState, useRef, useCallback, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KiAgent, KiAgentenTyp } from '@/lib/types';
import { Plus, X, Pencil, Play, Pause, RotateCcw, Send, Bot, Zap, ChevronRight, ArrowLeft } from 'lucide-react';

// ── Config ────────────────────────────────────────────────

const TYP_CFG: Record<KiAgentenTyp, { label: string; color: string }> = {
  analyse: { label: 'Analyse',    color: 'bg-cyan-900/60 text-cyan-300' },
  content: { label: 'Content',    color: 'bg-purple-900/60 text-purple-300' },
  admin:   { label: 'Admin',      color: 'bg-slate-700 text-slate-300' },
  sales:   { label: 'Sales',      color: 'bg-green-900/60 text-green-300' },
  support: { label: 'Support',    color: 'bg-orange-900/60 text-orange-300' },
};

const STATUS_CFG = {
  aktiv:    { label: 'Aktiv',    cls: 'bg-green-900/60 text-green-300' },
  pausiert: { label: 'Pausiert', cls: 'bg-yellow-900/60 text-yellow-300' },
  entwurf:  { label: 'Entwurf',  cls: 'bg-slate-700 text-slate-400' },
};

function timeAgo(iso?: string) {
  if (!iso) return 'Noch nie';
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return 'Gerade eben';
  if (min < 60)  return `vor ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `vor ${h}h`;
  return `vor ${Math.floor(h / 24)}d`;
}

// ── Agent Modal ───────────────────────────────────────────

const EMPTY_AGENT: Partial<KiAgent> = {
  name: '', beschreibung: '', typ: 'analyse', status: 'aktiv',
  webhook_url: '', avatar_emoji: '🤖',
};

const EMOJIS = ['🤖','🧠','📊','✍️','💼','🎯','🔍','⚡','📈','🛠️','🎨','📧'];

function AgentModal({ agent, onClose, onSaved }: {
  agent: Partial<KiAgent>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<KiAgent>>(agent);
  const [saving, setSaving] = useState(false);
  const isEdit = !!form.id;

  function set(k: keyof KiAgent, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaving(true);
    const payload = {
      name:         form.name,
      beschreibung: form.beschreibung || null,
      typ:          form.typ ?? 'analyse',
      status:       form.status ?? 'aktiv',
      webhook_url:  form.webhook_url || null,
      avatar_emoji: form.avatar_emoji || '🤖',
    };
    const sb = createClient();
    const { error } = isEdit
      ? await sb.from('ki_agenten').update(payload).eq('id', form.id!)
      : await sb.from('ki_agenten').insert(payload);
    setSaving(false);
    if (!error) onSaved();
  }

  const inputCls = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#1a1d27] rounded-2xl border border-[#2d3144] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3144]">
          <h2 className="font-semibold text-white">{isEdit ? 'Agent bearbeiten' : 'Neuer KI-Agent'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-2">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(em => (
                <button key={em} type="button" onClick={() => set('avatar_emoji', em)}
                  className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${form.avatar_emoji === em ? 'bg-[#6366f1] ring-2 ring-[#6366f1] ring-offset-1 ring-offset-[#1a1d27]' : 'bg-[#252836] hover:bg-[#2d3144]'}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name *</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value)}
              className={inputCls} placeholder="Max – Analyse Assistent" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Typ</label>
              <select value={form.typ ?? 'analyse'} onChange={e => set('typ', e.target.value)} className={inputCls}>
                {(Object.keys(TYP_CFG) as KiAgentenTyp[]).map(t => (
                  <option key={t} value={t}>{TYP_CFG[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select value={form.status ?? 'aktiv'} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="aktiv">Aktiv</option>
                <option value="pausiert">Pausiert</option>
                <option value="entwurf">Entwurf</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <textarea value={form.beschreibung ?? ''} onChange={e => set('beschreibung', e.target.value)}
              rows={2} className={inputCls + ' resize-none'} placeholder="Was macht dieser Agent?" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Webhook URL <span className="text-slate-600">(optional)</span></label>
            <input value={form.webhook_url ?? ''} onChange={e => set('webhook_url', e.target.value)}
              className={inputCls} placeholder="https://…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-[#2d3144] transition-colors">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white transition-colors">
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Chat Interface ────────────────────────────────────────

interface ChatMessage { role: 'user' | 'assistant'; text: string; ts: Date; }

function AgentChat({ agent, onBack }: { agent: KiAgent; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: `Hallo! Ich bin ${agent.name}. ${agent.beschreibung ?? ''} Wie kann ich dir helfen?`, ts: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text, ts: new Date() }]);
    setLoading(true);

    // If webhook configured, call it — otherwise use Claude API proxy pattern
    if (agent.webhook_url) {
      try {
        const res = await fetch(agent.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, agent_id: agent.id }),
        });
        const data = await res.json();
        const reply = data.response ?? data.message ?? JSON.stringify(data);
        setMessages(m => [...m, { role: 'assistant', text: reply, ts: new Date() }]);
      } catch {
        setMessages(m => [...m, { role: 'assistant', text: '⚠️ Webhook-Fehler. Bitte URL prüfen.', ts: new Date() }]);
      }
    } else {
      // Demo response
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      const demo = getDemoReply(agent.typ, text);
      setMessages(m => [...m, { role: 'assistant', text: demo, ts: new Date() }]);
    }

    // Update execution count
    await createClient().from('ki_agenten').update({
      letzte_ausfuehrung:  new Date().toISOString(),
      ausfuehrungen_total: (agent.ausfuehrungen_total ?? 0) + 1,
    }).eq('id', agent.id);

    setLoading(false);
  }

  function getDemoReply(typ?: string, msg?: string): string {
    const responses: Record<string, string[]> = {
      analyse: [
        'Basierend auf den verfügbaren Daten empfehle ich folgende Schritte: 1) Zielgruppe analysieren, 2) KPIs definieren, 3) Massnahmen priorisieren.',
        'Die Analyse zeigt klares Potenzial in diesem Bereich. Ich würde empfehlen, mit einem kleinen Pilotprojekt zu starten.',
        'Ich habe die Anfrage analysiert. Die wichtigsten Erkenntnisse: Marktpotenzial vorhanden, Timing ist gut, Ressourcenbedarf überschaubar.',
      ],
      content: [
        'Hier ist ein Entwurf für deinen Content:\n\n**Headline:** Entdecken Sie die Kraft der KI für Ihr Unternehmen\n\n**Lead:** Immer mehr Schweizer KMU setzen auf KI-Lösungen – und die Ergebnisse sprechen für sich.',
        'Für den LinkedIn-Post schlage ich vor: "KI ist kein Trend – sie ist Realität. Heute habe ich einem KMU gezeigt, wie sie 4 Stunden täglich einsparen. Was könnte das für Ihr Unternehmen bedeuten?"',
        'Content-Idee: Eine Case-Study-Serie über erfolgreiche KI-Implementierungen bei Schweizer KMU. Format: kurze Videos + Blog-Artikel.',
      ],
      sales: [
        'Für diesen Lead empfehle ich: Erstgespräch innerhalb von 48h, Fokus auf Schmerzpunkte, konkreten ROI aufzeigen.',
        'Follow-up Strategie: 1. E-Mail mit Case Study (Tag 3), 2. LinkedIn Connect (Tag 5), 3. Anruf mit Agenda (Tag 10).',
        'Das Angebot sollte 3 Optionen enthalten: Basis (3.5k), Standard (7k), Premium (15k). Erfahrungsgemäss wählen 60% die mittlere Option.',
      ],
      admin: [
        'Ich habe die Aufgabe notiert. Priorität: mittel. Deadline: Ende der Woche. Soll ich einen Kalender-Eintrag erstellen?',
        'Zusammenfassung erstellt. Nächste Schritte: 1) Review durch Marcel, 2) Freigabe, 3) Versand bis Freitag.',
        'Erledigt! Die Informationen sind strukturiert und bereit für den nächsten Schritt.',
      ],
      support: [
        'Ich habe die Anfrage bearbeitet. Die Lösung ist: Einstellungen → Erweitert → Cache leeren. Bei Fragen melde dich gerne!',
        'Danke für deine Nachricht! Das Problem liegt wahrscheinlich an den Berechtigungen. Lösung: Admin-Rechte für den Nutzer aktivieren.',
        'Ich habe ähnliche Fälle analysiert. Die schnellste Lösung ist ein Neustart des Services. Benötigst du eine Schritt-für-Schritt-Anleitung?',
      ],
    };
    const list = responses[typ ?? 'analyse'] ?? responses.analyse;
    return list[Math.floor(Math.random() * list.length)];
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#2d3144] flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Agenten
        </button>
        <div className="w-px h-4 bg-[#2d3144]" />
        <div className="text-2xl">{agent.avatar_emoji}</div>
        <div>
          <div className="font-bold text-white">{agent.name}</div>
          <div className="text-xs text-slate-500">{agent.typ ? TYP_CFG[agent.typ].label : ''} · {STATUS_CFG[agent.status].label}</div>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          {agent.ausfuehrungen_total} Ausführungen · zuletzt {timeAgo(agent.letzte_ausfuehrung)}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${m.role === 'assistant' ? 'bg-[#252836] border border-[#2d3144]' : 'bg-[#6366f1]'}`}>
              {m.role === 'assistant' ? agent.avatar_emoji : '👤'}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === 'assistant' ? 'bg-[#252836] text-slate-200 rounded-tl-sm' : 'bg-[#6366f1] text-white rounded-tr-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#252836] border border-[#2d3144] flex items-center justify-center text-sm">{agent.avatar_emoji}</div>
            <div className="bg-[#252836] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#2d3144] flex-shrink-0">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder={`Nachricht an ${agent.name}…`}
            className="flex-1 rounded-xl bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-4 py-3 text-white text-sm placeholder-slate-600 transition-colors"
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-40 text-white transition-colors">
            <Send size={16} />
          </button>
        </div>
        {!agent.webhook_url && (
          <p className="text-xs text-slate-600 mt-2">Demo-Modus · Kein Webhook konfiguriert</p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function KiAgentenPage() {
  const [agenten, setAgenten]   = useState<KiAgent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<Partial<KiAgent> | false>(false);
  const [selected, setSelected] = useState<KiAgent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await createClient().from('ki_agenten').select('*').order('created_at');
    setAgenten((data ?? []) as KiAgent[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(agent: KiAgent) {
    const next = agent.status === 'aktiv' ? 'pausiert' : 'aktiv';
    await createClient().from('ki_agenten').update({ status: next }).eq('id', agent.id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Agent löschen?')) return;
    await createClient().from('ki_agenten').delete().eq('id', id);
    load();
  }

  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <AgentChat agent={selected} onBack={() => { setSelected(null); load(); }} />
      </div>
    );
  }

  const active  = agenten.filter(a => a.status === 'aktiv').length;
  const totalEx = agenten.reduce((s, a) => s + (a.ausfuehrungen_total ?? 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">KI-Agenten</h1>
          <p className="text-sm text-slate-400 mt-0.5">{active} aktiv · {totalEx} Ausführungen total</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY_AGENT })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Neuer Agent
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">Lädt…</div>
      ) : agenten.length === 0 ? (
        <div className="py-16 text-center">
          <Bot size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">Noch keine Agenten. Die Seed-Daten aus der SQL-Migration werden hier angezeigt.</p>
          <button onClick={() => setModal({ ...EMPTY_AGENT })} className="mt-4 text-[#6366f1] text-sm hover:underline">
            + Ersten Agenten anlegen
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agenten.map(a => {
            const typCfg    = a.typ ? TYP_CFG[a.typ] : null;
            const statusCfg = STATUS_CFG[a.status];
            return (
              <div key={a.id} className="group bg-[#1a1d27] border border-[#2d3144] rounded-2xl p-5 hover:border-[#6366f1]/40 transition-all flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#252836] flex items-center justify-center text-2xl border border-[#2d3144]">
                      {a.avatar_emoji}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-snug">{a.name}</h3>
                      {typCfg && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${typCfg.color}`}>{typCfg.label}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {a.beschreibung && <p className="text-sm text-slate-400 mb-4 flex-1 leading-relaxed">{a.beschreibung}</p>}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Zap size={11} />
                    <span>{a.ausfuehrungen_total} Ausf.</span>
                  </div>
                  <div>{timeAgo(a.letzte_ausfuehrung)}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(a)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#818cf8] text-sm font-medium transition-colors">
                    Chat <ChevronRight size={14} />
                  </button>
                  <button onClick={() => toggleStatus(a)}
                    className={`p-2 rounded-lg transition-colors ${a.status === 'aktiv' ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                    title={a.status === 'aktiv' ? 'Pausieren' : 'Aktivieren'}>
                    {a.status === 'aktiv' ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => setModal(a)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[#2d3144] transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== false && (
        <AgentModal agent={modal} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      )}
    </div>
  );
}
