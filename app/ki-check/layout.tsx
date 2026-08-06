import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KI Check. Wie setzt Ihr Unternehmen KI heute ein?',
  description: 'Beantworten Sie zehn Fragen in drei Minuten. Marcel Spahr prüft Ihre Angaben persönlich und sendet Ihnen eine konkrete Einschätzung.',
  robots: { index: false, follow: false },
};

export default function KiCheckLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
