import './globals.css';

export const metadata = {
  title: 'Marcel Spahr – KI-Berater & Wirtschaftsinformatiker',
  description: 'Marcel Spahr – Wirtschaftsinformatiker & KI-Berater für Schweizer KMU. Prozessautomatisierung, KI-Agenten, Digital Marketing und Business Analyse. Bern, Schweiz.',
  keywords: 'KI-Berater, Wirtschaftsinformatiker, KI-Agenten, Automatisierung, Prozessoptimierung, Digital Marketing, Bern, Schweiz, KMU',
  authors: [{ name: 'Marcel Spahr', url: 'https://www.marcelspahr.ch' }],
  openGraph: {
    title: 'Marcel Spahr – KI-Berater & Wirtschaftsinformatiker',
    description: 'Wirtschaftsinformatiker & KI-Berater für Schweizer KMU – Automatisierung, Prozessoptimierung und KI-Agenten.',
    url: 'https://www.marcelspahr.ch',
    siteName: 'Marcel Spahr',
    locale: 'de_CH',
    type: 'website',
    images: [{ url: 'https://www.marcelspahr.ch/assets/portrait.jpg', width: 400, height: 400, alt: 'Marcel Spahr' }],
  },
  twitter: {
    card: 'summary',
    title: 'Marcel Spahr – KI-Berater & Wirtschaftsinformatiker',
    description: 'Wirtschaftsinformatiker & KI-Berater für Schweizer KMU.',
    images: ['https://www.marcelspahr.ch/assets/portrait.jpg'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.marcelspahr.ch' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/app.css?v=6" />
      </head>
      <body className="bg-ms-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
