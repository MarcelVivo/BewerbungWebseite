'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ChevronRight, ChevronLeft, Check, Plus, X, Sparkles,
  ClipboardList, Star, Users, Target, Zap, DollarSign,
  Clock, FileText, AlertCircle, CheckCircle2, Circle, Copy,
  Inbox, ExternalLink, Mail, Phone, Building2, Calendar,
} from 'lucide-react';
import type { Kunde } from '@/lib/types';

// ── RE Anfragen Types ────────────────────────────────────────

type ReAnfrageStatus = 'neu' | 'kontaktiert' | 'in_bearbeitung' | 'abgeschlossen';

interface ReAnfrage {
  id: string;
  name: string;
  email: string;
  firma?: string;
  telefon?: string;
  branche: string;
  projekttyp: string;
  anforderungen: { text: string; prio: 'must' | 'nice' }[];
  budget?: string;
  zeitrahmen?: string;
  notizen?: string;
  status: ReAnfrageStatus;
  created_at: string;
}

const STATUS_CFG: Record<ReAnfrageStatus, { label: string; cls: string }> = {
  neu:            { label: 'Neu',            cls: 'bg-blue-900/60 text-blue-300' },
  kontaktiert:    { label: 'Kontaktiert',    cls: 'bg-yellow-900/60 text-yellow-300' },
  in_bearbeitung: { label: 'In Bearbeitung', cls: 'bg-purple-900/60 text-purple-300' },
  abgeschlossen:  { label: 'Abgeschlossen',  cls: 'bg-green-900/60 text-green-300' },
};

// ── Static Data ─────────────────────────────────────────────

const BRANCHEN = [
  { label: 'Beauty & Wellness', icon: '💆' },
  { label: 'Immobilien', icon: '🏠' },
  { label: 'IT & Software', icon: '💻' },
  { label: 'Finanzwesen', icon: '💰' },
  { label: 'Baubranche', icon: '🏗️' },
  { label: 'Gesundheit & Medizin', icon: '🏥' },
  { label: 'Gastronomie & Food', icon: '🍽️' },
  { label: 'E-Commerce & Retail', icon: '🛍️' },
  { label: 'NGO & Verein', icon: '🤝' },
  { label: 'Bildung & Training', icon: '📚' },
  { label: 'Sonstiges', icon: '⚙️' },
];

const PROJEKTTYPEN = [
  { label: 'Neue Website', icon: '🌐' },
  { label: 'Website Redesign', icon: '🔄' },
  { label: 'Prozessoptimierung', icon: '⚡' },
  { label: 'Marketing Strategie', icon: '📈' },
  { label: 'KI-Integration', icon: '🤖' },
  { label: 'App / Plattform', icon: '📱' },
  { label: 'E-Commerce Shop', icon: '🛒' },
  { label: 'Workshop / Training', icon: '🎓' },
  { label: 'Sonstiges', icon: '🔧' },
];

const IST_CHIPS = [
  'Bestehende Website vorhanden',
  'Keine digitale Präsenz',
  'Social-Media-Präsenz vorhanden',
  'CRM-System im Einsatz',
  'Manuelle Prozesse (Excel/Papier)',
  'Bestehende Software/Tools',
  'Online-Shop vorhanden',
  'Newsletter-System aktiv',
  'Buchungssystem vorhanden',
  'Kein Analytics/Tracking',
];

const SCHMERZ_CHIPS = [
  'Zu zeitaufwändig / manuell',
  'Zu wenig Kundenanfragen',
  'Schlechte Mobile-Erfahrung',
  'Nicht auffindbar (SEO)',
  'Veraltetes Design / CI',
  'Keine Übersicht / kein Reporting',
  'Systembrüche / Medienbrüche',
  'Fehlende Automatisierung',
  'Hohe Fehlerquote',
  'Schlechte Kundenkommunikation',
  'Daten nicht zentral',
  'Kein klares Alleinstellungsmerkmal',
];

const NF_CHIPS = [
  'Mobile-First / Responsive',
  'Ladezeit < 2 Sekunden',
  'DSGVO / Datenschutz',
  'Barrierefreiheit (WCAG)',
  'SSL / IT-Sicherheit',
  'SEO-tauglich',
  'Mehrsprachig (DE/EN/FR)',
  'Für mehr Nutzung ausgelegt',
  'Analytics / Tracking',
  'Browser-Kompatibilität',
  'Backup & Recovery',
  'API-Schnittstellen',
];

