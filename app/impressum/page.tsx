'use client';

export const dynamic = 'force-static';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLanguage } from '../LanguageContext';

const C = {
  de: {
    title: 'Impressum',
    subtitle: 'Angaben gemäss Art. 13 nDSG',
    langToggle: { de: 'DE', en: 'EN' },
    back: '← Zurück zur Startseite',
    sections: [
      {
        heading: 'Verantwortliche Person',
        content: [
          'Marcel Spahr',
          'Schwarzenburgstrasse 65',
          '3008 Bern',
          'Schweiz',
        ],
      },
      {
        heading: 'Kontakt',
        content: [
          'E-Mail: kontakt@marcelspahr.ch',
          'Telefon: +41 79 511 09 11',
        ],
      },
      {
        heading: 'Handelsregistereintrag',
        content: [
          'Handelsregister-Nr.: CH-036.1.051.760-7',
          'Rechtsform: Einzelfirma',
          'Branche: Erbringung von übrigen freiberuflichen Tätigkeiten',
          'Letzte Eintragung: 13.09.2011',
        ],
      },
      {
        heading: 'Hosting',
        content: [
          'Diese Website wird betrieben von Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA.',
        ],
      },
      {
        heading: 'Urheberrecht',
        content: [
          'Alle Inhalte dieser Website, darunter Texte, Bilder, Grafiken und Dokumente, sind urheberrechtlich geschützt. Eine Vervielfältigung, Verbreitung oder öffentliche Wiedergabe ist auch in Auszügen nur mit der ausdrücklichen schriftlichen Genehmigung von Marcel Spahr gestattet.',
        ],
      },
      {
        heading: 'Haftungsausschluss',
        content: [
          'Alle Angaben auf dieser Website wurden sorgfältig geprüft. Marcel Spahr übernimmt jedoch keine Gewähr für die Aktualität, Richtigkeit und Vollständigkeit der bereitgestellten Informationen. Haftungsansprüche für Schäden materieller oder ideeller Art, die durch die Nutzung dieser Website entstehen, sind grundsätzlich ausgeschlossen, soweit kein vorsätzliches oder grob fahrlässiges Verschulden nachgewiesen werden kann.',
        ],
      },
      {
        heading: 'Externe Links',
        content: [
          'Diese Website kann Links zu externen Websites enthalten. Auf deren Inhalte hat Marcel Spahr keinen Einfluss und übernimmt dafür keine Haftung. Für die Inhalte verlinkter Seiten sind ausschliesslich deren Betreiber verantwortlich.',
        ],
      },
    ],
  },
  en: {
    title: 'Legal Notice',
    subtitle: 'Information pursuant to Art. 13 nDSG (Swiss Data Protection Act)',
    langToggle: { de: 'DE', en: 'EN' },
    back: '← Back to homepage',
    sections: [
      {
        heading: 'Responsible Person',
        content: [
          'Marcel Spahr',
          'Schwarzenburgstrasse 65',
          '3008 Bern',
          'Switzerland',
        ],
      },
      {
        heading: 'Contact',
        content: [
          'Email: kontakt@marcelspahr.ch',
          'Phone: +41 79 511 09 11',
        ],
      },
      {
        heading: 'Commercial Register Entry',
        content: [
          'Commercial Register No.: CH-036.1.051.760-7',
          'Legal form: Sole proprietorship (Einzelfirma)',
          'Industry: Provision of other professional activities',
          'Last entry: 13.09.2011',
        ],
      },
      {
        heading: 'Hosting',
        content: [
          'This website is operated by Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA.',
        ],
      },
      {
        heading: 'Copyright',
        content: [
          'All content on this website, including text, images, graphics and documents, is protected by copyright. Reproduction, distribution or public disclosure, including in part, requires the express written consent of Marcel Spahr.',
        ],
      },
      {
        heading: 'Disclaimer',
        content: [
          'All information on this website has been carefully reviewed. However, Marcel Spahr assumes no liability for the timeliness, accuracy, or completeness of the information provided. Liability claims for material or immaterial damages caused by the use of this website are excluded unless wilful intent or gross negligence can be proven.',
        ],
      },
      {
        heading: 'External Links',
        content: [
          'This website may contain links to external websites. Marcel Spahr has no influence over their content and accepts no liability for it. The respective operators are solely responsible for the content of linked pages.',
        ],
      },
    ],
  },
};

export default function ImpressumPage() {
  const { lang, setLang } = useLanguage();
  const c = C[lang];

  useEffect(() => {
    document.title = `${c.title} | Digitalstudio Marcel Spahr`;
  }, [c.title]);

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2d2820] bg-[#0c0a06]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm text-[#a89880] hover:text-[#f4edd8] transition-colors">
            {c.back}
          </Link>
          <div className="flex items-center gap-1 rounded-lg border border-[#2d2820] overflow-hidden">
            <button
              onClick={() => setLang('de')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'de' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}
            >DE</button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#c9a84c] text-[#0c0a06]' : 'text-[#a89880] hover:text-[#f4edd8]'}`}
            >EN</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#f4edd8] mb-2">{c.title}</h1>
          <p className="text-[#7a6d5a] text-sm">{c.subtitle}</p>
        </div>

        <div className="space-y-8">
          {c.sections.map((section) => (
            <section key={section.heading} className="border-t border-[#2d2820] pt-8">
              <h2 className="text-base font-semibold text-[#c9a84c] mb-3">{section.heading}</h2>
              <div className="space-y-1">
                {section.content.map((line, i) => (
                  <p key={i} className="text-[#d4c4a8] text-sm leading-relaxed">{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer link */}
        <div className="mt-16 pt-8 border-t border-[#2d2820] flex flex-wrap gap-4 text-xs text-[#7a6d5a]">
          <Link href="/" className="hover:text-[#c9a84c] transition-colors">marcelspahr.ch</Link>
          <Link href="/datenschutz" className="hover:text-[#c9a84c] transition-colors">
            {lang === 'de' ? 'Datenschutz' : 'Privacy Policy'}
          </Link>
        </div>
      </main>
    </div>
  );
}
