// Server Component – statisch generiert, kein Cold Start, kein JS-Bundle für Inhalte
import {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb, Mail, MapPin, Phone,
  ChevronRight, ExternalLink, FileText, Star,
  CheckCircle, Zap, Users, Award,
  MessageSquare, Search, Compass, Wrench, Heart,
} from 'lucide-react';
import HomeNavBar from './HomeNavBar';
import ContactFormClient from './ContactFormClient';

export const dynamic = 'force-static';

// ── Services ──────────────────────────────────────────────

const SERVICES = [
  { icon: Bot,           title: 'KI-Agenten & Automatisierung',     desc: 'Intelligente Agenten die für dich arbeiten – 24/7',         slug: 'ki-agenten' },
  { icon: BarChart3,     title: 'Business Analyse & Requirements',   desc: 'Prozesse verstehen, Lösungen definieren',                   slug: 'business-analyse' },
  { icon: Workflow,      title: 'Prozessoptimierung (BPMN)',         desc: 'Manuelle Abläufe digitalisieren und automatisieren',         slug: 'prozessoptimierung' },
  { icon: Megaphone,     title: 'Digital Marketing & Social Media',  desc: 'LinkedIn, Content-Strategie, KI-unterstütztes Marketing',   slug: 'digital-marketing' },
  { icon: Video,         title: 'Video-Produktion',                  desc: 'Erklärvideos, Unternehmensfilme, Social-Content',           slug: 'video-produktion' },
  { icon: FolderKanban,  title: 'Projektmanagement',                 desc: 'Von der Idee bis zum Go-Live – strukturiert und agil',      slug: 'projektmanagement' },
  { icon: GraduationCap, title: 'Workshops & Schulungen',            desc: 'KI-Schulungen für Teams (ChatGPT, Copilot, Automatisierung)', slug: 'workshops' },
  { icon: Globe,         title: 'Website-Optimierung',               desc: 'Performance, SEO, Conversion – für KMU optimiert',         slug: 'website-optimierung' },
  { icon: Lightbulb,     title: 'KI-Beratung für KMU',              desc: 'Digitalisierungsanalyse und KI-Roadmap',                    slug: 'ki-beratung-kmu' },
];

// ── Portfolio ─────────────────────────────────────────────

const PORTFOLIO = [
  {
    tag: 'Software Engineering',
    title: 'Swiss COVID Certificate App',
    desc: 'Software-Architektur und technische Dokumentation der schweizweiten COVID-Zertifikats-App.',
    url: '/assets/SWISS_COVID_CERT_APP_SoftwareArchitektur.pdf',
    color: '#a896c8',
  },
  {
    tag: 'Requirements Engineering',
    title: 'Software & Requirements Engineering',
    desc: 'Abschlussarbeit zu modernen Requirements-Engineering-Methoden: User Stories, BPMN und agile Anforderungserfassung.',
    url: '/assets/FinalArbeitSoftwareundRequirementsEngineering.pdf',
    color: '#7aada8',
  },
  {
    tag: 'Digital Marketing',
    title: "Olivia's Olivenpaste",
    desc: 'Vollständige Digital-Marketing-Strategie für ein Schweizer KMU: Markenaufbau, Social-Media-Konzept und Content-Plan.',
    url: '/assets/OliviasOlivenpaste_MarcelSpahr.pdf',
    color: '#8fb58a',
  },
  {
    tag: 'Event & Marketing',
    title: '90s Love Mobile – Streetparade',
    desc: 'Konzeption und Vermarktung eines Love Mobiles an der Streetparade Zürich – von Sponsoring bis Social-Media-Kampagne.',
    url: '/assets/90sLoveMobileProjektarbeit_Digital Marketing-Final.pdf',
    color: '#c4926a',
  },
  {
    tag: 'Leadership',
    title: 'Persönliches Führungshandbuch',
    desc: 'Reflexion eigener Führungsprinzipien und Entwicklung eines persönlichen Führungsansatzes basierend auf modernen Leadership-Theorien.',
    url: '/assets/Personliches_Fuhrungshandbuch_MarcelSpahr.pdf',
    color: '#c4897a',
  },
  {
    tag: 'Prozessoptimierung',
    title: 'Digitalisierung @ Swisscom',
    desc: '15 Jahre Mitgestaltung der digitalen Transformation: Prozessautomatisierung, Reporting-Pipelines und Stakeholder-Management.',
    url: null,
    color: '#7a9bb5',
  },
];

