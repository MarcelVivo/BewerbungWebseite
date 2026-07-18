'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, Check, Plus, X,
  CheckCircle2, Mail, Phone, Building2, User,
  Sparkles, Home, Code2, Landmark, HardHat, HeartPulse,
  UtensilsCrossed, ShoppingBag, Users, BookOpen, Settings,
  Globe, RefreshCw, Zap, TrendingUp, Bot, Smartphone,
  ShoppingCart, GraduationCap, Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────

const BRANCHEN: { label: string; icon: LucideIcon }[] = [
  { label: 'Beauty & Wellness',    icon: Sparkles },
  { label: 'Immobilien',           icon: Home },
  { label: 'IT & Software',        icon: Code2 },
  { label: 'Finanzwesen',          icon: Landmark },
  { label: 'Baubranche',           icon: HardHat },
  { label: 'Gesundheit & Medizin', icon: HeartPulse },
  { label: 'Gastronomie & Food',   icon: UtensilsCrossed },
  { label: 'E-Commerce & Retail',  icon: ShoppingBag },
  { label: 'NGO & Verein',         icon: Users },
  { label: 'Bildung & Training',   icon: BookOpen },
  { label: 'Sonstiges',            icon: Settings },
];

const PROJEKTTYPEN: { label: string; icon: LucideIcon; desc: string }[] = [
  { label: 'Neue Website',        icon: Globe,         desc: 'Professioneller Online-Auftritt von Grund auf' },
  { label: 'Website Redesign',    icon: RefreshCw,     desc: 'Bestehende Website modernisieren' },
  { label: 'Prozessoptimierung',  icon: Zap,           desc: 'Abläufe digitalisieren & automatisieren' },
  { label: 'Marketing Strategie', icon: TrendingUp,    desc: 'Mehr Sichtbarkeit & qualifizierte Leads' },
  { label: 'KI-Integration',      icon: Bot,           desc: 'KI-Tools in Ihr Unternehmen integrieren' },
  { label: 'App / Plattform',     icon: Smartphone,    desc: 'Massgeschneiderte Software-Lösung' },
  { label: 'E-Commerce Shop',     icon: ShoppingCart,  desc: 'Online verkaufen & Zahlungen abwickeln' },
  { label: 'Workshop / Training', icon: GraduationCap, desc: 'Schulung für Ihr Team' },
  { label: 'Sonstiges',           icon: Wrench,        desc: 'Anderes Projekt' },
];

const ANF_SEGMENT: Record<string, string[]> = {
  'Beauty & Wellness':    ['Online-Buchungssystem', 'Vorher/Nachher Galerie', 'Preisliste', 'Team-Präsentation', 'Kundenbewertungen', 'Online-Shop', 'Gutscheine', 'Newsletter'],
  'Immobilien':           ['Objektsuche / Filter', 'Exposé-Ansicht', 'Kontaktformular', '360° Rundgang', 'Grundriss-Upload', 'Karten-Integration', 'Interessentenanfragen'],
  'IT & Software':        ['Demo / Trial Anfrage', 'Kundenportal', 'Support & Ticketing', 'Preistabelle', 'Integrationen & APIs', 'Dokumentation'],
  'Finanzwesen':          ['Beratungsanfrage', 'Rechner-Tool', 'FAQ-Bereich', 'Terminbuchung', 'Formulare & Downloads', 'Mehrsprachigkeit'],
  'Baubranche':           ['Referenzprojekte', 'Leistungsübersicht', 'Angebotsanfrage', 'Team & Kontakt', 'Jobs / Karriere', 'Zertifikate & Nachweise'],
  'Gesundheit & Medizin': ['Online-Terminbuchung', 'Leistungen & Fachgebiete', 'Team / Ärzte', 'Patienteninformationen', 'Notfallinfos', 'Anfahrt & Lageplan'],
  'Gastronomie & Food':   ['Online-Reservierung', 'Speisekarte', 'Bestellsystem', 'Catering & Events', 'Lieferservice', 'Gutscheine'],
  'E-Commerce & Retail':  ['Produktkatalog', 'Warenkorb & Checkout', 'Filterfunktion', 'Kundenkonto', 'Lagerverwaltung', 'Rabattcodes'],
  'NGO & Verein':         ['Spendenformular', 'Mitgliedschaft', 'Projektberichte', 'Veranstaltungen', 'Blog / News', 'Ehrenamt-Verwaltung'],
  'Bildung & Training':   ['Kursübersicht', 'Online-Anmeldung', 'Lernplattform', 'Dozenten-Profile', 'Zertifikate', 'Testimonials'],
  'Sonstiges':            ['Kontaktformular', 'Über uns', 'Leistungen', 'Portfolio', 'Blog', 'Social Media', 'Newsletter'],
};

