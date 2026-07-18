'use client';

export const dynamic = 'force-static';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLanguage } from '../LanguageContext';

type Section = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

const C: Record<'de' | 'en', { title: string; subtitle: string; back: string; updated: string; sections: Section[] }> = {
  de: {
    title: 'Datenschutzerklärung',
    subtitle: 'Gemäss Schweizer Bundesgesetz über den Datenschutz (nDSG)',
    back: '← Zurück zur Startseite',
    updated: 'Stand: Januar 2025',
    sections: [
      {
        heading: '1. Verantwortlicher',
        paragraphs: [
          'Verantwortlich für die Erhebung, Verarbeitung und Nutzung Ihrer persönlichen Daten im Sinne des nDSG ist:',
          'Marcel Spahr · Schwarzenburgstrasse 65 · 3008 Bern · Schweiz · kontakt@marcelspahr.ch',
        ],
      },
      {
        heading: '2. Grundsatz',
        paragraphs: [
          'Ich erhebe und verarbeite nur jene personenbezogenen Daten, die für die Erbringung meiner Dienstleistungen und den Betrieb dieser Website notwendig sind. Eine Weitergabe an Dritte erfolgt ausschliesslich in dem Umfang, der für den Betrieb der Website technisch erforderlich ist (Hosting, E-Mail-Versand).',
        ],
      },
      {
        heading: '3. Erhobene Daten',
        paragraphs: ['Folgende Daten werden auf dieser Website verarbeitet:'],
      },
      {
        heading: '3.1 Kontaktformular',
        paragraphs: [
          'Wenn Sie das Kontaktformular nutzen, werden folgende Daten erhoben: Name, E-Mail-Adresse und Nachrichteninhalt. Diese werden ausschliesslich zur Bearbeitung Ihrer Anfrage verwendet und danach gelöscht.',
          'Zur technischen Abwicklung werden folgende Auftragsverarbeiter eingesetzt:',
        ],
        list: [
          'Supabase Inc. (San Francisco, USA) – Datenbankablage; Rechenzentrum Frankfurt/EU; Datenübertragung auf Basis von EU-Standardvertragsklauseln (SCCs)',
          'Resend Inc. (San Francisco, USA) – E-Mail-Versand; Datenübertragung auf Basis von SCCs',
        ],
      },
      {
        heading: '3.2 Server-Logs',
        paragraphs: [
          'Beim Aufruf dieser Website erfasst der Hosting-Anbieter Vercel Inc. (340 Pine Street, Suite 701, San Francisco, CA 94104, USA) automatisch technische Zugriffsdaten: IP-Adresse, Browser-Typ, Betriebssystem, Referrer-URL sowie Datum und Uhrzeit des Zugriffs.',
          'Diese Daten werden ausschliesslich für den sicheren und stabilen Betrieb der Website verwendet und nach spätestens 30 Tagen gelöscht. Rechtsgrundlage: berechtigtes Interesse (Art. 6 nDSG).',
        ],
      },
      {
        heading: '3.3 Spracheinstellung (localStorage)',
        paragraphs: [
          'Ihre gewählte Sprache (Deutsch/Englisch) wird im localStorage Ihres Browsers gespeichert. Diese Information verlässt Ihren Browser nicht und wird nicht an externe Server übertragen. Es handelt sich ausdrücklich nicht um ein Cookie.',
        ],
      },
      {
        heading: '3.4 Cookies',
        paragraphs: [
          'Diese Website setzt ausschliesslich technisch notwendige Cookies ein:',
        ],
        list: [
          'ms-session: Session-Cookie für den geschützten Recruiter-Bereich (nur für autorisierte Nutzer). Wird bei der Abmeldung oder nach Ablauf der Sitzung automatisch gelöscht.',
        ],
      },
      {
        heading: '4. Keine Tracking-Tools',
        paragraphs: [
          'Diese Website verwendet keine Tracking-Cookies, kein Google Analytics, keinen Meta Pixel und keine sonstigen Marketing- oder Analyse-Tools. Ein Cookie-Banner ist daher nicht erforderlich.',
          'Google Fonts werden von Next.js lokal auf dem Webserver bereitgestellt – es erfolgt keine Verbindung zu Google-Servern.',
        ],
      },
      {
        heading: '5. Hosting',
        paragraphs: [
          'Diese Website wird über Vercel Inc. (San Francisco, USA) gehostet. Vercel verarbeitet Daten im Rahmen des Hostingbetriebs auf Grundlage eines Data Processing Agreements (DPA). Die Datenübertragung in die USA erfolgt auf Basis von EU-Standardvertragsklauseln.',
        ],
      },
      {
        heading: '6. Ihre Rechte',
        paragraphs: ['Sie haben jederzeit das Recht auf:'],
        list: [
          'Auskunft über die zu Ihrer Person gespeicherten Daten',
          'Berichtigung unrichtiger Daten',
          'Löschung Ihrer Daten (soweit keine gesetzliche Aufbewahrungspflicht besteht)',
          'Einschränkung der Verarbeitung',
          'Datenübertragbarkeit',
          'Widerspruch gegen die Verarbeitung',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'Zur Ausübung dieser Rechte wenden Sie sich per E-Mail an: kontakt@marcelspahr.ch',
        ],
      },
      {
        heading: '7. Beschwerderecht',
        paragraphs: [
          'Sie haben das Recht, sich beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) zu beschweren:',
          'EDÖB · Feldeggweg 1 · 3003 Bern · www.edoeb.admin.ch',
        ],
      },
      {
        heading: '8. Änderungen',
        paragraphs: [
          'Diese Datenschutzerklärung kann bei Bedarf angepasst werden. Die jeweils aktuelle Version ist auf dieser Seite abrufbar.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'In accordance with the Swiss Federal Act on Data Protection (nDSG)',
    back: '← Back to homepage',
    updated: 'Last updated: January 2025',
    sections: [
      {
        heading: '1. Controller',
        paragraphs: [
          'The person responsible for the collection, processing and use of your personal data within the meaning of the nDSG is:',
          'Marcel Spahr · Schwarzenburgstrasse 65 · 3008 Bern · Switzerland · kontakt@marcelspahr.ch',
        ],
      },
      {
        heading: '2. Principle',
        paragraphs: [
          'I only collect and process personal data that is necessary for the provision of my services and the operation of this website. Data is only shared with third parties to the extent technically required for operating the website (hosting, email delivery).',
        ],
      },
      {
        heading: '3. Data Collected',
        paragraphs: ['The following data is processed on this website:'],
      },
      {
        heading: '3.1 Contact Form',
        paragraphs: [
          'When you use the contact form, the following data is collected: name, email address, and message content. This data is used solely to process your enquiry and is deleted afterwards.',
          'The following processors handle the technical transmission:',
        ],
        list: [
          'Supabase Inc. (San Francisco, USA) – database storage; data centre in Frankfurt/EU; data transfer based on EU Standard Contractual Clauses (SCCs)',
          'Resend Inc. (San Francisco, USA) – email delivery; data transfer based on SCCs',
        ],
      },
      {
        heading: '3.2 Server Logs',
        paragraphs: [
          'When you visit this website, the hosting provider Vercel Inc. (340 Pine Street, Suite 701, San Francisco, CA 94104, USA) automatically records technical access data: IP address, browser type, operating system, referrer URL, and date and time of access.',
          'This data is used solely to ensure secure and stable operation of the website and is deleted after a maximum of 30 days. Legal basis: legitimate interest (Art. 6 nDSG).',
        ],
      },
      {
        heading: '3.3 Language Preference (localStorage)',
        paragraphs: [
          'Your selected language (German/English) is stored in your browser\'s localStorage. This information never leaves your browser and is not transmitted to external servers. This is explicitly not a cookie.',
        ],
      },
      {
        heading: '3.4 Cookies',
        paragraphs: [
          'This website uses only technically necessary cookies:',
        ],
        list: [
          'ms-session: Session cookie for the protected recruiter area (authorised users only). Automatically deleted upon logout or session expiry.',
        ],
      },
      {
        heading: '4. No Tracking Tools',
        paragraphs: [
          'This website does not use tracking cookies, Google Analytics, Meta Pixel, or any other marketing or analytics tools. A cookie banner is therefore not required.',
          'Google Fonts are served locally by Next.js from the web server — no connection to Google servers is made.',
        ],
      },
      {
        heading: '5. Hosting',
        paragraphs: [
          'This website is hosted by Vercel Inc. (San Francisco, USA). Vercel processes data as part of its hosting operations under a Data Processing Agreement (DPA). Data transfer to the USA is based on EU Standard Contractual Clauses.',
        ],
      },
      {
        heading: '6. Your Rights',
        paragraphs: ['You have the right at any time to:'],
        list: [
          'Request information about the personal data stored about you',
          'Request correction of inaccurate data',
          'Request deletion of your data (where no legal retention obligation applies)',
          'Request restriction of processing',
          'Data portability',
          'Object to processing',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'To exercise these rights, please contact: kontakt@marcelspahr.ch',
        ],
      },
      {
        heading: '7. Right to Complain',
        paragraphs: [
          'You have the right to lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (FDPIC):',
          'FDPIC · Feldeggweg 1 · 3003 Bern · www.edoeb.admin.ch',
        ],
      },
      {
        heading: '8. Changes',
        paragraphs: [
          'This privacy policy may be updated as needed. The current version is always available on this page.',
        ],
      },
    ],
  },
};

export default function DatenschutzPage() {
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
          {c.sections.map((section, idx) => (
            <section key={idx} className={section.heading ? 'border-t border-[#2d2820] pt-8' : 'pt-0'}>
              {section.heading && (
                <h2 className="text-base font-semibold text-[#c9a84c] mb-3">{section.heading}</h2>
              )}
              <div className="space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-[#d4c4a8] text-sm leading-relaxed">{p}</p>
                ))}
                {section.list && (
                  <ul className="mt-2 space-y-1.5 pl-4 border-l border-[#2d2820]">
                    {section.list.map((item, i) => (
                      <li key={i} className="text-[#a89880] text-sm leading-relaxed">{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Updated date */}
        <p className="mt-12 text-xs text-[#7a6d5a]">{c.updated}</p>

        {/* Footer links */}
        <div className="mt-8 pt-8 border-t border-[#2d2820] flex flex-wrap gap-4 text-xs text-[#7a6d5a]">
          <Link href="/" className="hover:text-[#c9a84c] transition-colors">marcelspahr.ch</Link>
          <Link href="/impressum" className="hover:text-[#c9a84c] transition-colors">
            {lang === 'de' ? 'Impressum' : 'Legal Notice'}
          </Link>
        </div>
      </main>
    </div>
  );
}
