import './globals.css';
import { LanguageProvider } from './LanguageContext';
import CustomCursor from './CustomCursor';
import WebsiteAnalytics from './WebsiteAnalytics';
import AuthRecoveryRedirect from './AuthRecoveryRedirect';
import PwaRuntime from '../components/pwa/PwaRuntime';

export const metadata = {
  title: {
    default: 'Marcel Spahr · Digitale Unternehmenssysteme aus einer Hand',
    template: '%s | Marcel Spahr',
  },
  description: 'Ich verbinde Website, Marketing, CRM, ERP, Daten, AI und Automationen zu individuellen digitalen Unternehmenssystemen für Schweizer KMU und Start-ups.',
  keywords: [
    'Weblösungen KMU Schweiz',
    'Digitale Unternehmenssysteme Schweiz',
    'Webagentur Bern',
    'Corporate Design KMU',
    '3D Website Schweiz',
    'CRM Lösung KMU',
    'ERP Lösung KMU',
    'KI Automation KMU',
    'KI Unterstützung Unternehmen',
    'KI Agenten Schweiz',
    'Datenbank Entwicklung Schweiz',
    'Automatisierung KMU',
    'SEO GEO Schweiz',
    'SaaS Entwicklung Schweiz',
    'Marketing Automation Schweiz',
    'Individuelle Website',
    'Wirtschaftsinformatiker Bern',
    'Marcel Spahr',
  ],
  authors: [{ name: 'Marcel Spahr', url: 'https://www.marcelspahr.ch' }],
  creator: 'Marcel Spahr',
  metadataBase: new URL('https://www.marcelspahr.ch'),
  openGraph: {
    title: 'Dein digitales Unternehmen. Aus einem Guss.',
    description: 'Website, Marketing, Daten, CRM, ERP, AI und Automationen – individuell zu einem System verbunden.',
    url: 'https://www.marcelspahr.ch',
    siteName: 'Marcel Spahr',
    locale: 'de_CH',
    type: 'website',
    images: [{ url: 'https://www.marcelspahr.ch/assets/portrait.jpg', width: 400, height: 400, alt: 'Marcel Spahr. Digitale Unternehmenssysteme für Schweizer KMU.' }],
  },
  twitter: {
    card: 'summary',
    title: 'Marcel Spahr · Digitale Unternehmenssysteme',
    description: 'Website, Marketing, Software, Daten und Automationen als ein verbundenes System.',
    images: ['https://www.marcelspahr.ch/assets/portrait.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  alternates: { canonical: 'https://www.marcelspahr.ch' },
  category: 'business',
  applicationName: 'Marcel Spahr',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Marcel Spahr',
  },
  icons: {
    icon: [
      { url: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/pwa/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020303',
  colorScheme: 'dark',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
  {
    '@type': 'Person',
    name: 'Marcel Spahr',
    url: 'https://www.marcelspahr.ch',
    image: 'https://www.marcelspahr.ch/assets/portrait.jpg',
    jobTitle: 'Digital Systems Designer und Wirtschaftsinformatiker',
    description: 'Marcel Spahr entwickelt individuelle digitale Unternehmenssysteme aus Website, Marketing, CRM, ERP, Daten und Automationen für KMU.',
    telephone: '+41795110911',
    email: 'kontakt@marcelspahr.ch',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bern',
      addressRegion: 'BE',
      addressCountry: 'CH',
    },
    sameAs: ['https://www.linkedin.com/in/marcel-spahr-901568304'],
    knowsAbout: [
      'Webentwicklung', 'Corporate Design', '3D Websites',
      'CRM', 'ERP', 'Datenbanken', 'KI-Automation', 'KI-Agenten', 'Automatisierung',
      'Business Analyse', 'Wirtschaftsinformatik', 'Projektmanagement',
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', name: 'Wirtschaftsinformatik HF in der Abschlussphase', credentialCategory: 'education' },
      { '@type': 'EducationalOccupationalCredential', name: 'SAFe Agile Framework', credentialCategory: 'certification' },
      { '@type': 'EducationalOccupationalCredential', name: 'Scrum Zertifizierung', credentialCategory: 'certification' },
      { '@type': 'EducationalOccupationalCredential', name: 'EFZ Werbetechniker', credentialCategory: 'degree' },
      { '@type': 'EducationalOccupationalCredential', name: 'EFZ Maler', credentialCategory: 'degree' },
    ],
    worksFor: { '@type': 'Organization', name: 'Digitalstudio Marcel Spahr' },
  },
  {
    '@type': 'ProfessionalService',
    name: 'Marcel Spahr. Digitale Unternehmenssysteme.',
    url: 'https://www.marcelspahr.ch',
    image: 'https://www.marcelspahr.ch/assets/portrait.jpg',
    description: 'Individuelle digitale Unternehmenssysteme aus Website, Marketing, CRM, ERP, Daten, AI und Automationen für Schweizer KMU und Start-ups.',
    telephone: '+41795110911',
    email: 'kontakt@marcelspahr.ch',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bern',
      addressRegion: 'BE',
      postalCode: '3000',
      addressCountry: 'CH',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 46.9480, longitude: 7.4474 },
    areaServed: { '@type': 'Country', name: 'Schweiz' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Weblösungen, CRM, ERP, KI-Automation und Automatisierung',
      itemListElement: [
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Corporate Design & Markenauftritt', url: 'https://www.marcelspahr.ch/leistungen/corporate-design' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Moderne 2D- & 3D-Websites', url: 'https://www.marcelspahr.ch/leistungen/2d-3d-websites' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'CRM-Lösungen', url: 'https://www.marcelspahr.ch/leistungen/crm-loesungen' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'ERP- & Geschäftsprozesse', url: 'https://www.marcelspahr.ch/leistungen/erp-prozesse' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Datenbanken & Schnittstellen', url: 'https://www.marcelspahr.ch/leistungen/datenbanken-schnittstellen' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'KI-Automation & KI-Unterstützung', url: 'https://www.marcelspahr.ch/leistungen/automatisierung-ki-agenten' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Analyse & Konzept', url: 'https://www.marcelspahr.ch/leistungen/analyse-konzept' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Umsetzung bis Go-Live', url: 'https://www.marcelspahr.ch/leistungen/go-live-umsetzung' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Wartung & Weiterentwicklung', url: 'https://www.marcelspahr.ch/leistungen/wartung-weiterentwicklung' } },
      ],
    },
  },
  {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Was baut marcelspahr.ch?',
        acceptedAnswer: { '@type': 'Answer', text: 'Marcel Spahr entwickelt individuelle digitale Unternehmenssysteme aus Website, Marketing, Software, Daten und Automationen.' },
      },
      {
        '@type': 'Question',
        name: 'Für wen sind die Lösungen gedacht?',
        acceptedAnswer: { '@type': 'Answer', text: 'Für Schweizer KMU und Start-ups, die digitale Werkzeuge und Prozesse zu einem verlässlichen System verbinden wollen.' },
      },
      {
        '@type': 'Question',
        name: 'Wie beginnt ein Projekt?',
        acceptedAnswer: { '@type': 'Answer', text: 'Mit einer Analyse von Unternehmen, Zielen, Mitarbeitenden, Engpässen, Daten und bestehenden Systemen. Danach wird nur gebaut, was tatsächlich benötigt wird.' },
      },
      {
        '@type': 'Question',
        name: 'Welche Leistungen bietet Marcel Spahr an?',
        acceptedAnswer: { '@type': 'Answer', text: 'Corporate Design und Markenauftritt, moderne 2D- und 3D-Websites, CRM-Lösungen, ERP und Geschäftsprozesse, Datenbanken und Schnittstellen, KI-Automation und KI-Unterstützung, Analyse und Konzept sowie Umsetzung, Wartung und Weiterentwicklung – einzeln oder als verbundenes System.' },
      },
      {
        '@type': 'Question',
        name: 'Gibt es eine kostenlose erste Einschätzung?',
        acceptedAnswer: { '@type': 'Answer', text: 'Ja. Der KI-Check ist ein kostenloser, unverbindlicher Kurz-Check zur KI-Bereitschaft eines Unternehmens. Er dauert rund drei Minuten und liefert eine persönliche Einschätzung von Marcel Spahr per E-Mail, ohne Verkaufsgespräch.' },
      },
      {
        '@type': 'Question',
        name: 'In welcher Region ist Marcel Spahr tätig?',
        acceptedAnswer: { '@type': 'Answer', text: 'Marcel Spahr ist in Bern ansässig und betreut Unternehmen in der ganzen Schweiz, wahlweise vor Ort, hybrid oder vollständig remote.' },
      },
    ],
  },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="text-[#f4edd8]">
        <CustomCursor />
        <LanguageProvider>
          <WebsiteAnalytics />
          <AuthRecoveryRedirect />
          <PwaRuntime />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
