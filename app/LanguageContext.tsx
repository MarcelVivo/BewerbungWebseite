'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'de' | 'en';

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'de',
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('de');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ms-lang') as Lang | null;
      if (saved === 'de' || saved === 'en') setLangState(saved);
    } catch {}
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    document.documentElement.lang = l;
    try { localStorage.setItem('ms-lang', l); } catch {}
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLanguage = () => useContext(Ctx);
