'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Bot, Lock, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useEmbeddedForm } from '../EmbeddedFormContext';
import { scrollToJourneyDestination } from '../lib/journeyNavigation';

// ─── Types & Data ────────────────────────────────────────────────────────────

type SingleStep = {
  id: string; type: 'single'; section: string; question: string; hint?: string; options: string[];
};
type MultiStep = {
  id: string; type: 'multi'; section: string; question: string; hint?: string; options: string[]; max?: number;
};
type QuizStep = SingleStep | MultiStep;

const STEPS: QuizStep[] = [
  {
    id: 'team-size', type: 'single',
    section: '§ 01 · DEIN UNTERNEHMEN',
    question: 'Wie viele Mitarbeitende hat dein Unternehmen?',
    options: ['1 bis 9', '10 bis 25', '26 bis 50', '51 bis 100', 'Über 100'],
  },
  {
    id: 'industry', type: 'single',
    section: '§ 02 · DEIN UNTERNEHMEN',
    question: 'In welcher Branche ist dein Unternehmen tätig?',
    options: [
      'Treuhand / Finanzen / Versicherung',
      'Rechtsberatung / Notariat',
      'Immobilien / Verwaltung',
      'Ingenieurwesen / Architektur / Planung',
      'Agentur / Marketing / Kommunikation',
      'Personalberatung / HR',
      'IT / Software / Technologie',
      'Gesundheitswesen / Pharma',
      'Handwerk / Bau / Gebäudetechnik',
      'Gastronomie / Hotellerie / Tourismus',
      'Handel / E-Commerce',
      'Andere Branche',
    ],
  },
  {
    id: 'role', type: 'single',
    section: '§ 03 · DEIN UNTERNEHMEN',
    question: 'Was ist deine Rolle im Unternehmen?',
    options: [
      'Inhaber/in oder Geschäftsführer/in',
      'Mitglied der Geschäftsleitung',
      'Abteilungsleiter/in',
      'Projektleiter/in oder Fachverantwortliche/r',
      'Andere Rolle',
    ],
  },
  {
    id: 'time-wasters', type: 'multi',
    section: '§ 04 · ZEITFRESSER',
    question: 'Welche Aufgaben kosten dich oder dein Team täglich am meisten Zeit?',
    hint: 'Mehrfachauswahl möglich',
    options: [
      'E-Mails beantworten und sortieren',
      'Dokumente suchen und zusammenstellen',
      'Offerten, Berichte oder Protokolle erstellen',
      'Kundenanfragen manuell bearbeiten',
      'Daten zwischen Systemen übertragen',
      'Interne Abstimmungen und Meetings',
      'Vertrieb, Akquise und Lead-Management',
      'Anderes',
    ],
  },
  {
    id: 'time-lost', type: 'single',
    section: '§ 05 · ZEITFRESSER',
    question: 'Wie viele Stunden pro Woche gehen schätzungsweise für diese Aufgaben drauf?',
    options: ['Unter 5 Stunden', '5 bis 10 Stunden', '10 bis 20 Stunden', 'Über 20 Stunden'],
  },
  {
    id: 'knowledge', type: 'single',
    section: '§ 06 · WISSEN & PROZESSE',
    question: 'Was passiert mit dem Wissen deiner besten Mitarbeitenden, wenn sie krank sind oder gehen?',
    options: [
      'Ist dokumentiert und für alle zugänglich',
      'Teilweise dokumentiert, aber lückenhaft',
      'Steckt vor allem in den Köpfen einzelner Personen',
    ],
  },
  {
    id: 'ai-status', type: 'single',
    section: '§ 07 · KI-STATUS',
    question: 'Wie setzt dein Unternehmen aktuell KI ein?',
    options: [
      'Gar nicht',
      'Einzelne Mitarbeitende experimentieren privat mit KI-Tools',
      'Wir nutzen KI punktuell, aber ohne klare Strategie',
      'KI ist in einzelnen Prozessen fest integriert',
      'KI ist integraler Bestandteil unserer Arbeitsweise',
    ],
  },
  {
    id: 'barriers', type: 'multi',
    section: '§ 08 · HÜRDEN',
    question: 'Was hält dich aktuell am meisten davon ab, KI einzusetzen?',
    hint: 'Mehrfachauswahl möglich',
    options: [
      'Gar nichts – wir sind startklar',
      'Wir wissen nicht, wo wir anfangen sollen',
      'Datenschutzbedenken',
      'Kein Budget dafür eingeplant',
      'Das Team ist skeptisch gegenüber KI',
      'Fehlende IT-Infrastruktur',
      'Anderes',
    ],
  },
  {
    id: 'expected-results', type: 'multi',
    section: '§ 09 · ZIELE',
    question: 'Welche Ergebnisse erhoffst du dir durch KI am meisten?',
    hint: 'Maximal 3 Optionen wählbar',
    max: 3,
    options: [
      'Schnellere Reaktionszeiten gegenüber Kunden',
      'Kürzere Durchlaufzeiten bei internen Prozessen',
      'Weniger Kosten durch Automatisierung',
      'Bessere Qualität und weniger Fehler',
      'Mitarbeitende von Routinearbeit entlasten',
      'Bessere Entscheidungen durch aufbereitete Daten',
      'Wachstum ermöglichen ohne proportional mehr Personal',
      'Anderes',
    ],
  },
  {
    id: 'top-priority', type: 'single',
    section: '§ 10 · ZIELE',
    question: 'Welches Ziel hat für dein Unternehmen in den nächsten 12 Monaten die höchste Priorität?',
    options: [
      'Umsatz steigern',
      'Kosten senken',
      'Qualität und Kundenzufriedenheit verbessern',
      'Wachstum skalierbar machen',
      'Mitarbeitende entlasten',
      'Anderes',
    ],
  },
];

