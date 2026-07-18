'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { useLanguage } from '../LanguageContext';
import { useEmbeddedForm } from '../EmbeddedFormContext';
import { scrollToJourneyDestination } from '../lib/journeyNavigation';

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
  { label: 'KI-Integration',      icon: Bot,           desc: 'KI-Tools in dein Unternehmen integrieren' },
  { label: 'App / Plattform',     icon: Smartphone,    desc: 'Massgeschneiderte Software-Lösung' },
  { label: 'E-Commerce Shop',     icon: ShoppingCart,  desc: 'Online verkaufen & Zahlungen abwickeln' },
  { label: 'Workshop / Training', icon: GraduationCap, desc: 'Schulung für dein Team' },
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
  consent: boolean;
}

const EMPTY: Form = {
  name: '', email: '', firma: '', telefon: '',
  branche: '', projekttyp: '',
  anforderungen: [],
  budget: '', zeitrahmen: '', notizen: '',
  consent: false,
};

// ── Step indicators ───────────────────────────────────────────

const STEPS = ['Über dich', 'Dein Projekt', 'Anforderungen', 'Absenden'];

const EN_TEXT: Record<string, string> = {
  'Über dich': 'About You', 'Dein Projekt': 'Your Project', 'Anforderungen': 'Requirements', 'Absenden': 'Submit',
  'Beauty & Wellness': 'Beauty & Wellness', 'Immobilien': 'Real Estate', 'IT & Software': 'IT & Software',
  'Finanzwesen': 'Finance', 'Baubranche': 'Construction', 'Gesundheit & Medizin': 'Health & Medicine',
  'Gastronomie & Food': 'Hospitality & Food', 'E-Commerce & Retail': 'E-Commerce & Retail',
  'NGO & Verein': 'NGO & Association', 'Bildung & Training': 'Education & Training', 'Sonstiges': 'Other',
  'Neue Website': 'New Website', 'Professioneller Online-Auftritt von Grund auf': 'A professional online presence built from scratch',
  'Website Redesign': 'Website Redesign', 'Bestehende Website modernisieren': 'Modernize an existing website',
  'Prozessoptimierung': 'Process Optimization', 'Abläufe digitalisieren & automatisieren': 'Digitize and automate workflows',
  'Marketing Strategie': 'Marketing Strategy', 'Mehr Sichtbarkeit & qualifizierte Leads': 'More visibility and qualified leads',
  'KI-Integration': 'AI Integration', 'KI-Tools in dein Unternehmen integrieren': 'Integrate AI tools into your business',
  'App / Plattform': 'App / Platform', 'Massgeschneiderte Software-Lösung': 'Custom software solution',
  'E-Commerce Shop': 'E-Commerce Store', 'Online verkaufen & Zahlungen abwickeln': 'Sell online and process payments',
  'Workshop / Training': 'Workshop / Training', 'Schulung für dein Team': 'Training for your team',
  'Anderes Projekt': 'Another type of project',
  'Online-Buchungssystem': 'Online booking system', 'Vorher/Nachher Galerie': 'Before/after gallery',
  'Preisliste': 'Price list', 'Team-Präsentation': 'Team presentation', 'Kundenbewertungen': 'Customer reviews',
  'Online-Shop': 'Online store', 'Gutscheine': 'Vouchers', 'Newsletter': 'Newsletter',
  'Objektsuche / Filter': 'Property search / filters', 'Exposé-Ansicht': 'Property detail view',
  'Kontaktformular': 'Contact form', '360° Rundgang': '360° tour', 'Grundriss-Upload': 'Floor plan upload',
  'Karten-Integration': 'Map integration', 'Interessentenanfragen': 'Prospect inquiries',
  'Demo / Trial Anfrage': 'Demo / trial request', 'Kundenportal': 'Customer portal',
  'Support & Ticketing': 'Support & ticketing', 'Preistabelle': 'Pricing table',
  'Integrationen & APIs': 'Integrations & APIs', 'Dokumentation': 'Documentation',
  'Beratungsanfrage': 'Consultation request', 'Rechner-Tool': 'Calculator tool', 'FAQ-Bereich': 'FAQ section',
  'Terminbuchung': 'Appointment booking', 'Formulare & Downloads': 'Forms & downloads', 'Mehrsprachigkeit': 'Multilingual support',
  'Referenzprojekte': 'Reference projects', 'Leistungsübersicht': 'Service overview', 'Angebotsanfrage': 'Quote request',
  'Team & Kontakt': 'Team & contact', 'Jobs / Karriere': 'Jobs / careers', 'Zertifikate & Nachweise': 'Certificates & credentials',
  'Online-Terminbuchung': 'Online appointment booking', 'Leistungen & Fachgebiete': 'Services & specialties',
  'Team / Ärzte': 'Team / doctors', 'Patienteninformationen': 'Patient information', 'Notfallinfos': 'Emergency information',
  'Anfahrt & Lageplan': 'Directions & map', 'Online-Reservierung': 'Online reservation', 'Speisekarte': 'Menu',
  'Bestellsystem': 'Ordering system', 'Catering & Events': 'Catering & events', 'Lieferservice': 'Delivery service',
  'Produktkatalog': 'Product catalog', 'Warenkorb & Checkout': 'Cart & checkout', 'Filterfunktion': 'Filter function',
  'Kundenkonto': 'Customer account', 'Lagerverwaltung': 'Inventory management', 'Rabattcodes': 'Discount codes',
  'Spendenformular': 'Donation form', 'Mitgliedschaft': 'Membership', 'Projektberichte': 'Project reports',
  'Veranstaltungen': 'Events', 'Blog / News': 'Blog / news', 'Ehrenamt-Verwaltung': 'Volunteer management',
  'Kursübersicht': 'Course overview', 'Online-Anmeldung': 'Online registration', 'Lernplattform': 'Learning platform',
  'Dozenten-Profile': 'Instructor profiles', 'Zertifikate': 'Certificates', 'Testimonials': 'Testimonials',
  'Über uns': 'About us', 'Leistungen': 'Services', 'Portfolio': 'Portfolio', 'Blog': 'Blog', 'Social Media': 'Social media',
  'Responsive Design': 'Responsive design', 'Einfach pflegbar (CMS)': 'Easy to maintain (CMS)',
  'SEO-Optimierung': 'SEO optimization', 'DSGVO-konform': 'GDPR compliant', 'Cookie-Banner': 'Cookie banner', 'Analytics': 'Analytics',
  'Inhalte übernehmen': 'Migrate existing content', 'Neues Design / CI': 'New design / visual identity',
  'SEO erhalten': 'Preserve SEO', 'Mobile verbessern': 'Improve mobile experience', 'Ladezeit optimieren': 'Optimize loading speed',
  'Automatisierung': 'Automation', 'Weniger manuelle Arbeit': 'Less manual work', 'Reporting / Dashboard': 'Reporting / dashboard',
  'Systemintegration': 'System integration', 'Fehlerreduktion': 'Error reduction', 'Zielgruppen-Definition': 'Target audience definition',
  'Content-Plan': 'Content plan', 'E-Mail Marketing': 'Email marketing', 'Google Ads': 'Google Ads', 'KPI-Tracking': 'KPI tracking',
  'KI-Chatbot': 'AI chatbot', 'Automatische Auswertungen': 'Automated analysis', 'KI-gestützte Suche': 'AI-assisted search',
  'Datenschutz / DSGVO': 'Privacy / GDPR', 'Training auf eigene Daten': 'Training on your own data',
  'Login / Registrierung': 'Login / registration', 'Mobile App': 'Mobile app', 'Admin-Dashboard': 'Admin dashboard',
  'Benachrichtigungen': 'Notifications', 'Rollen & Rechte': 'Roles & permissions', 'Zahlungsintegration': 'Payment integration',
  'Produktverwaltung': 'Product management', 'Zahlungsanbieter': 'Payment provider', 'Versand-Integration': 'Shipping integration',
  'Bewertungen': 'Reviews', 'Lernziele festlegen': 'Define learning objectives', 'Schulungsunterlagen': 'Training materials',
  'Hands-on Übungen': 'Hands-on exercises', 'Online / Präsenz': 'Online / on-site', 'Zertifikat': 'Certificate', 'Feedback': 'Feedback',
  'Anforderungen individuell': 'Individual requirements', 'Budget klären': 'Clarify budget', 'Machbarkeit prüfen': 'Assess feasibility',
  "Unter CHF 2'000": "Under CHF 2,000", "CHF 2'000 – 5'000": 'CHF 2,000–5,000',
  "CHF 5'000 – 15'000": 'CHF 5,000–15,000', "CHF 15'000 – 30'000": 'CHF 15,000–30,000',
  "Über CHF 30'000": 'Over CHF 30,000', 'Noch nicht definiert': 'Not defined yet',
  'So bald wie möglich': 'As soon as possible', '1 – 2 Monate': '1–2 months', '3 – 6 Monate': '3–6 months',
  '6 – 12 Monate': '6–12 months', 'Noch offen': 'Still open',
};