// ── References ────────────────────────────────────────────

const STATS = [
  { value: '15+', label: 'Jahre Berufserfahrung' },
  { value: '50+', label: 'Projekte umgesetzt' },
  { value: '2',   label: 'EFZ Abschlüsse' },
  { value: '2026', label: 'HF Wirtschaftsinformatik' },
];

const USP_POINTS = [
  { icon: Zap,         title: 'Technologie & Kreativität', desc: 'Ich verbinde technisches Know-how mit kreativem Denken – selten in einer Person vereint.' },
  { icon: Users,       title: 'Kundennähe & Empathie',     desc: '15 Jahre im direkten Kundenkontakt bei Swisscom haben mein Gespür für Menschen geschärft.' },
  { icon: CheckCircle, title: 'Ganzheitlicher Ansatz',     desc: 'Von der Analyse über das Konzept bis zur Umsetzung – alles aus einer Hand.' },
  { icon: Award,       title: 'Kontinuierliches Lernen',   desc: 'HF Wirtschaftsinformatik, SAFe, Scrum, KI-Zertifikate – ich bilde mich laufend weiter.' },
];

// ── Process Steps ─────────────────────────────────────────

const PROCESS_STEPS = [
  {
    icon:    MessageSquare,
    num:     '01',
    title:   'Erstgespräch',
    badge:   'Kostenlos',
    tagline: 'Kennenlernen & Ziele verstehen',
    desc:    'Wir sprechen 30 Minuten über dein Unternehmen, deine aktuellen Herausforderungen und was du erreichen möchtest. Ohne Verpflichtung – ich höre zu, bevor ich etwas vorschlage.',
  },
  {
    icon:    Search,
    num:     '02',
    title:   'Analyse',
    badge:   'Woche 1–2',
    tagline: 'Verstehen, wo du stehst',
    desc:    'Ich analysiere deine Prozesse, Daten und Potenziale. Damit wir von Anfang an das Richtige angehen – und keine Zeit mit falschen Lösungen verlieren.',
  },
  {
    icon:    Compass,
    num:     '03',
    title:   'Konzept & Strategie',
    badge:   'Woche 2–3',
    tagline: 'Den richtigen Weg definieren',
    desc:    'Ich entwickle einen massgeschneiderten Plan mit konkreten Massnahmen, Zeitplan und realistischen Ergebnissen – transparent und gemeinsam mit dir validiert.',
  },
  {
    icon:    Wrench,
    num:     '04',
    title:   'Umsetzung',
    badge:   'ab Woche 3',
    tagline: 'Konkret und zügig handeln',
    desc:    'Die definierten Massnahmen werden professionell umgesetzt – ob KI-Agent, Prozessoptimierung oder Marketing-Strategie. Du wirst dabei laufend informiert und einbezogen.',
  },
  {
    icon:    Heart,
    num:     '05',
    title:   'Begleitung',
    badge:   'Dauerhaft',
    tagline: 'Langfristig an deiner Seite',
    desc:    'Ich bleibe dein Ansprechpartner. Ob Fragen, neue Ideen oder Anpassungen – ich bin für dich da und sorge dafür, dass die Ergebnisse nachhaltig wirken.',
  },
];