const TOTAL = STEPS.length;

const KI_EN: Record<string, string> = {
  '§ 01 · DEIN UNTERNEHMEN': '§ 01 · YOUR BUSINESS', '§ 02 · DEIN UNTERNEHMEN': '§ 02 · YOUR BUSINESS',
  '§ 03 · DEIN UNTERNEHMEN': '§ 03 · YOUR BUSINESS', '§ 04 · ZEITFRESSER': '§ 04 · TIME DRAINS',
  '§ 05 · ZEITFRESSER': '§ 05 · TIME DRAINS', '§ 06 · WISSEN & PROZESSE': '§ 06 · KNOWLEDGE & PROCESSES',
  '§ 07 · KI-STATUS': '§ 07 · AI STATUS', '§ 08 · HÜRDEN': '§ 08 · BARRIERS',
  '§ 09 · ZIELE': '§ 09 · GOALS', '§ 10 · ZIELE': '§ 10 · GOALS',
  'Wie viele Mitarbeitende hat dein Unternehmen?': 'How many employees does your business have?',
  'In welcher Branche ist dein Unternehmen tätig?': 'What industry is your business in?',
  'Was ist deine Rolle im Unternehmen?': 'What is your role in the business?',
  'Welche Aufgaben kosten dich oder dein Team täglich am meisten Zeit?': 'Which tasks take up most of your or your team’s time each day?',
  'Wie viele Stunden pro Woche gehen schätzungsweise für diese Aufgaben drauf?': 'How many hours per week do you estimate are spent on these tasks?',
  'Was passiert mit dem Wissen deiner besten Mitarbeitenden, wenn sie krank sind oder gehen?': 'What happens to the knowledge of your best employees when they are absent or leave?',
  'Wie setzt dein Unternehmen aktuell KI ein?': 'How does your business currently use AI?',
  'Was hält dich aktuell am meisten davon ab, KI einzusetzen?': 'What is currently holding you back most from using AI?',
  'Welche Ergebnisse erhoffst du dir durch KI am meisten?': 'What results do you hope to achieve most with AI?',
  'Welches Ziel hat für dein Unternehmen in den nächsten 12 Monaten die höchste Priorität?': 'Which goal is the highest priority for your business over the next 12 months?',
  'Mehrfachauswahl möglich': 'Multiple selections possible', 'Maximal 3 Optionen wählbar': 'Select up to 3 options',
  '1 bis 9': '1 to 9', '10 bis 25': '10 to 25', '26 bis 50': '26 to 50', '51 bis 100': '51 to 100', 'Über 100': 'More than 100',
  'Treuhand / Finanzen / Versicherung': 'Fiduciary / finance / insurance', 'Rechtsberatung / Notariat': 'Legal services / notary',
  'Immobilien / Verwaltung': 'Real estate / property management', 'Ingenieurwesen / Architektur / Planung': 'Engineering / architecture / planning',
  'Agentur / Marketing / Kommunikation': 'Agency / marketing / communications', 'Personalberatung / HR': 'Recruitment / HR',
  'IT / Software / Technologie': 'IT / software / technology', 'Gesundheitswesen / Pharma': 'Healthcare / pharma',
  'Handwerk / Bau / Gebäudetechnik': 'Trades / construction / building services',
  'Gastronomie / Hotellerie / Tourismus': 'Hospitality / hotels / tourism', 'Handel / E-Commerce': 'Retail / e-commerce', 'Andere Branche': 'Other industry',
  'Inhaber/in oder Geschäftsführer/in': 'Owner or managing director', 'Mitglied der Geschäftsleitung': 'Executive management member',
  'Abteilungsleiter/in': 'Department head', 'Projektleiter/in oder Fachverantwortliche/r': 'Project manager or subject matter lead', 'Andere Rolle': 'Other role',
  'E-Mails beantworten und sortieren': 'Answering and sorting emails', 'Dokumente suchen und zusammenstellen': 'Finding and compiling documents',
  'Offerten, Berichte oder Protokolle erstellen': 'Creating quotes, reports or minutes', 'Kundenanfragen manuell bearbeiten': 'Handling customer inquiries manually',
  'Daten zwischen Systemen übertragen': 'Transferring data between systems', 'Interne Abstimmungen und Meetings': 'Internal coordination and meetings',
  'Vertrieb, Akquise und Lead-Management': 'Sales, acquisition and lead management', 'Anderes': 'Other',
  'Unter 5 Stunden': 'Under 5 hours', '5 bis 10 Stunden': '5 to 10 hours', '10 bis 20 Stunden': '10 to 20 hours', 'Über 20 Stunden': 'More than 20 hours',
  'Ist dokumentiert und für alle zugänglich': 'It is documented and accessible to everyone',
  'Teilweise dokumentiert, aber lückenhaft': 'Partially documented, but incomplete',
  'Steckt vor allem in den Köpfen einzelner Personen': 'It mostly resides in the heads of individual people',
  'Gar nicht': 'Not at all', 'Einzelne Mitarbeitende experimentieren privat mit KI-Tools': 'Individual employees experiment with AI tools on their own',
  'Wir nutzen KI punktuell, aber ohne klare Strategie': 'We use AI selectively, but without a clear strategy',
  'KI ist in einzelnen Prozessen fest integriert': 'AI is firmly integrated into individual processes',
  'KI ist integraler Bestandteil unserer Arbeitsweise': 'AI is an integral part of how we work',
  'Gar nichts – wir sind startklar': 'Nothing – we are ready to start', 'Wir wissen nicht, wo wir anfangen sollen': 'We do not know where to start',
  'Datenschutzbedenken': 'Data privacy concerns', 'Kein Budget dafür eingeplant': 'No budget allocated',
  'Das Team ist skeptisch gegenüber KI': 'The team is skeptical about AI', 'Fehlende IT-Infrastruktur': 'Insufficient IT infrastructure',
  'Schnellere Reaktionszeiten gegenüber Kunden': 'Faster response times for customers',
  'Kürzere Durchlaufzeiten bei internen Prozessen': 'Shorter turnaround times for internal processes',
  'Weniger Kosten durch Automatisierung': 'Lower costs through automation', 'Bessere Qualität und weniger Fehler': 'Better quality and fewer errors',
  'Mitarbeitende von Routinearbeit entlasten': 'Free employees from routine work',
  'Bessere Entscheidungen durch aufbereitete Daten': 'Better decisions through prepared data',
  'Wachstum ermöglichen ohne proportional mehr Personal': 'Enable growth without proportionally increasing headcount',
  'Umsatz steigern': 'Increase revenue', 'Kosten senken': 'Reduce costs',
  'Qualität und Kundenzufriedenheit verbessern': 'Improve quality and customer satisfaction',
  'Wachstum skalierbar machen': 'Make growth scalable', 'Mitarbeitende entlasten': 'Reduce employee workload',
};

