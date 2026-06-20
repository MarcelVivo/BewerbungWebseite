import { Playfair_Display } from 'next/font/google';
import type { Metadata } from 'next';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'KI-Readiness Check – Wie KI-ready ist Ihr Unternehmen?',
  description: '10 Fragen, 3 Minuten – Ihr persönlicher KI-Fahrplan von Marcel Spahr, KI-Berater in Bern, Schweiz.',
  robots: { index: false, follow: false },
};

export default function KiCheckLayout({ children }: { children: React.ReactNode }) {
  return <div className={playfair.variable}>{children}</div>;
}
