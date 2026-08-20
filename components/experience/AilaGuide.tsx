'use client';

import { ArrowRight, X } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import type { ExperienceLang } from './content';
import styles from './experience.module.css';

type PromptId = 'benefit' | 'partnership' | 'start';

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
    prompts: { benefit: 'Was bringt das?', partnership: 'Wie arbeitet ihr zusammen?', start: 'Wie starten wir?' },
    partnership: 'Marcel prüft Ziele, Kontext und Konsequenzen. AILA verdichtet Informationen, erkennt Muster und beschleunigt die Ausarbeitung. Entscheidungen und Verantwortung bleiben beim Menschen.',
    start: 'Wir beginnen mit einem kompakten Gespräch über Ausgangslage, Ziele und Reibungspunkte. Danach erhältst du eine klare Empfehlung für den sinnvollsten nächsten Schritt.',
    response: 'AILAS EINORDNUNG', next: 'Weiter zum nächsten Kapitel', contact: 'Projekt besprechen', close: 'AILA schliessen',
  },
  en: {
    prompts: { benefit: 'What is the benefit?', partnership: 'How do you work together?', start: 'How do we begin?' },
    partnership: 'Marcel assesses goals, context and consequences. AILA condenses information, recognises patterns and accelerates development. Decisions and accountability remain human.',
    start: 'We begin with a focused conversation about the current situation, goals and friction points. You then receive a clear recommendation for the most useful next step.',
    response: 'AILA’S ASSESSMENT', next: 'Continue to the next chapter', contact: 'Discuss a project', close: 'Close AILA',
  },
} as const;

export default function AilaGuide({
  open,
  lang,
  sectionId,
  position,
  nextSectionId,
  onClose,
  onRespond,
  onNavigate,
}: {
  open: boolean;
  lang: ExperienceLang;
  sectionId: string;
  position: { x: number; y: number };
  nextSectionId: string;
  onClose: () => void;
  onRespond: () => void;
  onNavigate: (target: string) => void;
}) {
  const [prompt, setPrompt] = useState<PromptId>('benefit');
  const entry = GUIDE[lang][sectionId] ?? GUIDE[lang]['journey-start'];
  const common = COMMON[lang];

  useEffect(() => { if (open) setPrompt('benefit'); }, [open, sectionId]);

  if (!open) return null;

  const response = prompt === 'benefit' ? entry.benefit : prompt === 'partnership' ? common.partnership : common.start;
  const selectPrompt = (next: PromptId) => { setPrompt(next); onRespond(); };

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
        <button type="button" onClick={onClose} aria-label={common.close}><X size={16} /></button>
      </header>
      <h2>{entry.title}</h2>
      <p>{entry.intro}</p>

      <div className={styles.ailaGuidePrompts} aria-label={lang === 'de' ? 'Fragen an AILA' : 'Questions for AILA'}>
        {(Object.keys(common.prompts) as PromptId[]).map((id) => (
          <button key={id} type="button" data-active={prompt === id ? 'true' : 'false'} onClick={() => selectPrompt(id)}>{common.prompts[id]}</button>
        ))}
      </div>

      <div className={styles.ailaGuideResponse} aria-live="polite">
        <span>{common.response}</span>
        <p>{response}</p>
      </div>

      <footer>
        {sectionId !== 'journey-contact' && <button type="button" onClick={() => onNavigate(nextSectionId)}>{common.next}<ArrowRight size={14} /></button>}
        <button type="button" onClick={() => onNavigate('journey-contact')}>{common.contact}<ArrowRight size={14} /></button>
      </footer>
    </aside>
  );
}
