'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, GitBranch, Users, Megaphone,
  FolderKanban, Timer, Receipt, FileText, Calendar,
  Bot, FolderOpen, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Briefcase,
  Search, Command, MessageSquare, ClipboardList, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

type NavItem  = { label: string; href: string; icon: React.ElementType; badgeKey?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'ÜBERSICHT',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'AILA', href: '/dashboard/aila', icon: Sparkles },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { label: 'Pipeline',  href: '/dashboard/pipeline',  icon: GitBranch },
      { label: 'Kunden',    href: '/dashboard/kunden',    icon: Users },
      { label: 'Outreach',  href: '/dashboard/outreach',  icon: Megaphone },
      { label: 'Kontakt',   href: '/dashboard/kontakt',   icon: MessageSquare, badgeKey: 'kontakt' },
    ],
  },
  {
    label: 'PROJEKTE',
    items: [
      { label: 'Projekte & Tasks', href: '/dashboard/projekte',       icon: FolderKanban },
      { label: 'Zeiterfassung',    href: '/dashboard/zeiterfassung',  icon: Timer },
    ],
  },
  {
    label: 'FINANZEN',
    items: [
      { label: 'Rechnungen', href: '/dashboard/rechnungen', icon: Receipt },
      { label: 'Verträge',   href: '/dashboard/vertrage',   icon: FileText },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'RE-Interview',  href: '/dashboard/re-interview', icon: ClipboardList },
      { label: 'Kalender',      href: '/dashboard/kalender',     icon: Calendar },
      { label: 'KI-Agenten',   href: '/dashboard/ki-agenten',   icon: Bot },
      { label: 'Dokumente',     href: '/dashboard/dokumente',    icon: FolderOpen },
      { label: 'Bewerbungen',   href: '/dashboard/bewerbungen',  icon: Briefcase },
    ],
  },
  {
    label: 'KPI',
    items: [{ label: 'Statistiken', href: '/dashboard/statistiken', icon: BarChart3 }],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed]   = useState(false);
  const [badges, setBadges]         = useState<Record<string, number>>({});
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadBadges();
    // Realtime: bei neuen Kontaktanfragen Badge aktualisieren
    const channel = supabase.channel('kontakt-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kontaktanfragen' }, () => loadBadges())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadBadges() {
    const { data } = await supabase.from('kontaktanfragen').select('status').eq('status', 'neu');
    setBadges({ kontakt: data?.length ?? 0 });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/dashboard/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#1a1d27] border-r border-[#2d3144] transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* ── Logo + Collapse Button ── */}
      <div className="flex items-center h-16 px-3 border-b border-[#2d3144] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white text-xs font-bold tracking-tight">MS</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate leading-tight">Command Center</div>
              <div className="text-[10px] text-slate-400 truncate">Marcel Spahr</div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-[#252836] transition-colors"
          title={collapsed ? 'Ausklappen' : 'Einklappen'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* ── Suchleiste ── */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-[#2d3144]">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#252836] text-slate-400 text-xs cursor-pointer hover:bg-[#2d3144] transition-colors select-none">
            <Search size={12} />
            <span className="flex-1">Suchen...</span>
            <div className="flex items-center gap-0.5 opacity-60">
              <Command size={9} /><span className="text-[10px]">K</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <div className="px-2 mb-1 mt-2 text-[9px] font-bold text-slate-600 tracking-widest uppercase select-none">
                {group.label}
              </div>
            )}
            {collapsed && <div className="my-2 border-t border-[#2d3144]" />}
            {group.items.map((item) => {
              const Icon   = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'relative flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all duration-150 group',
                    active
                      ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-[#252836]',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon
                    size={17}
                    className={cn('flex-shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-white')}
                  />
                  {!collapsed && <span className="truncate font-medium flex-1">{item.label}</span>}
                  {!collapsed && item.badgeKey && (badges[item.badgeKey] ?? 0) > 0 && (
                    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold px-1">
                      {badges[item.badgeKey]}
                    </span>
                  )}
                  {collapsed && item.badgeKey && (badges[item.badgeKey] ?? 0) > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="flex-shrink-0 border-t border-[#2d3144] p-2 space-y-1">
        <Link
          href="/dashboard/einstellungen"
          title={collapsed ? 'Einstellungen' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-[#252836] transition-colors',
            collapsed && 'justify-center px-0'
          )}
        >
          <Settings size={17} className="flex-shrink-0" />
          {!collapsed && <span className="font-medium">Einstellungen</span>}
        </Link>

        <div className="pt-2 border-t border-[#2d3144]">
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#252836] transition-colors"
              title="Abmelden"
            >
              <LogOut size={17} />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#6366f1] flex items-center justify-center flex-shrink-0 shadow shadow-indigo-500/30">
                <span className="text-white text-[10px] font-bold">MS</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white font-semibold truncate">Marcel Spahr</div>
                <div className="text-[10px] text-slate-500 truncate">kontakt@marcelspahr.ch</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex-shrink-0 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-[#252836] transition-colors"
                title="Abmelden"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
