'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Database, ExternalLink, FileText, Globe2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';
import { getProject } from '../data';

const PL = {
  de: {
    back: '← Zu den Referenzen',
    role: 'Meine Rolle',
    status: 'Projektstatus',
    challenge: 'Ausgangslage',
    approach: 'Mein Ansatz',
    result: 'Ergebnis',
    insightsEyebrow: 'SYSTEMEINBLICKE',
    insightsTitle: 'Das Vera Portal im Einsatz',
    insightsText: 'Einblick in die von mir konzipierte und entwickelte Verwaltungsplattform. Sämtliche dargestellten Personen- und Objektdaten wurden vollständig anonymisiert.',
    enlarge: 'Ansicht vergrössern',
    live: 'Live-Projekt öffnen',
    document: 'Businessplan öffnen',
    ctaEyebrow: 'DEINE IDEE ALS NÄCHSTES PROJEKT',
    ctaTitle: 'Lass uns dein Vorhaben besprechen.',
    ctaText: 'Erzähl mir, was du aufbauen, vereinfachen oder digitalisieren möchtest. Gemeinsam klären wir den sinnvollsten nächsten Schritt.',
    ctaButton: 'Projekt besprechen',
  },
  en: {
    back: '← Back to references',
    role: 'My role',
    status: 'Project status',
    challenge: 'Starting point',
    approach: 'My approach',
    result: 'Outcome',
    insightsEyebrow: 'SYSTEM INSIGHTS',
    insightsTitle: 'The Vera Portal in action',
    insightsText: 'A look inside the administration platform I designed and developed. All personal and property data shown has been fully anonymized.',
    enlarge: 'Enlarge view',
    live: 'Open live project',
    document: 'Open business plan',
    ctaEyebrow: 'YOUR IDEA AS THE NEXT PROJECT',
    ctaTitle: 'Let’s discuss what you want to build.',
    ctaText: 'Tell me what you want to create, simplify or digitize. Together, we will identify the most useful next step.',
    ctaButton: 'Discuss your project',
  },
};

