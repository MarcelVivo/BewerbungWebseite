'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { BLOG_POSTS, getBlogPostTranslation } from './data';

const PL = {
  de: {
    title: 'Insights | Digitalstudio Marcel Spahr',
    kicker: 'INSIGHTS',
    heading: 'Fundiertes Wissen statt Buzzwords.',
    intro: 'Ehrliche Einordnungen zu Websites, CRM, ERP und KI-Automatisierung für Schweizer KMU – aus der Praxis, ohne Verkaufsdruck.',
    readMore: 'Weiterlesen',
    backHome: 'Zurück zur Startseite',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
  },
  en: {
    title: 'Insights | Marcel Spahr Digital Studio',
    kicker: 'INSIGHTS',
    heading: 'Grounded knowledge instead of buzzwords.',
    intro: 'Honest takes on websites, CRM, ERP and AI automation for Swiss SMEs – from practice, without sales pressure.',
    readMore: 'Read more',
    backHome: 'Back to homepage',
    imprint: 'Legal notice',
    privacy: 'Privacy',
  },
};

export default function BlogIndexContent() {
  const { lang, setLang } = useLanguage();
  const pl = PL[lang];
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

  useEffect(() => {
    document.title = pl.title;
  }, [pl.title]);

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2d2820] bg-[#0c0a06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-white text-lg tracking-tight hover:opacity-80 transition-opacity">
            Marcel Spahr
          </Link>
          <div className="flex items-center gap-0.5 rounded-lg border border-[#2d2820] overflow-hidden">
            <button onClick={() => setLang('de')} className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}>DE</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}>EN</button>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(ellipse 50% 40% at 20% 30%, #c9a84c12 0%, transparent 70%)',
        }} />
        <div className="relative max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#a89880] hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            {pl.backHome}
          </Link>
          <span className="block text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">{pl.kicker}</span>
          <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">{pl.heading}</h1>
          <p className="mt-4 text-lg text-[#a89880] max-w-2xl">{pl.intro}</p>
        </div>
      </section>

      <section className="pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid gap-5 sm:grid-cols-2">
          {posts.map((post) => {
            const t = getBlogPostTranslation(post, lang);
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-[#2d2820] bg-[#1c1912] p-6 transition-colors hover:border-[#c9a84c]/40"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-[#7a6d5a]">
                  <Clock size={12} /> {t.readingTime}
                </span>
                <h2 className="mt-3 text-xl font-bold text-white leading-snug">{t.title}</h2>
                <p className="mt-2 text-sm text-[#a89880] leading-relaxed flex-1">{t.subtitle}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: post.color }}>
                  {pl.readMore} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-[#2d2820] bg-[#100d09] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-sm text-[#a89880] hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft size={13} /> {pl.backHome}
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-[#7a6d5a]">© {new Date().getFullYear()} Marcel Spahr</span>
            <a href="/impressum" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{pl.imprint}</a>
            <a href="/datenschutz" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{pl.privacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
