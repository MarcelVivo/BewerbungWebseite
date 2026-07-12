'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { T } from '../lib/translations';

export default function HomeNavBar() {
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  const t = T[lang].nav;

  const NAV_LINKS = [
    { href: '#about',     label: t.about },
    { href: '#services',  label: t.services },
    { href: '#portfolio', label: t.portfolio },
    { href: '#prozess',   label: t.process },
    { href: '#contact',   label: t.contact },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black">
      <div className="navbar-gold-divider absolute inset-x-0 bottom-0 h-px pointer-events-none" aria-hidden="true" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* ── Logo ── */}
        <a href="/" aria-label="Marcel Spahr – Startseite" className="flex items-center select-none">
          <img
            src="/MSLogo/MSLogoLang.png"
            alt="Marcel Spahr"
            className="h-24 sm:h-28 w-auto object-contain"
          />
        </a>
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-[#a89880] hover:text-[#f4edd8] transition-colors">{l.label}</a>
          ))}
          {/* Language toggle */}
          <div className="flex items-center gap-1 ml-1 rounded-lg border border-[#2d2820] overflow-hidden">
            <button
              onClick={() => setLang('de')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}
            >DE</button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}
            >EN</button>
          </div>
          <a href="#contact" className="ml-1 px-4 py-1.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] text-sm font-semibold transition-colors">
            {t.book}
          </a>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          {/* Mobile language toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-[#2d2820] overflow-hidden">
            <button onClick={() => setLang('de')} className={`px-2 py-1 text-xs font-semibold transition-colors ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880]'}`}>DE</button>
            <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880]'}`}>EN</button>
          </div>
          <button className="text-[#a89880] hover:text-[#f4edd8]" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-[#1c1912] border-t border-[#2d2820] px-4 py-4 space-y-3 ms-anim">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="block text-sm text-[#d4c4a8] hover:text-[#f4edd8]" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <a href="#contact" className="block text-sm font-semibold text-[#c9a84c]" onClick={() => setOpen(false)}>{t.book}</a>
        </div>
      )}
    </header>
  );
}
