'use client';

export const dynamic = 'force-static';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Lock } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';
import { PROJECTS, getProject } from '../data';

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }));
}

const PL = {
  de: {
    back: '← Zurück zum Portfolio',
    challenge: 'Herausforderung',
    approach: 'Mein Ansatz',
    result: 'Ergebnis',
    expertiseCta: 'Vollständige Expertise einsehen',
    expertiseNote: 'Lebenslauf, Diplome, Zertifikate & alle Projektdokumente als PDF',
    accessHint: 'Kein Zugang? Diesen unter',
    accessHint2: 'anfordern.',
  },
  en: {
    back: '← Back to portfolio',
    challenge: 'The Challenge',
    approach: 'My Approach',
    result: 'The Result',
    expertiseCta: 'View full expertise',
    expertiseNote: 'CV, diplomas, certificates & all project documents as PDF',
    accessHint: 'No access? Request it at',
    accessHint2: '.',
  },
};

export default function PortfolioDetailPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug);
  if (!project) notFound();

  const { lang } = useLanguage();
  const p = project[lang];
  const pl = PL[lang];

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2d2820] bg-[#0c0a06]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/#portfolio" className="text-sm text-[#a89880] hover:text-[#f4edd8] transition-colors">
            {pl.back}
          </Link>
          <Link href="/" className="font-bold text-[#f4edd8] text-sm">Marcel Spahr</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <div className="mb-12">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-4"
            style={{ color: project.color, borderColor: `${project.color}50`, background: `${project.color}15` }}
          >
            {p.tag}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">{p.title}</h1>
          <p className="text-lg text-[#c9a84c] font-medium italic">{p.tagline}</p>
        </div>

        {/* Content sections */}
        <div className="space-y-10">
          {/* Challenge */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[#2d2820]" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-[#7a6d5a]">{pl.challenge}</h2>
              <div className="h-px flex-1 bg-[#2d2820]" />
            </div>
            <p className="text-[#d4c4a8] leading-relaxed">{p.challenge}</p>
          </section>

          {/* Approach */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[#2d2820]" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-[#7a6d5a]">{pl.approach}</h2>
              <div className="h-px flex-1 bg-[#2d2820]" />
            </div>
            <p className="text-[#d4c4a8] leading-relaxed mb-5">{p.approach}</p>
            <ul className="space-y-2.5">
              {p.points.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: project.color }} />
                  <span className="text-[#a89880] text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Result */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[#2d2820]" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-[#7a6d5a]">{pl.result}</h2>
              <div className="h-px flex-1 bg-[#2d2820]" />
            </div>
            <p className="text-[#d4c4a8] leading-relaxed">{p.result}</p>
          </section>
        </div>

        {/* Expertise CTA */}
        <div className="mt-16 rounded-2xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
            <Lock size={22} className="text-[#c9a84c]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{pl.expertiseCta}</h3>
          <p className="text-sm text-[#7a6d5a] mb-6">{pl.expertiseNote}</p>
          <Link
            href="/login?next=/expertise"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/20"
          >
            {pl.expertiseCta}
            <ChevronRight size={16} />
          </Link>
          <p className="mt-4 text-xs text-[#7a6d5a]">
            {pl.accessHint}{' '}
            <a href="mailto:kontakt@marcelspahr.ch" className="text-[#c9a84c] hover:underline">
              kontakt@marcelspahr.ch
            </a>{' '}
            {pl.accessHint2}
          </p>
        </div>
      </main>
    </div>
  );
}
