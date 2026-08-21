'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useLanguage } from '@/app/LanguageContext';
import { getBlogPost, getBlogPostTranslation } from '../data';

const PL = {
  de: {
    allPosts: 'Alle Insights',
    backHome: 'Zurück zur Startseite',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    author: 'Marcel Spahr',
  },
  en: {
    allPosts: 'All insights',
    backHome: 'Back to homepage',
    imprint: 'Legal notice',
    privacy: 'Privacy',
    author: 'Marcel Spahr',
  },
};

export default function BlogPostContent({ slug }: { slug: string }) {
  const { lang, setLang } = useLanguage();
  const post = getBlogPost(slug);
  if (!post) notFound();

  const t = getBlogPostTranslation(post, lang);
  const pl = PL[lang];

  useEffect(() => {
    document.title = `${t.title} | Digitalstudio Marcel Spahr`;
  }, [t.title]);

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

      <article className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{
          background: `radial-gradient(ellipse 50% 40% at 20% 20%, ${post.color}12 0%, transparent 70%)`,
        }} />
        <div className="relative max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[#a89880] hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            {pl.allPosts}
          </Link>

          <span className="flex items-center gap-1.5 text-xs text-[#7a6d5a]">
            <Clock size={12} /> {t.readingTime}
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">{t.title}</h1>
          <p className="mt-4 text-lg sm:text-xl text-[#a89880]">{t.subtitle}</p>
          <p className="mt-6 text-sm text-[#7a6d5a]">{pl.author}</p>

          <div className="mt-10 rounded-2xl border border-[#2d2820] bg-[#1c1912] p-6 sm:p-8">
            <p className="text-[#d4c4a8] leading-relaxed text-lg">{t.intro}</p>
          </div>

          <div className="mt-10 space-y-10">
            {t.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">{section.heading}</h2>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-[#d4c4a8] leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border p-6 sm:p-8 text-center" style={{ borderColor: `${post.color}44`, background: `${post.color}0d` }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: post.color }}>{t.ctaEyebrow}</span>
            <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white">{t.ctaTitle}</h2>
            <p className="mt-3 text-[#a89880] leading-relaxed max-w-xl mx-auto">{t.ctaText}</p>
            <Link
              href={post.ctaHref}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-[#0c0a06] transition-transform hover:-translate-y-0.5"
              style={{ background: post.color }}
            >
              {t.ctaLabel} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </article>

      <footer className="border-t border-[#2d2820] bg-[#100d09] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/blog" className="text-sm text-[#a89880] hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft size={13} /> {pl.allPosts}
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