// ── Page ──────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      <HomeNavBar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen overflow-hidden pt-16">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img
            src="/assets/MarcelSpahrHeader.jpg"
            alt="Marcel Spahr – KI-Unternehmensberater Bern"
            className="w-full h-full object-cover object-top"
          />
          {/* Gradient: subtle top-dark for nav readability → transparent mid → strong dark at bottom */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(12,10,6,0.45) 0%, rgba(12,10,6,0.10) 22%, rgba(12,10,6,0.15) 48%, rgba(12,10,6,0.72) 66%, rgba(12,10,6,0.94) 80%, #0c0a06 93%)'
          }} />
        </div>

        {/* Text – positioned in lower portion, over the dark fade */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-16 sm:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="ms-anim-scale mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#d4b86a] text-sm font-medium backdrop-blur-sm">
              <Bot size={14} /> Kreativer KI-Unternehmensberater · Bern, Schweiz
            </div>
            <h1 style={{ animationDelay: '0.1s' }} className="ms-anim text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
              KI-Intelligenz trifft Kreativität
            </h1>
            <p style={{ animationDelay: '0.2s' }} className="ms-anim mt-5 text-lg sm:text-xl text-[#d4c4a8] max-w-2xl mx-auto leading-relaxed drop-shadow">
              Kreativer KI-Unternehmensberater & Wirtschaftsinformatiker für Schweizer KMU – ich automatisiere, optimiere und digitalisiere deinen Betrieb.
            </p>
            <div style={{ animationDelay: '0.3s' }} className="ms-anim mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#contact" className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/30">
                Termin buchen
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#about" className="px-6 py-3 rounded-xl border border-[#f4edd8]/25 hover:border-[#f4edd8]/60 text-[#f4edd8] font-medium transition-all backdrop-blur-sm">
                Mehr erfahren
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">About</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Über mich</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-[#d4c4a8] leading-relaxed">
                Ich bin Marcel Spahr – der Wirtschaftsinformatiker, der denkt wie ein Kreativdirektor. Bei Swisscom habe ich 15 Jahre lang gelernt, wie grosse Unternehmen funktionieren. Heute bringe ich dieses Wissen zu Schweizer KMU – gepaart mit modernster KI, Prozessautomatisierung und einer Leidenschaft für Innovation.
              </p>
              <div className="mt-8 flex gap-4">
                <a href="https://www.linkedin.com/in/marcelspahr" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d2820] hover:border-[#c9a84c] text-[#a89880] hover:text-[#c9a84c] text-sm transition-all">
                  <ExternalLink size={16} /> LinkedIn
                </a>
                <a href="mailto:kontakt@marcelspahr.ch"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d2820] hover:border-[#c9a84c] text-[#a89880] hover:text-[#c9a84c] text-sm transition-all">
                  <Mail size={16} /> E-Mail
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Ausbildung',      value: 'HF Wirtschaftsinformatik 2026' },
                { label: 'Erfahrung',       value: '15 Jahre Swisscom' },
                { label: 'Spezialisierung', value: 'KI-Berater seit 2022' },
                { label: 'Kreativ',         value: 'Grafiker & Werbetechniker' },
              ].map((f, i) => (
                <div key={i} className="rounded-xl border border-[#2d2820] bg-[#221e14] p-5">
                  <div className="text-xs text-[#7a6d5a] uppercase tracking-wider mb-1">{f.label}</div>
                  <div className="text-sm font-semibold text-white leading-snug">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">Services</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Leistungen</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={`/leistungen/${s.slug}`}
                  className="group h-full rounded-xl border border-[#2d2820] bg-[#1c1912] p-6 hover:border-[#c9a84c]/50 hover:bg-[#231e15] transition-all block">
                  <div className="mb-4 inline-flex p-2.5 rounded-lg bg-[#c9a84c]/10 text-[#d4b86a] group-hover:bg-[#c9a84c]/20 transition-colors">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-white mb-2 leading-snug">{s.title}</h3>
                  <p className="text-sm text-[#a89880] leading-relaxed">{s.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-[#c9a84c] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Mehr erfahren <ChevronRight size={12} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Portfolio ── */}
      <section id="portfolio" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">Portfolio</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Portfolio</h2>
            <p className="mt-3 text-[#a89880]">Ausgewählte Projekte & Arbeiten</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTFOLIO.map((p, i) => (
              <div key={i} className="group h-full flex flex-col rounded-xl border border-[#2d2820] bg-[#1c1912] overflow-hidden hover:border-[#c9a84c]/40 transition-all">
                <div className="h-1.5 w-full" style={{ background: p.color }} />
                <div className="flex-1 p-6 flex flex-col gap-3">
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full border"
                    style={{ color: p.color, borderColor: `${p.color}40`, background: `${p.color}15` }}>
                    {p.tag}
                  </span>
                  <h3 className="font-bold text-white leading-snug">{p.title}</h3>
                  <p className="text-sm text-[#a89880] leading-relaxed flex-1">{p.desc}</p>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#d4b86a] hover:text-[#c9a84c] transition-colors">
                      <FileText size={14} /> Dokument ansehen
                    </a>
                  ) : (
                    <span className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                      <Star size={14} /> Intern / auf Anfrage
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Warum Marcel ── */}
      <section id="references" className="py-24 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">Referenzen</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Warum Marcel?</h2>
            <p className="mt-3 text-[#a89880]">Was mich von anderen unterscheidet</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
            {STATS.map((s, i) => (
              <div key={i} className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-6 text-center">
                <div className="text-3xl font-bold text-[#c9a84c] mb-1">{s.value}</div>
                <div className="text-sm text-[#a89880]">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {USP_POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="flex gap-4 rounded-xl border border-[#2d2820] bg-[#1c1912] p-6 hover:border-[#c9a84c]/40 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#d4b86a]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{p.title}</h3>
                    <p className="text-sm text-[#a89880] leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Vorgehen / Prozess ── */}
      <section id="prozess" className="py-24 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block border border-[#2d2820] text-[#a89880] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">Ablauf</span>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="text-white">So arbeiten </span>
              <span className="text-[#c9a84c]">wir zusammen</span>
            </h2>
            <p className="mt-3 text-[#a89880] max-w-xl mx-auto">
              Ein strukturierter, transparenter Prozess – damit du immer weisst, was als Nächstes kommt.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line – desktop only */}
            <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-[#2d2820] -translate-x-1/2 z-0" />

            <div className="space-y-4 md:space-y-0">
              {PROCESS_STEPS.map((step, i) => {
                const isLeft = i % 2 === 0;
                const Icon  = step.icon;
                const card  = (
                  <div className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-5 hover:border-[#c9a84c]/40 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#d4b86a]">
                        <Icon size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{step.title}</span>
                          <span className="text-[11px] text-[#7a6d5a] bg-[#221e14] px-2 py-0.5 rounded-full">{step.badge}</span>
                        </div>
                        <p className="text-xs font-medium mt-0.5 text-[#d4b86a]">{step.tagline}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#a89880] leading-relaxed">{step.desc}</p>
                  </div>
                );

                return (
                  <div key={i} className="md:py-3">
                    {/* Mobile */}
                    <div className="flex items-start gap-3 md:hidden">
                      <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-full border border-[#c9a84c]/50 bg-[#0c0a06] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#c9a84c]">{step.num}</span>
                      </div>
                      <div className="flex-1">{card}</div>
                    </div>

                    {/* Desktop zigzag */}
                    <div className="hidden md:grid grid-cols-[1fr_80px_1fr] items-center gap-6">
                      <div>{isLeft  ? card : null}</div>
                      <div className="flex justify-center relative z-10">
                        <div className="w-12 h-12 rounded-full border-2 border-[#c9a84c]/50 bg-[#0c0a06] flex items-center justify-center shadow-lg shadow-[#c9a84c]/10">
                          <span className="text-sm font-bold text-[#c9a84c]">{step.num}</span>
                        </div>
                      </div>
                      <div>{!isLeft ? card : null}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 text-center">
            <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-white font-semibold transition-all shadow-lg shadow-[#c9a84c]/25">
              Jetzt Erstgespräch buchen <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Kontakt ── */}
      <section id="contact" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">Contact</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Kontakt</h2>
          </div>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-10">
            <div className="space-y-5">
              {[
                { Icon: MapPin, text: 'Bern, Schweiz',           href: undefined },
                { Icon: Phone,  text: '+41 79 511 09 11',        href: undefined },
                { Icon: Mail,   text: 'kontakt@marcelspahr.ch',  href: 'mailto:kontakt@marcelspahr.ch' },
              ].map(({ Icon, text, href }, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#d4b86a]">
                    <Icon size={18} />
                  </div>
                  {href ? (
                    <a href={href} className="text-[#d4c4a8] hover:text-white transition-colors text-sm">{text}</a>
                  ) : (
                    <span className="text-[#d4c4a8] text-sm">{text}</span>
                  )}
                </div>
              ))}
            </div>
            <ContactFormClient />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Was macht ein kreativer KI-Unternehmensberater?',
                acceptedAnswer: { '@type': 'Answer', text: 'Ein kreativer KI-Unternehmensberater verbindet technisches KI-Know-how mit strategischem Denken und kreativem Problemlösen. Ich analysiere dein Unternehmen, identifiziere konkrete KI-Potenziale und begleite die Umsetzung – von der Strategie über die Konzeption bis zum laufenden, automatisierten System.' },
              },
              {
                '@type': 'Question',
                name: 'Für welche Unternehmen ist KI-Beratung geeignet?',
                acceptedAnswer: { '@type': 'Answer', text: 'KI-Beratung eignet sich für jedes KMU, das wiederkehrende Prozesse hat, Zeit sparen möchte oder digital wachsen will – unabhängig von der Branche. Ob Handwerksbetrieb, Beratungsunternehmen oder Online-Shop: KI lässt sich fast überall sinnvoll einsetzen und bringt messbare Ergebnisse.' },
              },
              {
                '@type': 'Question',
                name: 'Was kostet eine KI-Beratung bei Marcel Spahr?',
                acceptedAnswer: { '@type': 'Answer', text: 'Die Erstberatung ist kostenlos und unverbindlich. Konkrete Projekte wie KI-Agenten-Entwicklung, Prozessoptimierung oder Workshop-Durchführung werden individuell nach Aufwand und Projektumfang berechnet. Kontaktiere mich für ein unverbindliches Angebot.' },
              },
              {
                '@type': 'Question',
                name: 'Wie lange dauert ein typisches KI-Projekt?',
                acceptedAnswer: { '@type': 'Answer', text: 'Ein erster Quick Win – zum Beispiel ein einfacher KI-Agent oder ein optimierter Prozess – ist oft innerhalb von 2 bis 4 Wochen umgesetzt. Grössere Projekte wie eine vollständige KI-Roadmap oder komplexe Automatisierungen dauern 2 bis 3 Monate. Ich arbeite mit klaren Meilensteinen und regelmässigen Status-Updates.' },
              },
              {
                '@type': 'Question',
                name: 'Arbeitet Marcel Spahr auch remote oder nur in Bern?',
                acceptedAnswer: { '@type': 'Answer', text: 'Die meisten Projekte laufen hybrid: Kick-off und wichtige Workshops gerne persönlich in Bern oder direkt bei dir vor Ort, der Rest effizient remote. Ich arbeite mit Kunden in der gesamten Deutschschweiz und darüber hinaus zusammen.' },
              },
            ],
          })}}
        />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">FAQ</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Häufige Fragen</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'Was macht ein kreativer KI-Unternehmensberater?',
                a: 'Ein kreativer KI-Unternehmensberater verbindet technisches KI-Know-how mit strategischem Denken und kreativem Problemlösen. Ich analysiere dein Unternehmen, identifiziere konkrete KI-Potenziale und begleite die Umsetzung – von der Strategie über die Konzeption bis zum laufenden, automatisierten System.',
              },
              {
                q: 'Für welche Unternehmen ist KI-Beratung geeignet?',
                a: 'KI-Beratung eignet sich für jedes KMU, das wiederkehrende Prozesse hat, Zeit sparen möchte oder digital wachsen will – unabhängig von der Branche. Ob Handwerksbetrieb, Beratungsunternehmen oder Online-Shop: KI lässt sich fast überall sinnvoll einsetzen und bringt messbare Ergebnisse.',
              },
              {
                q: 'Was kostet eine KI-Beratung bei Marcel Spahr?',
                a: 'Die Erstberatung ist kostenlos und unverbindlich. Konkrete Projekte werden individuell nach Aufwand und Projektumfang berechnet. Kontaktiere mich für ein unverbindliches Angebot – ich melde mich innerhalb von 2 Arbeitstagen.',
              },
              {
                q: 'Wie lange dauert ein typisches KI-Projekt?',
                a: 'Ein erster Quick Win – zum Beispiel ein einfacher KI-Agent oder ein optimierter Prozess – ist oft innerhalb von 2 bis 4 Wochen umgesetzt. Grössere Projekte wie eine vollständige KI-Roadmap dauern 2 bis 3 Monate. Ich arbeite mit klaren Meilensteinen und regelmässigen Status-Updates.',
              },
              {
                q: 'Arbeitet Marcel Spahr auch remote oder nur in Bern?',
                a: 'Die meisten Projekte laufen hybrid: Kick-off und wichtige Workshops gerne persönlich in Bern oder direkt bei dir vor Ort, der Rest effizient remote. Ich arbeite mit Kunden in der gesamten Deutschschweiz zusammen.',
              },
            ].map((item, i) => (
              <details key={i} className="group rounded-xl border border-[#2d2820] bg-[#1c1912] overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none hover:bg-[#231e15] transition-colors">
                  <span className="font-medium text-white text-sm sm:text-base">{item.q}</span>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-[#2d2820] flex items-center justify-center text-[#c9a84c] text-lg leading-none group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <div className="px-6 pb-5 pt-1">
                  <p className="text-sm text-[#a89880] leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2d2820] bg-[#100d09] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-[#7a6d5a]">© 2026 Marcel Spahr</span>
          <div className="flex items-center gap-6">
            <a href="/impressum" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">Impressum</a>
            <a href="/datenschutz" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