const KI_UI = {
  de: {
    title: 'KI-Check | Digitalstudio Marcel Spahr', badge: 'Kostenloser Self-Check · 100% persönlich · Kein Verkaufsgespräch',
    headingA: 'Wie KI-ready ist', headingB: 'dein', headingC: 'Unternehmen?', introA: 'Zehn Fragen. Drei Minuten.',
    introB: 'Eine ehrliche Standortbestimmung', introC: '– und dein persönlicher KI-Fahrplan, gratis per E-Mail.',
    start: 'Check starten', questions: 'Fragen', minutes: 'Minuten', result: 'Ergebnis', immediate: 'Sofort', home: 'Zurück zur Startseite',
    successTitle: 'Dein KI-Fahrplan ist unterwegs.', success: 'Ich habe deine Antworten ausgewertet. Innerhalb von zwei Arbeitstagen melde ich mich persönlich bei dir – nicht eine KI, sondern ich: Marcel Spahr.',
    spam: 'Bitte prüfe auch deinen Spam-Ordner, falls du keine E-Mail erhältst.', toHome: 'Zur Startseite', report: '§ 11 · DEIN BERICHT',
    nextTitle: 'Was jetzt passiert', nextItems: ['Ich prüfe deine Antworten persönlich.', 'Du erhältst deinen individuellen KI-Fahrplan.', 'Danach klären wir, welche nächsten Schritte sinnvoll sind.'], viewReferences: 'Referenzen ansehen',
    formTitleA: 'Wohin darf ich deinen', formTitleB: 'persönlichen', formTitleC: 'KI-Fahrplan schicken?',
    formIntro: 'Ich werte deine Antworten persönlich aus und sende dir konkrete Empfehlungen – zugeschnitten auf dein Unternehmen.',
    name: 'Dein Name', company: 'Firmenname', phone: 'Telefon (optional)', sending: 'Wird gesendet …', submit: 'Meinen KI-Fahrplan erhalten →',
    privacy: 'Deine Daten werden ausschliesslich für die Erstellung und Zustellung deines KI-Fahrplans genutzt. Kein Verkauf, keine Weitergabe an Dritte.',
    privacyLink: 'Datenschutzerklärung', consentLead: 'Ich habe die ', consentTail: ' gelesen und stimme der Verarbeitung meiner Angaben zur Erstellung meines KI-Fahrplans zu.',
    requiredConsent: 'Bitte bestätige die Datenschutzerklärung.', back: 'Zurück', continue: 'Weiter', homepage: 'Startseite', error: 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.', connection: 'Verbindungsfehler. Bitte prüfe deine Internetverbindung.',
    requiredName: 'Bitte gib deinen Namen ein.', requiredEmail: 'Bitte gib deine E-Mail-Adresse ein.', invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.', requiredCompany: 'Bitte gib deinen Firmennamen ein.',
  },
  en: {
    title: 'AI Readiness Check | Marcel Spahr Digital Studio', badge: 'Free self-check · 100% personal · No sales call',
    headingA: 'How AI-ready is', headingB: 'your', headingC: 'business?', introA: 'Ten questions. Three minutes.',
    introB: 'An honest assessment', introC: '– and your personal AI roadmap, delivered free by email.',
    start: 'Start check', questions: 'Questions', minutes: 'Minutes', result: 'Result', immediate: 'Instant', home: 'Back to homepage',
    successTitle: 'Your AI roadmap is on its way.', success: 'I have reviewed your answers. I will contact you personally within two business days – not an AI, but me: Marcel Spahr.',
    spam: 'Please also check your spam folder if you do not receive an email.', toHome: 'Go to homepage', report: '§ 11 · YOUR REPORT',
    nextTitle: 'What happens next', nextItems: ['I personally review your answers.', 'You receive your individual AI roadmap.', 'Then we clarify which next steps make sense.'], viewReferences: 'View references',
    formTitleA: 'Where may I send your', formTitleB: 'personal', formTitleC: 'AI roadmap?',
    formIntro: 'I personally review your answers and send you concrete recommendations tailored to your business.',
    name: 'Your name', company: 'Company name', phone: 'Phone (optional)', sending: 'Sending …', submit: 'Receive my AI roadmap →',
    privacy: 'Your data is used exclusively to create and deliver your AI roadmap. No sales and no sharing with third parties.',
    privacyLink: 'privacy policy', consentLead: 'I have read the ', consentTail: ' and agree to the processing of my information to create my AI roadmap.',
    requiredConsent: 'Please confirm the privacy policy.', back: 'Back', continue: 'Continue', homepage: 'Homepage', error: 'An error occurred. Please try again.', connection: 'Connection error. Please check your internet connection.',
    requiredName: 'Please enter your name.', requiredEmail: 'Please enter your email address.', invalidEmail: 'Please enter a valid email address.', requiredCompany: 'Please enter your company name.',
  },
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const SITE_FONT = { fontFamily: 'var(--font-site)' };
const INPUT = 'w-full rounded-xl bg-[#1c1912] border border-[#2d2820] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none px-4 py-4 text-[#f4edd8] placeholder-[#7a6d5a] text-sm transition-colors';

function KiLanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="fixed top-4 right-4 z-20 flex overflow-hidden rounded-md border border-[#c9a84c]/30 bg-[#0c0a06]/80 backdrop-blur-md">
      <button onClick={() => setLang('de')} className={`px-3 py-1.5 text-xs font-bold ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880]'}`}>DE</button>
      <button onClick={() => setLang('en')} className={`px-3 py-1.5 text-xs font-bold ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880]'}`}>EN</button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KiCheckPage() {
  const embedded = useEmbeddedForm();
  const { lang } = useLanguage();
  const copy = KI_UI[lang];
  const tr = (text: string) => lang === 'en' ? (KI_EN[text] ?? text) : text;
  const [step, setStep]       = useState(0); // 0=intro, 1-10=questions, 11=form, 12=success
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [form, setForm]       = useState({ name: '', email: '', firma: '', telefon: '' });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (embedded) return;
    document.title = copy.title;
  }, [copy.title, embedded]);

  function setSingle(id: string, val: string) {
    setAnswers(prev => ({ ...prev, [id]: val }));
    setTimeout(() => setStep(s => s + 1), 260);
  }

  function toggleMulti(id: string, val: string, max?: number) {
    setAnswers(prev => {
      const cur = (prev[id] as string[]) ?? [];
      if (cur.includes(val)) return { ...prev, [id]: cur.filter(v => v !== val) };
      if (max && cur.length >= max) return prev;
      return { ...prev, [id]: [...cur, val] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError(copy.requiredName);
      return;
    }
    if (!form.email.trim()) {
      setError(copy.requiredEmail);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(copy.invalidEmail);
      return;
    }
    if (!form.firma.trim()) {
      setError(copy.requiredCompany);
      return;
    }
    if (!consent) {
      setError(copy.requiredConsent);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/ki-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, ...form, consent }),
      });
      if (res.ok) setStep(12);
      else setError(copy.error);
    } catch {
      setError(copy.connection);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className={`ki-check-page min-h-screen bg-[#0c0a06] flex flex-col ${embedded ? 'ki-check-embedded' : ''}`}>
        {!embedded && <KiLanguageToggle />}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-xl w-full text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#d4b86a] text-sm font-medium mb-8">
              <Bot size={14} /> {copy.badge}
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-5" style={SITE_FONT}>
              {copy.headingA}{' '}
              <em className="not-italic text-[#c9a84c]">{copy.headingB}</em>{' '}
              {copy.headingC}
            </h1>
            <p className="text-lg text-[#a89880] leading-relaxed mb-10 max-w-md mx-auto">
              {copy.introA}{' '}
              <span className="text-[#f4edd8]">{copy.introB}</span>{' '}
              {copy.introC}
            </p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold text-lg transition-all shadow-lg shadow-[#c9a84c]/30 hover:shadow-[#c9a84c]/50 hover:scale-[1.02]"
            >
              {copy.start} <ArrowRight size={20} />
            </button>
            <div className="mt-10 flex items-center justify-center gap-10 text-[#7a6d5a] text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10</div>
                <div className="text-xs tracking-widest uppercase mt-0.5">{copy.questions}</div>
              </div>
              <div className="w-px h-8 bg-[#2d2820]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-xs tracking-widest uppercase mt-0.5">{copy.minutes}</div>
              </div>
              <div className="w-px h-8 bg-[#2d2820]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{copy.immediate}</div>
                <div className="text-xs tracking-widest uppercase mt-0.5">{copy.result}</div>
              </div>
            </div>
          </div>
        </div>
        {!embedded && <div className="py-6 text-center">
          <Link href="/" className="text-[#7a6d5a] hover:text-[#a89880] text-sm transition-colors">
            ← {copy.home}
          </Link>
        </div>}
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 12) {
    return (
      <div className={`ki-check-page min-h-screen bg-[#0c0a06] flex flex-col items-center justify-center px-4 py-16 text-center ${embedded ? 'ki-check-embedded' : ''}`}>
        {!embedded && <KiLanguageToggle />}
        <div className="max-w-lg w-full">
          <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-8">
            <Check size={36} className="text-[#c9a84c]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={SITE_FONT}>
            {copy.successTitle}
          </h2>
          <p className="text-[#a89880] leading-relaxed mb-3">
            {copy.success}
          </p>
          <p className="text-[#7a6d5a] text-sm mb-10">
            {copy.spam}
          </p>
          <div className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-5 text-left space-y-2 mb-6">
            <p className="text-xs text-[#7a6d5a] font-bold uppercase tracking-widest">{copy.nextTitle}</p>
            {copy.nextItems.map((item, index) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#a89880]">
                <span className="w-5 h-5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
                {item}
              </div>
            ))}
          </div>
          {embedded && (
            <button
              type="button"
              onClick={() => scrollToJourneyDestination('references')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all"
            >
              {copy.viewReferences} <ChevronRight size={16} />
            </button>
          )}
          {!embedded && <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all"
          >
            {copy.toHome} <ChevronRight size={16} />
          </Link>}
        </div>
      </div>
    );
  }

  // ── Contact Form ───────────────────────────────────────────────────────────
  if (step === 11) {
    return (
      <div className={`ki-check-page min-h-screen bg-[#0c0a06] flex flex-col ${embedded ? 'ki-check-embedded' : ''}`}>
        {!embedded && <KiLanguageToggle />}
        <div className="h-1 bg-[#1c1912]">
          <div className="h-full bg-[#c9a84c] transition-all duration-500" style={{ width: '100%' }} />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">
              {copy.report}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight" style={SITE_FONT}>
              {copy.formTitleA}{' '}
              <em className="not-italic text-[#c9a84c]">{copy.formTitleB}</em>{' '}
              {copy.formTitleC}
            </h2>
            <p className="text-[#a89880] text-sm mb-8 leading-relaxed">
              {copy.formIntro}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <input
                required type="text" placeholder={copy.name}
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(null); }}
                className={INPUT}
              />
              <input
                required type="email" placeholder="name@firma.ch"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(null); }}
                className={INPUT}
              />
              <input
                required type="text" placeholder={copy.company}
                value={form.firma}
                onChange={e => { setForm(f => ({ ...f, firma: e.target.value })); setError(null); }}
                className={INPUT}
              />
              <input
                type="tel" placeholder={copy.phone}
                value={form.telefon}
                onChange={e => { setForm(f => ({ ...f, telefon: e.target.value })); setError(null); }}
                className={INPUT}
              />
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#2d2820] bg-[#100d09] px-4 py-3 text-xs leading-relaxed text-[#a89880]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => { setConsent(e.target.checked); setError(null); }}
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#c9a84c]"
                />
                <span>
                  {copy.consentLead}<Link href="/datenschutz" target="_blank" rel="noreferrer" className="text-[#d4b86a] underline underline-offset-2 transition-colors hover:text-[#f4edd8]">{copy.privacyLink}</Link>{copy.consentTail}
                </span>
              </label>
              {error && (
                <p className="text-sm text-[#d9788a] bg-[#a6425c]/10 rounded-xl px-4 py-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/20 mt-2"
              >
                {submitting ? copy.sending : copy.submit}
              </button>
            </form>
            <div className="mt-6 flex items-start gap-3 text-[#7a6d5a] text-xs leading-relaxed">
              <Lock size={12} className="flex-shrink-0 mt-0.5 text-[#c9a84c]" />
              <p>
                {copy.privacy}{' '}
                <Link href="/datenschutz" className="text-[#a89880] hover:text-[#c9a84c] underline transition-colors">
                  {copy.privacyLink}
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="py-6 text-center">
          <button
            onClick={() => setStep(10)}
            className="inline-flex items-center gap-1.5 text-[#7a6d5a] hover:text-[#a89880] text-sm transition-colors"
          >
            <ChevronLeft size={14} /> {copy.back}
          </button>
        </div>
      </div>
    );
  }

  // ── Question ───────────────────────────────────────────────────────────────
  const current = STEPS[step - 1];
  if (!current) return null;

  const isMulti      = current.type === 'multi';
  const multiSel     = isMulti ? ((answers[current.id] as string[]) ?? []) : [];
  const singleSel    = !isMulti ? ((answers[current.id] as string) ?? '') : '';
  const maxVal       = isMulti ? (current as MultiStep).max : undefined;
  const atMax        = isMulti && maxVal !== undefined && multiSel.length >= maxVal;
  const canContinue  = isMulti && multiSel.length > 0;

  return (
    <div className={`ki-check-page min-h-screen bg-[#0c0a06] flex flex-col ${embedded ? 'ki-check-embedded' : ''}`}>
      {!embedded && <KiLanguageToggle />}
      {/* Progress bar */}
      <div className="h-1 bg-[#1c1912]">
        <div
          className="h-full bg-[#c9a84c] transition-all duration-500"
          style={{ width: `${(step / TOTAL) * 100}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="text-center py-4 text-[#7a6d5a] text-sm tracking-wider select-none">
        {String(step).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
      </div>

      {/* Question content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-6">
        <div className="max-w-xl w-full pt-4">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">
            {tr(current.section)}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight" style={SITE_FONT}>
            {tr(current.question)}
          </h2>
          {current.hint && (
            <p className="text-[#7a6d5a] text-sm mb-6">{tr(current.hint)}</p>
          )}
          {!current.hint && <div className="mb-6" />}

          <div className="space-y-2.5">
            {current.options.map(opt => {
              const selected = isMulti ? multiSel.includes(opt) : singleSel === opt;
              const disabled = isMulti && atMax && !selected;

              return (
                <button
                  key={opt}
                  disabled={disabled}
                  onClick={() => {
                    if (isMulti) toggleMulti(current.id, opt, maxVal);
                    else setSingle(current.id, opt);
                  }}
                  className={`w-full flex items-center gap-4 text-left px-5 py-4 rounded-xl border transition-all duration-150 ${
                    selected
                      ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-white'
                      : disabled
                        ? 'border-[#2d2820] bg-[#1c1912] text-[#3d3525] cursor-not-allowed'
                        : 'border-[#2d2820] bg-[#1c1912] text-[#d4c4a8] hover:border-[#c9a84c]/40 hover:bg-[#221e14] cursor-pointer'
                  }`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 ${isMulti ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center transition-all ${
                    selected ? 'border-[#c9a84c] bg-[#c9a84c]' : 'border-[#3d3525]'
                  }`}>
                    {selected && <Check size={10} className="text-[#0c0a06]" strokeWidth={3} />}
                  </span>
                  <span className="text-sm leading-snug">{tr(opt)}</span>
                </button>
              );
            })}
          </div>

          {/* Multi-select continue button */}
          {isMulti && (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canContinue}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl border border-[#2d2820] bg-[#1c1912] hover:border-[#c9a84c]/40 hover:bg-[#221e14] disabled:opacity-30 disabled:cursor-not-allowed text-[#d4c4a8] hover:text-white text-sm font-medium transition-all"
            >
              {copy.continue} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Back navigation */}
      <div className="py-6 px-4 text-center">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          className="inline-flex items-center gap-1.5 text-[#7a6d5a] hover:text-[#a89880] text-sm transition-colors"
        >
          <ChevronLeft size={14} />
          {step === 1 ? copy.homepage : copy.back}
        </button>
      </div>
    </div>
  );
}