export default function PortfolioDetailContent({ slug }: { slug: string }) {
  const project = getProject(slug)!;
  const { lang, setLang } = useLanguage();
  const p = project[lang];
  const pl = PL[lang];

  useEffect(() => {
    document.title = `${p.title} | Digitalstudio Marcel Spahr`;
  }, [p.title]);

  return (
    <div
      className="min-h-screen bg-[#07090b] text-[#f4edd8]"
      style={{ '--project-accent': project.color, '--project-accent-rgb': project.colorRgb } as React.CSSProperties}
    >
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#07090b]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/#journey-references" className="text-sm text-[#a89880] hover:text-white transition-colors">
            {pl.back}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex overflow-hidden rounded-md border border-white/15">
              <button onClick={() => setLang('de')} className={`px-2.5 py-1 text-xs font-semibold ${lang === 'de' ? 'text-[#07090b]' : 'text-[#a89880]'}`} style={lang === 'de' ? { background: project.color } : undefined}>DE</button>
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-xs font-semibold ${lang === 'en' ? 'text-[#07090b]' : 'text-[#a89880]'}`} style={lang === 'en' ? { background: project.color } : undefined}>EN</button>
            </div>
            <Link href="/" className="font-bold text-white text-sm tracking-wide">Digitalstudio Marcel Spahr</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <section className="grid lg:grid-cols-[0.82fr_1.18fr] gap-10 lg:gap-16 items-center mb-20">
          <div>
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-5"
              style={{ color: project.color, borderColor: `${project.color}66`, background: `${project.color}12` }}
            >
              {p.tag}
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-5 leading-[0.95] tracking-[-0.045em]">{p.title}</h1>
            <p className="text-lg sm:text-xl leading-relaxed" style={{ color: project.color }}>{p.tagline}</p>

            <dl className="mt-8 grid gap-5 border-t border-white/10 pt-6">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-[#716b62] mb-1.5">{pl.role}</dt>
                <dd className="text-sm leading-relaxed text-[#d4c4a8]">{p.role}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-[#716b62] mb-1.5">{pl.status}</dt>
                <dd className="text-sm text-[#d4c4a8]">{p.status}</dd>
              </div>
            </dl>

            {(project.externalUrl || project.documentUrl) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {project.externalUrl && (
                  <a
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#07090b] transition-transform hover:-translate-y-0.5"
                    style={{ background: project.color }}
                  >
                    {pl.live}<ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
                {project.documentUrl && (
                  <a
                    href={project.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                    style={{ color: project.color, borderColor: `${project.color}77` }}
                  >
                    {pl.document}<FileText size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div
            className="relative overflow-hidden rounded-2xl border bg-black/30 shadow-2xl"
            style={{ borderColor: `${project.color}33`, boxShadow: `0 30px 90px rgba(${project.colorRgb},0.12)` }}
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/35 via-transparent to-white/[0.03] pointer-events-none" />
            <img src={project.image} alt={`${p.title} – Projektansicht`} className="block w-full aspect-[8/5] object-cover object-top" />
          </div>
        </section>

        {p.facts && p.facts.length > 0 && (
          <section className="mb-20 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] lg:grid-cols-4" aria-label={lang === 'de' ? 'Projekt auf einen Blick' : 'Project at a glance'}>
            {p.facts.map((fact, index) => (
              <div
                key={fact.label}
                className={`p-5 sm:p-7 ${index % 2 !== 0 ? 'border-l border-white/10' : ''} ${index >= 2 ? 'border-t border-white/10 lg:border-t-0' : ''} ${index > 0 ? 'lg:border-l lg:border-white/10' : ''}`}
              >
                <p className="text-lg font-bold tracking-[-0.025em] sm:text-xl" style={{ color: project.color }}>{fact.value}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[#8e877b]">{fact.label}</p>
              </div>
            ))}
          </section>
        )}

        <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-10 lg:gap-16">
          <aside className="lg:sticky lg:top-28 self-start">
            <p className="text-[0.68rem] font-bold tracking-[0.2em] uppercase" style={{ color: project.color }}>{p.tag}</p>
            <h2 className="mt-3 text-2xl font-bold text-white">{p.title}</h2>
            <ul className="mt-6 space-y-3">
              {p.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-[#a89880]">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: project.color }} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-12">
            {[
              { label: pl.challenge, copy: p.challenge },
              { label: pl.approach, copy: p.approach },
              { label: pl.result, copy: p.result },
            ].map((section) => (
              <section key={section.label} className="border-t border-white/10 pt-6">
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#716b62] mb-4">{section.label}</h2>
                <p className="text-base sm:text-lg text-[#d4c4a8] leading-[1.75]">{section.copy}</p>
              </section>
            ))}
          </div>
        </div>

        {p.systemLayers && p.systemLayers.length > 0 && (
          <section className="mt-24 border-t border-white/10 pt-10" aria-labelledby="project-system-title">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-bold tracking-[0.2em]" style={{ color: project.color }}>{p.systemEyebrow}</p>
              <h2 id="project-system-title" className="mt-3 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">{p.systemTitle}</h2>
              <p className="mt-4 text-base leading-relaxed text-[#a89880] sm:text-lg">{p.systemIntro}</p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {p.systemLayers.map((layer, index) => {
                const Icon = [Globe2, Database, ShieldCheck][index] || Database;
                return (
                  <article key={layer.title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{ color: project.color, borderColor: `${project.color}44`, background: `${project.color}10` }}>
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-xl font-bold text-white">{layer.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#a89880]">{layer.description}</p>
                    <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
                      {layer.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#c8bda9]">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.color }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            {p.roles && p.roles.length > 0 && (
              <div className="mt-7 grid gap-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                <div>
                  <h3 className="text-xl font-bold text-white sm:text-2xl">{p.rolesTitle}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#a89880]">{p.rolesIntro}</p>
                </div>
                <ul className="flex flex-wrap gap-2.5" aria-label={p.rolesTitle}>
                  {p.roles.map((role) => (
                    <li key={role} className="rounded-full border px-3.5 py-2 text-xs font-semibold" style={{ color: project.color, borderColor: `${project.color}44`, background: `${project.color}0b` }}>
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {project.gallery && project.gallery.length > 0 && (
          <section className="mt-24 border-t border-white/10 pt-10" aria-labelledby="system-insights-title">
            <div className="max-w-3xl mb-10">
              <p className="text-[0.68rem] font-bold tracking-[0.2em]" style={{ color: project.color }}>{pl.insightsEyebrow}</p>
              <h2 id="system-insights-title" className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-[-0.035em]">{pl.insightsTitle}</h2>
              <p className="mt-4 text-[#a89880] leading-relaxed">{pl.insightsText}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 sm:gap-7">
              {project.gallery.map((item, index) => {
                const copy = item[lang];
                return (
                  <article
                    key={item.image}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
                  >
                    <a
                      href={item.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative overflow-hidden bg-[#edf1f5]"
                      aria-label={`${copy.title} – ${pl.enlarge}`}
                    >
                      <img
                        src={item.image}
                        alt={`${p.title}: ${copy.title}`}
                        loading={index > 1 ? 'lazy' : 'eager'}
                        className="block w-full aspect-[16/9] object-cover object-top transition-transform duration-700 group-hover:scale-[1.015]"
                      />
                      <span
                        className="absolute right-3 bottom-3 rounded-full border px-3 py-1.5 text-[0.65rem] font-bold tracking-wide text-[#07090b] opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0"
                        style={{ background: project.color, borderColor: `${project.color}99` }}
                      >
                        {pl.enlarge}
                      </span>
                    </a>
                    <div className="p-5 sm:p-6">
                      <h3 className="font-bold text-white text-lg">{copy.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#a89880]">{copy.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section
          className="mt-24 rounded-2xl border p-8 sm:p-12 text-center"
          style={{ borderColor: `${project.color}44`, background: `rgba(${project.colorRgb},0.055)` }}
        >
          <p className="text-[0.68rem] font-bold tracking-[0.2em]" style={{ color: project.color }}>{pl.ctaEyebrow}</p>
          <h2 className="mt-4 text-2xl sm:text-4xl font-bold text-white tracking-[-0.035em]">{pl.ctaTitle}</h2>
          <p className="mt-4 max-w-2xl mx-auto text-[#a89880] leading-relaxed">{pl.ctaText}</p>
          <Link
            href="/?lead=project"
            className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-[#07090b] transition-transform hover:-translate-y-0.5"
            style={{ background: project.color }}
          >
            {pl.ctaButton}<ChevronRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
