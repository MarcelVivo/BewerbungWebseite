'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#about',     label: 'Über mich' },
  { href: '#services',  label: 'Leistungen' },
  { href: '#portfolio', label: 'Portfolio' },
  { href: '#prozess',   label: 'Ablauf' },
  { href: '#contact',   label: 'Kontakt' },
];

export default function HomeNavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2d2820] bg-[#0c0a06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-[#f4edd8] text-lg tracking-tight">Marcel Spahr</span>
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-[#a89880] hover:text-[#f4edd8] transition-colors">{l.label}</a>
          ))}
          <a href="#contact" className="ml-2 px-4 py-1.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] text-sm font-semibold transition-colors">
            Termin buchen
          </a>
        </nav>
        <button className="md:hidden text-[#a89880] hover:text-[#f4edd8]" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-[#1c1912] border-t border-[#2d2820] px-4 py-4 space-y-3 ms-anim">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="block text-sm text-[#d4c4a8] hover:text-[#f4edd8]" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <a href="#contact" className="block text-sm font-semibold text-[#c9a84c]" onClick={() => setOpen(false)}>Termin buchen</a>
        </div>
      )}
    </header>
  );
}
