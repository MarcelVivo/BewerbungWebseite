'use client';

import { ArrowRight, LoaderCircle, Mic, Send, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import type { ExperienceLang } from './content';
import styles from './experience.module.css';

type GuideEntry = {
  kicker: string;
  title: string;
  intro: string;
  benefit: string;
};

const GUIDE: Record<ExperienceLang, Record<string, GuideEntry>> = {
  de: {
    'journey-start': { kicker: 'AILA · SYSTEMBEGLEITERIN', title: 'Was soll sich im Unternehmen verbessern?', intro: 'Ich zeige, wie Website, Prozesse, Daten und KI als ein zusammenhängendes System arbeiten können.', benefit: 'Du erkennst schneller, welche Veränderung wirklich Wirkung bringt – und welche nur ein weiteres Werkzeug wäre.' },
    fragmentierung: { kicker: 'AILA · AUSGANGSLAGE', title: 'Wo geht heute Zeit verloren?', intro: 'Getrennte Werkzeuge erzeugen Übergaben, doppelte Daten und blinde Flecken. Ich mache diese Brüche sichtbar.', benefit: 'Weniger manuelle Übergaben, klarere Zuständigkeiten und Informationen, die dort ankommen, wo sie gebraucht werden.' },
    'journey-solutions': { kicker: 'AILA · ARCHITEKTUR', title: 'Ein System statt Einzellösungen.', intro: 'Die richtigen Bausteine werden um deine Abläufe herum verbunden – nicht umgekehrt.', benefit: 'Das Unternehmen erhält eine tragfähige Architektur, die mit den Anforderungen wachsen kann.' },
    verkaufssystem: { kicker: 'AILA · WEBSITE', title: 'Eine Website, die weiterarbeitet.', intro: 'Aus einem Besuch wird ein nachvollziehbarer Weg von der ersten Frage bis zum Auftrag.', benefit: 'Anfragen gehen nicht verloren, nächste Schritte sind klar und Verkauf wird planbarer.' },
    'marketing-engine': { kicker: 'AILA · MARKETING', title: 'Aus Aufmerksamkeit wird ein Prozess.', intro: 'Kanäle, Inhalte und Anfragen werden mit Vertrieb und Kundendaten verbunden.', benefit: 'Marketing wird messbarer und zeigt nicht nur Reichweite, sondern seinen Beitrag zum Geschäft.' },
    'business-os': { kicker: 'AILA · PROZESSE', title: 'Abläufe, die den Alltag entlasten.', intro: 'Informationen, Aufgaben und Entscheidungen bleiben in einem gemeinsamen Kontext.', benefit: 'Teams koordinieren weniger und handeln schneller, weil Status und Verantwortung jederzeit sichtbar sind.' },
    'daten-intelligenz': { kicker: 'AILA · DATEN & KI', title: 'Verlässliche Daten. Kontrollierte KI.', intro: 'KI unterstützt konkrete Arbeitsschritte, während Rollen, Freigaben und menschliche Kontrolle erhalten bleiben.', benefit: 'Mehr Geschwindigkeit ohne Kontrollverlust – auf einer gemeinsamen, nachvollziehbaren Datengrundlage.' },
    'journey-references': { kicker: 'AILA · PROJEKTE', title: 'Substanz wird sichtbar.', intro: 'Reale Projekte zeigen, wie Strategie, Design, Entwicklung und Betrieb zusammengeführt werden.', benefit: 'Du beurteilst die Zusammenarbeit anhand konkreter Lösungen statt abstrakter Versprechen.' },
    'journey-about': { kicker: 'AILA · MENSCH × KI', title: 'Erfahrung entscheidet. KI verstärkt.', intro: 'Marcel bringt Kontext, Urteilskraft und Verantwortung ein. Ich beschleunige Analyse, Entwurf und Umsetzung.', benefit: 'Das Ergebnis sind fundiertere Entscheidungen, höheres Tempo und eine verantwortliche Person vom ersten Gespräch bis zum Betrieb.' },
    'journey-contact': { kicker: 'AILA · PROJEKTSTART', title: 'Bereit für den ersten sinnvollen Schritt?', intro: 'Ein gutes Projekt beginnt nicht mit einem Tool, sondern mit einer klaren Frage und einem gemeinsamen Bild der Ausgangslage.', benefit: 'Du erhältst eine ehrliche Einordnung, einen realistischen nächsten Schritt und Klarheit über Aufwand und Wirkung.' },
  },
  en: {
    'journey-start': { kicker: 'AILA · SYSTEM GUIDE', title: 'What should improve in your business?', intro: 'I show how website, processes, data and AI can work as one connected system.', benefit: 'You see sooner which change can create real impact—and which would merely add another tool.' },
    fragmentierung: { kicker: 'AILA · CURRENT STATE', title: 'Where is time being lost today?', intro: 'Disconnected tools create handovers, duplicate data and blind spots. I make those breaks visible.', benefit: 'Fewer manual handovers, clearer ownership and information available where people need it.' },
    'journey-solutions': { kicker: 'AILA · ARCHITECTURE', title: 'One system instead of isolated solutions.', intro: 'The right components are connected around your workflows—not the other way round.', benefit: 'Your organisation gains a dependable architecture that can grow with its requirements.' },
    verkaufssystem: { kicker: 'AILA · WEBSITE', title: 'A website that keeps working.', intro: 'A visit becomes a traceable journey from the first question through to an order.', benefit: 'Enquiries stay visible, next steps are clear and sales becomes more predictable.' },
    'marketing-engine': { kicker: 'AILA · MARKETING', title: 'Turn attention into a process.', intro: 'Channels, content and enquiries connect directly to sales and customer data.', benefit: 'Marketing becomes measurable by business contribution, not reach alone.' },
    'business-os': { kicker: 'AILA · PROCESSES', title: 'Workflows that reduce daily friction.', intro: 'Information, tasks and decisions remain in one shared context.', benefit: 'Teams coordinate less and act faster because status and ownership are always visible.' },
    'daten-intelligenz': { kicker: 'AILA · DATA & AI', title: 'Dependable data. Controlled AI.', intro: 'AI supports concrete work while roles, approvals and human oversight remain intact.', benefit: 'More speed without losing control—built on a shared and traceable data foundation.' },
    'journey-references': { kicker: 'AILA · PROJECTS', title: 'Real substance, made visible.', intro: 'Real projects demonstrate how strategy, design, development and operation come together.', benefit: 'You can assess the collaboration through concrete solutions rather than abstract promises.' },
    'journey-about': { kicker: 'AILA · HUMAN × AI', title: 'Experience decides. AI amplifies.', intro: 'Marcel brings context, judgement and accountability. I accelerate analysis, design and delivery.', benefit: 'The result is better-founded decisions, greater speed and one accountable partner from first conversation through operation.' },
    'journey-contact': { kicker: 'AILA · PROJECT START', title: 'Ready for the first useful step?', intro: 'A strong project starts with a clear question and a shared view of the current situation—not with a tool.', benefit: 'You receive an honest assessment, a realistic next step and clarity on effort and impact.' },
  },
};

const COMMON = {
  de: {
    prompts: ['Was kann Marcel für mein Unternehmen tun?', 'Wie verbindet ihr Erfahrung und KI?', 'Wie starten wir?'],
    welcome: 'Frag mich frei zu Marcels Leistungen, Arbeitsweise oder zu deinem digitalen Vorhaben.',
    placeholder: 'Deine Frage an AILA …', send: 'Frage senden', micStart: 'Frage einsprechen', micStop: 'Aufnahme beenden',
    thinking: 'AILA denkt nach …', listening: 'AILA hört zu …', voiceOn: 'KI-Stimme ausschalten', voiceOff: 'KI-Stimme einschalten',
    error: 'Das hat gerade nicht funktioniert. Versuche es bitte noch einmal oder besprich dein Anliegen direkt mit Marcel.',
    unsupported: 'Die Sprachaufnahme wird von diesem Browser nicht unterstützt.',
    next: 'Nächstes Kapitel', contact: 'Mit Marcel sprechen', close: 'AILA schliessen',
  },
  en: {
    prompts: ['What could Marcel do for my company?', 'How do you combine experience and AI?', 'How do we begin?'],
    welcome: 'Ask me anything about Marcel’s services, his way of working or your digital project.',
    placeholder: 'Your question for AILA …', send: 'Send question', micStart: 'Record a question', micStop: 'Stop recording',
    thinking: 'AILA is thinking …', listening: 'AILA is listening …', voiceOn: 'Turn AI voice off', voiceOff: 'Turn AI voice on',
    error: 'That did not work just now. Please try again or discuss your question directly with Marcel.',
    unsupported: 'Voice recording is not supported by this browser.',
    next: 'Next chapter', contact: 'Talk to Marcel', close: 'Close AILA',
  },
} as const;

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };
type AilaConversationState = 'thinking' | 'speaking' | 'idle';

const messageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AilaGuide({
  open,
  lang,
  sectionId,
  position,
  nextSectionId,
  onClose,
  onStateChange,
  onNavigate,
}: {
  open: boolean;
  lang: ExperienceLang;
  sectionId: string;
  position: { x: number; y: number };
  nextSectionId: string;
  onClose: () => void;
  onStateChange: (state: AilaConversationState) => void;
  onNavigate: (target: string) => void;
}) {
  const entry = GUIDE[lang][sectionId] ?? GUIDE[lang]['journey-start'];
  const common = COMMON[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnswer, setLastAnswer] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const stopAudio = (announceIdle = true) => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = '';
    }
    if (announceIdle) onStateChange('idle');
  };

  const stopRecorder = () => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  };

  useEffect(() => {
    if (!open) return;
    setMessages([{ id: messageId(), role: 'assistant', content: common.welcome }]);
    setInput('');
    setBusy(false);
    setLastAnswer('');
  }, [open, sectionId, lang, common.welcome]);

  useEffect(() => {
    if (open) return;
    requestRef.current?.abort();
    requestRef.current = null;
    stopAudio(false);
    stopRecorder();
  }, [open]);

  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => {
    requestRef.current?.abort();
    stopAudio(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  if (!open) return null;

  const speak = async (text: string) => {
    if (!voiceEnabled || !text) {
      onStateChange('idle');
      return;
    }
    stopAudio(false);
    try {
      const response = await fetch('/api/aila/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });
      if (!response.ok) throw new Error('speech failed');
      const url = URL.createObjectURL(await response.blob());
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopAudio(true);
      audio.onerror = () => stopAudio(true);
      await audio.play();
      onStateChange('speaking');
    } catch {
      stopAudio(true);
    }
  };

  const ask = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || busy) return;
    stopAudio(false);
    const prior = messages.filter((message) => message.content !== common.welcome);
    const userMessage: ChatMessage = { id: messageId(), role: 'user', content: question };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setBusy(true);
    onStateChange('thinking');
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch('/api/aila/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          lang,
          sectionId,
          history: prior.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok || typeof payload?.answer !== 'string') throw new Error(payload?.error || 'chat failed');
      const answer = payload.answer.trim();
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: answer }]);
      setLastAnswer(answer);
      setBusy(false);
      await speak(answer);
    } catch {
      if (controller.signal.aborted) return;
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.error }]);
      setBusy(false);
      onStateChange('idle');
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.unsupported }]);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        if (!blob.size) return;
        setBusy(true);
        onStateChange('thinking');
        try {
          const form = new FormData();
          form.append('audio', new File([blob], `aila-question.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`, { type: blob.type }));
          form.append('lang', lang);
          const response = await fetch('/api/aila/transcribe', { method: 'POST', body: form });
          const payload = await response.json();
          if (!response.ok || typeof payload?.text !== 'string') throw new Error('transcription failed');
          setBusy(false);
          await ask(payload.text);
        } catch {
          setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.error }]);
          setBusy(false);
          onStateChange('idle');
        }
      };
      recorder.start();
      setRecording(true);
      onStateChange('idle');
    } catch {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.unsupported }]);
      onStateChange('idle');
    }
  };

  const close = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    stopAudio(true);
    stopRecorder();
    onClose();
  };

  return (
    <aside
      className={styles.ailaGuide}
      style={{ '--aila-guide-x': `${position.x}px`, '--aila-guide-y': `${position.y}px` } as CSSProperties}
      role="dialog"
      aria-label="AILA"
      aria-modal="false"
    >
      <header>
        <div><span>{entry.kicker}</span><i>LIVE</i></div>
        <div className={styles.ailaGuideControls}>
          <button type="button" onClick={() => { setVoiceEnabled((current) => !current); if (voiceEnabled) stopAudio(true); }} aria-label={voiceEnabled ? common.voiceOn : common.voiceOff} title={voiceEnabled ? common.voiceOn : common.voiceOff}>
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button type="button" onClick={close} aria-label={common.close}><X size={16} /></button>
        </div>
      </header>
      <h2>{entry.title}</h2>
      <p>{entry.intro}</p>

      <div className={styles.ailaGuidePrompts} aria-label={lang === 'de' ? 'Fragen an AILA' : 'Questions for AILA'}>
        {common.prompts.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => void ask(suggestion)} disabled={busy}>{suggestion}</button>
        ))}
      </div>

      <div ref={historyRef} className={styles.ailaGuideConversation} aria-live="polite" aria-label={lang === 'de' ? 'Gespräch mit AILA' : 'Conversation with AILA'}>
        {messages.map((message) => (
          <div key={message.id} className={styles.ailaGuideMessage} data-role={message.role}>
            <span>{message.role === 'assistant' ? 'AILA' : lang === 'de' ? 'DU' : 'YOU'}</span>
            <p>{message.content}</p>
            {message.role === 'assistant' && message.content === lastAnswer && voiceEnabled && !busy && (
              <button type="button" onClick={() => void speak(message.content)} aria-label={lang === 'de' ? 'Antwort vorlesen' : 'Read answer aloud'}><Volume2 size={13} /></button>
            )}
          </div>
        ))}
        {busy && <div className={styles.ailaGuideThinking}><LoaderCircle size={14} />{common.thinking}</div>}
      </div>

      <form className={styles.ailaGuideComposer} onSubmit={submit}>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={recording ? common.listening : common.placeholder} rows={2} maxLength={1200} disabled={busy || recording} onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(input); }
        }} />
        <button type="button" data-recording={recording ? 'true' : 'false'} onClick={() => void toggleRecording()} disabled={busy} aria-label={recording ? common.micStop : common.micStart} title={recording ? common.micStop : common.micStart}><Mic size={17} /></button>
        <button type="submit" disabled={busy || recording || !input.trim()} aria-label={common.send} title={common.send}><Send size={16} /></button>
      </form>

      <footer>
        {sectionId !== 'journey-contact' && <button type="button" onClick={() => onNavigate(nextSectionId)}>{common.next}<ArrowRight size={14} /></button>}
        <button type="button" onClick={() => onNavigate('journey-contact')}>{common.contact}<ArrowRight size={14} /></button>
      </footer>
    </aside>
  );
}
