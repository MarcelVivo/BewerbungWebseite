import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb, ArrowLeft, ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { SERVICES, getService } from '../data';
import ContactFormClient from '@/app/ContactFormClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return SERVICES.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const s = getService(params.slug);
  if (!s) return {};
  return {
    title: `${s.title} – Marcel Spahr`,
    description: s.metaDesc,
  };
}

const ICON_MAP: Record<string, React.ElementType> = {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb,
};

// ── Per-Service Visual Sections ──────────────────────────────

function VisualKiAgenten({ color }: { color: string }) {
  return (
    <div className="rounded-2xl border border-[#2d3144] bg-[#0f1117] p-6 space-y-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">Live-Demo: Kunde schreibt, Agent antwortet</p>
      {[
        { from: 'Kunde', text: 'Guten Tag, ich möchte eine Bestellung stornieren. Bestellnummer 48291.', align: 'left' },
        { from: 'KI-Agent', text: '✅ Bestellung #48291 gefunden. Stornierung wird sofort verarbeitet. Sie erhalten eine Bestätigung per E-Mail. Rückerstattung innerhalb von 3–5 Werktagen.', align: 'right' },
        { from: 'Kunde', text: 'Super, danke! Und kann ich eine neue Bestellung für Artikel 7722 aufgeben?', align: 'left' },
        { from: 'KI-Agent', text: '🛒 Artikel 7722 ist auf Lager. Soll ich die Bestellung direkt aufnehmen oder möchten Sie den Warenkorb zuerst prüfen?', align: 'right' },
      ].map((msg, i) => (
        <div key={i} className={`flex ${msg.align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            msg.align === 'right'
              ? 'text-white rounded-br-sm'
              : 'bg-[#1e2235] text-slate-300 rounded-bl-sm'
          }`} style={msg.align === 'right' ? { background: color } : {}}>
            <span className="block text-[10px] font-semibold mb-1 opacity-70">{msg.from}</span>
            {msg.text}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-slate-600 text-center pt-2">Dieser gesamte Dialog lief ohne menschliches Eingreifen – vollautomatisch.</p>
    </div>
  );
}

function VisualBusinessAnalyse({ color }: { color: string }) {
  const cols = [
    { label: '😕 Ohne Analyse', items: ['„Wir brauchen eine App"', '„Macht einfach mal"', 'Endloser E-Mail-Austausch', 'Entwicklung startet, Ziele unklar', 'Ergebnis: falsche Lösung'] },
    { label: '✅ Mit mir', items: ['Stakeholder-Interviews', 'Klare User Stories', 'Priorisierter Anforderungskatalog', 'Alle einig, bevor gebaut wird', 'Ergebnis: das Richtige, beim ersten Mal'] },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {cols.map((col, i) => (
        <div key={i} className={`rounded-2xl border p-5 space-y-3 ${
          i === 1 ? 'border-[#06b6d4]/40 bg-[#06b6d408]' : 'border-[#2d3144] bg-[#1a1d27]'
        }`}>
          <p className="font-semibold text-sm" style={{ color: i === 1 ? color : '#64748b' }}>{col.label}</p>
          {col.items.map((item, j) => (
            <div key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">{i === 1 ? '✓' : '✗'}</span>
              <span className={i === 1 ? 'text-slate-300' : 'text-slate-500'}>{item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function VisualBpmn({ color }: { color: string }) {
  const before = [
    { step: '1', text: 'Rechnung in Excel erstellen', time: '30 min' },
    { step: '2', text: 'Als PDF exportieren & umbenennen', time: '5 min' },
    { step: '3', text: 'Per E-Mail manuell versenden', time: '5 min' },
    { step: '4', text: 'In Buchhaltungssoftware nachtragen', time: '10 min' },
    { step: '5', text: 'Zahlungseingang wöchentlich prüfen', time: '20 min' },
    { step: '6', text: 'Mahnung manuell schreiben', time: '15 min' },
  ];
  const after = [
    { step: '1', text: 'Daten im System erfassen', time: '5 min' },
    { step: '2', text: 'Auf „Senden" klicken – Rest automatisch', time: '1 min' },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Vorher — 85 min/Woche</p>
        <div className="space-y-2">
          {before.map(b => (
            <div key={b.step} className="flex items-center gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center font-bold">{b.step}</span>
              <span className="flex-1 text-slate-400">{b.text}</span>
              <span className="text-xs text-red-400">{b.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-5" style={{ borderColor: `${color}40`, background: `${color}08` }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color }}>Nachher — 6 min/Woche</p>
        <div className="space-y-2">
          {after.map(a => (
            <div key={a.step} className="flex items-center gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: `${color}30`, color }}>
                {a.step}
              </span>
              <span className="flex-1 text-slate-300">{a.text}</span>
              <span className="text-xs" style={{ color }}>{a.time}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold" style={{ color }}>→ Zeitersparnis: ~79 Minuten pro Woche = 65 Stunden pro Jahr</p>
      </div>
    </div>
  );
}

function VisualMarketing({ color }: { color: string }) {
  const stages = [
    { label: 'Sichtbarkeit', value: '12.000 Impressionen', pct: 100 },
    { label: 'Engagement',   value: '960 Reaktionen',      pct: 70 },
    { label: 'Klicks',       value: '240 Profilbesuche',   pct: 45 },
    { label: 'Anfragen',     value: '32 DMs / Kontakte',   pct: 25 },
    { label: 'Kunden',       value: '6 neue Aufträge',     pct: 10 },
  ];
  return (
    <div className="rounded-2xl border border-[#2d3144] bg-[#1a1d27] p-6">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-5">LinkedIn-Funnel · Monatsdurchschnitt nach 6 Monaten</p>
      <div className="space-y-3">
        {stages.map((s, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">{s.label}</span>
              <span className="text-slate-400">{s.value}</span>
            </div>
            <div className="h-2 bg-[#2d3144] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: color, opacity: 1 - i * 0.1 }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-slate-500">Organisch, ohne bezahltes Advertising. Nur durch konsistenten, strategischen Content.</p>
    </div>
  );
}

function VisualVideo({ color }: { color: string }) {
  const phases = [
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
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[#1e2235]">{p.icon}</div>
          <div className="flex-1 rounded-xl border border-[#2d3144] bg-[#1a1d27] px-4 py-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-sm text-white">{p.label}</span>
              <span className="text-xs" style={{ color }}>{p.days}</span>
            </div>
            <span className="text-xs text-slate-400">{p.desc}</span>
          </div>
          {i < phases.length - 1 && (
            <div className="absolute ml-5 mt-10 w-0.5 h-3 bg-[#2d3144]" />
          )}
        </div>
      ))}
    </div>
  );
}

function VisualKanban({ color }: { color: string }) {
  const columns = [
    { title: 'Backlog', tasks: ['Design-Konzept erstellen', 'Inhalte sammeln', 'API-Anbindung', 'SEO-Texte schreiben'] },
    { title: 'In Progress', tasks: ['Homepage-Entwicklung', 'Mobile-Ansicht'] },
    { title: 'Done ✓', tasks: ['Anforderungen definiert', 'Hosting eingerichtet', 'Domain konfiguriert', 'Design-System festgelegt'] },
  ];
  const colors = ['#475569', color, '#22c55e'];
  return (
    <div className="grid grid-cols-3 gap-3">
      {columns.map((col, ci) => (
        <div key={ci} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: colors[ci] }}>{col.title}</p>
          {col.tasks.map((t, ti) => (
            <div key={ti} className="rounded-lg border border-[#2d3144] bg-[#1e2235] px-3 py-2.5">
              <p className="text-xs text-slate-300 leading-snug">{t}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function VisualWorkshop({ color }: { color: string }) {
  const modules = [
    {
      num: '01',
      title: 'KI-Grundlagen & Tools',
      items: ['Was ist KI / ChatGPT / Copilot?', 'Wie schreibe ich gute Prompts?', 'Dos & Don'ts im Alltag', 'Live-Demo mit euren Beispielen'],
      duration: '1.5 Stunden',
    },
    {
      num: '02',
      title: 'KI im Arbeitsalltag',
      items: ['E-Mails mit KI verfassen', 'Dokumente analysieren & zusammenfassen', 'Recherche und Ideen generieren', 'Präsentationen erstellen'],
      duration: '1.5 Stunden',
    },
    {
      num: '03',
      title: 'Automatisierung & Workflows',
      items: ['Was ist Make / Zapier?', 'Einfache Automatisierungen bauen', 'Integration in bestehende Tools', 'Euer erster eigener Workflow'],
      duration: '1 Stunde',
    },
  ];
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {modules.map((m, i) => (
        <div key={i} className="rounded-xl border border-[#2d3144] bg-[#1a1d27] p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color }}>{m.num}</span>
            <div>
              <p className="font-semibold text-white text-sm leading-snug">{m.title}</p>
              <p className="text-xs text-slate-500">{m.duration}</p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {m.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
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

function VisualWebsite({ color }: { color: string }) {
  const scores = [
    { label: 'Performance', before: 42, after: 96 },
    { label: 'SEO',         before: 68, after: 99 },
    { label: 'Best Practices', before: 75, after: 100 },
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Lighthouse-Score Vergleich</p>
      {scores.map((s, i) => (
        <div key={i} className="rounded-xl border border-[#2d3144] bg-[#1a1d27] p-4">
          <p className="text-sm font-semibold text-white mb-3">{s.label}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Vorher</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-[#2d3144] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${s.before}%` }} />
                </div>
                <span className="text-sm font-bold text-red-400 w-7">{s.before}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Nachher</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-[#2d3144] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.after}%`, background: color }} />
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

function VisualRoadmap({ color }: { color: string }) {
  const phases = [
    { week: 'Woche 1–2',  title: 'Assessment',      desc: 'Bestandsaufnahme Prozesse, Daten, Tools. Interviews mit Schlüsselpersonen.' },
    { week: 'Woche 3–4',  title: 'Potenzialanalyse', desc: 'Top 5 KI-Use-Cases identifiziert, bewertet, priorisiert.' },
    { week: 'Woche 5–6',  title: 'KI-Roadmap',       desc: '12-Monats-Plan mit Kosten, ROI-Kalkulation und Technologie-Auswahl.' },
    { week: 'Ab Woche 7', title: 'Pilotprojekt',     desc: 'Erster Quick Win: kleines KI-Projekt mit messbarem Ergebnis.' },
  ];
  return (
    <div className="relative">
      <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-[#2d3144]" />
      <div className="space-y-4">
        {phases.map((p, i) => (
          <div key={i} className="relative flex gap-4 pl-2">
            <div className="flex-shrink-0 relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold"
              style={{ borderColor: color, background: '#0f1117', color }}>
              {i + 1}
            </div>
            <div className="flex-1 rounded-xl border border-[#2d3144] bg-[#1a1d27] p-4 pt-2.5">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-white">{p.title}</p>
                <span className="text-xs" style={{ color }}>{p.week}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceVisual({ slug, color }: { slug: string; color: string }) {
  switch (slug) {
    case 'ki-agenten':          return <VisualKiAgenten color={color} />;
    case 'business-analyse':    return <VisualBusinessAnalyse color={color} />;
    case 'prozessoptimierung':  return <VisualBpmn color={color} />;
    case 'digital-marketing':   return <VisualMarketing color={color} />;
    case 'video-produktion':    return <VisualVideo color={color} />;
    case 'projektmanagement':   return <VisualKanban color={color} />;
    case 'workshops':           return <VisualWorkshop color={color} />;
    case 'website-optimierung': return <VisualWebsite color={color} />;
    case 'ki-beratung-kmu':     return <VisualRoadmap color={color} />;
    default: return null;
  }
}

// ── Page ─────────────────────────────────────────────────────

export default function ServicePage({ params }: { params: { slug: string } }) {
  const s = getService(params.slug);
  if (!s) notFound();

  const Icon = ICON_MAP[s.iconKey] || Lightbulb;

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2d3144] bg-[#0f1117]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-white text-lg tracking-tight hover:opacity-80 transition-opacity">
            Marcel Spahr
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#services"  className="text-sm text-slate-400 hover:text-white transition-colors">Leistungen</Link>
            <Link href="/#portfolio" className="text-sm text-slate-400 hover:text-white transition-colors">Portfolio</Link>
            <Link href="/#about"     className="text-sm text-slate-400 hover:text-white transition-colors">Über mich</Link>
            <a href="#contact" className="ml-2 px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-colors" style={{ background: s.color }}>
              Kostenlos anfragen
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{
          background: `radial-gradient(ellipse 50% 40% at 20% 30%, ${s.color}12 0%, transparent 70%)`
        }} />
        <div className="relative max-w-4xl mx-auto">
          <Link href="/#services" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Alle Leistungen
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
              <Icon size={28} style={{ color: s.color }} />
            </div>
            <div className="flex-1">
              <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ color: s.color, background: `${s.color}18` }}>
                Leistung
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                {s.title}
              </h1>
              <p className="mt-3 text-lg sm:text-xl text-slate-400">{s.subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-[#2d3144] bg-[#1a1d27] p-8">
            <h2 className="text-xl font-bold text-white mb-4">Was bedeutet das für dich?</h2>
            <p className="text-slate-300 leading-relaxed text-lg">{s.intro}</p>
          </div>
        </div>
      </section>

      {/* ── Visual / Example ── */}
      <section className="py-12 px-4 sm:px-6 bg-[#0c0e14]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>Beispiel aus der Praxis</span>
            <h2 className="mt-1 text-2xl font-bold text-white">{s.exampleTitle}</h2>
            <p className="mt-2 text-slate-400 leading-relaxed">{s.exampleText}</p>
          </div>
          <ServiceVisual slug={s.slug} color={s.color} />
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>Vorgehen</span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white">So gehe ich vor</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {s.process.map((step, i) => (
              <div key={i} className="relative rounded-xl border border-[#2d3144] bg-[#1a1d27] p-6 hover:border-[#6366f1]/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${s.color}20`, color: s.color }}>
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deliverables ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#0c0e14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>Ergebnis</span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white">Was du bekommst</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.deliverables.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#2d3144] bg-[#1a1d27] px-4 py-3">
                <span className="text-xl flex-shrink-0">{d.emoji}</span>
                <span className="text-sm text-slate-300 font-medium">{d.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Kontakt ── */}
      <section id="contact" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden">
            <div className="px-8 pt-10 pb-6 text-center" style={{ background: `linear-gradient(135deg, ${s.color}15 0%, transparent 60%)` }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: `${s.color}20` }}>
                <CheckCircle size={28} style={{ color: s.color }} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Kostenlose Erstberatung</h2>
              <p className="mt-3 text-slate-400 max-w-xl mx-auto">
                Interessiert an <strong className="text-white">{s.title}</strong>?  Schreib mir – ich melde mich innerhalb von 2 Arbeitstagen und wir schauen gemeinsam, was für dich Sinn macht. Unverbindlich.
              </p>
            </div>
            <div className="px-8 pb-10">
              <div className="max-w-xl mx-auto">
                <ContactFormClient />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2d3144] bg-[#0c0e14] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft size={13} /> Zurück zur Startseite
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-slate-500">© 2026 Marcel Spahr</span>
            <a href="/impressum"  className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Impressum</a>
            <a href="/datenschutz" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
