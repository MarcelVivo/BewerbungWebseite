'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Chakra_Petch } from 'next/font/google';
import { useLanguage } from './LanguageContext';
import { buildFlapWord, setFlapWordMode, type FlapLetter } from './lib/splitFlap';
import { T } from '../lib/translations';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: '700', display: 'swap' });

function NavbarFlapLabel({ label }: { label: string }) {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const lettersRef = useRef<FlapLetter[]>([]);
  const settleTimerRef = useRef(0);
  const uppercaseLabel = label.toUpperCase();

  useEffect(() => {
    const container = labelRef.current;
    if (!container) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const letters = buildFlapWord(container, uppercaseLabel);
    lettersRef.current = letters;

    return () => {
      window.clearTimeout(settleTimerRef.current);
      setFlapWordMode(letters, 'settle', reduced);
    };
  }, [uppercaseLabel]);

  function triggerFlap() {
    const letters = lettersRef.current;
    if (!letters.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    window.clearTimeout(settleTimerRef.current);
    setFlapWordMode(letters, 'spin', false);
    settleTimerRef.current = window.setTimeout(() => {
      setFlapWordMode(letters, 'settle', false);
    }, 440);
  }

  return <span ref={labelRef} onClick={triggerFlap} className="inline-flex whitespace-pre" />;
}

export default function HomeNavBar() {
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  const t = T[lang].nav;

  const NAV_LINKS = [
    { href: '#about',     label: t.about },
    { href: '#services',  label: t.services },
    { href: '#portfolio', label: t.portfolio },
  ];

  return (
    <header className="home-navbar fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div className="home-navbar-shell max-w-7xl mx-auto px-4 sm:px-6 h-16 lg:h-20 flex items-center justify-between pointer-events-auto">
        {/* ── Logo ── */}
        <a href="/" aria-label="Marcel Spahr – Startseite" className="flex items-center select-none">
          <img
            src="/MSLogo/MSLogoGehirn.png"
            alt="Marcel Spahr"
            className="h-14 w-auto object-contain"
          />
        </a>
        <nav className={`hidden lg:flex items-center gap-6 ${chakraPetch.className}`}>
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-[#a89880] hover:text-[#f4edd8] transition-colors"><NavbarFlapLabel label={l.label} /></a>
          ))}
          {/* Language toggle */}
          <div className="flex items-center gap-1 ml-1 rounded-lg border border-[#2d2820] overflow-hidden">
            <button
              onClick={() => setLang('de')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}
            ><NavbarFlapLabel label="DE" /></button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}
            ><NavbarFlapLabel label="EN" /></button>
          </div>
          <a href="mailto:kontakt@marcelspahr.ch?subject=Termin%20buchen" className="ml-1 px-4 py-1.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] text-sm font-semibold transition-colors">
            <NavbarFlapLabel label={t.book} />
          </a>
        </nav>
        <div className={`flex items-center gap-3 lg:hidden ${chakraPetch.className}`}>
          {/* Mobile language toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-[#2d2820] overflow-hidden">
            <button onClick={() => setLang('de')} className={`px-2 py-1 text-xs font-semibold transition-colors ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880]'}`}><NavbarFlapLabel label="DE" /></button>
            <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880]'}`}><NavbarFlapLabel label="EN" /></button>
          </div>
          <button className="text-[#a89880] hover:text-[#f4edd8]" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className="navbar-gold-divider home-navbar-horizon h-px pointer-events-none" aria-hidden="true" />
      {open && (
        <div className={`home-navbar-mobile-menu lg:hidden px-4 py-4 space-y-3 ms-anim pointer-events-auto ${chakraPetch.className}`}>
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="block text-sm text-[#d4c4a8] hover:text-[#f4edd8]" onClick={() => setOpen(false)}><NavbarFlapLabel label={l.label} /></a>
          ))}
          <a href="mailto:kontakt@marcelspahr.ch?subject=Termin%20buchen" className="block text-sm font-semibold text-[#c9a84c]" onClick={() => setOpen(false)}><NavbarFlapLabel label={t.book} /></a>
        </div>
      )}
    </header>
  );
}
