import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bewerbungsprofil · Marcel Spahr',
  description: 'Geschütztes Bewerbungsprofil von Marcel Spahr.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ExpertiseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
