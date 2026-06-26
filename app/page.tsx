'use client';

import { useState, useEffect } from 'react';
import {
  Bot, BarChart3, Workflow, Megaphone, Video, FolderKanban,
  GraduationCap, Globe, Lightbulb, Mail, MapPin, Phone,
  ChevronRight, ExternalLink, Star,
  CheckCircle, Zap, Users, Award,
  MessageSquare, Search, Compass, Wrench, Heart, ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import HomeNavBar from './HomeNavBar';
import ContactFormClient from './ContactFormClient';
import { useLanguage } from './LanguageContext';
import { T } from '../lib/translations';

export const dynamic = 'force-static';

// ── Static meta (icons + slugs/urls, language-independent) ───

const SERVICE_META = [
  { icon: Bot,           slug: 'ki-agenten' },
  { icon: BarChart3,     slug: 'business-analyse' },
  { icon: Workflow,      slug: 'prozessoptimierung' },
  { icon: Megaphone,     slug: 'digital-marketing' },
  { icon: Video,         slug: 'video-produktion' },
  { icon: FolderKanban,  slug: 'projektmanagement' },
  { icon: GraduationCap, slug: 'workshops' },
  { icon: Globe,         slug: 'website-optimierung' },
  { icon: Lightbulb,     slug: 'ki-beratung-kmu' },
];

const PORTFOLIO_META = [
  { slug: 'covid-certificate',         color: '#a896c8' },
  { slug: 'digitalisierung-swisscom',  color: '#7a9bb5' },
  { slug: 'olivias-olivenpaste',       color: '#8fb58a' },
  { slug: 'requirements-engineering',  color: '#7aada8' },
];

const USP_ICONS = [Zap, Users, CheckCircle, Award];
const PROCESS_ICONS = [MessageSquare, Search, Compass, Wrench, Heart];

const CINEMATIC_QUOTES = [
  'KI ersetzt keine Menschen. Sie ersetzt Unternehmen, die sie ignorieren.',
  'Die besten Ergebnisse entstehen dort, wo menschliche Intelligenz auf künstliche Intelligenz trifft.',
  'Wer KI nur nutzt, spart Zeit. Wer sie versteht, gewinnt Zukunft.',
  'KI denkt schnell. Der Mensch denkt richtig. Gemeinsam entsteht Exzellenz.',
  'KI kann Daten verstehen. Menschen verstehen Menschen.',
];

function CinematicQuotes() {
  const [state, setState] = useState({ index: 0, gen: 0 });

  useEffect(() => {
    const t = setTimeout(
      () => setState(s => ({ index: (s.index + 1) % CINEMATIC_QUOTES.length, gen: s.gen + 1 })),
      7600,
    );
    return () => clearTimeout(t);
  }, [state.gen]);

  return (
    <div className="absolute top-[20%] sm:top-[26%] right-3 sm:right-[10%] left-[42%] sm:left-auto sm:w-[min(290px,32vw)] z-10 pointer-events-none">
      <div key={state.gen} className="cinematic-quote">
        <p
          className="text-[#ede8dc] text-[0.73rem] sm:text-[0.82rem] leading-[1.75] font-light italic tracking-wide text-right"
          style={{ textShadow: '0 2px 14px rgba(0,0,0,0.96), 0 1px 4px rgba(0,0,0,0.88)' }}
        >
          <span className="text-[#c9a84c] not-italic">„</span>
          {CINEMATIC_QUOTES[state.index]}
          <span className="text-[#c9a84c] not-italic">“</span>
        </p>
        <div className="mt-2.5 flex justify-end">
          <div className="h-px w-10 bg-gradient-to-l from-[#c9a84c]/55 to-transparent" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function HomePage() {
  const { lang } = useLanguage();
  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      <HomeNavBar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img
            src="/assets/MarcelSpahrHeader.jpg"
            alt="Marcel Spahr – KI-Unternehmensberater Bern"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(12,10,6,0.35) 0%, rgba(12,10,6,0.05) 20%, rgba(12,10,6,0.08) 50%, rgba(12,10,6,0.70) 68%, rgba(12,10,6,0.92) 82%, #0c0a06 95%)'
          }} />
        </div>
        <CinematicQuotes />
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="ms-anim-scale mb-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#d4b86a] text-sm font-medium backdrop-blur-sm">
              <Bot size={14} /> {t.hero.badge}
            </div>
            <p style={{ animationDelay: '0.08s' }} className="ms-anim mb-3 text-sm sm:text-base font-medium italic text-[#c9a84c] tracking-wide drop-shadow">
              {t.hero.tagline}
            </p>
            <h1 style={{ animationDelay: '0.15s' }} className="ms-anim text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
              {t.hero.title}
            </h1>
            <p style={{ animationDelay: '0.2s' }} className="ms-anim mt-4 text-base sm:text-lg text-[#d4c4a8] max-w-2xl mx-auto leading-relaxed drop-shadow">
              {t.hero.subtitle}
            </p>
            <div style={{ animationDelay: '0.3s' }} className="ms-anim mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#contact" className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/30">
                {t.hero.cta}
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#about" className="px-6 py-3 rounded-xl border border-[#f4edd8]/25 hover:border-[#f4edd8]/60 text-[#f4edd8] font-medium transition-all backdrop-blur-sm">
                {t.hero.more}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.about.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.about.heading}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-[#d4c4a8] leading-relaxed">{t.about.text}</p>
              <div className="mt-8 flex gap-4">
                <a href="https://www.linkedin.com/in/marcel-spahr-901568304" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d2820] hover:border-[#c9a84c] text-[#a89880] hover:text-[#c9a84c] text-sm transition-all">
                  <ExternalLink size={16} /> {t.about.linkedin}
                </a>
                <a href="mailto:kontakt@marcelspahr.ch"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d2820] hover:border-[#c9a84c] text-[#a89880] hover:text-[#c9a84c] text-sm transition-all">
                  <Mail size={16} /> {t.about.email}
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {t.about.facts.map((f, i) => (
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
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.services.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.services.heading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_META.map((s, i) => {
              const Icon = s.icon;
              const item = t.services.items[i];
              return (
                <a key={i} href={`/leistungen/${s.slug}`}
                  className="group h-full rounded-xl border border-[#2d2820] bg-[#1c1912] p-6 hover:border-[#c9a84c]/50 hover:bg-[#231e15] transition-all block">
                  <div className="mb-4 inline-flex p-2.5 rounded-lg bg-[#c9a84c]/10 text-[#d4b86a] group-hover:bg-[#c9a84c]/20 transition-colors">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-white mb-2 leading-snug">{item.title}</h3>
                  <p className="text-sm text-[#a89880] leading-relaxed">{item.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-[#c9a84c] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    {t.services.more} <ChevronRight size={12} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Duo: Projektanfrage + KI-Check ── */}
      <section className="py-20 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">
              {lang === 'de' ? 'Nächster Schritt' : 'Next Step'}
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              {lang === 'de' ? 'Wie kann ich Ihnen helfen?' : 'How can I help you?'}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">

            {/* Projektanfrage – primary */}
            <div className="relative rounded-2xl border border-[#c9a84c]/50 bg-[#1c1912] overflow-hidden p-7 flex flex-col">
              <div
                className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 70%)' }}
              />
              <div className="relative z-10 flex flex-col flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#d4b86a] text-xs font-semibold mb-5 tracking-widest uppercase w-fit">
                  <ClipboardList size={12} />
                  {lang === 'de' ? 'Projekt starten' : 'Start a Project'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                  {lang === 'de'
                    ? <>{`Bereit loszulegen? `}<span className="text-[#c9a84c]">Anfrage stellen.</span></>
                    : <>{`Ready to go? `}<span className="text-[#c9a84c]">Submit a request.</span></>}
                </h3>
                <p className="text-[#a89880] leading-relaxed mb-6 flex-1">
                  {lang === 'de'
                    ? 'Beschreiben Sie Ihr Projekt in 4 strukturierten Schritten – ich melde mich innerhalb von 24 Stunden persönlich bei Ihnen.'
                    : 'Describe your project in 4 structured steps – I will get back to you personally within 24 hours.'}
                </p>
                <div className="space-y-4">
                  <a
                    href="/anfrage"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/25"
                  >
                    {lang === 'de' ? 'Projektanfrage starten' : 'Start Project Request'}
                    <ChevronRight size={18} />
                  </a>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#7a6d5a]">
                    <span>{lang === 'de' ? '4 Schritte' : '4 Steps'}</span>
                    <span>·</span>
                    <span>{lang === 'de' ? '5 Minuten' : '5 Minutes'}</span>
                    <span>·</span>
                    <span>{lang === 'de' ? 'Antwort innerhalb 24h' : 'Reply within 24h'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KI-Check – secondary */}
            <div className="relative rounded-2xl border border-[#2d2820] bg-[#1c1912] overflow-hidden p-7 flex flex-col hover:border-[#c9a84c]/30 transition-colors">
              <div
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)' }}
              />
              <div className="relative z-10 flex flex-col flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/8 text-[#d4b86a] text-xs font-semibold mb-5 tracking-widest uppercase w-fit">
                  <Bot size={12} />
                  {lang === 'de' ? 'Kostenloser Self-Check' : 'Free Self-Assessment'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                  {lang === 'de'
                    ? <>{'Wie KI-ready ist '}<span className="text-[#c9a84c]">Ihr</span>{' Unternehmen?'}</>
                    : <>{'How AI-ready is '}<span className="text-[#c9a84c]">your</span>{' company?'}</>}
                </h3>
                <p className="text-[#a89880] leading-relaxed mb-6 flex-1">
                  {lang === 'de'
                    ? 'Der kostenlose Self-Check zeigt Ihnen in wenigen Minuten, wo Ihr Unternehmen heute steht – und welche Hebel als Nächstes wirklich helfen.'
                    : 'The free self-check shows you in minutes where your company stands – and which levers will really help next.'}
                </p>
                <div className="space-y-4">
                  <a
                    href="/ki-check"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#c9a84c]/50 hover:border-[#c9a84c] hover:bg-[#c9a84c]/10 text-[#c9a84c] font-bold transition-all"
                  >
                    {lang === 'de' ? 'Jetzt Check starten' : 'Start Assessment'}
                    <ChevronRight size={18} />
                  </a>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#7a6d5a]">
                    <span>{lang === 'de' ? '10 Fragen' : '10 Questions'}</span>
                    <span>·</span>
                    <span>{lang === 'de' ? '3 Minuten' : '3 Minutes'}</span>
                    <span>·</span>
                    <span>{lang === 'de' ? 'Persönlicher Fahrplan per E-Mail' : 'Personal roadmap by email'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Warum Marcel ── */}
      <section id="references" className="py-24 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.why.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.why.heading}</h2>
            <p className="mt-3 text-[#a89880]">{t.why.subheading}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
            {t.why.stats.map((s, i) => (
              <div key={i} className="rounded-xl border border-[#2d2820] bg-[#1c1912] p-6 text-center">
                <div className="text-3xl font-bold text-[#c9a84c] mb-1">{s.value}</div>
                <div className="text-sm text-[#a89880]">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {t.why.usp.map((p, i) => {
              const Icon = USP_ICONS[i];
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

      {/* ── Portfolio ── */}
      <section id="portfolio" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.portfolio.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.portfolio.heading}</h2>
            <p className="mt-3 text-[#a89880]">{t.portfolio.subheading}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {t.portfolio.items.map((item, i) => {
              const meta = PORTFOLIO_META[i];
              return (
                <Link
                  key={i}
                  href={`/portfolio/${meta.slug}`}
                  className="group h-full flex flex-col rounded-xl border border-[#2d2820] bg-[#1c1912] overflow-hidden hover:border-[#c9a84c]/40 hover:bg-[#1c1912]/80 transition-all"
                >
                  <div className="h-1 w-full" style={{ background: meta.color }} />
                  <div className="flex-1 p-6 flex flex-col gap-3">
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full border w-fit"
                      style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}15` }}>
                      {item.tag}
                    </span>
                    <h3 className="font-bold text-white leading-snug">{item.title}</h3>
                    <p className="text-sm text-[#a89880] leading-relaxed flex-1">{item.desc}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#d4b86a] group-hover:text-[#c9a84c] transition-colors">
                      {t.portfolio.viewProject}
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Vorgehen / Prozess ── */}
      <section id="prozess" className="py-24 px-4 sm:px-6 bg-[#100d09]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block border border-[#2d2820] text-[#a89880] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">{t.process.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="text-white">{t.process.heading1}</span>
              <span className="text-[#c9a84c]">{t.process.heading2}</span>
            </h2>
            <p className="mt-3 text-[#a89880] max-w-xl mx-auto">{t.process.subheading}</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-[#2d2820] -translate-x-1/2 z-0" />
            <div className="space-y-4 md:space-y-0">
              {t.process.steps.map((step, i) => {
                const isLeft = i % 2 === 0;
                const Icon = PROCESS_ICONS[i];
                const card = (
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
                    <div className="flex items-start gap-3 md:hidden">
                      <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-full border border-[#c9a84c]/50 bg-[#0c0a06] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#c9a84c]">{step.num}</span>
                      </div>
                      <div className="flex-1">{card}</div>
                    </div>
                    <div className="hidden md:grid grid-cols-[1fr_80px_1fr] items-center gap-6">
                      <div>{isLeft ? card : null}</div>
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
            <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/25">
              {t.process.cta} <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Kontakt ── */}
      <section id="contact" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.contact.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.contact.heading}</h2>
          </div>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-10">
            <div className="space-y-5">
              {[
                { Icon: MapPin, text: t.contact.location,          href: undefined },
                { Icon: Phone,  text: '+41 79 511 09 11',          href: undefined },
                { Icon: Mail,   text: 'kontakt@marcelspahr.ch',    href: 'mailto:kontakt@marcelspahr.ch' },
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
            mainEntity: T.de.faq.items.map(item => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          })}}
        />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#c9a84c] text-sm font-semibold tracking-widest uppercase">{t.faq.label}</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{t.faq.heading}</h2>
          </div>
          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <details key={`${lang}-${i}`} className="group rounded-xl border border-[#2d2820] bg-[#1c1912] overflow-hidden">
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
          <span className="text-sm text-[#7a6d5a]">{t.footer.copy}</span>
          <div className="flex items-center gap-6">
            <a href="/impressum"  className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{t.footer.imprint}</a>
            <a href="/datenschutz" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{t.footer.privacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
