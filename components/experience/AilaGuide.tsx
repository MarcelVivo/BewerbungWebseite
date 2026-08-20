'use client';

import { ArrowRight, LoaderCircle, Mic, Send, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { buildAilaLeadObject, createInitialAilaSalesContext, sanitizeAilaSalesContext } from '@/app/lib/aila/engine';
import { trackWebsiteEvent } from '@/app/lib/analytics';
import { openJourneyLeadForm } from '@/app/lib/journeyNavigation';
import type {
  AilaAnimationState,
  AilaInputMode,
  AilaRecommendation,
  AilaSalesContext,
  AilaUiAction,
} from '@/app/lib/aila/types';
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
    prompts: ['Ich habe ein Unternehmen', 'Ich bin selbständig', 'Ich baue ein Start-up', 'Ich habe eine konkrete Idee', 'Ich möchte sehen, was möglich ist'],
    welcome: 'Hallo, ich bin AILA. Wie kann ich dir helfen? Ich finde mit dir heraus, was dein Unternehmen digital wirklich braucht.',
    placeholder: 'Deine Frage an AILA …', send: 'Frage senden', micStart: 'Frage einsprechen', micStop: 'Aufnahme beenden',
    thinking: 'AILA denkt nach …', listening: 'AILA hört zu …', voiceOn: 'KI-Stimme ausschalten', voiceOff: 'KI-Stimme einschalten',
    error: 'Das hat gerade nicht funktioniert. Versuche es bitte noch einmal oder besprich dein Anliegen direkt mit Marcel.',
    micPermission: 'Bitte erlaube den Mikrofonzugriff für diese Website und versuche es erneut.',
    micUnavailable: 'Es wurde kein verfügbares Mikrofon gefunden. Du kannst deine Frage weiterhin eintippen.',
    micSecure: 'Die Spracheingabe funktioniert nur über eine sichere HTTPS-Verbindung.',
    micUnsupported: 'Dieser Browser unterstützt die Spracheingabe leider nicht. Du kannst deine Frage weiterhin eintippen.',
    micError: 'Die Aufnahme konnte nicht gestartet werden. Prüfe den Mikrofonzugriff und versuche es erneut.',
    next: 'Nächstes Kapitel', contact: 'Mit Marcel sprechen', close: 'AILA schliessen',
  },
  en: {
    prompts: ['I run a company', 'I am self-employed', 'I am building a start-up', 'I have a specific idea', 'Show me what is possible'],
    welcome: 'Hello, I’m AILA. How can I help? Together we can find out what your business really needs digitally.',
    placeholder: 'Your question for AILA …', send: 'Send question', micStart: 'Record a question', micStop: 'Stop recording',
    thinking: 'AILA is thinking …', listening: 'AILA is listening …', voiceOn: 'Turn AI voice off', voiceOff: 'Turn AI voice on',
    error: 'That did not work just now. Please try again or discuss your question directly with Marcel.',
    micPermission: 'Please allow microphone access for this website and try again.',
    micUnavailable: 'No available microphone was found. You can still type your question.',
    micSecure: 'Voice input requires a secure HTTPS connection.',
    micUnsupported: 'This browser does not support voice input. You can still type your question.',
    micError: 'The recording could not be started. Check microphone access and try again.',
    next: 'Next chapter', contact: 'Talk to Marcel', close: 'Close AILA',
  },
} as const;

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };
type AilaConversationState = AilaAnimationState;
type WavRecorder = { stop: () => Promise<Blob>; cancel: () => void };

const messageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

