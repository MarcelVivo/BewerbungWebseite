'use client';

import { ArrowRight, AudioLines, Check, LoaderCircle, Send, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { buildAilaLeadObject, createInitialAilaSalesContext, sanitizeAilaSalesContext } from '@/app/lib/aila/engine';
import { trackWebsiteEvent } from '@/app/lib/analytics';
import type {
  AilaAnimationState,
  AilaInputMode,
  AilaRecommendation,
  AilaSalesContext,
  AilaUiAction,
} from '@/app/lib/aila/types';
import type { ExperienceLang } from './content';
import AilaContactCapture from './AilaContactCapture';
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
    placeholder: 'Deine Frage an AILA …', send: 'Frage senden', liveLabel: 'Mit AILA Sprechen', liveStop: 'Gespräch beenden',
    thinking: 'AILA denkt nach …', listening: 'AILA hört zu …', voiceOn: 'KI-Stimme ausschalten', voiceOff: 'KI-Stimme einschalten',
    error: 'Das hat gerade nicht funktioniert. Versuche es bitte noch einmal oder besprich dein Anliegen direkt mit Marcel.',
    micPermission: 'Bitte erlaube den Mikrofonzugriff für diese Website und versuche es erneut.',
    micUnavailable: 'Es wurde kein verfügbares Mikrofon gefunden. Du kannst deine Frage weiterhin eintippen.',
    micSecure: 'Die Spracheingabe funktioniert nur über eine sichere HTTPS-Verbindung.',
    micUnsupported: 'Dieser Browser unterstützt die Spracheingabe leider nicht. Du kannst deine Frage weiterhin eintippen.',
    micError: 'Das Live-Gespräch konnte nicht gestartet werden. Prüfe den Mikrofonzugriff und versuche es erneut.',
    offline: 'Du bist gerade offline. Ich behalte unseren bisherigen Gesprächskontext in dieser Browser-Sitzung und wir können weitermachen, sobald die Verbindung wieder da ist.',
    next: 'Nächstes Kapitel', contact: 'Mit Marcel sprechen', close: 'AILA schliessen',
    handoverKicker: 'PERSÖNLICH WEITER', handoverTitle: 'Kontakt mit Marcel aufnehmen',
    handoverText: 'Dein Gesprächskontext wird sicher übernommen. Du musst nichts nochmals erklären.',
    successTitle: 'Alles ist bei Marcel angekommen.', successText: 'Deine Kontaktdaten und das AILA-Gespräch wurden per E-Mail und im CRM übermittelt. Marcel meldet sich persönlich bei dir.',
    directSuccessText: 'Deine Kontaktdaten und dein Anliegen wurden per E-Mail und im CRM übermittelt. Marcel meldet sich persönlich bei dir.',
  },
  en: {
    prompts: ['I run a company', 'I am self-employed', 'I am building a start-up', 'I have a specific idea', 'Show me what is possible'],
    welcome: 'Hello, I’m AILA. How can I help? Together we can find out what your business really needs digitally.',
    placeholder: 'Your question for AILA …', send: 'Send question', liveLabel: 'Speak with AILA', liveStop: 'End conversation',
    thinking: 'AILA is thinking …', listening: 'AILA is listening …', voiceOn: 'Turn AI voice off', voiceOff: 'Turn AI voice on',
    error: 'That did not work just now. Please try again or discuss your question directly with Marcel.',
    micPermission: 'Please allow microphone access for this website and try again.',
    micUnavailable: 'No available microphone was found. You can still type your question.',
    micSecure: 'Voice input requires a secure HTTPS connection.',
    micUnsupported: 'This browser does not support voice input. You can still type your question.',
    micError: 'The live conversation could not be started. Check microphone access and try again.',
    offline: 'You are currently offline. I will keep our existing context in this browser session and we can continue as soon as the connection returns.',
    next: 'Next chapter', contact: 'Talk to Marcel', close: 'Close AILA',
    handoverKicker: 'CONTINUE PERSONALLY', handoverTitle: 'Contact Marcel',
    handoverText: 'Your conversation context is transferred securely. You will not need to explain everything again.',
    successTitle: 'Everything has reached Marcel.', successText: 'Your contact details and the AILA conversation were sent by email and stored in the CRM. Marcel will contact you personally.',
    directSuccessText: 'Your contact details and enquiry were sent by email and stored in the CRM. Marcel will contact you personally.',
  },
} as const;

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };
type AilaConversationState = AilaAnimationState;
type LiveStatus = 'off' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';
type RealtimeEvent = {
  type?: string;
  item_id?: string;
  transcript?: string;
  delta?: string;
  error?: { message?: string };
  response?: {
    output?: Array<{ id?: string; content?: Array<{ transcript?: string; text?: string }> }>;
  };
};

