import './globals.css';
import { Inter } from 'next/font/google';
import { LanguageProvider } from './LanguageContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata = {
  title: {
    default: 'Marcel Spahr – KI & Digitalisierungsberater Schweiz',
    template: '%s | Marcel Spahr',
  },
  description: 'Marcel Spahr – KI & Digitalisierungsberater für Schweizer KMU. KI-Agenten, Prozessautomatisierung, Business Analyse und Digital Marketing. Bern, Schweiz.',
  keywords: [
    'KI-Unternehmensberater Schweiz',
    'kreativer KI-Unternehmensberater',
    'KI-Berater KMU',
    'KI Beratung Schweiz',
    'Wirtschaftsinformatiker Bern',
    'KI-Agenten Automatisierung',
    'Prozessoptimierung BPMN',
    'Digitalisierung KMU Schweiz',
    'Business Analyse Requirements',
    'Digital Marketing Schweiz',
    'Marcel Spahr',
  ],
  authors: [{ name: 'Marcel Spahr', url: 'https://www.marcelspahr.ch' }],
  creator: 'Marcel Spahr',
  metadataBase: new URL('https://www.marcelspahr.ch'),
  openGraph: {
    title: 'Marcel Spahr – KI & Digitalisierungsberater Schweiz',
    description: 'KI & Digitalisierungsberater für Schweizer KMU – KI-Agenten, Automatisierung, Prozessoptimierung und Digital Marketing. Bern, Schweiz.',
    url: 'https://www.marcelspahr.ch',
    siteName: 'Marcel Spahr',
    locale: 'de_CH',
    type: 'website',
    images: [{ url: 'https://www.marcelspahr.ch/assets/portrait.jpg', width: 400, height: 400, alt: 'Marcel Spahr – KI-Unternehmensberater Schweiz' }],
  },
  twitter: {
    card: 'summary',
    title: 'Marcel Spahr – KI & Digitalisierungsberater Schweiz',
    description: 'KI & Digitalisierungsberater für Schweizer KMU. Bern, Schweiz.',
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
    jobTitle: 'KI & Digitalisierungsberater | Wirtschaftsinformatiker',
    description: 'KI & Digitalisierungsberater mit 15 Jahren Erfahrung bei Swisscom. Spezialisiert auf KI-Agenten, Prozessautomatisierung und Digitalisierung für Schweizer KMU.',
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
      'Künstliche Intelligenz', 'KI-Agenten', 'Prozessautomatisierung',
      'Business Analyse', 'Wirtschaftsinformatik', 'Digital Marketing',
      'Projektmanagement', 'BPMN', 'Scrum', 'SAFe', 'Digitalisierung',
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', name: 'HF Wirtschaftsinformatik', credentialCategory: 'degree' },
      { '@type': 'EducationalOccupationalCredential', name: 'SAFe Agile Framework', credentialCategory: 'certification' },
      { '@type': 'EducationalOccupationalCredential', name: 'Scrum Zertifizierung', credentialCategory: 'certification' },
      { '@type': 'EducationalOccupationalCredential', name: 'EFZ Werbetechniker', credentialCategory: 'degree' },
      { '@type': 'EducationalOccupationalCredential', name: 'EFZ Maler', credentialCategory: 'degree' },
    ],
    worksFor: { '@type': 'Organization', name: 'Marcel Spahr – KI-Unternehmensberatung' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Marcel Spahr – KI & Digitalisierungsberater',
    url: 'https://www.marcelspahr.ch',
    image: 'https://www.marcelspahr.ch/assets/portrait.jpg',
    description: 'KI & Digitalisierungsberater für Schweizer KMU. KI-Agenten, Prozessautomatisierung, Business Analyse, Digital Marketing und Website-Optimierung.',
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
      name: 'KI-Beratung & Digitalisierungsleistungen',
      itemListElement: [
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'KI-Agenten & Automatisierung', url: 'https://www.marcelspahr.ch/leistungen/ki-agenten' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Business Analyse & Requirements', url: 'https://www.marcelspahr.ch/leistungen/business-analyse' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Prozessoptimierung BPMN', url: 'https://www.marcelspahr.ch/leistungen/prozessoptimierung' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Digital Marketing & Social Media', url: 'https://www.marcelspahr.ch/leistungen/digital-marketing' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Projektmanagement', url: 'https://www.marcelspahr.ch/leistungen/projektmanagement' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Workshops & Schulungen', url: 'https://www.marcelspahr.ch/leistungen/workshops' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Website-Optimierung', url: 'https://www.marcelspahr.ch/leistungen/website-optimierung' } },
        { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'KI-Beratung für KMU', url: 'https://www.marcelspahr.ch/leistungen/ki-beratung-kmu' } },
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
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
