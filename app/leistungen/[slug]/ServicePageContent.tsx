'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb, ArrowLeft, ChevronRight,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/app/LanguageContext';
import { getService, getServiceTranslation } from '../data';
import type { Lang } from '@/app/LanguageContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb,
};

const METALLIC_GRADIENTS: Record<string, string> = {
  '#c89a3d': 'linear-gradient(135deg, #F6E3A1 0%, #E7C56A 18%, #C89A3D 45%, #B8862B 72%, #7C5A1A 100%)',
  '#4d7fbf': 'linear-gradient(135deg, #C4E3FF 0%, #8EBEF2 18%, #4D7FBF 45%, #244D82 72%, #102A4A 100%)',
  '#8ebef2': 'linear-gradient(135deg, #C4E3FF 0%, #8EBEF2 18%, #4D7FBF 45%, #244D82 72%, #102A4A 100%)',
  '#244d82': 'linear-gradient(135deg, #C4E3FF 0%, #8EBEF2 18%, #4D7FBF 45%, #244D82 72%, #102A4A 100%)',
  '#a6425c': 'linear-gradient(135deg, #F3B0B9 0%, #D9788A 18%, #A6425C 45%, #6A263B 72%, #37131D 100%)',
  '#6a263b': 'linear-gradient(135deg, #F3B0B9 0%, #D9788A 18%, #A6425C 45%, #6A263B 72%, #37131D 100%)',
};

function metallicGradient(color: string) {
  return METALLIC_GRADIENTS[color.toLowerCase()] ?? 'var(--gradient-gold)';
}

// ── Page labels by language ───────────────────────────────────

const PL = {
  de: {
    allServices: 'Alle Leistungen', badge: 'Leistung',
    whatItMeans: 'Was bedeutet das für dich?',
    exampleLabel: 'Beispiel aus der Praxis',
    processLabel: 'Vorgehen', processHeading: 'So gehe ich vor',
    resultsLabel: 'Ergebnis', resultsHeading: 'Was du bekommst',
    ctaHeading: 'Projekt besprechen',
    ctaPrefix: 'Interessiert an ',
    ctaSuffix: '? Schreib mir – ich melde mich innerhalb von 2 Arbeitstagen und wir schauen gemeinsam, was für dich Sinn macht. Unverbindlich.',
    navServices: 'Meine Umsetzung', navPortfolio: 'Meine Referenzen', navAbout: 'Dein Digitalpartner',
    navCta: 'Projekt besprechen', navCtaAi: 'KI-Potenzial prüfen', backHome: 'Zurück zur Startseite',
    imprint: 'Impressum', privacy: 'Datenschutz',
  },
  en: {
    allServices: 'All Services', badge: 'Service',
    whatItMeans: 'What does this mean for you?',
    exampleLabel: 'Real-world example',
    processLabel: 'Approach', processHeading: 'How I proceed',
    resultsLabel: 'Results', resultsHeading: 'What you get',
    ctaHeading: 'Discuss your project',
    ctaPrefix: 'Interested in ',
    ctaSuffix: "? Write to me – I'll respond within 2 business days and we'll see together what makes sense for you. No commitment.",
    navServices: 'My Execution', navPortfolio: 'My Work', navAbout: 'Your Digital Partner',
    navCta: 'Discuss your project', navCtaAi: 'Assess AI potential', backHome: 'Back to home',
    imprint: 'Imprint', privacy: 'Privacy',
  },
};

// ── Visual components ─────────────────────────────────────────

