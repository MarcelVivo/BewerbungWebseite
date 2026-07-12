import './globals.css';
import { Inter } from 'next/font/google';
import { LanguageProvider } from './LanguageContext';
import CustomCursor from './CustomCursor';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata = {
  title: {
    default: 'Marcel Spahr – Weblösungen, CRM & ERP für KMU',
    template: '%s | Marcel Spahr',
  },
  description: 'Marcel Spahr baut massgeschneiderte Weblösungen für KMU und Unternehmen: Corporate Design, moderne 2D/3D-Websites, CRM, ERP, Datenbanken, KI-Automation und Automatisierung aus einer Hand.',
  keywords: [
    'Weblösungen KMU Schweiz',
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
    'Massgeschneiderte Website',
    'Wirtschaftsinformatiker Bern',
    'Marcel Spahr',
  ],
  authors: [{ name: 'Marcel Spahr', url: 'https://www.marcelspahr.ch' }],
  creator: 'Marcel Spahr',
  metadataBase: new URL('https://www.marcelspahr.ch'),
  openGraph: {
    title: 'Marcel Spahr – Weblösungen, CRM & ERP für KMU',
    description: 'Massgeschneiderte Weblösungen aus einer Hand: Corporate Design, moderne Websites, CRM, ERP, Datenbanken, KI-Automation und Automatisierung.',
    url: 'https://www.marcelspahr.ch',
    siteName: 'Marcel Spahr',
    locale: 'de_CH',
    type: 'website',
    images: [{ url: 'https://www.marcelspahr.ch/assets/portrait.jpg', width: 400, height: 400, alt: 'Marcel Spahr – Weblösungen für KMU und Unternehmen' }],
  },
  twitter: {
    card: 'summary',
    title: 'Marcel Spahr – Weblösungen, CRM & ERP für KMU',
    description: 'Massgeschneiderte Weblösungen für KMU und Unternehmen. Bern, Schweiz.',
    images: ['https://www.marcelspahr.ch/assets/portrait.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  alternates: { canonical: 'https://www.marcelspahr.ch' },
  category: 'business',
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Marcel Spahr',
    url: 'https://www.marcelspahr.ch',
    image: 'https://www.marcelspahr.ch/assets/portrait.jpg',
    jobTitle: 'Weblösungen, CRM & ERP | Wirtschaftsinformatiker',
    description: 'Wirtschaftsinformatiker mit 15 Jahren Erfahrung in digitalen Systemen. Spezialisiert auf massgeschneiderte Weblösungen, CRM, ERP, Datenbanken, KI-Automation und Automatisierung für KMU.',
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
      { '@type': 'EducationalOccupationalCredential', name: 'HF Wirtschaftsinformatik', credentialCategory: 'degree' },
      { '@type': 'EducationalOccupationalCredential', name: 'SAFe Agile Framework', credentialCategory: 'certification' },
      { '@type': 'EducationalOccupationalCredential', name: 'Scrum Zertifizierung', credentialCategory: 'certification' },
      { '@type': 'EducationalOccupationalCredential', name: 'EFZ Werbetechniker', credentialCategory: 'degree' },
      { '@type': 'EducationalOccupationalCredential', name: 'EFZ Maler', credentialCategory: 'degree' },
    ],
    worksFor: { '@type': 'Organization', name: 'Marcel Spahr – Weblösungen' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Marcel Spahr – Weblösungen, CRM & ERP',
    url: 'https://www.marcelspahr.ch',
    image: 'https://www.marcelspahr.ch/assets/portrait.jpg',
    description: 'Massgeschneiderte Weblösungen für KMU und Unternehmen: Corporate Design, moderne Websites, CRM, ERP, Datenbanken, KI-Automation und Automatisierung aus einer Hand.',
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
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
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
];

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="text-[#f4edd8]">
        <CustomCursor />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