const ANF_PROJEKT: Record<string, string[]> = {
  'Neue Website':        ['Responsive Design', 'Einfach pflegbar (CMS)', 'SEO-Optimierung', 'DSGVO-konform', 'Cookie-Banner', 'Analytics'],
  'Website Redesign':    ['Inhalte übernehmen', 'Neues Design / CI', 'SEO erhalten', 'Mobile verbessern', 'Ladezeit optimieren'],
  'Prozessoptimierung':  ['Automatisierung', 'Weniger manuelle Arbeit', 'Reporting / Dashboard', 'Systemintegration', 'Fehlerreduktion'],
  'Marketing Strategie': ['Zielgruppen-Definition', 'Content-Plan', 'Social Media', 'E-Mail Marketing', 'Google Ads', 'KPI-Tracking'],
  'KI-Integration':      ['KI-Chatbot', 'Automatische Auswertungen', 'KI-gestützte Suche', 'Datenschutz / DSGVO', 'Training auf eigene Daten'],
  'App / Plattform':     ['Login / Registrierung', 'Mobile App', 'Admin-Dashboard', 'Benachrichtigungen', 'Rollen & Rechte', 'Zahlungsintegration'],
  'E-Commerce Shop':     ['Produktverwaltung', 'Zahlungsanbieter', 'Versand-Integration', 'Kundenkonto', 'Bewertungen'],
  'Workshop / Training': ['Lernziele festlegen', 'Schulungsunterlagen', 'Hands-on Übungen', 'Online / Präsenz', 'Zertifikat', 'Feedback'],
  'Sonstiges':           ['Anforderungen individuell', 'Budget klären', 'Machbarkeit prüfen'],
};

const BUDGET_OPTIONS = [
  "Unter CHF 2'000", "CHF 2'000 – 5'000", "CHF 5'000 – 15'000",
  "CHF 15'000 – 30'000", "Über CHF 30'000", 'Noch nicht definiert',
];

const ZEIT_OPTIONS = [
  'So bald wie möglich', '1 – 2 Monate', '3 – 6 Monate',
  '6 – 12 Monate', 'Noch offen',
];

// ── Types ─────────────────────────────────────────────────────

type Prio = 'must' | 'nice';
interface Anforderung { text: string; prio: Prio; }

interface Form {
  name: string; email: string; firma: string; telefon: string;
  branche: string; projekttyp: string;
  anforderungen: Anforderung[];
  budget: string; zeitrahmen: string; notizen: string;
}

const EMPTY: Form = {
  name: '', email: '', firma: '', telefon: '',
  branche: '', projekttyp: '',
  anforderungen: [],
  budget: '', zeitrahmen: '', notizen: '',
};

// ── Step indicators ───────────────────────────────────────────

const STEPS = ['Über Sie', 'Ihr Projekt', 'Anforderungen', 'Absenden'];

// ── Component ─────────────────────────────────────────────────