const encodeWav = (chunks: Float32Array[], sampleRate: number) => {
  const sampleCount = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, sampleCount * 2, true);
  let offset = 44;
  chunks.forEach((chunk) => {
    for (let index = 0; index < chunk.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[index]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  });
  return new Blob([buffer], { type: 'audio/wav' });
};

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
  const [salesContext, setSalesContext] = useState<AilaSalesContext>(() => createInitialAilaSalesContext());
  const [quickReplies, setQuickReplies] = useState<string[]>([...common.prompts]);
  const [lastRecommendation, setLastRecommendation] = useState<AilaRecommendation | undefined>();
  const hasWelcomedRef = useRef(false);
  const wasOpenRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const primedAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef('');
  const speechRequestRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const wavRecorderRef = useRef<WavRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const stopAudio = (announceIdle = true) => {
    speechRequestRef.current?.abort();
    speechRequestRef.current = null;
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

  const discardPrimedAudio = () => {
    const audio = primedAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    primedAudioRef.current = null;
  };

  const stopRecorder = () => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    wavRecorderRef.current?.cancel();
    wavRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  };

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      trackWebsiteEvent('aila_opened', { station: sectionId });
    }
    wasOpenRef.current = open;
  }, [open, sectionId]);

  useEffect(() => {
    if (!open) return;
    if (!hasWelcomedRef.current) {
      hasWelcomedRef.current = true;
      setMessages([{ id: messageId(), role: 'assistant', content: common.welcome }]);
      setLastAnswer(common.welcome);
      setQuickReplies([...common.prompts]);
    }
    setInput('');
    setBusy(false);
    setVoiceEnabled(true);
  }, [open, sectionId, lang, common.welcome]);

  useEffect(() => {
    if (open) return;
    requestRef.current?.abort();
    requestRef.current = null;
    stopAudio(false);
    discardPrimedAudio();
    stopRecorder();
  }, [open]);

  useEffect(() => {
    const primeAudio = () => {
      discardPrimedAudio();
      const audio = new Audio(SILENT_WAV);
      audio.setAttribute('playsinline', '');
      primedAudioRef.current = audio;
      void audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => undefined);
    };
    window.addEventListener('aila:prime-audio', primeAudio);
    return () => window.removeEventListener('aila:prime-audio', primeAudio);
  }, []);

  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => {
    requestRef.current?.abort();
    stopAudio(false);
    discardPrimedAudio();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const speak = async (text: string, force = false) => {
    if ((!voiceEnabled && !force) || !text) {
      onStateChange('idle');
      return;
    }
    stopAudio(false);
    const controller = new AbortController();
    speechRequestRef.current = controller;
    try {
      const response = await fetch('/api/aila/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('speech failed');
      const url = URL.createObjectURL(await response.blob());
      audioUrlRef.current = url;
      const audio = primedAudioRef.current || new Audio();
      primedAudioRef.current = null;
      audio.src = url;
      audio.setAttribute('playsinline', '');
      audioRef.current = audio;
      audio.onended = () => stopAudio(true);
      audio.onerror = () => stopAudio(true);
      await audio.play();
      onStateChange('speaking');
    } catch {
      stopAudio(true);
    } finally {
      if (speechRequestRef.current === controller) speechRequestRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void speak(common.welcome, true), 90);
    return () => window.clearTimeout(timer);
  }, [open, sectionId, lang, common.welcome]);

  if (!open) return null;

  const handleUiActions = (
    actions: AilaUiAction[],
    recommendation?: AilaRecommendation,
    context = salesContext,
  ) => {
    actions.forEach((action) => {
      window.dispatchEvent(new CustomEvent('aila:ui-action', {
        detail: { action, recommendation, context },
      }));
      if (action.type === 'OPEN_CONTACT') {
        const lead = buildAilaLeadObject(context);
        window.dispatchEvent(new CustomEvent('aila:handover', { detail: lead }));
        trackWebsiteEvent('aila_contact_requested', {
          metadata: { stage: context.currentStage, lead_temperature: context.leadTemperature },
        });
        trackWebsiteEvent('aila_handover', {
          metadata: { stage: context.currentStage, lead_temperature: context.leadTemperature },
        });
        openJourneyLeadForm('consultation', { ctaId: 'aila-contact-handover' });
      }
      if (action.type === 'OPEN_PROJECT_FLOW') {
        window.dispatchEvent(new CustomEvent('aila:handover', { detail: buildAilaLeadObject(context) }));
        trackWebsiteEvent('aila_handover', {
          metadata: { stage: context.currentStage, lead_temperature: context.leadTemperature },
        });
        openJourneyLeadForm('project', { ctaId: 'aila-project-flow' });
      }
      if (action.type === 'SHOW_SOLUTION' || action.type === 'SHOW_RECOMMENDATION') {
        trackWebsiteEvent('aila_solution_shown', {
          metadata: {
            stage: context.currentStage,
            lead_temperature: context.leadTemperature,
            service_count: recommendation?.services.length ?? 0,
          },
        });
      }
    });
  };

  const ask = async (rawQuestion: string, inputMode: AilaInputMode = 'text') => {
    const question = rawQuestion.trim();
    if (!question || busy) return;
    stopAudio(false);
    const prior = messages.filter((message) => message.content !== common.welcome);
    const userMessage: ChatMessage = { id: messageId(), role: 'user', content: question };
    setMessages((current) => [...current, userMessage]);
    trackWebsiteEvent('aila_message_sent', {
      station: sectionId,
      metadata: { input_mode: inputMode, stage: salesContext.currentStage },
    });
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
          inputMode,
          context: salesContext,
          history: prior.slice(-10).map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok || typeof payload?.answer !== 'string') throw new Error(payload?.error || 'chat failed');
      const answer = payload.answer.trim();
      const nextContext = sanitizeAilaSalesContext(payload?.context, salesContext);
      const recommendation = payload?.recommendation as AilaRecommendation | undefined;
      const actions = Array.isArray(payload?.uiActions) ? payload.uiActions as AilaUiAction[] : [];
      const nextReplies = Array.isArray(payload?.quickReplies)
        ? payload.quickReplies.filter((reply: unknown): reply is string => typeof reply === 'string' && Boolean(reply.trim())).slice(0, 4)
        : [];
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: answer }]);
      setSalesContext(nextContext);
      if (!salesContext.industry && nextContext.industry) {
        trackWebsiteEvent('aila_industry_detected', {
          metadata: { detected: true, stage: nextContext.currentStage },
        });
      }
      if (!salesContext.primaryProblem && nextContext.primaryProblem) {
        trackWebsiteEvent('aila_problem_detected', {
          metadata: { detected: true, stage: nextContext.currentStage },
        });
      }
      setQuickReplies(nextReplies);
      setLastRecommendation(recommendation);
      setLastAnswer(answer);
      setBusy(false);
      if (typeof payload?.animationState === 'string') {
        onStateChange(payload.animationState as AilaAnimationState);
      }
      handleUiActions(actions, recommendation, nextContext);
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

  const transcribeRecording = async (blob: Blob) => {
    setRecording(false);
    if (!blob.size) {
      onStateChange('idle');
      return;
    }
    setBusy(true);
    onStateChange('thinking');
    try {
      const form = new FormData();
      const extension = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm';
      form.append('audio', new File([blob], `aila-question.${extension}`, { type: blob.type }));
      form.append('lang', lang);
      const response = await fetch('/api/aila/transcribe', { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok || typeof payload?.text !== 'string' || !payload.text.trim()) throw new Error('transcription failed');
      setBusy(false);
      await ask(payload.text, 'voice');
    } catch {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.error }]);
      setBusy(false);
      onStateChange('idle');
    }
  };

  const startWavRecorder = async (stream: MediaStream) => {
    const AudioContextConstructor = window.AudioContext
      || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error('audio context unavailable');
    const context = new AudioContextConstructor();
    if (context.state === 'suspended') await context.resume();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const mutedOutput = context.createGain();
    const samples: Float32Array[] = [];
    const sampleRate = context.sampleRate;
    mutedOutput.gain.value = 0;
    processor.onaudioprocess = (event) => samples.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    source.connect(processor);
    processor.connect(mutedOutput);
    mutedOutput.connect(context.destination);
    let stopped = false;
    const disconnect = () => {
      processor.onaudioprocess = null;
      source.disconnect();
      processor.disconnect();
      mutedOutput.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    wavRecorderRef.current = {
      stop: async () => {
        if (stopped) return new Blob([], { type: 'audio/wav' });
        stopped = true;
        disconnect();
        await context.close();
        return encodeWav(samples, sampleRate);
      },
      cancel: () => {
        if (stopped) return;
        stopped = true;
        disconnect();
        void context.close();
      },
    };
  };

  const toggleRecording = async () => {
    if (recording) {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
        return;
      }
      if (wavRecorderRef.current) {
        const wavRecorder = wavRecorderRef.current;
        wavRecorderRef.current = null;
        await transcribeRecording(await wavRecorder.stop());
      }
      return;
    }
    if (!window.isSecureContext) {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.micSecure }]);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.micUnsupported }]);
      return;
    }
    try {
      trackWebsiteEvent('aila_voice_used', {
        station: sectionId,
        metadata: { stage: salesContext.currentStage },
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;
      let recorder: MediaRecorder | null = null;
      if (typeof MediaRecorder !== 'undefined') {
        try {
          const mimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm'];
          const mimeType = typeof MediaRecorder.isTypeSupported === 'function'
            ? mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ''
            : '';
          recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        } catch {
          recorder = null;
        }
      }
      if (recorder) {
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          recorderRef.current = null;
          await transcribeRecording(blob);
        };
        recorder.start(250);
      } else {
        await startWavRecorder(stream);
      }
      setRecording(true);
      onStateChange('listening');
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const name = error instanceof DOMException ? error.name : '';
      const content = name === 'NotAllowedError' || name === 'SecurityError'
        ? common.micPermission
        : name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError'
          ? common.micUnavailable
          : common.micError;
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content }]);
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
        {(quickReplies.length > 0 ? quickReplies : common.prompts).map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => void ask(suggestion, 'quick_reply')} disabled={busy}>{suggestion}</button>
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
        <button type="button" onClick={() => {
          window.dispatchEvent(new CustomEvent('aila:handover', { detail: buildAilaLeadObject(salesContext) }));
          trackWebsiteEvent('aila_contact_requested', { metadata: { stage: salesContext.currentStage, lead_temperature: salesContext.leadTemperature } });
          trackWebsiteEvent('aila_handover', { metadata: { stage: salesContext.currentStage, lead_temperature: salesContext.leadTemperature } });
          openJourneyLeadForm('consultation', { ctaId: 'aila-footer-contact' });
        }}>{common.contact}<ArrowRight size={14} /></button>
      </footer>
      {process.env.NODE_ENV !== 'production' && (
        <details className={styles.ailaGuideDebug}>
          <summary>AILA DEBUG</summary>
          <pre>{JSON.stringify({ salesContext, lastRecommendation }, null, 2)}</pre>
        </details>
      )}
    </aside>
  );
}
