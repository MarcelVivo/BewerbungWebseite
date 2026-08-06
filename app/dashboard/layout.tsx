import type { Metadata } from 'next';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar  from '@/components/dashboard/TopBar';

export const metadata: Metadata = {
  title:       'Command Center. Marcel Spahr.',
  description: 'Privates Command Center für Marcel Spahr',
  robots:      'noindex, nofollow',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-100 overflow-hidden">
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
