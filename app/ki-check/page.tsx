'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Bot, Lock, ArrowRight } from 'lucide-react';

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
    section: '§ 01 · IHR UNTERNEHMEN',
    question: 'Wie viele Mitarbeitende hat Ihr Unternehmen?',
    options: ['1 bis 9', '10 bis 25', '26 bis 50', '51 bis 100', 'Über 100'],
  },
  {
    id: 'industry', type: 'single',
    section: '§ 02 · IHR UNTERNEHMEN',
    question: 'In welcher Branche ist Ihr Unternehmen tätig?',
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
    section: '§ 03 · IHR UNTERNEHMEN',
    question: 'Was ist Ihre Rolle im Unternehmen?',
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
    question: 'Welche Aufgaben kosten Sie oder Ihr Team täglich am meisten Zeit?',
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
    question: 'Wie viele Stunden pro Woche schätzen Sie, gehen für diese Aufgaben drauf?',
    options: ['Unter 5 Stunden', '5 bis 10 Stunden', '10 bis 20 Stunden', 'Über 20 Stunden'],
  },
  {
    id: 'knowledge', type: 'single',
    section: '§ 06 · WISSEN & PROZESSE',
    question: 'Was passiert mit dem Wissen Ihrer besten Mitarbeitenden, wenn sie krank sind oder gehen?',
    options: [
      'Ist dokumentiert und für alle zugänglich',
      'Teilweise dokumentiert, aber lückenhaft',
      'Steckt vor allem in den Köpfen einzelner Personen',
    ],
  },
  {
    id: 'ai-status', type: 'single',
    section: '§ 07 · KI-STATUS',
    question: 'Wie setzt Ihr Unternehmen aktuell KI ein?',
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
    question: 'Was hält Sie aktuell am meisten davon ab, KI einzusetzen?',
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
    question: 'Welche Ergebnisse würden Sie sich durch KI am meisten erhoffen?',
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
    question: 'Welches Ziel hat für Ihr Unternehmen in den nächsten 12 Monaten die höchste Priorität?',
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

// ─── Shared styles ────────────────────────────────────────────────────────────

const SERIF = { fontFamily: 'var(--font-playfair), Georgia, serif' };
const INPUT = 'w-full rounded-xl bg-[#1c1912] border border-[#2d2820] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none px-4 py-4 text-[#f4edd8] placeholder-[#7a6d5a] text-sm transition-colors';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KiCheckPage() {
  const [step, setStep]       = useState(0); // 0=intro, 1-10=questions, 11=form, 12=success
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [form, setForm]       = useState({ name: '', email: '', firma: '', telefon: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

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
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/ki-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, ...form }),
      });
      if (res.ok) setStep(12);
      else setError('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } catch {
      setError('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#0c0a06] flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-xl w-full text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#d4b86a] text-sm font-medium mb-8">
              <Bot size={14} /> Kostenloser Self-Check · 100% persönlich · Kein Verkaufsgespräch
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-5" style={SERIF}>
              Wie KI-ready ist{' '}
              <em className="not-italic text-[#c9a84c]">Ihr</em>{' '}
              Unternehmen?
            </h1>
            <p className="text-lg text-[#a89880] leading-relaxed mb-10 max-w-md mx-auto">
              Zehn Fragen. Drei Minuten.{' '}
              <span className="text-[#f4edd8]">Eine ehrliche Standortbestimmung</span>{' '}
              – und Ihr persönlicher KI-Fahrplan, gratis per E-Mail.
            </p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold text-lg transition-all shadow-lg shadow-[#c9a84c]/30 hover:shadow-[#c9a84c]/50 hover:scale-[1.02]"
            >
              Check starten <ArrowRight size={20} />
            </button>
            <div className="mt-10 flex items-center justify-center gap-10 text-[#7a6d5a] text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10</div>
                <div className="text-xs tracking-widest uppercase mt-0.5">Fragen</div>
              </div>
              <div className="w-px h-8 bg-[#2d2820]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-xs tracking-widest uppercase mt-0.5">Minuten</div>
              </div>
              <div className="w-px h-8 bg-[#2d2820]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Sofort</div>
                <div className="text-xs tracking-widest uppercase mt-0.5">Ergebnis</div>
              </div>
            </div>
          </div>
        </div>
        <div className="py-6 text-center">
          <Link href="/" className="text-[#7a6d5a] hover:text-[#a89880] text-sm transition-colors">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 12) {
    return (
      <div className="min-h-screen bg-[#0c0a06] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-lg w-full">
          <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-8">
            <Check size={36} className="text-[#c9a84c]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={SERIF}>
            Ihr KI-Fahrplan ist unterwegs.
          </h2>
          <p className="text-[#a89880] leading-relaxed mb-3">
            Ich habe Ihre Antworten ausgewertet. Innert{' '}
            <strong className="text-[#f4edd8]">24 Stunden</strong> melde ich mich persönlich
            bei Ihnen – nicht eine KI, sondern ich: Marcel Spahr.
          </p>
          <p className="text-[#7a6d5a] text-sm mb-10">
            Bitte prüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all"
          >
            Zur Startseite <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Contact Form ───────────────────────────────────────────────────────────
  if (step === 11) {
    return (
      <div className="min-h-screen bg-[#0c0a06] flex flex-col">
        <div className="h-1 bg-[#1c1912]">
          <div className="h-full bg-[#c9a84c] transition-all duration-500" style={{ width: '100%' }} />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">
              § 11 · IHR BERICHT
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight" style={SERIF}>
              Wohin dürfen wir Ihren{' '}
              <em className="not-italic text-[#c9a84c]">persönlichen</em>{' '}
              KI-Fahrplan schicken?
            </h2>
            <p className="text-[#a89880] text-sm mb-8 leading-relaxed">
              Ich werte Ihre Antworten persönlich aus und sende Ihnen konkrete
              Empfehlungen – zugeschnitten auf Ihr Unternehmen.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required type="text" placeholder="Ihr Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={INPUT}
              />
              <input
                required type="email" placeholder="name@firma.ch"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={INPUT}
              />
              <input
                required type="text" placeholder="Firmenname"
                value={form.firma}
                onChange={e => setForm(f => ({ ...f, firma: e.target.value }))}
                className={INPUT}
              />
              <input
                type="tel" placeholder="Telefon (optional)"
                value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className={INPUT}
              />
              {error && (
                <p className="text-sm text-[#c4897a] bg-[#c4897a]/10 rounded-xl px-4 py-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !form.name || !form.email || !form.firma}
                className="w-full py-4 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/20 mt-2"
              >
                {submitting ? 'Wird gesendet …' : 'Meinen KI-Fahrplan erhalten →'}
              </button>
            </form>
            <div className="mt-6 flex items-start gap-3 text-[#7a6d5a] text-xs leading-relaxed">
              <Lock size={12} className="flex-shrink-0 mt-0.5 text-[#c9a84c]" />
              <p>
                Ihre Daten werden ausschliesslich für die Erstellung und Zustellung Ihres
                KI-Fahrplans genutzt. Kein Verkauf, keine Weitergabe an Dritte.{' '}
                <Link href="/datenschutz" className="text-[#a89880] hover:text-[#c9a84c] underline transition-colors">
                  Datenschutz
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
            <ChevronLeft size={14} /> Zurück
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
    <div className="min-h-screen bg-[#0c0a06] flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-[#1c1912]">
        <div
          className="h-full bg-[#c9a84c] transition-all duration-500"
          style={{ width: `${(step / TOTAL) * 100}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="text-center py-4 text-[#7a6d5a] text-sm font-mono tracking-wider select-none">
        {String(step).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
      </div>

      {/* Question content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-6">
        <div className="max-w-xl w-full pt-4">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">
            {current.section}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight" style={SERIF}>
            {current.question}
          </h2>
          {current.hint && (
            <p className="text-[#7a6d5a] text-sm mb-6">{current.hint}</p>
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
                  <span className="text-sm leading-snug">{opt}</span>
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
              Weiter <ChevronRight size={16} />
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
          {step === 1 ? 'Startseite' : 'Zurück'}
        </button>
      </div>
    </div>
  );
}