const ANF_SEGMENT: Record<string, string[]> = {
  'Beauty & Wellness':    ['Online-Buchung', 'Vorher/Nachher Galerie', 'Preisliste', 'Team-Präsentation', 'Bewertungen/Social Proof', 'Produkt-Shop', 'Gutscheine', 'Newsletter'],
  'Immobilien':           ['Objektsuche / Filter', 'Exposé-Ansicht', 'Kontaktformular', '360° Rundgang', 'Grundriss-Upload', 'Karten-Integration', 'Interessenten-Portal', 'Bewertungsanfrage'],
  'IT & Software':        ['API-Dokumentation', 'Demo-Anfrage', 'Kundenportal', 'Support-Ticketing', 'Changelog', 'Preistabelle', 'Integrationen', 'Status-Page'],
  'Finanzwesen':          ['Beratungsanfrage', 'Rechner-Tool', 'FAQ-Bereich', 'Trust-Elemente', 'DSGVO-konform', 'Terminbuchung', 'Formulare', 'Mehrsprachig'],
  'Baubranche':           ['Referenzprojekte', 'Leistungsübersicht', 'Anfrageformular', 'Team-Präsentation', 'Ausschreibungen', 'Zertifikate', 'Jobs/Karriere', 'Maschinenpark'],
  'Gesundheit & Medizin': ['Online-Terminbuchung', 'Leistungen & Fachgebiete', 'Team/Ärzte', 'Patienteninfos', 'Notfallinfos', 'DSGVO', 'Anfahrt/Maps', 'Zertifikate'],
  'Gastronomie & Food':   ['Online-Reservierung', 'Speisekarte', 'Bestellsystem', 'Catering/Events', 'Lieferung', 'Bewertungen', 'Gutscheine', 'Saisonales Angebot'],
  'E-Commerce & Retail':  ['Produktkatalog', 'Warenkorb & Checkout', 'Filterfunktion', 'Bewertungen', 'Lagerverwaltung', 'Rabattcodes', 'Wishlist', 'Rückgabeprozess'],
  'NGO & Verein':         ['Spendenformular', 'Mitgliedschaft', 'Projektberichte', 'Team/Vorstand', 'Veranstaltungen', 'Blog/News', 'Social Media', 'Ehrenamt-Verwaltung'],
  'Bildung & Training':   ['Kursübersicht', 'Online-Anmeldung', 'Lernplattform', 'Dozenten-Profile', 'Zertifikate', 'Testimonials', 'E-Learning', 'Newsletter'],
  'Sonstiges':            ['Kontaktformular', 'Über uns', 'Leistungen', 'Portfolio', 'Blog', 'Social Media', 'Newsletter', 'FAQ'],
};

const ANF_PROJEKT: Record<string, string[]> = {
  'Neue Website':        ['Responsive Design', 'CMS (einfach pflegbar)', 'SEO-Optimierung', 'Schnelle Ladezeit', 'DSGVO-konform', 'Cookie-Banner', 'Analytics', 'SSL'],
  'Website Redesign':    ['Inhalte übernehmen', 'Neues Design / CI', 'SEO nicht verlieren', 'Mobile UX verbessern', 'Modernere Technologie', 'A/B Testing', 'Ladezeit optimieren'],
  'Prozessoptimierung':  ['Automatisierung', 'Weniger manuelle Eingaben', 'Reporting/Dashboard', 'Systemintegration', 'Fehlerreduktion', 'Zeitersparnis messbar', 'Für mehr Nutzung ausgelegt'],
  'Marketing Strategie': ['Zielgruppen-Definition', 'Content-Kalender', 'Social Media Plan', 'SEO-Strategie', 'E-Mail Marketing', 'Paid Ads', 'KPI-Definition', 'Wettbewerbsanalyse'],
  'KI-Integration':      ['KI-Chatbot', 'Automatische Zusammenfassungen', 'KI-Suche', 'Dokumentenanalyse', 'Empfehlungssystem', 'Datenschutz/DSGVO', 'Training auf eigene Daten', 'API-Anbindung'],
  'App / Plattform':     ['Login/Registrierung', 'Mobile App (iOS/Android)', 'Admin-Dashboard', 'Push-Notifications', 'Offline-Funktion', 'API-Schnittstellen', 'Rollen/Rechte', 'Zahlungsintegration'],
  'E-Commerce Shop':     ['Produktverwaltung', 'Zahlungsanbieter', 'Versand-Integration', 'Steuern/MwSt', 'Lagerverwaltung', 'Kundenkonto', 'Bewertungen', 'Mehrwährung'],
  'Workshop / Training': ['Lernziele definieren', 'Teilnehmer-Unterlagen', 'Hands-on Übungen', 'Online/Präsenz/Hybrid', 'Zertifikat', 'Feedback-Erhebung', 'Follow-up Material'],
  'Sonstiges':           ['Anforderungen individuell', 'Machbarkeit prüfen', 'Budget klären', 'Timeline festlegen'],
};

const BUDGET_OPTIONS = [
  "Unter CHF 2'000", "CHF 2'000 bis 5'000", "CHF 5'000 bis 15'000",
  "CHF 15'000 bis 30'000", "Über CHF 30'000", 'Noch nicht definiert',
];

const ZEIT_OPTIONS = [
  'So bald wie möglich', '1 bis 2 Monate', '3 bis 6 Monate',
  '6 bis 12 Monate', 'Über 1 Jahr', 'Noch offen',
];

const STEPS = [
  { id: 1, label: 'Kontext',         icon: Users },
  { id: 2, label: 'Ist-Situation',   icon: AlertCircle },
  { id: 3, label: 'Anforderungen',   icon: Target },
  { id: 4, label: 'Rahmenbedingungen', icon: DollarSign },
  { id: 5, label: 'Auswertung',      icon: Sparkles },
];

