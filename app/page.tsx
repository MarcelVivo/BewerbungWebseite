// Server Component – statisch generiert, kein Cold Start, kein JS-Bundle für Inhalte
import {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb, Mail, MapPin, Phone,
  ChevronRight, ExternalLink, FileText, Star,
  CheckCircle, Zap, Users, Award, User,
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
    color: '#6366f1',
  },
  {
    tag: 'Requirements Engineering',
    title: 'Software & Requirements Engineering',
    desc: 'Abschlussarbeit zu modernen Requirements-Engineering-Methoden: User Stories, BPMN und agile Anforderungserfassung.',
    url: '/assets/FinalArbeitSoftwareundRequirementsEngineering.pdf',
    color: '#06b6d4',
  },
  {
    tag: 'Digital Marketing',
    title: "Olivia's Olivenpaste",
    desc: 'Vollständige Digital-Marketing-Strategie für ein Schweizer KMU: Markenaufbau, Social-Media-Konzept und Content-Plan.',
    url: '/assets/OliviasOlivenpaste_MarcelSpahr.pdf',
    color: '#22c55e',
  },
  {
    tag: 'Event & Marketing',
    title: '90s Love Mobile – Streetparade',
    desc: 'Konzeption und Vermarktung eines Love Mobiles an der Streetparade Zürich – von Sponsoring bis Social-Media-Kampagne.',
    url: '/assets/90sLoveMobileProjektarbeit_Digital Marketing-Final.pdf',
    color: '#f59e0b',
  },
  {
    tag: 'Leadership',
    title: 'Persönliches Führungshandbuch',
    desc: 'Reflexion eigener Führungsprinzipien und Entwicklung eines persönlichen Führungsansatzes basierend auf modernen Leadership-Theorien.',
    url: '/assets/Personliches_Fuhrungshandbuch_MarcelSpahr.pdf',
    color: '#ec4899',
  },
  {
    tag: 'Prozessoptimierung',
    title: 'Digitalisierung @ Swisscom',
    desc: '15 Jahre Mitgestaltung der digitalen Transformation: Prozessautomatisierung, Reporting-Pipelines und Stakeholder-Management.',
    url: null,
    color: '#8b5cf6',
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

// ── Page ──────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      <HomeNavBar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 55% at 15% 15%, #6366f118 0%, transparent 70%), radial-gradient(ellipse 50% 45% at 85% 85%, #06b6d40d 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="ms-anim-scale mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#6366f1]/40 bg-[#6366f1]/10 text-[#a5b4fc] text-sm font-medium">
            <Bot size={14} /> KI-Berater & Wirtschaftsinformatiker
          </div>
          <h1 style={{ animationDelay: '0.1s' }} className="ms-anim text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            KI-Intelligenz trifft Kreativität
          </h1>
          <p style={{ animationDelay: '0.2s' }} className="ms-anim mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Wirtschaftsinformatiker & KI-Berater für Schweizer KMU – ich automatisiere, optimiere und digitalisiere deinen Betrieb.
          </p>
          <div style={{ animationDelay: '0.3s' }} className="ms-anim mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contact" className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] text-white font-semibold transition-all shadow-lg shadow-[#6366f1]/25">
              Termin buchen
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="#about" className="px-6 py-3 rounded-xl border border-[#2d3144] hover:border-slate-500 text-slate-300 hover:text-white font-medium transition-all">
              Mehr erfahren
            </a>
          </div>
          <div style={{ animationDelay: '0.45s' }} className="ms-anim mt-16 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#6366f1]/15" />
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#1e2235] ring-2 ring-[#6366f1]/50 flex items-center justify-center">
                <User size={56} className="text-[#6366f1] sm:hidden" />
                <User size={72} className="text-[#6366f1] hidden sm:block" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">About</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Über mich</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-slate-300 leading-relaxed">
                Ich bin Marcel Spahr – der Wirtschaftsinformatiker, der denkt wie ein Kreativdirektor. Bei Swisscom habe ich 15 Jahre lang gelernt, wie grosse Unternehmen funktionieren. Heute bringe ich dieses Wissen zu Schweizer KMU – gepaart mit modernster KI, Prozessautomatisierung und einer Leidenschaft für Innovation.
              </p>
              <div className="mt-8 flex gap-4">
                <a href="https://www.linkedin.com/in/marcelspahr" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d3144] hover:border-[#6366f1] text-slate-400 hover:text-[#6366f1] text-sm transition-all">
                  <ExternalLink size={16} /> LinkedIn
                </a>
                <a href="mailto:kontakt@marcelspahr.ch"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d3144] hover:border-[#6366f1] text-slate-400 hover:text-[#6366f1] text-sm transition-all">
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
                <div key={i} className="rounded-xl border border-[#2d3144] bg-[#252836] p-5">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{f.label}</div>
                  <div className="text-sm font-semibold text-white leading-snug">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 px-4 sm:px-6 bg-[#0c0e14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Services</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Leistungen</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={`/leistungen/${s.slug}`}
                  className="group h-full rounded-xl border border-[#2d3144] bg-[#1a1d27] p-6 hover:border-[#6366f1]/50 hover:bg-[#1e2035] transition-all block">
                  <div className="mb-4 inline-flex p-2.5 rounded-lg bg-[#6366f1]/10 text-[#818cf8] group-hover:bg-[#6366f1]/20 transition-colors">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-white mb-2 leading-snug">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
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
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Portfolio</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Portfolio</h2>
            <p className="mt-3 text-slate-400">Ausgewählte Projekte & Arbeiten</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTFOLIO.map((p, i) => (
              <div key={i} className="group h-full flex flex-col rounded-xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden hover:border-[#6366f1]/40 transition-all">
                <div className="h-1.5 w-full" style={{ background: p.color }} />
                <div className="flex-1 p-6 flex flex-col gap-3">
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full border"
                    style={{ color: p.color, borderColor: `${p.color}40`, background: `${p.color}15` }}>
                    {p.tag}
                  </span>
                  <h3 className="font-bold text-white leading-snug">{p.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed flex-1">{p.desc}</p>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#818cf8] hover:text-[#6366f1] transition-colors">
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
      <section id="references" className="py-24 px-4 sm:px-6 bg-[#0c0e14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Referenzen</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Warum Marcel?</h2>
            <p className="mt-3 text-slate-400">Was mich von anderen unterscheidet</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
            {STATS.map((s, i) => (
              <div key={i} className="rounded-xl border border-[#2d3144] bg-[#1a1d27] p-6 text-center">
                <div className="text-3xl font-bold text-[#6366f1] mb-1">{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {USP_POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="flex gap-4 rounded-xl border border-[#2d3144] bg-[#1a1d27] p-6 hover:border-[#6366f1]/40 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center text-[#818cf8]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{p.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Kontakt ── */}
      <section id="contact" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Contact</span>
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
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center text-[#818cf8]">
                    <Icon size={18} />
                  </div>
                  {href ? (
                    <a href={href} className="text-slate-300 hover:text-white transition-colors text-sm">{text}</a>
                  ) : (
                    <span className="text-slate-300 text-sm">{text}</span>
                  )}
                </div>
              ))}
            </div>
            <ContactFormClient />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2d3144] bg-[#0c0e14] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-500">© 2026 Marcel Spahr</span>
          <div className="flex items-center gap-6">
            <a href="/impressum" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Impressum</a>
            <a href="/datenschutz" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