function VisualKiAgenten({ color, lang }: { color: string; lang: Lang }) {
  const msgs = lang === 'en' ? [
    { from: 'Customer', text: 'Good day, I would like to cancel an order. Order number 48291.', align: 'left' },
    { from: 'AI Agent', text: '✅ Order #48291 found. Cancellation processed immediately. Confirmation sent by email. Refund within 3–5 business days.', align: 'right' },
    { from: 'Customer', text: 'Great, thank you! And can I place a new order for item 7722?', align: 'left' },
    { from: 'AI Agent', text: '🛒 Item 7722 is in stock. Shall I take the order directly or would you like to check the cart first?', align: 'right' },
  ] : [
    { from: 'Kunde', text: 'Guten Tag, ich möchte eine Bestellung stornieren. Bestellnummer 48291.', align: 'left' },
    { from: 'KI-Agent', text: '✅ Bestellung #48291 gefunden. Stornierung wird sofort verarbeitet. Sie erhalten eine Bestätigung per E-Mail. Rückerstattung innerhalb von 3–5 Werktagen.', align: 'right' },
    { from: 'Kunde', text: 'Super, danke! Und kann ich eine neue Bestellung für Artikel 7722 aufgeben?', align: 'left' },
    { from: 'KI-Agent', text: '🛒 Artikel 7722 ist auf Lager. Soll ich die Bestellung direkt aufnehmen oder möchten Sie den Warenkorb zuerst prüfen?', align: 'right' },
  ];
  const caption = lang === 'en' ? 'Live Demo: Customer writes, agent responds' : 'Live-Demo: Kunde schreibt, Agent antwortet';
  const footer  = lang === 'en' ? 'This entire dialogue ran without human intervention – fully automated.' : 'Dieser gesamte Dialog lief ohne menschliches Eingreifen – vollautomatisch.';
  return (
    <div className="rounded-2xl border border-[#2d2820] bg-[#0c0a06] p-6 space-y-3">
      <p className="text-xs text-[#7a6d5a] uppercase tracking-wider font-semibold mb-4">{caption}</p>
      {msgs.map((msg, i) => (
        <div key={i} className={`flex ${msg.align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            msg.align === 'right' ? 'text-white rounded-br-sm' : 'bg-[#231e15] text-[#d4c4a8] rounded-bl-sm'
          }`} style={msg.align === 'right' ? { background: metallicGradient(color) } : {}}>
            <span className="block text-[10px] font-semibold mb-1 opacity-70">{msg.from}</span>
            {msg.text}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-[#7a6d5a] text-center pt-2">{footer}</p>
    </div>
  );
}

function VisualBusinessAnalyse({ color, lang }: { color: string; lang: Lang }) {
  const cols = lang === 'en' ? [
    { label: '😕 Without Analysis', items: ['"We need an app"', '"Just do something"', 'Endless email chains', 'Development starts, goals unclear', 'Result: wrong solution'] },
    { label: '✅ With me', items: ['Stakeholder interviews', 'Clear user stories', 'Prioritized requirements catalog', 'Everyone aligned before building', 'Result: the right thing, first time'] },
  ] : [
    { label: '😕 Ohne Analyse', items: ['"Wir brauchen eine App"', '"Macht einfach mal"', 'Endloser E-Mail-Austausch', 'Entwicklung startet, Ziele unklar', 'Ergebnis: falsche Lösung'] },
    { label: '✅ Mit mir', items: ['Stakeholder-Interviews', 'Klare User Stories', 'Priorisierter Anforderungskatalog', 'Alle einig, bevor gebaut wird', 'Ergebnis: das Richtige, beim ersten Mal'] },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {cols.map((col, i) => (
        <div key={i} className="rounded-2xl border p-5 space-y-3"
          style={i === 1 ? { borderColor: `${color}40`, background: `${color}08` } : { borderColor: '#2A2D32', background: '#1A1C20' }}>
          <p className="font-semibold text-sm" style={{ color: i === 1 ? color : '#64748b' }}>{col.label}</p>
          {col.items.map((item, j) => (
            <div key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">{i === 1 ? '✓' : '✗'}</span>
              <span className={i === 1 ? 'text-[#d4c4a8]' : 'text-[#7a6d5a]'}>{item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function VisualBpmn({ color, lang }: { color: string; lang: Lang }) {
  const before = lang === 'en' ? [
    { step: '1', text: 'Create invoice in Excel', time: '30 min' },
    { step: '2', text: 'Export as PDF & rename', time: '5 min' },
    { step: '3', text: 'Send manually by email', time: '5 min' },
    { step: '4', text: 'Enter into accounting software', time: '10 min' },
    { step: '5', text: 'Check payment receipt weekly', time: '20 min' },
    { step: '6', text: 'Write reminder manually', time: '15 min' },
  ] : [
    { step: '1', text: 'Rechnung in Excel erstellen', time: '30 min' },
    { step: '2', text: 'Als PDF exportieren & umbenennen', time: '5 min' },
    { step: '3', text: 'Per E-Mail manuell versenden', time: '5 min' },
    { step: '4', text: 'In Buchhaltungssoftware nachtragen', time: '10 min' },
    { step: '5', text: 'Zahlungseingang wöchentlich prüfen', time: '20 min' },
    { step: '6', text: 'Mahnung manuell schreiben', time: '15 min' },
  ];
  const after = lang === 'en' ? [
    { step: '1', text: 'Enter data in the system', time: '5 min' },
    { step: '2', text: 'Click "Send" – rest is automatic', time: '1 min' },
  ] : [
    { step: '1', text: 'Daten im System erfassen', time: '5 min' },
    { step: '2', text: 'Auf „Senden" klicken – Rest automatisch', time: '1 min' },
  ];
  const beforeLabel = lang === 'en' ? 'Before — 85 min/week' : 'Vorher — 85 min/Woche';
  const afterLabel  = lang === 'en' ? 'After — 6 min/week'   : 'Nachher — 6 min/Woche';
  const savings     = lang === 'en' ? '→ Time saved: ~79 min/week = 65 hours/year' : '→ Zeitersparnis: ~79 Minuten pro Woche = 65 Stunden pro Jahr';
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#a6425c]/20 bg-[#a6425c]/5 p-5">
        <p className="text-xs font-semibold text-[#d9788a] uppercase tracking-wider mb-3">{beforeLabel}</p>
        <div className="space-y-2">
          {before.map(b => (
            <div key={b.step} className="flex items-center gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#a6425c]/20 text-[#d9788a] text-xs flex items-center justify-center font-bold">{b.step}</span>
              <span className="flex-1 text-[#a89880]">{b.text}</span>
              <span className="text-xs text-[#d9788a]">{b.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-5" style={{ borderColor: `${color}40`, background: `${color}08` }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color }}>{afterLabel}</p>
        <div className="space-y-2">
          {after.map(a => (
            <div key={a.step} className="flex items-center gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: `${color}30`, color }}>{a.step}</span>
              <span className="flex-1 text-[#d4c4a8]">{a.text}</span>
              <span className="text-xs" style={{ color }}>{a.time}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold" style={{ color }}>{savings}</p>
      </div>
    </div>
  );
}

function VisualMarketing({ color, lang }: { color: string; lang: Lang }) {
  const stages = lang === 'en' ? [
    { label: 'Visibility', value: '12,000 impressions', pct: 100 },
    { label: 'Engagement', value: '960 reactions', pct: 70 },
    { label: 'Clicks', value: '240 profile visits', pct: 45 },
    { label: 'Inquiries', value: '32 DMs / contacts', pct: 25 },
    { label: 'Clients', value: '6 new contracts', pct: 10 },
  ] : [
    { label: 'Sichtbarkeit', value: '12.000 Impressionen', pct: 100 },
    { label: 'Engagement',   value: '960 Reaktionen',      pct: 70 },
    { label: 'Klicks',       value: '240 Profilbesuche',   pct: 45 },
    { label: 'Anfragen',     value: '32 DMs / Kontakte',   pct: 25 },
    { label: 'Kunden',       value: '6 neue Aufträge',     pct: 10 },
  ];
  const caption = lang === 'en' ? 'LinkedIn Funnel · Monthly average after 6 months' : 'LinkedIn-Funnel · Monatsdurchschnitt nach 6 Monaten';
  const footer  = lang === 'en' ? 'Organic, without paid advertising. Only through consistent, strategic content.' : 'Organisch, ohne bezahltes Advertising. Nur durch konsistenten, strategischen Content.';
  return (
    <div className="rounded-2xl border border-[#2d2820] bg-[#1c1912] p-6">
      <p className="text-xs text-[#7a6d5a] uppercase tracking-wider font-semibold mb-5">{caption}</p>
      <div className="space-y-3">
        {stages.map((s, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#d4c4a8]">{s.label}</span>
              <span className="text-[#a89880]">{s.value}</span>
            </div>
            <div className="h-2 bg-[#2d2820] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: metallicGradient(color), opacity: 1 - i * 0.1 }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-[#7a6d5a]">{footer}</p>
    </div>
  );
}

function VisualVideo({ color, lang }: { color: string; lang: Lang }) {
  const phases = lang === 'en' ? [
    { icon: '💡', label: 'Concept',     days: '1–2 days',  desc: 'Brief, goal, script, storyboard' },
    { icon: '📋', label: 'Preparation', days: '2–3 days',  desc: 'Shooting schedule, equipment, location' },
    { icon: '🎬', label: 'Shoot',       days: '0.5–1 day', desc: 'Production, B-roll, interviews' },
    { icon: '✂️', label: 'Edit',        days: '2–4 days',  desc: 'Editing, color grading, music, subtitles' },
    { icon: '🚀', label: 'Done',        days: 'Day 8–10',  desc: 'Export all formats & approval' },
  ] : [
    { icon: '💡', label: 'Konzept',      days: '1–2 Tage',  desc: 'Brief, Ziel, Script, Storyboard' },
    { icon: '📋', label: 'Vorbereitung', days: '2–3 Tage',  desc: 'Drehplan, Technik, Location' },
    { icon: '🎬', label: 'Dreh',         days: '0.5–1 Tag', desc: 'Produktion, B-Roll, Interviews' },
    { icon: '✂️', label: 'Schnitt',      days: '2–4 Tage',  desc: 'Edit, Farbkorrektur, Musik, Untertitel' },
    { icon: '🚀', label: 'Fertig',       days: 'Tag 8–10',  desc: 'Export alle Formate & Freigabe' },
  ];
  return (
    <div className="space-y-3">
      {phases.map((p, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[#231e15]">{p.icon}</div>
          <div className="flex-1 rounded-xl border border-[#2d2820] bg-[#1c1912] px-4 py-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-sm text-white">{p.label}</span>
              <span className="text-xs" style={{ color }}>{p.days}</span>
            </div>
            <span className="text-xs text-[#a89880]">{p.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualKanban({ color, lang }: { color: string; lang: Lang }) {
  const columns = lang === 'en' ? [
    { title: 'Backlog',     tasks: ['Create design concept', 'Collect content', 'API integration', 'Write SEO texts'] },
    { title: 'In Progress', tasks: ['Homepage development', 'Mobile view'] },
    { title: 'Done ✓',     tasks: ['Requirements defined', 'Hosting set up', 'Domain configured', 'Design system established'] },
  ] : [
    { title: 'Backlog',     tasks: ['Design-Konzept erstellen', 'Inhalte sammeln', 'API-Anbindung', 'SEO-Texte schreiben'] },
    { title: 'In Progress', tasks: ['Homepage-Entwicklung', 'Mobile-Ansicht'] },
    { title: 'Done ✓',     tasks: ['Anforderungen definiert', 'Hosting eingerichtet', 'Domain konfiguriert', 'Design-System festgelegt'] },
  ];
  const colors = ['#102A4A', color, '#8EBEF2'];
  return (
    <div className="grid grid-cols-3 gap-3">
      {columns.map((col, ci) => (
        <div key={ci} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: colors[ci] }}>{col.title}</p>
          {col.tasks.map((t, ti) => (
            <div key={ti} className="rounded-lg border border-[#2d2820] bg-[#231e15] px-3 py-2.5">
              <p className="text-xs text-[#d4c4a8] leading-snug">{t}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function VisualWorkshop({ color, lang }: { color: string; lang: Lang }) {
  const modules = lang === 'en' ? [
    {
      num: '01', title: 'AI Basics & Tools', duration: '1.5 hours',
      items: ['What is AI / ChatGPT / Copilot?', 'How do I write good prompts?', "Dos & Don'ts in daily work", 'Live demo with your examples'],
    },
    {
      num: '02', title: 'AI in Daily Work', duration: '1.5 hours',
      items: ['Write emails with AI', 'Analyze & summarize documents', 'Research and generate ideas', 'Create presentations'],
    },
    {
      num: '03', title: 'Automation & Workflows', duration: '1 hour',
      items: ['What is Make / Zapier?', 'Build simple automations', 'Integration into existing tools', 'Your first own workflow'],
    },
  ] : [
    {
      num: '01', title: 'KI-Grundlagen & Tools', duration: '1.5 Stunden',
      items: ['Was ist KI / ChatGPT / Copilot?', 'Wie schreibe ich gute Prompts?', 'Dos & Don’ts im Alltag', 'Live-Demo mit euren Beispielen'],
    },
    {
      num: '02', title: 'KI im Arbeitsalltag', duration: '1.5 Stunden',
      items: ['E-Mails mit KI verfassen', 'Dokumente analysieren & zusammenfassen', 'Recherche und Ideen generieren', 'Präsentationen erstellen'],
    },
    {
      num: '03', title: 'Automatisierung & Workflows', duration: '1 Stunde',
      items: ['Was ist Make / Zapier?', 'Einfache Automatisierungen bauen', 'Integration in bestehende Tools', 'Euer erster eigener Workflow'],
    },
  ];
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {modules.map((m, i) => (
        <div key={i} className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color }}>{m.num}</span>
            <div>
              <p className="font-semibold text-white text-sm leading-snug">{m.title}</p>
              <p className="text-xs text-[#7a6d5a]">{m.duration}</p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {m.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-xs text-[#a89880]">
                <span className="mt-0.5 flex-shrink-0" style={{ color }}>›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function VisualWebsite({ color, lang }: { color: string; lang: Lang }) {
  const scores = [
    { label: 'Performance', before: 42, after: 96 },
    { label: 'SEO',         before: 68, after: 99 },
    { label: 'Best Practices', before: 75, after: 100 },
  ];
  const caption    = lang === 'en' ? 'Lighthouse Score Comparison' : 'Lighthouse-Score Vergleich';
  const beforeLabel = lang === 'en' ? 'Before' : 'Vorher';
  const afterLabel  = lang === 'en' ? 'After'  : 'Nachher';
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#7a6d5a] uppercase tracking-wider font-semibold">{caption}</p>
      {scores.map((s, i) => (
        <div key={i} className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-4">
          <p className="text-sm font-semibold text-white mb-3">{s.label}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#7a6d5a] mb-1">{beforeLabel}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-[#2d2820] rounded-full overflow-hidden">
                  <div className="brand-red-fill h-full rounded-full" style={{ width: `${s.before}%` }} />
                </div>
                <span className="text-sm font-bold text-[#d9788a] w-7">{s.before}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#7a6d5a] mb-1">{afterLabel}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-[#2d2820] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.after}%`, background: metallicGradient(color) }} />
                </div>
                <span className="text-sm font-bold w-7" style={{ color }}>{s.after}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualRoadmap({ color, lang }: { color: string; lang: Lang }) {
  const phases = lang === 'en' ? [
    { week: 'Week 1–2',    title: 'Assessment',        desc: 'Inventory of processes, data, tools. Interviews with key people.' },
    { week: 'Week 3–4',    title: 'Potential Analysis', desc: 'Top 5 AI use cases identified, evaluated, prioritized.' },
    { week: 'Week 5–6',    title: 'AI Roadmap',         desc: '12-month plan with costs, ROI calculation and technology selection.' },
    { week: 'From Week 7', title: 'Pilot Project',      desc: 'First quick win: small AI project with measurable result.' },
  ] : [
    { week: 'Woche 1–2',  title: 'Assessment',        desc: 'Bestandsaufnahme Prozesse, Daten, Tools. Interviews mit Schlüsselpersonen.' },
    { week: 'Woche 3–4',  title: 'Potenzialanalyse',  desc: 'Top 5 KI-Use-Cases identifiziert, bewertet, priorisiert.' },
    { week: 'Woche 5–6',  title: 'KI-Roadmap',        desc: '12-Monats-Plan mit Kosten, ROI-Kalkulation und Technologie-Auswahl.' },
    { week: 'Ab Woche 7', title: 'Pilotprojekt',       desc: 'Erster Quick Win: kleines KI-Projekt mit messbarem Ergebnis.' },
  ];
  return (
    <div className="relative">
      <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-[#2d2820]" />
      <div className="space-y-4">
        {phases.map((p, i) => (
          <div key={i} className="relative flex gap-4 pl-2">
            <div className="flex-shrink-0 relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold"
              style={{ borderColor: color, background: '#0F1012', color }}>
              {i + 1}
            </div>
            <div className="flex-1 rounded-xl border border-[#2d2820] bg-[#1c1912] p-4 pt-2.5">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-white">{p.title}</p>
                <span className="text-xs" style={{ color }}>{p.week}</span>
              </div>
              <p className="text-sm text-[#a89880] leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceVisual({ slug, color, lang }: { slug: string; color: string; lang: Lang }) {
  switch (slug) {
    case 'ki-agenten':          return <VisualKiAgenten color={color} lang={lang} />;
    case 'business-analyse':    return <VisualBusinessAnalyse color={color} lang={lang} />;
    case 'prozessoptimierung':  return <VisualBpmn color={color} lang={lang} />;
    case 'digital-marketing':   return <VisualMarketing color={color} lang={lang} />;
    case 'video-produktion':    return <VisualVideo color={color} lang={lang} />;
    case 'projektmanagement':   return <VisualKanban color={color} lang={lang} />;
    case 'workshops':           return <VisualWorkshop color={color} lang={lang} />;
    case 'website-optimierung': return <VisualWebsite color={color} lang={lang} />;
    case 'ki-beratung-kmu':     return <VisualRoadmap color={color} lang={lang} />;
    default: return null;
  }
}

// ── Main component ────────────────────────────────────────────

export default function ServicePageContent({ slug }: { slug: string }) {
  const { lang, setLang } = useLanguage();
  const service = getService(slug);
  if (!service) notFound();

  const s   = getServiceTranslation(service, lang);
  const pl  = PL[lang];
  const Icon = ICON_MAP[service.iconKey] || Lightbulb;

  useEffect(() => {
    document.title = `${s.title} | Digitalstudio Marcel Spahr`;
  }, [s.title]);

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2d2820] bg-[#0c0a06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-white text-lg tracking-tight hover:opacity-80 transition-opacity">
            Marcel Spahr
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#journey-solutions"  className="text-sm text-[#a89880] hover:text-white transition-colors">{pl.navServices}</Link>
            <Link href="/#journey-references" className="text-sm text-[#a89880] hover:text-white transition-colors">{pl.navPortfolio}</Link>
            <Link href="/#journey-about" className="text-sm text-[#a89880] hover:text-white transition-colors">{pl.navAbout}</Link>
            <div className="flex items-center gap-0.5 rounded-lg border border-[#2d2820] overflow-hidden">
              <button onClick={() => setLang('de')} className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}>DE</button>
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}>EN</button>
            </div>
            <a href={`/?lead=${service.slug === 'automatisierung-ki-agenten' ? 'ki' : 'project'}#journey-contact`} className="px-4 py-1.5 rounded-lg text-[#0c0a06] text-sm font-semibold transition-colors" style={{ background: metallicGradient(service.color) }}>
              {service.slug === 'automatisierung-ki-agenten' ? pl.navCtaAi : pl.navCta}
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{
          background: `radial-gradient(ellipse 50% 40% at 20% 30%, ${service.color}12 0%, transparent 70%)`
        }} />
        <div className="relative max-w-4xl mx-auto">
          <Link href="/#journey-solutions" className="inline-flex items-center gap-1.5 text-sm text-[#a89880] hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            {pl.allServices}
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center" style={{ background: `${service.color}20` }}>
              <Icon size={28} style={{ color: service.color }} />
            </div>
            <div className="flex-1">
              <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ color: service.color, background: `${service.color}18` }}>
                {pl.badge}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">{s.title}</h1>
              <p className="mt-3 text-lg sm:text-xl text-[#a89880]">{s.subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-[#2d2820] bg-[#1c1912] p-8">
            <h2 className="text-xl font-bold text-white mb-4">{pl.whatItMeans}</h2>
            <p className="text-[#d4c4a8] leading-relaxed text-lg">{s.intro}</p>
          </div>
        </div>
      </section>

      {/* ── Visual / Example ── */}
      <section className="py-12 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: service.color }}>{pl.exampleLabel}</span>
            <h2 className="mt-1 text-2xl font-bold text-white">{s.exampleTitle}</h2>
            <p className="mt-2 text-[#a89880] leading-relaxed">{s.exampleText}</p>
          </div>
          <ServiceVisual slug={service.slug} color={service.color} lang={lang} />
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: service.color }}>{pl.processLabel}</span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white">{pl.processHeading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {s.process.map((step, i) => (
              <div key={i} className="relative rounded-xl border border-[#2d2820] bg-[#1c1912] p-6 hover:border-[#c9a84c]/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${service.color}20`, color: service.color }}>
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-[#a89880] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deliverables ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: service.color }}>{pl.resultsLabel}</span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white">{pl.resultsHeading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.deliverables.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#2d2820] bg-[#1c1912] px-4 py-3">
                <span className="text-xl flex-shrink-0">{d.emoji}</span>
                <span className="text-sm text-[#d4c4a8] font-medium">{d.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2d2820] bg-[#100d09] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-sm text-[#a89880] hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft size={13} /> {pl.backHome}
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-[#7a6d5a]">© 2026 Marcel Spahr</span>
            <a href="/impressum"   className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{pl.imprint}</a>
            <a href="/datenschutz" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{pl.privacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
