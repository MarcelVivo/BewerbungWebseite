import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KI-Readiness Check – Wie KI-ready ist Ihr Unternehmen?',
  description: '10 Fragen, 3 Minuten – Ihr persönlicher KI-Fahrplan von Marcel Spahr, KI-Berater in Bern, Schweiz.',
  robots: { index: false, follow: false },
};

export default function KiCheckLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