// ── Types ────────────────────────────────────────────────────

type Prio = 'must' | 'nice';
interface Anforderung { text: string; prio: Prio; }

interface Interview {
  kundenName: string;
  kunden_id: string;
  branche: string;
  projekttyp: string;
  istSituation: string[];
  gutLaueft: string;
  schmerzpunkte: string[];
  schmerzpunkteText: string;
  anforderungen: Anforderung[];
  nfAnforderungen: string[];
  anforderungenText: string;
  budget: string;
  zeitrahmen: string;
  deadline: string;
  stakeholder: string;
  techEinschraenkungen: string;
  notizen: string;
  projekttitel: string;
}

const EMPTY: Interview = {
  kundenName: '', kunden_id: '', branche: '', projekttyp: '',
  istSituation: [], gutLaueft: '', schmerzpunkte: [], schmerzpunkteText: '',
  anforderungen: [], nfAnforderungen: [], anforderungenText: '',
  budget: '', zeitrahmen: '', deadline: '', stakeholder: '',
  techEinschraenkungen: '', notizen: '', projekttitel: '',
};

// ── Helpers ──────────────────────────────────────────────────

const inp = 'w-full rounded-lg bg-[#0f1117] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-3 py-2 text-white text-sm placeholder-slate-600 transition-colors';

function ChipToggle({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        selected
          ? 'bg-[#6366f1]/20 border-[#6366f1]/60 text-[#a5b4fc]'
          : 'bg-[#0f1117] border-[#2d3144] text-slate-400 hover:border-[#6366f1]/30 hover:text-slate-300'
      }`}
    >
      {selected && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

function AnforderungChip({ text, prio, onClick }: { text: string; prio: Prio | null; onClick: () => void }) {
  const cls = prio === 'must'
    ? 'bg-green-900/30 border-green-700/50 text-green-300'
    : prio === 'nice'
    ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300'
    : 'bg-[#0f1117] border-[#2d3144] text-slate-400 hover:border-[#6366f1]/30 hover:text-slate-300';

  return (
    <button
      type="button"
      onClick={onClick}
      title={prio === 'must' ? 'Must-have → Nice-to-have → entfernen' : prio === 'nice' ? 'Nice-to-have → entfernen' : 'Klick = Must-have, 2x = Nice-to-have, 3x = entfernen'}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${cls}`}
    >
      {prio === 'must' && <span className="mr-1">★</span>}
      {prio === 'nice' && <span className="mr-1">◇</span>}
      {text}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{children}</h3>;
}

// ── Main Component ───────────────────────────────────────────