const UI = {
  de: {
    pageTitle: 'Projektanfrage | Digitalstudio Marcel Spahr', kicker: 'PERSÖNLICH · STRUKTURIERT · UNVERBINDLICH',
    title: 'Erzähl mir von deinem Projekt', intro: 'Beantworte ein paar Fragen – ich melde mich innerhalb von zwei Arbeitstagen persönlich bei dir.',
    start: 'Start', backHome: 'Zurück zur Hauptseite', aboutTitle: 'Über dich', name: 'Dein Name *', email: 'E-Mail *',
    company: 'Firma (optional)', phone: 'Telefon (optional)', industry: 'In welcher Branche bist du tätig? *',
    planning: 'Was planst du? *', capabilities: 'Was soll dein Projekt können?', selectHint: 'Wähle aus, was wichtig ist.',
    must: '1× Klick = Muss dabei sein', nice: '2× Klick = Wäre schön', remove: '3× = entfernen', custom: 'Eigene Anforderung hinzufügen …',
    selection: 'Deine Auswahl:', budget: 'Budget (optional)', deadline: 'Wann soll es fertig sein? (optional)', almost: 'Fast geschafft!',
    industryLabel: 'Branche', projectLabel: 'Projekt', budgetLabel: 'Budget', timeframe: 'Zeitrahmen', mustHave: 'Must-have Anforderungen',
    more: 'Weitere Informationen (optional)', morePlaceholder: 'Besonderheiten, offene Fragen, spezielle Wünsche …',
    promiseLead: 'Mein Versprechen:', promise: 'Ich melde mich innerhalb von zwei Arbeitstagen persönlich bei dir. Kein automatisches Angebot, keine generische Antwort – sondern ein echtes Gespräch über dein Projekt.',
    consentLead: 'Ich habe die ', privacyLink: 'Datenschutzerklärung', consentTail: ' gelesen und stimme der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage zu.',
    requiredConsent: 'Bitte bestätige die Datenschutzerklärung.',
    back: 'Zurück', next: 'Weiter', send: 'Anfrage absenden', sending: 'Wird gesendet …',
    thanks: 'Vielen Dank', received: 'Deine Projektanfrage ist bei mir eingegangen.', confirmation: 'Du erhältst eine Bestätigung an',
    response: 'und ich melde mich innerhalb von zwei Arbeitstagen persönlich bei dir.', nextTitle: 'Was als Nächstes passiert',
    nextItems: ['Ich sichte deine Anforderungen sorgfältig', 'Ich melde mich innerhalb von zwei Arbeitstagen bei dir', 'Wir besprechen dein Projekt und die nächsten Schritte'],
    viewReferences: 'Referenzen ansehen',
    error: 'Etwas ist schiefgelaufen. Bitte versuche es erneut oder schreibe mir direkt.', stepAria: 'Zu Schritt',
  },
  en: {
    pageTitle: 'Project Inquiry | Marcel Spahr Digital Studio', kicker: 'PERSONAL · STRUCTURED · NO OBLIGATION',
    title: 'Tell me about your project', intro: 'Answer a few questions – I will get back to you personally within two business days.',
    start: 'Start', backHome: 'Back to homepage', aboutTitle: 'About you', name: 'Your name *', email: 'Email *',
    company: 'Company (optional)', phone: 'Phone (optional)', industry: 'What industry are you in? *',
    planning: 'What are you planning? *', capabilities: 'What should your project be able to do?', selectHint: 'Select what matters to you.',
    must: '1× click = Must-have', nice: '2× click = Nice-to-have', remove: '3× = remove', custom: 'Add your own requirement …',
    selection: 'Your selection:', budget: 'Budget (optional)', deadline: 'When should it be completed? (optional)', almost: 'Almost done!',
    industryLabel: 'Industry', projectLabel: 'Project', budgetLabel: 'Budget', timeframe: 'Timeframe', mustHave: 'Must-have requirements',
    more: 'Additional information (optional)', morePlaceholder: 'Special considerations, open questions or requests …',
    promiseLead: 'My promise:', promise: 'I will get back to you personally within two business days. No automated quote, no generic reply – a real conversation about your project.',
    consentLead: 'I have read the ', privacyLink: 'privacy policy', consentTail: ' and agree to the processing of my information for handling my inquiry.',
    requiredConsent: 'Please confirm the privacy policy.',
    back: 'Back', next: 'Next', send: 'Submit inquiry', sending: 'Sending …',
    thanks: 'Thank you', received: 'I have received your project inquiry.', confirmation: 'A confirmation will be sent to',
    response: 'and I will contact you personally within two business days.', nextTitle: 'What happens next',
    nextItems: ['I carefully review your requirements', 'I contact you within two business days', 'We discuss your project and the next steps'],
    viewReferences: 'View references',
    error: 'Something went wrong. Please try again or contact me directly.', stepAria: 'Go to step',
  },
};

