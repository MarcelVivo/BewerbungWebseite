'use client';

import { useState, useRef, FormEvent } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb, Mail, MapPin, Phone,
  Menu, X, ChevronRight, ExternalLink, FileText, Star,
  CheckCircle, Zap, Users, Award,
} from 'lucide-react';

// ── Translations ──────────────────────────────────────────

const T = {
  de: {
    nav: { about: 'Über mich', services: 'Leistungen', portfolio: 'Portfolio', contact: 'Kontakt', book: 'Termin buchen' },
    hero: {
      headline: 'KI-Intelligenz trifft Kreativität',
      subline: 'Wirtschaftsinformatiker & KI-Berater für Schweizer KMU – ich automatisiere, optimiere und digitalisiere deinen Betrieb.',
      cta_primary: 'Termin buchen',
      cta_secondary: 'Mehr erfahren',
    },
    about: {
      headline: 'Über mich',
      text: 'Ich bin Marcel Spahr – der Wirtschaftsinformatiker, der denkt wie ein Kreativdirektor. Bei Swisscom habe ich 15 Jahre lang gelernt, wie grosse Unternehmen funktionieren. Heute bringe ich dieses Wissen zu Schweizer KMU – gepaart mit modernster KI, Prozessautomatisierung und einer Leidenschaft für Innovation.',
      facts: [
        { label: 'Ausbildung', value: 'HF Wirtschaftsinformatik 2026' },
        { label: 'Erfahrung', value: '15 Jahre Swisscom' },
        { label: 'Spezialisierung', value: 'KI-Berater seit 2022' },
        { label: 'Kreativ', value: 'Grafiker & Werbetechniker' },
      ],
    },
    services: {
      headline: 'Leistungen',
      items: [
        { icon: Bot,           title: 'KI-Agenten & Automatisierung',          desc: 'Intelligente Agenten die für dich arbeiten – 24/7' },
        { icon: BarChart3,     title: 'Business Analyse & Requirements',         desc: 'Prozesse verstehen, Lösungen definieren' },
        { icon: Workflow,      title: 'Prozessoptimierung (BPMN)',               desc: 'Manuelle Abläufe digitalisieren und automatisieren' },
        { icon: Megaphone,     title: 'Digital Marketing & Social Media',        desc: 'LinkedIn, Content-Strategie, KI-unterstütztes Marketing' },
        { icon: Video,         title: 'Video-Produktion',                        desc: 'Erklärvideos, Unternehmensfilme, Social-Content' },
        { icon: FolderKanban,  title: 'Projektmanagement',                       desc: 'Von der Idee bis zum Go-Live – strukturiert und agil' },
        { icon: GraduationCap, title: 'Workshops & Schulungen',                  desc: 'KI-Schulungen für Teams (ChatGPT, Copilot, Automatisierung)' },
        { icon: Globe,         title: 'Website-Optimierung',                     desc: 'Performance, SEO, Conversion – für KMU optimiert' },
        { icon: Lightbulb,     title: 'KI-Beratung für KMU',                    desc: 'Digitalisierungsanalyse und KI-Roadmap' },
      ],
    },
    portfolio: {
      headline: 'Portfolio',
      subline: 'Ausgewählte Projekte & Arbeiten',
      items: [
        {
          tag: 'Software Engineering',
          title: 'Swiss COVID Certificate App',
          desc: 'Software-Architektur und technische Dokumentation der schweizweiten COVID-Zertifikats-App. Analyse von Systemkomponenten, Schnittstellen und Sicherheitsanforderungen.',
          url: '/assets/SWISS_COVID_CERT_APP_SoftwareArchitektur.pdf',
          color: '#6366f1',
        },
        {
          tag: 'Requirements Engineering',
          title: 'Software & Requirements Engineering',
          desc: 'Abschlussarbeit zu modernen Requirements-Engineering-Methoden: User Stories, Akzeptanzkriterien, BPMN-Prozessmodelle und agile Anforderungserfassung.',
          url: '/assets/FinalArbeitSoftwareundRequirementsEngineering.pdf',
          color: '#06b6d4',
        },
        {
          tag: 'Digital Marketing',
          title: "Olivia's Olivenpaste",
          desc: 'Vollständige Digital-Marketing-Strategie für ein Schweizer KMU: Markenaufbau, Social-Media-Konzept, Content-Plan und Performance-Tracking.',
          url: '/assets/OliviasOlivenpaste_MarcelSpahr.pdf',
          color: '#22c55e',
        },
        {
          tag: 'Event & Marketing',
          title: '90s Love Mobile – Streetparade',
          desc: 'Projektarbeit Digital Marketing: Konzeption und Vermarktung eines Love Mobiles an der Streetparade Zürich – von Sponsoring bis Social-Media-Kampagne.',
          url: '/assets/90sLoveMobileProjektarbeit_Digital Marketing-Final.pdf',
          color: '#f59e0b',
        },
        {
          tag: 'Leadership',
          title: 'Persönliches Führungshandbuch',
          desc: 'Reflexion eigener Führungsprinzipien, Werte und Führungsstile. Entwicklung eines persönlichen Führungsansatzes basierend auf modernen Leadership-Theorien.',
          url: '/assets/Personliches_Fuhrungshandbuch_MarcelSpahr.pdf',
          color: '#ec4899',
        },
        {
          tag: 'Prozessoptimierung',
          title: 'Digitalisierung @ Swisscom',
          desc: '15 Jahre Mitgestaltung der digitalen Transformation bei Swisscom: In-House Chat-Formular, Reporting-Pipelines, Prozessautomatisierung und Stakeholder-Management.',
          url: null,
          color: '#8b5cf6',
        },
      ],
    },
    references: {
      headline: 'Warum Marcel?',
      subline: 'Was mich von anderen unterscheidet',
      stats: [
        { value: '15+', label: 'Jahre Berufserfahrung' },
        { value: '50+', label: 'Projekte umgesetzt' },
        { value: '2', label: 'EFZ Abschlüsse' },
        { value: '2026', label: 'HF Wirtschaftsinformatik' },
      ],
      points: [
        { icon: Zap,          title: 'Technologie & Kreativität', desc: 'Ich verbinde technisches Know-how mit kreativem Denken – selten in einer Person vereint.' },
        { icon: Users,        title: 'Kundennähe & Empathie',     desc: '15 Jahre im direkten Kundenkontakt bei Swisscom haben mein Gespür für Menschen geschärft.' },
        { icon: CheckCircle,  title: 'Ganzheitlicher Ansatz',     desc: 'Von der Analyse über das Konzept bis zur Umsetzung – alles aus einer Hand.' },
        { icon: Award,        title: 'Kontinuierliches Lernen',   desc: 'HF Wirtschaftsinformatik, SAFe, Scrum, KI-Zertifikate – ich bilde mich laufend weiter.' },
      ],
    },
    contact: {
      headline: 'Kontakt',
      name: 'Name', email: 'E-Mail', message: 'Nachricht',
      submit: 'Nachricht senden', sending: 'Wird gesendet…',
      success: 'Vielen Dank! Ich melde mich bald.',
      error: 'Fehler beim Senden. Bitte versuche es erneut.',
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Impressum', privacy: 'Datenschutz' },
  },
  en: {
    nav: { about: 'About', services: 'Services', portfolio: 'Portfolio', contact: 'Contact', book: 'Book a meeting' },
    hero: {
      headline: 'AI Intelligence meets Creativity',
      subline: 'Business Informatics & AI Consultant for Swiss SMEs – I automate, optimize and digitize your business.',
      cta_primary: 'Book a meeting',
      cta_secondary: 'Learn more',
    },
    about: {
      headline: 'About me',
      text: "I'm Marcel Spahr – the business informatician who thinks like a creative director. At Swisscom, I spent 15 years learning how large organizations work. Today I bring that knowledge to Swiss SMEs – combined with cutting-edge AI, process automation, and a passion for innovation.",
      facts: [
        { label: 'Education', value: 'HF Business Informatics 2026' },
        { label: 'Experience', value: '15 years at Swisscom' },
        { label: 'Specialization', value: 'AI consultant since 2022' },
        { label: 'Creative', value: 'Graphic designer & ad technician' },
      ],
    },
    services: {
      headline: 'Services',
      items: [
        { icon: Bot,           title: 'AI Agents & Automation',                  desc: 'Intelligent agents working for you – 24/7' },
        { icon: BarChart3,     title: 'Business Analysis & Requirements',         desc: 'Understand processes, define solutions' },
        { icon: Workflow,      title: 'Process Optimization (BPMN)',              desc: 'Digitize and automate manual workflows' },
        { icon: Megaphone,     title: 'Digital Marketing & Social Media',         desc: 'LinkedIn, content strategy, AI-powered marketing' },
        { icon: Video,         title: 'Video Production',                         desc: 'Explainer videos, corporate films, social content' },
        { icon: FolderKanban,  title: 'Project Management',                       desc: 'From idea to go-live – structured and agile' },
        { icon: GraduationCap, title: 'Workshops & Training',                     desc: 'AI training for teams (ChatGPT, Copilot, automation)' },
        { icon: Globe,         title: 'Website Optimization',                     desc: 'Performance, SEO, conversion – optimized for SMEs' },
        { icon: Lightbulb,     title: 'AI Consulting for SMEs',                   desc: 'Digitization analysis and AI roadmap' },
      ],
    },
    portfolio: {
      headline: 'Portfolio',
      subline: 'Selected projects & work',
      items: [
        {
          tag: 'Software Engineering',
          title: 'Swiss COVID Certificate App',
          desc: 'Software architecture and technical documentation for the nationwide Swiss COVID certificate app. Analysis of system components, interfaces and security requirements.',
          url: '/assets/SWISS_COVID_CERT_APP_SoftwareArchitektur.pdf',
          color: '#6366f1',
        },
        {
          tag: 'Requirements Engineering',
          title: 'Software & Requirements Engineering',
          desc: 'Final thesis on modern requirements engineering methods: user stories, acceptance criteria, BPMN process models and agile requirements gathering.',
          url: '/assets/FinalArbeitSoftwareundRequirementsEngineering.pdf',
          color: '#06b6d4',
        },
        {
          tag: 'Digital Marketing',
          title: "Olivia's Olive Paste",
          desc: 'Complete digital marketing strategy for a Swiss SME: brand building, social media concept, content plan and performance tracking.',
          url: '/assets/OliviasOlivenpaste_MarcelSpahr.pdf',
          color: '#22c55e',
        },
        {
          tag: 'Event & Marketing',
          title: '90s Love Mobile – Street Parade',
          desc: 'Digital marketing project: conception and marketing of a Love Mobile at the Zurich Street Parade – from sponsoring to social media campaign.',
          url: '/assets/90sLoveMobileProjektarbeit_Digital Marketing-Final.pdf',
          color: '#f59e0b',
        },
        {
          tag: 'Leadership',
          title: 'Personal Leadership Handbook',
          desc: 'Reflection on personal leadership principles, values and styles. Development of a personal leadership approach based on modern leadership theories.',
          url: '/assets/Personliches_Fuhrungshandbuch_MarcelSpahr.pdf',
          color: '#ec4899',
        },
        {
          tag: 'Process Optimization',
          title: 'Digitization @ Swisscom',
          desc: '15 years co-shaping digital transformation at Swisscom: in-house chat form, reporting pipelines, process automation and stakeholder management.',
          url: null,
          color: '#8b5cf6',
        },
      ],
    },
    references: {
      headline: 'Why Marcel?',
      subline: 'What sets me apart',
      stats: [
        { value: '15+', label: 'Years of experience' },
        { value: '50+', label: 'Projects delivered' },
        { value: '2', label: 'Vocational degrees' },
        { value: '2026', label: 'HF Business Informatics' },
      ],
      points: [
        { icon: Zap,          title: 'Tech & Creativity',       desc: 'I combine technical know-how with creative thinking – rarely found in one person.' },
        { icon: Users,        title: 'Customer Focus',          desc: '15 years of direct customer contact at Swisscom sharpened my sense for people.' },
        { icon: CheckCircle,  title: 'End-to-End Approach',     desc: 'From analysis to concept to implementation – everything from one source.' },
        { icon: Award,        title: 'Continuous Learning',     desc: 'HF Business Informatics, SAFe, Scrum, AI certifications – always upskilling.' },
      ],
    },
    contact: {
      headline: 'Contact',
      name: 'Name', email: 'Email', message: 'Message',
      submit: 'Send message', sending: 'Sending…',
      success: "Thank you! I'll be in touch soon.",
      error: 'Error sending. Please try again.',
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Imprint', privacy: 'Privacy Policy' },
  },
} as const;

type Lang = keyof typeof T;

// ── Animation ─────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  );
}

// ── NavBar ────────────────────────────────────────────────

function NavBar({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: typeof T['de'] }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: '#about',     label: t.nav.about },
    { href: '#services',  label: t.nav.services },
    { href: '#portfolio', label: t.nav.portfolio },
    { href: '#contact',   label: t.nav.contact },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2d3144]/60 bg-[#0f1117]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-white text-lg tracking-tight">Marcel Spahr</span>
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</a>
          ))}
          <a href="#contact" className="ml-2 px-4 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium transition-colors">
            {t.nav.book}
          </a>
          <button
            onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
            className="ml-1 px-2.5 py-1 rounded text-xs font-semibold border border-[#2d3144] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            {lang === 'de' ? 'EN' : 'DE'}
          </button>
        </nav>
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-[#1a1d27] border-t border-[#2d3144] px-4 py-4 space-y-3">
          {links.map(l => (
            <a key={l.href} href={l.href} className="block text-sm text-slate-300 hover:text-white" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <a href="#contact" className="block text-sm font-medium text-[#6366f1]" onClick={() => setOpen(false)}>{t.nav.book}</a>
          <button onClick={() => setLang(lang === 'de' ? 'en' : 'de')} className="text-xs text-slate-500">
            {lang === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
          </button>
        </motion.div>
      )}
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────

function HeroSection({ t }: { t: typeof T['de'] }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#6366f1]/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#06b6d4]/10 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#6366f1]/40 bg-[#6366f1]/10 text-[#a5b4fc] text-sm font-medium"
        >
          <Bot size={14} /> KI-Berater & Wirtschaftsinformatiker
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight"
        >
          {t.hero.headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          {t.hero.subline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#contact" className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] text-white font-semibold transition-all shadow-lg shadow-[#6366f1]/25">
            {t.hero.cta_primary}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a href="#about" className="px-6 py-3 rounded-xl border border-[#2d3144] hover:border-slate-500 text-slate-300 hover:text-white font-medium transition-all">
            {t.hero.cta_secondary}
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#6366f1]/30 blur-xl scale-110" />
            <img src="/assets/portrait.jpg" alt="Marcel Spahr" className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-2 ring-[#6366f1]/50" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────

function AboutSection({ t }: { t: typeof T['de'] }) {
  return (
    <section id="about" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">About</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.about.headline}</h2>
          </div>
        </FadeUp>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <FadeUp delay={0.1}>
            <p className="text-lg text-slate-300 leading-relaxed">{t.about.text}</p>
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
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="grid grid-cols-2 gap-4">
              {t.about.facts.map((f, i) => (
                <div key={i} className="rounded-xl border border-[#2d3144] bg-[#252836] p-5">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{f.label}</div>
                  <div className="text-sm font-semibold text-white leading-snug">{f.value}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ── Services ──────────────────────────────────────────────

function ServicesSection({ t }: { t: typeof T['de'] }) {
  return (
    <section id="services" className="py-24 px-4 sm:px-6 bg-[#0c0e14]">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Services</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.services.headline}</h2>
          </div>
        </FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.services.items.map((s, i) => {
            const Icon = s.icon;
            return (
              <FadeUp key={i} delay={i * 0.06}>
                <div className="group h-full rounded-xl border border-[#2d3144] bg-[#1a1d27] p-6 hover:border-[#6366f1]/50 hover:bg-[#1e2035] transition-all cursor-default">
                  <div className="mb-4 inline-flex p-2.5 rounded-lg bg-[#6366f1]/10 text-[#818cf8] group-hover:bg-[#6366f1]/20 transition-colors">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-white mb-2 leading-snug">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Portfolio ─────────────────────────────────────────────

function PortfolioSection({ t }: { t: typeof T['de'] }) {
  return (
    <section id="portfolio" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Portfolio</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.portfolio.headline}</h2>
            <p className="mt-3 text-slate-400">{t.portfolio.subline}</p>
          </div>
        </FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.portfolio.items.map((p, i) => (
            <FadeUp key={i} delay={i * 0.07}>
              <div className="group h-full flex flex-col rounded-xl border border-[#2d3144] bg-[#1a1d27] overflow-hidden hover:border-[#6366f1]/40 transition-all">
                {/* Colour bar */}
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
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Referenzen / Warum Marcel ─────────────────────────────

function ReferencesSection({ t }: { t: typeof T['de'] }) {
  return (
    <section id="references" className="py-24 px-4 sm:px-6 bg-[#0c0e14]">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Referenzen</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.references.headline}</h2>
            <p className="mt-3 text-slate-400">{t.references.subline}</p>
          </div>
        </FadeUp>

        {/* Stats */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
            {t.references.stats.map((s, i) => (
              <div key={i} className="rounded-xl border border-[#2d3144] bg-[#1a1d27] p-6 text-center">
                <div className="text-3xl font-bold text-[#6366f1] mb-1">{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* USPs */}
        <div className="grid sm:grid-cols-2 gap-5">
          {t.references.points.map((p, i) => {
            const Icon = p.icon;
            return (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="flex gap-4 rounded-xl border border-[#2d3144] bg-[#1a1d27] p-6 hover:border-[#6366f1]/40 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center text-[#818cf8]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{p.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────

function ContactSection({ t }: { t: typeof T['de'] }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const body = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      email:   (form.elements.namedItem('email')   as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch('/api/kontakt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) form.reset();
    } catch {
      setStatus('error');
    }
  }

  const inputCls = 'w-full rounded-lg bg-[#1a1d27] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-4 py-3 text-white placeholder-slate-500 text-sm transition-colors';

  return (
    <section id="contact" className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase">Contact</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.contact.headline}</h2>
          </div>
        </FadeUp>
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-10">
          <FadeUp delay={0.1}>
            <div className="space-y-5">
              {[
                { Icon: MapPin, text: 'Bern, Schweiz' },
                { Icon: Phone,  text: '+41 79 511 09 11' },
                { Icon: Mail,   text: 'kontakt@marcelspahr.ch', href: 'mailto:kontakt@marcelspahr.ch' },
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
          </FadeUp>
          <FadeUp delay={0.2}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name"    type="text"  required placeholder={t.contact.name}    className={inputCls} />
              <input name="email"   type="email" required placeholder={t.contact.email}   className={inputCls} />
              <textarea name="message" required rows={5} placeholder={t.contact.message} className={inputCls + ' resize-none'} />
              {status === 'success' && <p className="text-sm text-green-400 bg-green-400/10 rounded-lg px-4 py-3">{t.contact.success}</p>}
              {status === 'error'   && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">{t.contact.error}</p>}
              <button type="submit" disabled={status === 'sending'}
                className="w-full py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white font-semibold transition-all shadow-lg shadow-[#6366f1]/20">
                {status === 'sending' ? t.contact.sending : t.contact.submit}
              </button>
            </form>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────

function FooterSection({ t }: { t: typeof T['de'] }) {
  return (
    <footer className="border-t border-[#2d3144] bg-[#0c0e14] py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-slate-500">{t.footer.copy}</span>
        <div className="flex items-center gap-6">
          <a href="/impressum" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{t.footer.imprint}</a>
          <a href="/datenschutz" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{t.footer.privacy}</a>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('de');
  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      <NavBar lang={lang} setLang={setLang} t={t} />
      <HeroSection t={t} />
      <AboutSection t={t} />
      <ServicesSection t={t} />
      <PortfolioSection t={t} />
      <ReferencesSection t={t} />
      <ContactSection t={t} />
      <FooterSection t={t} />
    </div>
  );
}
