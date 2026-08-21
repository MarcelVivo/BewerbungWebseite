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
    updated: 'Stand: August 2026',
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
          'Ich erhebe und verarbeite nur jene personenbezogenen Daten, die für die Erbringung meiner Dienstleistungen und den Betrieb dieser Website notwendig sind. Eine Weitergabe an Dritte erfolgt ausschliesslich in dem Umfang, der für den Betrieb der Website technisch erforderlich ist (Hosting, E-Mail-Versand, KI-Dialog).',
        ],
      },
      {
        heading: '3. Erhobene Daten',
        paragraphs: ['Folgende Daten werden auf dieser Website verarbeitet:'],
      },
      {
        heading: '3.1 Kontaktformular',
        paragraphs: [
          'Wenn Sie die Beratungsanfrage, Projektanfrage oder den KI-Check nutzen, werden die von Ihnen eingegebenen Kontakt-, Projekt- und Unternehmensangaben erhoben. Diese werden ausschliesslich zur Bearbeitung Ihrer Anfrage beziehungsweise zur Erstellung Ihrer persönlichen Auswertung verwendet und gelöscht, sobald sie für diesen Zweck nicht mehr erforderlich sind und keine gesetzliche Aufbewahrungspflicht besteht.',
          'Erhalten Sie innerhalb weniger Tage keine persönliche Antwort, sendet das System einmalig eine automatische Erinnerungs-E-Mail zu Ihrer bestehenden Anfrage. Es handelt sich dabei nicht um Werbung, sondern um eine einmalige Nachfrage zur selben Anfrage; es findet keine fortlaufende Serie automatischer E-Mails statt.',
          'Zur technischen Abwicklung werden folgende Auftragsverarbeiter eingesetzt:',
        ],
        list: [
          'Supabase Inc. mit Sitz in San Francisco in den USA speichert die Daten in einem Rechenzentrum in Frankfurt in der EU. Eine Datenübertragung erfolgt auf Basis der EU Standardvertragsklauseln.',
          'Resend Inc. mit Sitz in San Francisco in den USA versendet E-Mails. Eine Datenübertragung erfolgt auf Basis der EU Standardvertragsklauseln.',
        ],
      },
      {
        heading: '3.2 AILA KI-Dialog und Spracherkennung',
        paragraphs: [
          'Wenn Sie AILA nutzen, werden Ihre eingegebenen Fragen und die für die Antwort erforderlichen Gesprächsteile über die OpenAI API verarbeitet. Bei aktivierter Spracheingabe wird zusätzlich die Aufnahme zur Transkription übermittelt; bei aktivierter Sprachausgabe wird der Antworttext zur Erzeugung einer synthetischen KI-Stimme verarbeitet. Bitte geben Sie keine vertraulichen oder besonders schützenswerten Personendaten ein.',
          'Damit AILA Sie beim Wechsel zwischen Seitenbereichen und nach einem Neuladen im selben Tab weiter begleiten kann, werden die letzten Gesprächsschritte vorübergehend im sessionStorage Ihres Browsers gespeichert. Diese Sitzungsdaten bleiben auf Ihrem Gerät, werden nicht in den Offline-Cache übernommen und beim Schliessen der Browser-Sitzung gelöscht. Kontaktdaten aus dem Übergabeformular werden nicht als strukturierter AILA-Sitzungskontext gespeichert.',
          'Die Verarbeitung dient ausschliesslich der Beantwortung Ihrer Frage. Die Anwendung speichert den Dialog serverseitig nicht dauerhaft und fordert bei der Textgenerierung keine dauerhafte Speicherung durch die Responses API an. OpenAI verwendet API-Ein- und Ausgaben standardmässig nicht zum Training seiner Modelle. Abhängig vom Endpunkt können Inhalte in Sicherheitsprotokollen bis zu 30 Tage aufbewahrt werden; die Audio-Transkription selbst wird laut OpenAI nicht gespeichert. Eine Verarbeitung ausserhalb der Schweiz, insbesondere in den USA, kann stattfinden.',
        ],
      },
      {
        heading: '3.3 Server-Logs',
        paragraphs: [
          'Beim Aufruf dieser Website erfasst der Hosting-Anbieter Vercel Inc. (340 Pine Street, Suite 701, San Francisco, CA 94104, USA) automatisch technische Zugriffsdaten: IP-Adresse, Browser-Typ, Betriebssystem, Referrer-URL sowie Datum und Uhrzeit des Zugriffs.',
          'Diese Daten werden ausschliesslich für den sicheren und stabilen Betrieb der Website verwendet und nach spätestens 30 Tagen gelöscht. Rechtsgrundlage: berechtigtes Interesse (Art. 6 nDSG).',
        ],
      },
      {
        heading: '3.4 Spracheinstellung (localStorage)',
        paragraphs: [
          'Ihre gewählte Sprache (Deutsch/Englisch) wird im localStorage Ihres Browsers gespeichert. Diese Information verlässt Ihren Browser nicht und wird nicht an externe Server übertragen. Es handelt sich ausdrücklich nicht um ein Cookie.',
        ],
      },
      {
        heading: '3.5 Cookies',
        paragraphs: [
          'Diese Website setzt ausschliesslich technisch notwendige Cookies ein:',
        ],
        list: [
          'ms-session: Session-Cookie für den geschützten Recruiter-Bereich (nur für autorisierte Nutzer). Wird bei der Abmeldung oder nach Ablauf der Sitzung automatisch gelöscht.',
        ],
      },
      {
        heading: '4. Cookielose Reichweiten- und Conversion-Messung',
        paragraphs: [
          'Zur Verbesserung der Website und ihrer Kontaktwege wird eine eigene, datensparsame Reichweiten- und Conversion-Messung eingesetzt. Erfasst werden Ereignisse wie Seitenaufruf, erreichte Journey-Station, Klick auf einen Handlungsaufruf, Formularstart, Formularschritt und erfolgreicher Abschluss. Zusätzlich können die Referrer-Domain sowie vom aufrufenden Link übermittelte UTM-Kampagnenparameter verarbeitet werden.',
          'Für jeden Seitenaufruf wird im Arbeitsspeicher des Browsers eine zufällige, nicht dauerhafte Kennung erzeugt. Sie wird weder in Cookies noch in localStorage oder sessionStorage gespeichert und ist nach einem Neuladen nicht wiedererkennbar. Im Analyse-Datensatz werden keine IP-Adresse, kein User-Agent, keine Formulareingaben und kein Geräte-Fingerabdruck gespeichert. Es entstehen keine dauerhaften Nutzerprofile und keine websiteübergreifende Nachverfolgung.',
          'Die Daten werden in der Supabase-Datenbank in Frankfurt/EU gespeichert, ausschliesslich intern ausgewertet und spätestens nach 180 Tagen automatisch gelöscht. Global Privacy Control und die Browser-Einstellung Do Not Track werden respektiert. Rechtsgrundlage ist das berechtigte Interesse an der verständlichen und wirksamen Gestaltung des eigenen Webangebots. Für diese Messung werden keine Tracking-Cookies gesetzt; daher wird hierfür kein Cookie-Banner eingeblendet.',
          'Diese Website verwendet kein Google Analytics, keinen Meta Pixel und keine externen Werbe- oder Profiling-Dienste.',
          'Google Fonts werden von Next.js lokal auf dem Webserver bereitgestellt. Dabei wird keine Verbindung zu Servern von Google hergestellt.',
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
    updated: 'Last updated: August 2026',
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
          'I only collect and process personal data that is necessary for the provision of my services and the operation of this website. Data is only shared with third parties to the extent technically required for operating the website (hosting, email delivery, AI dialogue).',
        ],
      },
      {
        heading: '3. Data Collected',
        paragraphs: ['The following data is processed on this website:'],
      },
      {
        heading: '3.1 Contact Form',
        paragraphs: [
          'When you use the consultation request, project inquiry or AI check, the contact, project and company information you enter is collected. It is used solely to handle your inquiry or prepare your personal assessment and is deleted once it is no longer required for that purpose, unless a statutory retention obligation applies.',
          'If you do not receive a personal reply within a few days, the system sends a single automatic reminder email about your existing inquiry. This is not advertising but a one-time follow-up on the same inquiry; there is no ongoing series of automated emails.',
          'The following processors handle the technical transmission:',
        ],
        list: [
          'Supabase Inc. is based in San Francisco in the USA and stores data in a data centre in Frankfurt in the EU. Data transfers are based on EU Standard Contractual Clauses.',
          'Resend Inc. is based in San Francisco in the USA and delivers emails. Data transfers are based on EU Standard Contractual Clauses.',
        ],
      },
      {
        heading: '3.2 AILA AI Dialogue and Voice Recognition',
        paragraphs: [
          'When you use AILA, your questions and the conversation excerpts required for an answer are processed via the OpenAI API. If voice input is enabled, the recording is also transmitted for transcription; if voice output is enabled, the response text is processed to generate a synthetic AI voice. Please do not enter confidential or particularly sensitive personal data.',
          'So AILA can continue to assist you across page sections and after a reload in the same tab, the latest conversation steps are temporarily stored in your browser\'s sessionStorage. This session data remains on your device, is not included in the offline cache, and is deleted when the browser session is closed. Contact details from the handover form are not stored as structured AILA session context.',
          'Processing is used solely to answer your question. The application does not permanently store the dialogue on the server and requests no persistent Responses API storage for text generation. OpenAI does not use API inputs and outputs to train its models by default. Depending on the endpoint, content may be retained in safety logs for up to 30 days; according to OpenAI, the audio transcription itself is not stored. Processing outside Switzerland, particularly in the USA, may occur.',
        ],
      },
      {
        heading: '3.3 Server Logs',
        paragraphs: [
          'When you visit this website, the hosting provider Vercel Inc. (340 Pine Street, Suite 701, San Francisco, CA 94104, USA) automatically records technical access data: IP address, browser type, operating system, referrer URL, and date and time of access.',
          'This data is used solely to ensure secure and stable operation of the website and is deleted after a maximum of 30 days. Legal basis: legitimate interest (Art. 6 nDSG).',
        ],
      },
      {
        heading: '3.4 Language Preference (localStorage)',
        paragraphs: [
          'Your selected language (German/English) is stored in your browser\'s localStorage. This information never leaves your browser and is not transmitted to external servers. This is explicitly not a cookie.',
        ],
      },
      {
        heading: '3.5 Cookies',
        paragraphs: [
          'This website uses only technically necessary cookies:',
        ],
        list: [
          'ms-session: Session cookie for the protected recruiter area (authorised users only). Automatically deleted upon logout or session expiry.',
        ],
      },
      {
        heading: '4. Cookieless Reach and Conversion Measurement',
        paragraphs: [
          'To improve the website and its contact paths, this website uses its own data-minimising reach and conversion measurement. Events such as page views, journey stations reached, calls-to-action clicked, form starts, form steps and successful completions are recorded. The referrer domain and UTM campaign parameters supplied by the referring link may also be processed.',
          'A random, non-persistent identifier is generated in browser memory for each page load. It is not stored in cookies, localStorage or sessionStorage and cannot be recognised after reloading. No IP address, user agent, form input or device fingerprint is stored in the analytics dataset. No persistent user profiles or cross-site tracking are created.',
          'The data is stored in the Supabase database in Frankfurt/EU, used solely for internal analysis and automatically deleted after no more than 180 days. Global Privacy Control and the browser Do Not Track setting are respected. Processing is based on the legitimate interest in making this website clear and effective. This measurement does not set tracking cookies; no cookie banner is therefore displayed for it.',
          'This website does not use Google Analytics, Meta Pixel or external advertising or profiling services.',
          'Google Fonts are served locally by Next.js from the web server. No connection to Google servers is made.',
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