type StoredAilaSession = {
  messages: ChatMessage[];
  lastAnswer: string;
  quickReplies: string[];
  context: Partial<AilaSalesContext>;
};

const messageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

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
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('off');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnswer, setLastAnswer] = useState('');
  const [salesContext, setSalesContext] = useState<AilaSalesContext>(() => createInitialAilaSalesContext());
  const [quickReplies, setQuickReplies] = useState<string[]>([...common.prompts]);
  const [lastRecommendation, setLastRecommendation] = useState<AilaRecommendation | undefined>();
  const [contactMode, setContactMode] = useState<'idle' | 'form' | 'success'>('idle');
  const [compactDialog, setCompactDialog] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const hasWelcomedRef = useRef(false);
  const hasSpokenWelcomeRef = useRef(false);
  const wasOpenRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const primedAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef('');
  const speechRequestRef = useRef<AbortController | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const assistantDraftsRef = useRef<Map<string, string>>(new Map());
  const completedAssistantItemsRef = useRef<Set<string>>(new Set());
  const historyRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const hasConversationContext = messages.some((message) => message.role === 'user' && message.content.trim())
    || Boolean(salesContext.conversationSummary.trim());

  useEffect(() => {
    setSessionReady(false);
    hasWelcomedRef.current = false;
    hasSpokenWelcomeRef.current = false;
    try {
      const raw = sessionStorage.getItem(`ms-aila-session-${lang}`);
      if (raw) {
        const stored = JSON.parse(raw) as StoredAilaSession;
        const restoredMessages = Array.isArray(stored.messages)
          ? stored.messages.filter((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string').slice(-16)
          : [];
        if (restoredMessages.length) {
          setMessages(restoredMessages);
          setLastAnswer(typeof stored.lastAnswer === 'string' ? stored.lastAnswer : restoredMessages.at(-1)?.content || '');
          setQuickReplies(Array.isArray(stored.quickReplies) ? stored.quickReplies.filter((reply): reply is string => typeof reply === 'string').slice(0, 4) : []);
          setSalesContext(sanitizeAilaSalesContext(stored.context, createInitialAilaSalesContext()));
          hasWelcomedRef.current = true;
          hasSpokenWelcomeRef.current = true;
        } else {
          setMessages([]);
          setSalesContext(createInitialAilaSalesContext());
          setQuickReplies([...common.prompts]);
        }
      } else {
        setMessages([]);
        setSalesContext(createInitialAilaSalesContext());
        setQuickReplies([...common.prompts]);
      }
    } catch {
      setMessages([]);
      setSalesContext(createInitialAilaSalesContext());
      setQuickReplies([...common.prompts]);
    }
    setSessionReady(true);
  }, [lang, common.prompts]);

  useEffect(() => {
    if (!sessionReady || !messages.some((message) => message.role === 'user')) return;
    const {
      name: _name,
      company: _company,
      email: _email,
      phone: _phone,
      website: _website,
      consentToContact: _consentToContact,
      ...sessionContext
    } = salesContext;
    const stored: StoredAilaSession = {
      messages: messages.slice(-16),
      lastAnswer,
      quickReplies: quickReplies.slice(0, 4),
      context: sessionContext,
    };
    try { sessionStorage.setItem(`ms-aila-session-${lang}`, JSON.stringify(stored)); } catch {}
  }, [lang, lastAnswer, messages, quickReplies, salesContext, sessionReady]);

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

  const stopLiveConversation = (announceIdle = true) => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    assistantDraftsRef.current.clear();
    completedAssistantItemsRef.current.clear();
    setLiveStatus('off');
    setBusy(false);
    if (announceIdle) onStateChange('idle');
  };

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      trackWebsiteEvent('aila_opened', { station: sectionId });
    }
    wasOpenRef.current = open;
  }, [open, sectionId]);

  useEffect(() => {
    if (!open || !sessionReady) return;
    const query = window.matchMedia('(max-width: 700px), (max-width: 960px) and (hover: none) and (pointer: coarse)');
    const update = () => setCompactDialog(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [open, sessionReady]);

  useEffect(() => {
    if (!open || !compactDialog) return;

    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      rootOverflow: root.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
    };

    const syncViewport = () => {
      const viewport = window.visualViewport;
      root.style.setProperty('--aila-mobile-height', `${Math.round(viewport?.height ?? window.innerHeight)}px`);
      root.style.setProperty('--aila-mobile-top', `${Math.round(viewport?.offsetTop ?? 0)}px`);
    };

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    syncViewport();
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('orientationchange', syncViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
      root.style.removeProperty('--aila-mobile-height');
      root.style.removeProperty('--aila-mobile-top');
      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open, compactDialog]);

  useEffect(() => {
    if (!open || !sessionReady) return;
    if (!hasWelcomedRef.current) {
      hasWelcomedRef.current = true;
      setMessages([{ id: messageId(), role: 'assistant', content: common.welcome }]);
      setLastAnswer(common.welcome);
      setQuickReplies([...common.prompts]);
    }
    setInput('');
    setBusy(false);
    setVoiceEnabled(true);
  }, [open, sectionId, lang, common.welcome, sessionReady]);

  useEffect(() => {
    const openContact = () => {
      stopLiveConversation(false);
      setContactMode('form');
    };
    window.addEventListener('aila:open-contact-capture', openContact);
    return () => window.removeEventListener('aila:open-contact-capture', openContact);
  }, []);

  useEffect(() => {
    if (open) return;
    requestRef.current?.abort();
    requestRef.current = null;
    stopAudio(false);
    discardPrimedAudio();
    stopLiveConversation(false);
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
    stopLiveConversation(false);
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
    if (hasSpokenWelcomeRef.current) return;
    hasSpokenWelcomeRef.current = true;
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
        setContactMode('form');
      }
      if (action.type === 'OPEN_PROJECT_FLOW') {
        window.dispatchEvent(new CustomEvent('aila:handover', { detail: buildAilaLeadObject(context) }));
        trackWebsiteEvent('aila_handover', {
          metadata: { stage: context.currentStage, lead_temperature: context.leadTemperature },
        });
        setContactMode('form');
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

  const upsertRealtimeMessage = (
    id: string,
    role: ChatMessage['role'],
    content: string,
    append = false,
  ) => {
    if (!content) return;
    setMessages((current) => {
      const index = current.findIndex((message) => message.id === id);
      if (index < 0) return [...current, { id, role, content }];
      const next = [...current];
      next[index] = {
        ...next[index],
        content: append ? `${next[index].content}${content}` : content,
      };
      return next;
    });
  };

  const rememberLiveTurn = (role: ChatMessage['role'], content: string) => {
    setSalesContext((current) => ({
      ...current,
      currentStage: current.currentStage === 'welcome' ? 'identify_business' : current.currentStage,
      leadTemperature: current.leadTemperature === 'unknown' ? 'warm' : current.leadTemperature,
      conversationSummary: [
        current.conversationSummary,
        `${role === 'user' ? (lang === 'de' ? 'Besucher' : 'Visitor') : 'AILA'}: ${content}`,
      ].filter(Boolean).join('\n').slice(-6000),
    }));
  };

  const handleRealtimeEvent = (event: MessageEvent<string>) => {
    let payload: RealtimeEvent;
    try {
      payload = JSON.parse(event.data) as RealtimeEvent;
    } catch {
      return;
    }
    const type = payload.type || '';

    if (type === 'input_audio_buffer.speech_started') {
      setLiveStatus('listening');
      setBusy(false);
      onStateChange('listening');
      return;
    }
    if (type === 'input_audio_buffer.speech_stopped') {
      setLiveStatus('thinking');
      setBusy(true);
      onStateChange('thinking');
      return;
    }
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const transcript = payload.transcript?.trim();
      if (!transcript) return;
      const id = payload.item_id || messageId();
      upsertRealtimeMessage(id, 'user', transcript);
      rememberLiveTurn('user', transcript);
      setQuickReplies([]);
      trackWebsiteEvent('aila_message_sent', {
        station: sectionId,
        metadata: { input_mode: 'voice_live', stage: salesContext.currentStage },
      });
      return;
    }
    if (type === 'response.output_audio_transcript.delta' || type === 'response.audio_transcript.delta') {
      const delta = payload.delta || '';
      if (!delta) return;
      const id = payload.item_id || 'aila-live-response';
      assistantDraftsRef.current.set(id, `${assistantDraftsRef.current.get(id) || ''}${delta}`);
      upsertRealtimeMessage(id, 'assistant', delta, true);
      setLiveStatus('speaking');
      setBusy(false);
      onStateChange('speaking');
      return;
    }
    if (type === 'response.output_audio_transcript.done' || type === 'response.audio_transcript.done') {
      const id = payload.item_id || 'aila-live-response';
      const transcript = payload.transcript?.trim() || assistantDraftsRef.current.get(id)?.trim();
      if (!transcript) return;
      upsertRealtimeMessage(id, 'assistant', transcript);
      assistantDraftsRef.current.delete(id);
      completedAssistantItemsRef.current.add(id);
      setLastAnswer(transcript);
      rememberLiveTurn('assistant', transcript);
      return;
    }
    if (type === 'response.done') {
      payload.response?.output?.forEach((item) => {
        const transcript = item.content
          ?.map((part) => part.transcript || part.text || '')
          .join(' ')
          .trim();
        if (!transcript) return;
        const id = item.id || messageId();
        upsertRealtimeMessage(id, 'assistant', transcript);
        if (!completedAssistantItemsRef.current.has(id)) rememberLiveTurn('assistant', transcript);
        completedAssistantItemsRef.current.add(id);
        assistantDraftsRef.current.delete(id);
        setLastAnswer(transcript);
      });
      setLiveStatus('listening');
      setBusy(false);
      onStateChange('listening');
      return;
    }
    if (type === 'error') {
      console.error('AILA realtime event error', payload.error?.message || 'unknown error');
      setLiveStatus('error');
      setBusy(false);
      onStateChange('idle');
    }
  };

  const startLiveConversation = async () => {
    if (liveStatus !== 'off' && liveStatus !== 'error') return;
    if (!navigator.onLine) {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.offline }]);
      return;
    }
    if (!window.isSecureContext) {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.micSecure }]);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: common.micUnsupported }]);
      return;
    }

    stopAudio(false);
    setLiveStatus('connecting');
    setBusy(true);
    onStateChange('thinking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      remoteAudio.muted = !voiceEnabled;
      remoteAudio.setAttribute('playsinline', '');
      remoteAudioRef.current = remoteAudio;
      peerConnection.ontrack = (trackEvent) => {
        remoteAudio.srcObject = trackEvent.streams[0];
        void remoteAudio.play().catch(() => undefined);
      };
      stream.getAudioTracks().forEach((track) => peerConnection.addTrack(track, stream));

      const dataChannel = peerConnection.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleRealtimeEvent;
      dataChannel.onopen = () => {
        messages.slice(-8).forEach((message) => {
          dataChannel.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: message.role,
              content: [{
                type: message.role === 'user' ? 'input_text' : 'output_text',
                text: message.content,
              }],
            },
          }));
        });
        setLiveStatus('listening');
        setBusy(false);
        setQuickReplies([]);
        onStateChange('listening');
        trackWebsiteEvent('aila_voice_used', {
          station: sectionId,
          metadata: { mode: 'realtime', stage: salesContext.currentStage },
        });
      };
      dataChannel.onerror = () => {
        setLiveStatus('error');
        setBusy(false);
      };
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
          stopLiveConversation();
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      const response = await fetch(`/api/aila/realtime?lang=${lang}&sectionId=${encodeURIComponent(sectionId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      if (!response.ok) throw new Error('realtime session failed');
      await peerConnection.setRemoteDescription({ type: 'answer', sdp: await response.text() });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      const content = name === 'NotAllowedError' || name === 'SecurityError'
        ? common.micPermission
        : name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError'
          ? common.micUnavailable
          : common.micError;
      stopLiveConversation(false);
      setLiveStatus('error');
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content }]);
      onStateChange('idle');
    }
  };

  const ask = async (rawQuestion: string, inputMode: AilaInputMode = 'text') => {
    const question = rawQuestion.trim();
    if (!question || (busy && liveStatus === 'off')) return;
    if (!navigator.onLine) {
      setMessages((current) => [
        ...current.filter((message) => message.content !== common.welcome),
        { id: messageId(), role: 'user', content: question },
        { id: messageId(), role: 'assistant', content: common.offline },
      ]);
      setInput('');
      setLastAnswer(common.offline);
      setQuickReplies([]);
      return;
    }
    if (liveStatus !== 'off' && dataChannelRef.current?.readyState === 'open') {
      const userMessage: ChatMessage = { id: messageId(), role: 'user', content: question };
      setMessages((current) => [...current, userMessage]);
      rememberLiveTurn('user', question);
      setInput('');
      setQuickReplies([]);
      setLiveStatus('thinking');
      setBusy(true);
      onStateChange('thinking');
      if (liveStatus === 'speaking') {
        dataChannelRef.current.send(JSON.stringify({ type: 'response.cancel' }));
      }
      dataChannelRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: question }] },
      }));
      dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
      return;
    }
    stopAudio(false);
    const prior = messages.filter((message) => message.content !== common.welcome);
    const userMessage: ChatMessage = { id: messageId(), role: 'user', content: question };
    setMessages((current) => [
      ...current.filter((message) => message.content !== common.welcome),
      userMessage,
    ]);
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

  const close = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    stopAudio(true);
    stopLiveConversation();
    onClose();
  };

  return (
    <aside
      className={styles.ailaGuide}
      style={{ '--aila-guide-x': `${position.x}px`, '--aila-guide-y': `${position.y}px` } as CSSProperties}
      role="dialog"
      aria-label="AILA"
      aria-modal={compactDialog ? 'true' : 'false'}
      data-mobile-dialog={compactDialog ? 'true' : 'false'}
    >
      <header>
        <div><span>{entry.kicker}</span><i>LIVE</i></div>
        <div className={styles.ailaGuideControls}>
          <button type="button" onClick={() => {
            const nextVoiceEnabled = !voiceEnabled;
            setVoiceEnabled(nextVoiceEnabled);
            if (remoteAudioRef.current) remoteAudioRef.current.muted = !nextVoiceEnabled;
            if (!nextVoiceEnabled) stopAudio(true);
          }} aria-label={voiceEnabled ? common.voiceOn : common.voiceOff} title={voiceEnabled ? common.voiceOn : common.voiceOff}>
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button type="button" onClick={close} aria-label={common.close}><X size={16} /></button>
        </div>
      </header>
      {contactMode === 'form' ? (
        <AilaContactCapture
          lang={lang}
          lead={buildAilaLeadObject(salesContext)}
          recommendation={lastRecommendation}
          conversation={messages}
          onBack={() => setContactMode('idle')}
          onSuccess={(contact) => {
            setSalesContext((current) => ({
              ...current,
              ...contact,
              company: contact.company || current.company,
              consentToContact: true,
              previousStage: current.currentStage,
              currentStage: 'handover',
              nextBestAction: 'open_contact',
              leadTemperature: 'hot',
            }));
            setContactMode('success');
            onStateChange('success');
          }}
        />
      ) : contactMode === 'success' ? (
        <div className={styles.ailaContactSuccess} role="status">
          <span><Check size={22} /></span>
          <h3>{common.successTitle}</h3>
          <p>{hasConversationContext ? common.successText : common.directSuccessText}</p>
          <button type="button" onClick={close}>{common.close}<ArrowRight size={14} /></button>
        </div>
      ) : (
        <>
          <h2>{entry.title}</h2>
          <p>{entry.intro}</p>

          <div ref={historyRef} className={styles.ailaGuideConversation} aria-live="polite" aria-label={lang === 'de' ? 'Gespräch mit AILA' : 'Conversation with AILA'}>
            {messages.slice(-2).map((message) => (
              <div key={message.id} className={styles.ailaGuideMessage} data-role={message.role}>
                <span>{message.role === 'assistant' ? 'AILA' : lang === 'de' ? 'DU' : 'YOU'}</span>
                <p>{message.content}</p>
                {message.role === 'assistant' && message.content === lastAnswer && voiceEnabled && !busy && liveStatus === 'off' && (
                  <button type="button" onClick={() => void speak(message.content)} aria-label={lang === 'de' ? 'Antwort vorlesen' : 'Read answer aloud'}><Volume2 size={13} /></button>
                )}
              </div>
            ))}
            {busy && liveStatus === 'off' && <div className={styles.ailaGuideThinking}><LoaderCircle size={14} />{common.thinking}</div>}
          </div>

          {quickReplies.length > 0 && (
            <div className={styles.ailaGuidePrompts} aria-label={lang === 'de' ? 'Fragen an AILA' : 'Questions for AILA'}>
              {quickReplies.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void ask(suggestion, 'quick_reply')} disabled={busy}>{suggestion}</button>
              ))}
            </div>
          )}

          {messages.some((message) => message.role === 'user') && !busy && (
            <button type="button" className={styles.ailaGuideHandoverCta} onClick={() => {
              stopLiveConversation(false);
              setContactMode('form');
              trackWebsiteEvent('aila_contact_requested', { metadata: { stage: salesContext.currentStage, lead_temperature: salesContext.leadTemperature } });
            }}>
              <span>{common.handoverKicker}</span>
              <strong>{common.handoverTitle}</strong>
              <small>{common.handoverText}</small>
              <ArrowRight size={18} />
            </button>
          )}

          <button
            type="button"
            className={styles.ailaLiveConversation}
            data-state={liveStatus}
            onClick={() => liveStatus === 'off' || liveStatus === 'error'
              ? void startLiveConversation()
              : stopLiveConversation()}
            aria-label={liveStatus === 'off' || liveStatus === 'error' ? common.liveLabel : common.liveStop}
            title={liveStatus === 'off' || liveStatus === 'error' ? common.liveLabel : common.liveStop}
          >
            <span className={styles.ailaLiveSignal} aria-hidden="true">
              {liveStatus === 'connecting' ? <LoaderCircle size={17} /> : <AudioLines size={17} />}
            </span>
            <strong>{common.liveLabel}</strong>
          </button>

          <form className={styles.ailaGuideComposer} onSubmit={submit}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={common.placeholder} rows={2} maxLength={1200} disabled={busy && liveStatus === 'off'} onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(input); }
            }} />
            <button type="submit" disabled={(busy && liveStatus === 'off') || !input.trim()} aria-label={common.send} title={common.send}><Send size={16} /></button>
          </form>

          <footer>
            {sectionId !== 'journey-contact' && <button type="button" onClick={() => onNavigate(nextSectionId)}>{common.next}<ArrowRight size={14} /></button>}
            <button type="button" onClick={() => {
              stopLiveConversation(false);
              window.dispatchEvent(new CustomEvent('aila:handover', { detail: buildAilaLeadObject(salesContext) }));
              trackWebsiteEvent('aila_contact_requested', { metadata: { stage: salesContext.currentStage, lead_temperature: salesContext.leadTemperature } });
              setContactMode('form');
            }}>{common.contact}<ArrowRight size={14} /></button>
          </footer>
        </>
      )}
      {process.env.NODE_ENV !== 'production' && (
        <details className={styles.ailaGuideDebug}>
          <summary>AILA DEBUG</summary>
          <pre>{JSON.stringify({ salesContext, lastRecommendation }, null, 2)}</pre>
        </details>
      )}
    </aside>
  );
}