export default function AnfragePage() {
  const [step, setStep]           = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [form, setForm]           = useState<Form>(EMPTY);
  const [customInput, setCustomInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function toggleAnf(text: string) {
    setForm(prev => {
      const ex = prev.anforderungen.find(a => a.text === text);
      if (!ex)               return { ...prev, anforderungen: [...prev.anforderungen, { text, prio: 'must' }] };
      if (ex.prio === 'must') return { ...prev, anforderungen: prev.anforderungen.map(a => a.text === text ? { ...a, prio: 'nice' } : a) };
      return { ...prev, anforderungen: prev.anforderungen.filter(a => a.text !== text) };
    });
  }

  function addCustom() {
    const t = customInput.trim();
    if (!t || form.anforderungen.find(a => a.text === t)) return;
    setForm(p => ({ ...p, anforderungen: [...p.anforderungen, { text: t, prio: 'must' }] }));
    setCustomInput('');
  }

  const anfChips = useMemo(() => {
    const seg  = ANF_SEGMENT[form.branche]   ?? [];
    const proj = ANF_PROJEKT[form.projekttyp] ?? [];
    return [...new Set([...seg, ...proj])];
  }, [form.branche, form.projekttyp]);

  const canNext = useMemo(() => {
    if (step === 0) return form.name.trim() !== '' && form.email.includes('@') && form.branche !== '';
    if (step === 1) return form.projekttyp !== '';
    return true;
  }, [step, form]);

  function goToStep(nextStep: number) {
    const boundedStep = Math.max(0, Math.min(STEPS.length - 1, nextStep));
    const canAdvance = boundedStep <= furthestStep || (boundedStep === step + 1 && canNext);
    if (!canAdvance) return;
    setStep(boundedStep);
    setFurthestStep(previous => Math.max(previous, boundedStep));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/re-anfrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:            form.name,
          email:           form.email,
          firma:           form.firma,
          telefon:         form.telefon,
          branche:         form.branche,
          projekttyp:      form.projekttyp,
          istSituation:    [],
          schmerzpunkte:   [],
          anforderungen:   form.anforderungen,
          nfAnforderungen: [],
          budget:          form.budget,
          zeitrahmen:      form.zeitrahmen,
          notizen:         form.notizen,
        }),
      });
      if (!res.ok) throw new Error('Fehler beim Senden');
      setSubmitted(true);
    } catch {
      setError('Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie mir direkt.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Styles ────────────────────────────────────────────────

  const goldBtn = 'inquiry-primary-button flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed';
  const outlineBtn = 'inquiry-secondary-button flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-30';
  const inp = 'inquiry-input w-full outline-none px-4 py-3 text-sm transition-colors';

  // ── Render ────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="inquiry-page inquiry-display min-h-screen flex items-center justify-center p-6">
        <div className="inquiry-space" aria-hidden="true"><span /><span /><span /></div>
        <div className="inquiry-success-card max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#c9a84c]/20 border-2 border-[#c9a84c]/40 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-[#c9a84c]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Vielen Dank, {form.name.split(' ')[0]}!</h1>
          <p className="text-[#a89880] leading-relaxed">
            Ihre Projektanfrage ist bei mir eingegangen. Ich habe Ihnen eine Bestätigung
            an <span className="text-[#c9a84c] font-medium">{form.email}</span> gesendet
            und melde mich <strong className="text-white">innerhalb von 24 Stunden</strong> persönlich bei Ihnen.
          </p>
          <div className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-5 text-left space-y-2">
            <p className="text-xs text-[#7a6d5a] font-bold uppercase tracking-widest">Was als Nächstes passiert</p>
            {['Ich sichte Ihre Anforderungen sorgfältig', 'Ich melde mich innerhalb 24h bei Ihnen', 'Wir besprechen Ihr Projekt & die nächsten Schritte'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[#a89880]">
                <span className="w-5 h-5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#c9a84c] hover:underline">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="inquiry-page min-h-screen text-[#f4edd8]">
      <div className="inquiry-space" aria-hidden="true"><span /><span /><span /></div>

      <nav className="journey-navigator inquiry-journey-navigator inquiry-display" aria-label="Schritte der Projektanfrage">
        <span className="journey-rail" aria-hidden="true">
          <span
            className="journey-rail-progress"
            style={{ height: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </span>
        <Link
          href="/"
          className="journey-station is-visited"
          aria-label="Zurück zur Hauptseite"
        >
          <span className="journey-label">Start</span>
          <span className="journey-node" aria-hidden="true">
            <span className="journey-node-core" />
          </span>
        </Link>
        {STEPS.map((label, index) => {
          const isActive = index === step;
          const isVisited = index <= furthestStep && !isActive;
          const isReachable = index <= furthestStep || (index === step + 1 && canNext);
          return (
            <button
              key={label}
              type="button"
              className={`journey-station ${isActive ? 'is-active' : ''} ${isVisited ? 'is-visited' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Zu Schritt ${index + 1}: ${label}`}
              disabled={!isReachable}
              onClick={() => goToStep(index)}
            >
              <span className="journey-label">{label}</span>
              <span className="journey-node" aria-hidden="true">
                <span className="journey-node-core" />
              </span>
            </button>
          );
        })}
        <span className="journey-count" aria-hidden="true">
          {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
        </span>
      </nav>

      <main className="inquiry-shell mx-auto px-6 py-10">
        {/* Title */}
        <div className="inquiry-intro text-center mb-10">
          <p className="inquiry-kicker inquiry-display">PERSÖNLICH · STRUKTURIERT · UNVERBINDLICH</p>
          <h1 className="inquiry-display font-bold text-white mb-3">Erzählen Sie mir von Ihrem Projekt</h1>
          <p className="text-[#a89880] leading-relaxed">
            Beantworten Sie ein paar Fragen – ich melde mich innerhalb von 24 Stunden persönlich bei Ihnen.
          </p>
        </div>

        {/* Stepper */}
        <div className="inquiry-stepper inquiry-display flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="inquiry-step-wrap flex items-center gap-2">
              <div className={`inquiry-step flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                i < step  ? 'is-complete'
                : i === step ? 'is-active'
                : 'is-upcoming'
              }`}>
                {i < step ? <Check size={10} /> : <span>{i + 1}</span>}
                <span className="hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`inquiry-step-line w-6 h-px ${i < step ? 'is-complete' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="inquiry-card inquiry-display p-6 sm:p-8 mb-6">
          <span className="inquiry-card-corner inquiry-card-corner--tl" aria-hidden="true" />
          <span className="inquiry-card-corner inquiry-card-corner--br" aria-hidden="true" />

          {/* Step 0: Kontaktdaten + Branche */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-5">Über Sie</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><User size={11} /> Ihr Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="Max Müller" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><Mail size={11} /> E-Mail *</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="max@firma.ch" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><Building2 size={11} /> Firma (optional)</label>
                    <input value={form.firma} onChange={e => set('firma', e.target.value)} className={inp} placeholder="Müller AG" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><Phone size={11} /> Telefon (optional)</label>
                    <input value={form.telefon} onChange={e => set('telefon', e.target.value)} className={inp} placeholder="+41 79 000 00 00" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">In welcher Branche sind Sie tätig? *</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BRANCHEN.map(b => {
                    const selected = form.branche === b.label;
                    return (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => set('branche', b.label)}
                        className={`inquiry-choice flex items-center gap-2.5 px-3 py-3 text-sm font-medium transition-all text-left ${
                          selected
                            ? 'is-selected text-white'
                            : 'text-[#a89880]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? 'bg-[#c9a84c]/30 text-[#c9a84c]' : 'bg-[#c9a84c]/10 text-[#c9a84c]/50'
                        }`}>
                          <b.icon size={14} />
                        </div>
                        <span className="leading-tight text-xs">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Projekttyp */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-5">Was planen Sie? *</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {PROJEKTTYPEN.map(p => {
                  const selected = form.projekttyp === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => set('projekttyp', p.label)}
                        className={`inquiry-choice flex items-start gap-3 px-4 py-4 text-left transition-all ${
                        selected
                          ? 'is-selected text-white'
                          : 'text-[#a89880]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        selected ? 'bg-[#c9a84c]/30 text-[#c9a84c]' : 'bg-[#c9a84c]/10 text-[#c9a84c]/50'
                      }`}>
                        <p.icon size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.label}</p>
                        <p className="text-xs opacity-70 mt-0.5 leading-relaxed">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Anforderungen */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Was soll Ihr Projekt können?</h2>
                <p className="text-sm text-[#7a6d5a] mb-5">
                  Wählen Sie an, was wichtig ist.&nbsp;
                  <span className="text-[#c9a84c]">1× Klick = Muss dabei sein</span> &nbsp;·&nbsp;
                  <span className="text-[#d4b86a]">2× Klick = Wäre schön</span> &nbsp;·&nbsp;
                  <span className="text-[#7a6d5a]">3× = entfernen</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {anfChips.map(c => {
                    const ex = form.anforderungen.find(a => a.text === c);
                    const prio = ex?.prio ?? null;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleAnf(c)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          prio === 'must' ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#f4edd8]'
                          : prio === 'nice' ? 'bg-[#d4b86a]/10 border-[#d4b86a]/60 text-[#d4b86a]'
                          : 'bg-[#100d09] border-[#2d2820] text-[#7a6d5a] hover:border-[#c9a84c]/30 hover:text-[#a89880]'
                        }`}
                      >
                        {prio === 'must' && <span className="mr-1">★</span>}
                        {prio === 'nice' && <span className="mr-1">◇</span>}
                        {c}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                    className={inp + ' flex-1'}
                    placeholder="Eigene Anforderung hinzufügen…"
                  />
                  <button type="button" onClick={addCustom} className="px-3 py-2.5 rounded-xl bg-[#c9a84c]/20 border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/30 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                {form.anforderungen.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-[#100d09] border border-[#2d2820]">
                    <p className="text-xs text-[#5a5040] mb-2">Ihre Auswahl:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.anforderungen.map(a => (
                        <span key={a.text} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          a.prio === 'must' ? 'bg-[#c9a84c]/15 border-[#c9a84c]/30 text-[#c9a84c]' : 'bg-[#d4b86a]/10 border-[#d4b86a]/20 text-[#d4b86a]'
                        }`}>
                          {a.prio === 'must' ? '★' : '◇'} {a.text}
                          <button onClick={() => setForm(p => ({ ...p, anforderungen: p.anforderungen.filter(x => x.text !== a.text) }))} className="ml-1 opacity-60 hover:opacity-100">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#7a6d5a] mb-2">Budget (optional)</label>
                  <div className="space-y-1.5">
                    {BUDGET_OPTIONS.map(b => (
                      <button key={b} type="button" onClick={() => set('budget', b)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form.budget === b ? 'bg-[#c9a84c]/15 border-[#c9a84c]/50 text-[#f4edd8]' : 'bg-[#100d09] border-[#2d2820] text-[#7a6d5a] hover:border-[#c9a84c]/20'
                        }`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#7a6d5a] mb-2">Wann soll es fertig sein? (optional)</label>
                  <div className="space-y-1.5">
                    {ZEIT_OPTIONS.map(z => (
                      <button key={z} type="button" onClick={() => set('zeitrahmen', z)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form.zeitrahmen === z ? 'bg-[#c9a84c]/15 border-[#c9a84c]/50 text-[#f4edd8]' : 'bg-[#100d09] border-[#2d2820] text-[#7a6d5a] hover:border-[#c9a84c]/20'
                        }`}>
                        {z}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Zusammenfassung + Absenden */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white mb-5">Fast geschafft!</h2>

              {/* Summary */}
              <div className="rounded-xl border border-[#2d2820] bg-[#100d09] p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-[#5a5040] text-xs">Branche</span><p className="text-white font-medium">{form.branche}</p></div>
                  <div><span className="text-[#5a5040] text-xs">Projekt</span><p className="text-white font-medium">{form.projekttyp}</p></div>
                  {form.budget && <div><span className="text-[#5a5040] text-xs">Budget</span><p className="text-white font-medium">{form.budget}</p></div>}
                  {form.zeitrahmen && <div><span className="text-[#5a5040] text-xs">Zeitrahmen</span><p className="text-white font-medium">{form.zeitrahmen}</p></div>}
                </div>
                {form.anforderungen.filter(a => a.prio === 'must').length > 0 && (
                  <div>
                    <p className="text-xs text-[#5a5040] mb-1.5">Must-have Anforderungen</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.anforderungen.filter(a => a.prio === 'must').map(a => (
                        <span key={a.text} className="text-xs px-2 py-0.5 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/20 text-[#c9a84c]">★ {a.text}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-xs text-[#7a6d5a] mb-1.5">Weitere Informationen (optional)</label>
                <textarea
                  value={form.notizen}
                  onChange={e => set('notizen', e.target.value)}
                  rows={3}
                  className={inp + ' resize-none'}
                  placeholder="Besonderheiten, offene Fragen, spezielle Wünsche…"
                />
              </div>

              {/* Versprechen */}
              <div className="rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 text-sm text-[#a89880] leading-relaxed">
                <strong className="text-[#c9a84c]">Mein Versprechen:</strong> Ich melde mich innerhalb von 24 Stunden persönlich bei Ihnen.
                Kein automatisches Angebot, keine generische Antwort – sondern ein echtes Gespräch über Ihr Projekt.
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="inquiry-navigation inquiry-display flex items-center justify-between">
          <button
            onClick={() => goToStep(step - 1)}
            disabled={step === 0}
            className={outlineBtn}
          >
            <ChevronLeft size={16} /> Zurück
          </button>

          <span className="text-xs text-[#5a5040]">{step + 1} / {STEPS.length}</span>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => goToStep(step + 1)}
              disabled={!canNext}
              className={goldBtn}
            >
              Weiter <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={goldBtn}
            >
              {submitting ? 'Wird gesendet…' : <><Check size={16} /> Anfrage absenden</>}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