// ── Component ─────────────────────────────────────────────────

export default function AnfragePage() {
  const embedded = useEmbeddedForm();
  const { lang, setLang } = useLanguage();
  const copy = UI[lang];
  const tr = (text: string) => lang === 'en' ? (EN_TEXT[text] ?? text) : text;
  const [step, setStep]           = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [form, setForm]           = useState<Form>(EMPTY);
  const [customInput, setCustomInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (embedded) return;
    document.title = copy.pageTitle;
  }, [copy.pageTitle, embedded]);

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
    setError('');
    if (!form.consent) {
      setError(copy.requiredConsent);
      return;
    }
    setSubmitting(true);
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
          consent:         form.consent,
        }),
      });
      if (!res.ok) throw new Error('Fehler beim Senden');
      setSubmitted(true);
    } catch {
      setError(copy.error);
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
      <div className={`inquiry-page inquiry-display min-h-screen flex items-center justify-center p-6 ${embedded ? 'inquiry-page--embedded' : ''}`}>
        {!embedded && <div className="inquiry-space" aria-hidden="true"><span /><span /><span /></div>}
        <div className="inquiry-success-card max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#c9a84c]/20 border-2 border-[#c9a84c]/40 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-[#c9a84c]" />
          </div>
          <h1 className="text-2xl font-bold text-white">{copy.thanks}, {form.name.split(' ')[0]}!</h1>
          <p className="text-[#a89880] leading-relaxed">
            {copy.received} {copy.confirmation}{' '}
            <span className="text-[#c9a84c] font-medium">{form.email}</span>{' '}
            {copy.response}
          </p>
          <div className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-5 text-left space-y-2">
            <p className="text-xs text-[#7a6d5a] font-bold uppercase tracking-widest">{copy.nextTitle}</p>
            {copy.nextItems.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[#a89880]">
                <span className="w-5 h-5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
          {embedded && (
            <button
              type="button"
              className="inquiry-primary-button inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold"
              onClick={() => scrollToJourneyDestination('references')}
            >
              {copy.viewReferences} <ChevronRight size={15} />
            </button>
          )}
          {!embedded && (
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#c9a84c] hover:underline">
              ← {copy.backHome}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`inquiry-page min-h-screen text-[#f4edd8] ${embedded ? 'inquiry-page--embedded' : ''}`}>
      {!embedded && <div className="inquiry-space" aria-hidden="true"><span /><span /><span /></div>}

      {!embedded && <nav className="journey-navigator inquiry-journey-navigator inquiry-display" aria-label={lang === 'de' ? 'Schritte der Projektanfrage' : 'Project inquiry steps'}>
        <span className="inquiry-side-language" aria-label="Language selection">
          <button type="button" className={lang === 'de' ? 'is-active' : ''} onClick={() => setLang('de')}>DE</button>
          <button type="button" className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>EN</button>
        </span>
        <span className="journey-rail" aria-hidden="true">
          <span
            className="journey-rail-progress"
            style={{ height: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </span>
        <Link
          href="/"
          className="journey-station is-visited"
          aria-label={copy.backHome}
        >
          <span className="journey-label">{copy.start}</span>
          <span className="journey-node" aria-hidden="true">
            <span className="journey-node-core" />
          </span>
        </Link>
        {STEPS.map((sourceLabel, index) => {
          const label = tr(sourceLabel);
          const isActive = index === step;
          const isVisited = index <= furthestStep && !isActive;
          const isReachable = index <= furthestStep || (index === step + 1 && canNext);
          return (
            <button
              key={label}
              type="button"
              className={`journey-station ${isActive ? 'is-active' : ''} ${isVisited ? 'is-visited' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`${copy.stepAria} ${index + 1}: ${label}`}
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
      </nav>}

      <main className="inquiry-shell mx-auto px-6 py-10">
        {/* Title */}
        <div className="inquiry-intro text-center mb-10">
          <p className="inquiry-kicker inquiry-display">{copy.kicker}</p>
          <h1 className="inquiry-display font-bold text-white mb-3">{copy.title}</h1>
          <p className="text-[#a89880] leading-relaxed">
            {copy.intro}
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
                <span className="hidden sm:block">{tr(s)}</span>
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
                <h2 className="text-lg font-bold text-white mb-5">{copy.aboutTitle}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><User size={11} /> {copy.name}</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="Max Müller" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><Mail size={11} /> {copy.email}</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="max@firma.ch" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><Building2 size={11} /> {copy.company}</label>
                    <input value={form.firma} onChange={e => set('firma', e.target.value)} className={inp} placeholder="Müller AG" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6d5a] mb-1.5 flex items-center gap-1.5"><Phone size={11} /> {copy.phone}</label>
                    <input value={form.telefon} onChange={e => set('telefon', e.target.value)} className={inp} placeholder="+41 79 000 00 00" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">{copy.industry}</h3>
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
                        <span className="leading-tight text-xs">{tr(b.label)}</span>
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
              <h2 className="text-lg font-bold text-white mb-5">{copy.planning}</h2>
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
                        <p className="font-semibold text-sm">{tr(p.label)}</p>
                        <p className="text-xs opacity-70 mt-0.5 leading-relaxed">{tr(p.desc)}</p>
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
                <h2 className="text-lg font-bold text-white mb-2">{copy.capabilities}</h2>
                <p className="text-sm text-[#7a6d5a] mb-5">
                  {copy.selectHint}&nbsp;
                  <span className="text-[#c9a84c]">{copy.must}</span> &nbsp;·&nbsp;
                  <span className="text-[#d4b86a]">{copy.nice}</span> &nbsp;·&nbsp;
                  <span className="text-[#7a6d5a]">{copy.remove}</span>
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
                        {tr(c)}
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
                    placeholder={copy.custom}
                  />
                  <button type="button" onClick={addCustom} className="px-3 py-2.5 rounded-xl bg-[#c9a84c]/20 border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/30 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                {form.anforderungen.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-[#100d09] border border-[#2d2820]">
                    <p className="text-xs text-[#5a5040] mb-2">{copy.selection}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.anforderungen.map(a => (
                        <span key={a.text} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          a.prio === 'must' ? 'bg-[#c9a84c]/15 border-[#c9a84c]/30 text-[#c9a84c]' : 'bg-[#d4b86a]/10 border-[#d4b86a]/20 text-[#d4b86a]'
                        }`}>
                          {a.prio === 'must' ? '★' : '◇'} {tr(a.text)}
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
                  <label className="block text-xs text-[#7a6d5a] mb-2">{copy.budget}</label>
                  <div className="space-y-1.5">
                    {BUDGET_OPTIONS.map(b => (
                      <button key={b} type="button" onClick={() => set('budget', b)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form.budget === b ? 'bg-[#c9a84c]/15 border-[#c9a84c]/50 text-[#f4edd8]' : 'bg-[#100d09] border-[#2d2820] text-[#7a6d5a] hover:border-[#c9a84c]/20'
                        }`}>
                        {tr(b)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#7a6d5a] mb-2">{copy.deadline}</label>
                  <div className="space-y-1.5">
                    {ZEIT_OPTIONS.map(z => (
                      <button key={z} type="button" onClick={() => set('zeitrahmen', z)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form.zeitrahmen === z ? 'bg-[#c9a84c]/15 border-[#c9a84c]/50 text-[#f4edd8]' : 'bg-[#100d09] border-[#2d2820] text-[#7a6d5a] hover:border-[#c9a84c]/20'
                        }`}>
                        {tr(z)}
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
              <h2 className="text-lg font-bold text-white mb-5">{copy.almost}</h2>

              {/* Summary */}
              <div className="rounded-xl border border-[#2d2820] bg-[#100d09] p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-[#5a5040] text-xs">{copy.industryLabel}</span><p className="text-white font-medium">{tr(form.branche)}</p></div>
                  <div><span className="text-[#5a5040] text-xs">{copy.projectLabel}</span><p className="text-white font-medium">{tr(form.projekttyp)}</p></div>
                  {form.budget && <div><span className="text-[#5a5040] text-xs">{copy.budgetLabel}</span><p className="text-white font-medium">{tr(form.budget)}</p></div>}
                  {form.zeitrahmen && <div><span className="text-[#5a5040] text-xs">{copy.timeframe}</span><p className="text-white font-medium">{tr(form.zeitrahmen)}</p></div>}
                </div>
                {form.anforderungen.filter(a => a.prio === 'must').length > 0 && (
                  <div>
                    <p className="text-xs text-[#5a5040] mb-1.5">{copy.mustHave}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.anforderungen.filter(a => a.prio === 'must').map(a => (
                        <span key={a.text} className="text-xs px-2 py-0.5 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/20 text-[#c9a84c]">★ {tr(a.text)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-xs text-[#7a6d5a] mb-1.5">{copy.more}</label>
                <textarea
                  value={form.notizen}
                  onChange={e => set('notizen', e.target.value)}
                  rows={3}
                  className={inp + ' resize-none'}
                  placeholder={copy.morePlaceholder}
                />
              </div>

              {/* Versprechen */}
              <div className="rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 text-sm text-[#a89880] leading-relaxed">
                <strong className="text-[#c9a84c]">{copy.promiseLead}</strong> {copy.promise}
              </div>

              <label className="inquiry-consent">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={e => { set('consent', e.target.checked); setError(''); }}
                  required
                />
                <span>
                  {copy.consentLead}<Link href="/datenschutz" target="_blank" rel="noreferrer">{copy.privacyLink}</Link>{copy.consentTail}
                </span>
              </label>

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
            <ChevronLeft size={16} /> {copy.back}
          </button>

          <span className="text-xs text-[#5a5040]">{step + 1} / {STEPS.length}</span>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => goToStep(step + 1)}
              disabled={!canNext}
              className={goldBtn}
            >
              {copy.next} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={goldBtn}
            >
              {submitting ? copy.sending : <><Check size={16} /> {copy.send}</>}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
