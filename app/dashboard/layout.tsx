import type { Metadata } from 'next';
import { Chakra_Petch } from 'next/font/google';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar  from '@/components/dashboard/TopBar';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--font-dashboard-display',
});

export const metadata: Metadata = {
  title:       'Command Center. Marcel Spahr.',
  description: 'Privates Command Center für Marcel Spahr',
  robots:      'noindex, nofollow',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${chakraPetch.variable} flex h-screen bg-dash-bg text-dash-textSubtle overflow-hidden`}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
