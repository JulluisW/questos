'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flag, Kanban, LayoutDashboard, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Flag },
  { href: '/board', label: 'Quest Board', icon: Kanban },
  { href: '/team', label: 'Guild & Team', icon: Users },
  { href: '/records', label: 'Hall of Records', icon: Trophy },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="space-y-1.5 font-sans">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded px-3 py-2 text-xs font-medium transition-colors',
              active
                ? 'border border-amber-800/40 bg-[#2b1b14] text-amber-200'
                : 'border border-transparent text-stone-400 hover:bg-[#281a13] hover:text-stone-200'
            )}
          >
            <Icon className={cn('h-4 w-4', active && 'text-amber-500')} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Compact horizontal nav for small screens (the sidebar is hidden there). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-semibold',
              active ? 'bg-[#3d271d] text-amber-100' : 'text-stone-600 hover:bg-[#f2ebdf]'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className={cn(!active && 'sr-only sm:not-sr-only')}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const TITLES: Array<[string, string]> = [
  ['/dashboard', 'Command Center'],
  ['/campaigns', 'Campaigns'],
  ['/board', 'Quest Board'],
  ['/team', 'Guild & Team'],
  ['/records', 'Hall of Records'],
  ['/join', 'Guild Invitation'],
];

export function PageTitle() {
  const pathname = usePathname();
  const title = TITLES.find(([prefix]) => isActive(pathname, prefix))?.[1] ?? 'QuestOS';
  return (
    <div className="font-sans text-xs tracking-wide text-stone-500">
      QuestOS <span className="mx-1.5 text-stone-300">/</span>
      <span className="font-medium text-stone-800">{title}</span>
    </div>
  );
}