export default function ReInterviewPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [iv, setIv] = useState<Interview>(EMPTY);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [customAnfInput, setCustomAnfInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createClient().from('kunden').select('id,kontaktperson,firmenname').order('kontaktperson')
      .then(({ data }) => setKunden((data ?? []) as Kunde[]));
  }, []);

  function set<K extends keyof Interview>(key: K, val: Interview[K]) {
    setIv(prev => ({ ...prev, [key]: val }));
  }

  function toggleList(key: 'istSituation' | 'schmerzpunkte' | 'nfAnforderungen', val: string) {
    setIv(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  function toggleAnf(text: string) {
    setIv(prev => {
      const existing = prev.anforderungen.find(a => a.text === text);
      if (!existing) return { ...prev, anforderungen: [...prev.anforderungen, { text, prio: 'must' }] };
      if (existing.prio === 'must') return { ...prev, anforderungen: prev.anforderungen.map(a => a.text === text ? { ...a, prio: 'nice' } : a) };
      return { ...prev, anforderungen: prev.anforderungen.filter(a => a.text !== text) };
    });
  }

  function addCustomAnf() {
    const t = customAnfInput.trim();
    if (!t || iv.anforderungen.find(a => a.text === t)) return;
    setIv(prev => ({ ...prev, anforderungen: [...prev.anforderungen, { text: t, prio: 'must' }] }));
    setCustomAnfInput('');
  }

  const anfChips = useMemo(() => {
    const seg = ANF_SEGMENT[iv.branche] ?? [];
    const proj = ANF_PROJEKT[iv.projekttyp] ?? [];
    return [...new Set([...seg, ...proj])];
  }, [iv.branche, iv.projekttyp]);

  const canNext = useMemo(() => {
    if (step === 1) return iv.kundenName.trim() !== '' && iv.branche !== '' && iv.projekttyp !== '';
    return true;
  }, [step, iv]);

  function handleKundeSelect(id: string) {
    const k = kunden.find(k => k.id === id);
    set('kunden_id', id);
    if (k) set('kundenName', k.firmenname || k.kontaktperson);
  }

  function autoTitle() {
    if (!iv.projekttitel) {
      set('projekttitel', `${iv.projekttyp}. ${iv.kundenName}.`);
    }
  }

  function generatePrompt(): string {
    const must = iv.anforderungen.filter(a => a.prio === 'must');
    const nice = iv.anforderungen.filter(a => a.prio === 'nice');

    const lines: string[] = [
      `Du bist ein erfahrener Software-Architekt und KI-Berater. Ich habe soeben ein Requirements-Engineering-Interview mit einem Kunden durchgeführt und folgende Anforderungen aufgenommen. Analysiere diese und erstelle daraus einen konkreten Umsetzungsplan.`,
      ``,
      `## Kundenkontext`,
      `- **Kunde:** ${iv.kundenName || 'n.d.'}`,
      `- **Branche:** ${iv.branche || 'n.d.'}`,
      `- **Projekttyp:** ${iv.projekttyp || 'n.d.'}`,
    ];

    if (iv.istSituation.length > 0) {
      lines.push(``, `## Ist-Situation`);
      lines.push(`**Aktuell vorhanden:** ${iv.istSituation.join(', ')}`);
    }
    if (iv.gutLaueft) lines.push(`**Was gut läuft:** ${iv.gutLaueft}`);
    if (iv.schmerzpunkte.length > 0) lines.push(`**Schmerzpunkte:** ${iv.schmerzpunkte.join(', ')}`);
    if (iv.schmerzpunkteText) lines.push(`**Details:** ${iv.schmerzpunkteText}`);

    if (must.length > 0) {
      lines.push(``, `## Must-have Anforderungen _(zwingend umzusetzen)_`);
      must.forEach(a => lines.push(`- ${a.text}`));
    }
    if (nice.length > 0) {
      lines.push(``, `## Nice-to-have Anforderungen _(bei Budget/Zeit möglich)_`);
      nice.forEach(a => lines.push(`- ${a.text}`));
    }
    if (iv.anforderungenText) lines.push(``, `**Weitere Anforderungen:** ${iv.anforderungenText}`);

    if (iv.nfAnforderungen.length > 0) {
      lines.push(``, `## Nicht-funktionale Anforderungen`);
      iv.nfAnforderungen.forEach(n => lines.push(`- ${n}`));
    }

    lines.push(``, `## Rahmenbedingungen`);
    if (iv.budget) lines.push(`- **Budget:** ${iv.budget}`);
    if (iv.zeitrahmen) lines.push(`- **Zeitrahmen:** ${iv.zeitrahmen}`);
    if (iv.deadline) lines.push(`- **Deadline:** ${new Date(iv.deadline).toLocaleDateString('de-CH')}`);
    if (iv.stakeholder) lines.push(`- **Stakeholder:** ${iv.stakeholder}`);
    if (iv.techEinschraenkungen) lines.push(`- **Technische Einschränkungen:** ${iv.techEinschraenkungen}`);
    if (iv.notizen) lines.push(``, `## Zusatznotizen aus dem Interview`, iv.notizen);

    lines.push(
      ``,
      `---`,
      ``,
      `Bitte erstelle basierend auf diesen Anforderungen:`,
      ``,
      `1. **Projektbeschreibung.** Fasse das Projekt und sein Ziel kurz und klar zusammen.`,
      `2. **Technische Architektur.** Empfehle einen passenden technischen Aufbau.`,
      `3. **Aufgaben und User Stories.** Ordne die Aufgaben nach ihrer Wichtigkeit.`,
      `4. **Grober Zeitplan.** Nenne Meilensteine passend zu Zeitrahmen und Budget.`,
      `5. **Offene Fragen.** Halte fest, was vor der Umsetzung noch geklärt werden muss.`,
    );

    return lines.join('\n');
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(generatePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function createProject() {
    setSaving(true);
    const must = iv.anforderungen.filter(a => a.prio === 'must').map(a => `  • ${a.text}`).join('\n');
    const nice = iv.anforderungen.filter(a => a.prio === 'nice').map(a => `  ◇ ${a.text}`).join('\n');
    const nf   = iv.nfAnforderungen.map(a => `  ${a}.`).join('\n');

    const beschreibung = [
      `=== RE-Interview Auswertung ===`,
      `Branche: ${iv.branche} | Projekttyp: ${iv.projekttyp}`,
      ``,
      `IST-SITUATION`,
      iv.istSituation.join(', '),
      iv.gutLaueft ? `Was gut läuft: ${iv.gutLaueft}` : '',
      iv.schmerzpunkte.length ? `Schmerzpunkte: ${iv.schmerzpunkte.join(', ')}` : '',
      iv.schmerzpunkteText ? `Zusatz: ${iv.schmerzpunkteText}` : '',
      ``,
      `MUST-HAVE ANFORDERUNGEN`,
      must || '  (keine)',
      ``,
      `NICE-TO-HAVE ANFORDERUNGEN`,
      nice || '  (keine)',
      ``,
      `NICHT-FUNKTIONALE ANFORDERUNGEN`,
      nf || '  (keine)',
      iv.anforderungenText ? `Zusatz: ${iv.anforderungenText}` : '',
      ``,
      `RAHMENBEDINGUNGEN`,
      `Budget: ${iv.budget || 'n.d.'} | Zeitrahmen: ${iv.zeitrahmen || 'n.d.'}`,
      iv.deadline ? `Deadline: ${iv.deadline}` : '',
      iv.stakeholder ? `Stakeholder: ${iv.stakeholder}` : '',
      iv.techEinschraenkungen ? `Technische Einschränkungen: ${iv.techEinschraenkungen}` : '',
      iv.notizen ? `\nZUSATZNOTIZEN\n${iv.notizen}` : '',
    ].filter(Boolean).join('\n');

    const sb = createClient();
    const { error } = await sb.from('projekte').insert({
      name:        iv.projekttitel || `${iv.projekttyp}. ${iv.kundenName}.`,
      kunden_id:   iv.kunden_id || null,
      status:      'aktiv',
      beschreibung,
      farbe:       '#6366f1',
    });
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => router.push('/dashboard/projekte'), 1500); }
  }

  // ── Render Helpers ─────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-8">
        <div>
          <SectionTitle>Kunde</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Bestehenden Kunden wählen</label>
              <select
                value={iv.kunden_id}
                onChange={e => handleKundeSelect(e.target.value)}
                className={inp}
              >
                <option value="">Neuer oder kein Eintrag.</option>
                {kunden.map(k => (
                  <option key={k.id} value={k.id}>{k.firmenname || k.kontaktperson}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Kundenname *</label>
              <input
                value={iv.kundenName}
                onChange={e => set('kundenName', e.target.value)}
                className={inp}
                placeholder="Müller AG / Max Müller"
              />
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>Branche / Kundensegment *</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {BRANCHEN.map(b => (
              <button
                key={b.label}
                type="button"
                onClick={() => set('branche', b.label)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  iv.branche === b.label
                    ? 'bg-[#6366f1]/20 border-[#6366f1] text-white'
                    : 'bg-[#0f1117] border-[#2d3144] text-slate-400 hover:border-[#6366f1]/30 hover:text-slate-300'
                }`}
              >
                <span className="text-lg flex-shrink-0">{b.icon}</span>
                <span className="leading-tight">{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Projekttyp *</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROJEKTTYPEN.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => set('projekttyp', p.label)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  iv.projekttyp === p.label
                    ? 'bg-[#6366f1]/20 border-[#6366f1] text-white'
                    : 'bg-[#0f1117] border-[#2d3144] text-slate-400 hover:border-[#6366f1]/30 hover:text-slate-300'
                }`}
              >
                <span className="text-lg flex-shrink-0">{p.icon}</span>
                <span className="leading-tight">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-8">
        <div>
          <SectionTitle>Was hat der Kunde heute?</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {IST_CHIPS.map(c => (
              <ChipToggle key={c} label={c} selected={iv.istSituation.includes(c)} onClick={() => toggleList('istSituation', c)} />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Was funktioniert gut / soll erhalten bleiben?</SectionTitle>
          <textarea
            value={iv.gutLaueft}
            onChange={e => set('gutLaueft', e.target.value)}
            rows={3}
            className={inp + ' resize-none'}
            placeholder="Z.B. «Wir haben viele Stammkunden, die persönliche Beratung schätzen.»"
          />
        </div>

        <div>
          <SectionTitle>Hauptprobleme / Schmerzpunkte</SectionTitle>
          <div className="flex flex-wrap gap-2 mb-3">
            {SCHMERZ_CHIPS.map(c => (
              <ChipToggle key={c} label={c} selected={iv.schmerzpunkte.includes(c)} onClick={() => toggleList('schmerzpunkte', c)} />
            ))}
          </div>
          <textarea
            value={iv.schmerzpunkteText}
            onChange={e => set('schmerzpunkteText', e.target.value)}
            rows={2}
            className={inp + ' resize-none'}
            placeholder="Beschreibe weitere Probleme in eigenen Worten."
          />
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-8">
        <div>
          <SectionTitle>Funktionale Anforderungen</SectionTitle>
          <p className="text-xs text-slate-500 mb-3">
            <span className="text-green-400">★ 1×</span> = Must-have &nbsp;·&nbsp;
            <span className="text-yellow-400">◇ 2×</span> = Nice-to-have &nbsp;·&nbsp;
            <span className="text-slate-500">3× = entfernen</span>
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {anfChips.map(c => {
              const existing = iv.anforderungen.find(a => a.text === c);
              return (
                <AnforderungChip
                  key={c}
                  text={c}
                  prio={existing?.prio ?? null}
                  onClick={() => toggleAnf(c)}
                />
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              value={customAnfInput}
              onChange={e => setCustomAnfInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomAnf())}
              className={inp + ' flex-1'}
              placeholder="Füge eine eigene Anforderung hinzu."
            />
            <button
              type="button"
              onClick={addCustomAnf}
              className="px-3 py-2 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#a5b4fc] hover:bg-[#6366f1]/30 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {iv.anforderungen.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-[#0f1117] border border-[#2d3144]">
              <p className="text-xs text-slate-500 mb-2 font-bold">Ausgewählte Anforderungen</p>
              <div className="flex flex-wrap gap-1.5">
                {iv.anforderungen.map(a => (
                  <span
                    key={a.text}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      a.prio === 'must' ? 'bg-green-900/30 border-green-700/40 text-green-300' : 'bg-yellow-900/30 border-yellow-700/40 text-yellow-300'
                    }`}
                  >
                    {a.prio === 'must' ? '★' : '◇'} {a.text}
                    <button onClick={() => setIv(p => ({ ...p, anforderungen: p.anforderungen.filter(x => x.text !== a.text) }))} className="ml-1 opacity-60 hover:opacity-100">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <textarea
              value={iv.anforderungenText}
              onChange={e => set('anforderungenText', e.target.value)}
              rows={2}
              className={inp + ' resize-none'}
              placeholder="Beschreibe weitere Anforderungen in eigenen Worten."
            />
          </div>
        </div>

        <div>
          <SectionTitle>Nicht-funktionale Anforderungen</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {NF_CHIPS.map(c => (
              <ChipToggle key={c} label={c} selected={iv.nfAnforderungen.includes(c)} onClick={() => toggleList('nfAnforderungen', c)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-8">
        <div>
          <SectionTitle>Budget</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUDGET_OPTIONS.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => set('budget', b)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                  iv.budget === b
                    ? 'bg-[#6366f1]/20 border-[#6366f1] text-white'
                    : 'bg-[#0f1117] border-[#2d3144] text-slate-400 hover:border-[#6366f1]/30'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Zeitrahmen</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ZEIT_OPTIONS.map(z => (
              <button
                key={z}
                type="button"
                onClick={() => set('zeitrahmen', z)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                  iv.zeitrahmen === z
                    ? 'bg-[#6366f1]/20 border-[#6366f1] text-white'
                    : 'bg-[#0f1117] border-[#2d3144] text-slate-400 hover:border-[#6366f1]/30'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Festes Deadline-Datum (optional)</label>
            <input
              type="date"
              value={iv.deadline}
              onChange={e => set('deadline', e.target.value)}
              className={inp + ' [color-scheme:dark]'}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Stakeholder / Entscheider</label>
            <input
              value={iv.stakeholder}
              onChange={e => set('stakeholder', e.target.value)}
              className={inp}
              placeholder="z.B. CEO + Marketing-Leitung"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Technische Einschränkungen</label>
          <textarea
            value={iv.techEinschraenkungen}
            onChange={e => set('techEinschraenkungen', e.target.value)}
            rows={2}
            className={inp + ' resize-none'}
            placeholder="Zum Beispiel muss die Lösung mit WordPress kompatibel sein oder eine bestehende Datenbank behalten."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Zusätzliche Notizen aus dem Interview</label>
          <textarea
            value={iv.notizen}
            onChange={e => set('notizen', e.target.value)}
            rows={3}
            className={inp + ' resize-none'}
            placeholder="Halte persönliche Eindrücke, Besonderheiten und offene Punkte fest."
          />
        </div>
      </div>
    );
  }

  function renderStep5() {
    const must = iv.anforderungen.filter(a => a.prio === 'must');
    const nice = iv.anforderungen.filter(a => a.prio === 'nice');

    return (
      <div className="space-y-6">
        {saved ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <p className="text-white font-semibold text-lg">Projekt erstellt!</p>
            <p className="text-slate-400 text-sm">Du wirst zu den Projekten weitergeleitet.</p>
          </div>
        ) : (
          <>
            {/* Summary Header */}
            <div className="rounded-xl border border-[#2d3144] bg-[#1a1d27] p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest">
                <FileText size={12} /> Zusammenfassung
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs">Kunde</span>
                  <p className="text-white font-medium">{iv.kundenName || 'Keine Angabe.'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Branche</span>
                  <p className="text-white font-medium">{iv.branche || 'Keine Angabe.'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Projekttyp</span>
                  <p className="text-white font-medium">{iv.projekttyp || 'Keine Angabe.'}</p>
                </div>
              </div>
            </div>

            {/* Ist-Situation */}
            {(iv.istSituation.length > 0 || iv.schmerzpunkte.length > 0) && (
              <div className="rounded-xl border border-[#2d3144] bg-[#1a1d27] p-5 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ist-Situation</p>
                {iv.istSituation.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Aktuell vorhanden</p>
                    <div className="flex flex-wrap gap-1.5">
                      {iv.istSituation.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[#252836] border border-[#2d3144] text-slate-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {iv.schmerzpunkte.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Schmerzpunkte</p>
                    <div className="flex flex-wrap gap-1.5">
                      {iv.schmerzpunkte.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-900/20 border border-red-800/30 text-red-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {iv.gutLaueft && <p className="text-xs text-slate-400">✓ {iv.gutLaueft}</p>}
              </div>
            )}

            {/* Anforderungen */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-green-800/30 bg-green-900/10 p-5">
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">★ Must-have ({must.length})</p>
                {must.length === 0
                  ? <p className="text-xs text-slate-500">Keine erfasst</p>
                  : <ul className="space-y-1.5">
                      {must.map(a => <li key={a.text} className="flex items-center gap-2 text-sm text-green-300"><Check size={12} />{a.text}</li>)}
                    </ul>
                }
              </div>
              <div className="rounded-xl border border-yellow-800/30 bg-yellow-900/10 p-5">
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">◇ Nice-to-have ({nice.length})</p>
                {nice.length === 0
                  ? <p className="text-xs text-slate-500">Keine erfasst</p>
                  : <ul className="space-y-1.5">
                      {nice.map(a => <li key={a.text} className="flex items-center gap-2 text-sm text-yellow-300"><Circle size={12} />{a.text}</li>)}
                    </ul>
                }
              </div>
            </div>

            {/* NF + Rahmenbedingungen */}
            {(iv.nfAnforderungen.length > 0 || iv.budget || iv.zeitrahmen) && (
              <div className="rounded-xl border border-[#2d3144] bg-[#1a1d27] p-5 space-y-3">
                {iv.nfAnforderungen.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Nicht-funktionale Anforderungen</p>
                    <div className="flex flex-wrap gap-1.5">
                      {iv.nfAnforderungen.map(n => (
                        <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#a5b4fc]">{n}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-3 gap-3 text-sm pt-1">
                  {iv.budget && <div><span className="text-slate-500 text-xs">Budget</span><p className="text-white font-medium">{iv.budget}</p></div>}
                  {iv.zeitrahmen && <div><span className="text-slate-500 text-xs">Zeitrahmen</span><p className="text-white font-medium">{iv.zeitrahmen}</p></div>}
                  {iv.deadline && <div><span className="text-slate-500 text-xs">Deadline</span><p className="text-white font-medium">{new Date(iv.deadline).toLocaleDateString('de-CH')}</p></div>}
                </div>
              </div>
            )}

            {/* Claude Code Prompt */}
            <div className="rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/5 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#67e8f9] uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} /> Claude Code Prompt
                </p>
                <button
                  onClick={copyPrompt}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    copied
                      ? 'bg-green-500/20 border-green-500/40 text-green-300'
                      : 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#67e8f9] hover:bg-[#06b6d4]/20'
                  }`}
                >
                  {copied ? <><Check size={12} /> Kopiert!</> : <><Copy size={12} /> Prompt kopieren</>}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Dieser Prompt fasst alle Anforderungen zusammen. Du kannst ihn direkt in Claude Code einfügen.
              </p>
              <pre className="text-xs text-slate-300 bg-[#0f1117] rounded-lg border border-[#2d3144] p-4 overflow-auto max-h-64 whitespace-pre-wrap leading-relaxed font-mono">
                {generatePrompt()}
              </pre>
            </div>

            {/* Projekt erstellen */}
            <div className="rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/5 p-5 space-y-3">
              <p className="text-xs font-bold text-[#a5b4fc] uppercase tracking-widest">Projekt erstellen</p>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Projekttitel</label>
                <input
                  value={iv.projekttitel}
                  onChange={e => set('projekttitel', e.target.value)}
                  onFocus={autoTitle}
                  className={inp}
                  placeholder={`${iv.projekttyp}. ${iv.kundenName}.`}
                />
              </div>
              <button
                onClick={createProject}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white font-semibold transition-colors"
              >
                {saving ? 'Ich erstelle das Projekt.' : <><Sparkles size={16} /> Projekt aus Interview erstellen</>}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Anfragen (public submissions) ────────────────────────

  const [activeTab, setActiveTab] = useState<'interview' | 'anfragen'>('interview');
  const [anfragen, setAnfragen] = useState<ReAnfrage[]>([]);
  const [anfragenLoading, setAnfragenLoading] = useState(false);
  const [anfragenLoaded, setAnfragenLoaded] = useState(false);

  async function loadAnfragen() {
    setAnfragenLoading(true);
    const { data } = await createClient()
      .from('re_anfragen')
      .select('*')
      .order('created_at', { ascending: false });
    setAnfragen((data ?? []) as ReAnfrage[]);
    setAnfragenLoading(false);
    setAnfragenLoaded(true);
  }

  async function updateAnfrageStatus(id: string, status: ReAnfrageStatus) {
    await createClient().from('re_anfragen').update({ status }).eq('id', id);
    setAnfragen(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  function handleTabChange(tab: 'interview' | 'anfragen') {
    setActiveTab(tab);
    if (tab === 'anfragen' && !anfragenLoaded) loadAnfragen();
  }

  function renderAnfragen() {
    if (anfragenLoading) return <div className="py-16 text-center text-slate-500 text-sm">Die Anfragen werden geladen.</div>;
    if (anfragen.length === 0) return (
      <div className="py-16 text-center">
        <Inbox size={40} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">Noch keine Anfragen über die Website eingegangen.</p>
        <a href="/anfrage" target="_blank" rel="noopener" className="mt-4 inline-flex items-center gap-1.5 text-[#6366f1] text-sm hover:underline">
          <ExternalLink size={13} /> Anfrage-Seite öffnen
        </a>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{anfragen.length} Anfrage{anfragen.length !== 1 ? 'n' : ''}</span>
          <a href="/anfrage" target="_blank" rel="noopener"
            className="flex items-center gap-1.5 text-xs text-[#6366f1] hover:text-[#a5b4fc] transition-colors">
            <ExternalLink size={12} /> Formular ansehen
          </a>
        </div>
        {anfragen.map(a => {
          const must = a.anforderungen?.filter(x => x.prio === 'must') ?? [];
          const nice = a.anforderungen?.filter(x => x.prio === 'nice') ?? [];
          return (
            <div key={a.id} className="rounded-xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{a.name}</h3>
                      {a.firma && <span className="text-xs text-slate-500">· {a.firma}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-[#6366f1] transition-colors">
                        <Mail size={11} />{a.email}
                      </a>
                      {a.telefon && <a href={`tel:${a.telefon}`} className="flex items-center gap-1 hover:text-[#6366f1] transition-colors"><Phone size={11} />{a.telefon}</a>}
                      <span className="flex items-center gap-1"><Calendar size={11} />{new Date(a.created_at).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <select
                    value={a.status}
                    onChange={e => updateAnfrageStatus(a.id, e.target.value as ReAnfrageStatus)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 outline-none cursor-pointer ${STATUS_CFG[a.status].cls}`}
                  >
                    {(Object.keys(STATUS_CFG) as ReAnfrageStatus[]).map(s => (
                      <option key={s} value={s} className="bg-[#0f1117] text-white">{STATUS_CFG[s].label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#252836] border border-[#2d3144] text-slate-300">{a.branche}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#a5b4fc]">{a.projekttyp}</span>
                  {a.budget && <span className="text-xs px-2 py-0.5 rounded-full bg-[#252836] text-slate-400">💰 {a.budget}</span>}
                  {a.zeitrahmen && <span className="text-xs px-2 py-0.5 rounded-full bg-[#252836] text-slate-400">⏱ {a.zeitrahmen}</span>}
                </div>

                {must.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-600 mb-1">Must-have:</p>
                    <div className="flex flex-wrap gap-1">
                      {must.map(x => <span key={x.text} className="text-xs px-2 py-0.5 rounded-full bg-green-900/20 border border-green-800/30 text-green-300">★ {x.text}</span>)}
                    </div>
                  </div>
                )}
                {nice.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-600 mb-1">Nice-to-have:</p>
                    <div className="flex flex-wrap gap-1">
                      {nice.map(x => <span key={x.text} className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/20 border border-yellow-800/30 text-yellow-300">◇ {x.text}</span>)}
                    </div>
                  </div>
                )}
                {a.notizen && (
                  <p className="mt-2 text-xs text-slate-500 bg-[#0f1117] rounded-lg px-3 py-2 leading-relaxed">{a.notizen}</p>
                )}

                <div className="mt-4 flex gap-2">
                  <a href={`mailto:${a.email}?subject=Ihre Projektanfrage. ${a.projekttyp}.`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-xs font-medium transition-colors">
                    <Mail size={12} /> Antworten
                  </a>
                  {a.telefon && (
                    <a href={`tel:${a.telefon}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252836] hover:bg-[#2d3144] text-slate-300 text-xs font-medium transition-colors">
                      <Phone size={12} /> Anrufen
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Layout ───────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 flex items-center justify-center">
            <ClipboardList size={16} className="text-[#a5b4fc]" />
          </div>
          <h1 className="text-2xl font-bold text-white">RE-Interview</h1>
        </div>
        <p className="text-sm text-slate-400">Strukturiertes Kundeninterview für Requirements Engineering</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[#2d3144]">
        {[
          { key: 'interview', label: 'Neues Interview', icon: ClipboardList },
          { key: 'anfragen',  label: 'Eingehende Anfragen', icon: Inbox,
            badge: anfragen.filter(a => a.status === 'neu').length || undefined },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key as 'interview' | 'anfragen')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.badge ? (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab: Anfragen */}
      {activeTab === 'anfragen' && (
        <div>{renderAnfragen()}</div>
      )}

      {/* Tab: Interview Stepper */}
      {activeTab === 'interview' && (<>
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => done && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active  ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-500/30'
                  : done  ? 'bg-[#6366f1]/20 text-[#a5b4fc] hover:bg-[#6366f1]/30 cursor-pointer'
                  : 'bg-[#1a1d27] text-slate-500 cursor-default'
                }`}
              >
                {done ? <Check size={12} /> : <Icon size={12} />}
                <span className="hidden sm:block">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px flex-shrink-0 ${done ? 'bg-[#6366f1]/40' : 'bg-[#2d3144]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-[#2d3144] bg-[#1a1d27] p-6 mb-6">
        <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
          {(() => { const Icon = STEPS[step - 1].icon; return <Icon size={14} className="text-[#a5b4fc]" />; })()}
          Schritt {step}: {STEPS[step - 1].label}
        </h2>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      {/* Navigation */}
      {!saved && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d3144] text-sm text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Zurück
          </button>

          <span className="text-xs text-slate-600">{step} / {STEPS.length}</span>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              disabled={!canNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Weiter <ChevronRight size={16} />
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>
      )}
      </>)}
    </div>
  );
}
