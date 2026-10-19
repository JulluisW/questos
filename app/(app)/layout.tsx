// app/(dashboard)/layout.tsx
import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Kanban,
  Flag,
  FileText,
  Users,
  BarChart3,
  Trophy,
  Search,
  Sparkles,
  Plus,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1c120c] p-0 font-sans text-neutral-100 antialiased md:p-3">
      {/* Outer RPG Bezel / Window Frame */}
      <div className="relative flex max-h-[95vh] min-h-[820px] w-full max-w-7xl overflow-hidden rounded-lg border-4 border-[#332219] bg-[#170e0a] shadow-2xl">
        {/* =========================================================================
            SIDEBAR NAVIGATION (Server Rendered)
            ========================================================================= */}
        <aside className="z-20 hidden w-64 flex-col justify-between border-r border-[#332219] bg-[#1f140f] p-5 select-none md:flex">
          <div>
            {/* Top Brand Block */}
            <div className="mb-8 flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded border border-amber-600/40 bg-[#170e0a] font-serif text-lg font-bold text-amber-500 shadow-inner">
                Q
              </div>
              <div>
                <h1 className="font-serif text-sm font-bold tracking-wider text-amber-500 uppercase">QUESTOS</h1>
                <p className="font-sans text-[10px] tracking-widest text-amber-600/80 uppercase">Acme Guild</p>
              </div>
            </div>

            {/* Navigation Links */}
            {/* Note: To make active states dynamic later, you can extract this <nav> into a <SidebarNav /> client component using usePathname() */}
            <nav className="space-y-1.5 font-sans">
              <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Command Center" href="/dashboard" />
              <SidebarItem icon={<Kanban className="h-4 w-4" />} label="Quest Board" href="/quest-board" />
              <SidebarItem icon={<Flag className="h-4 w-4" />} label="Campaigns" href="/campaigns" />
              <SidebarItem icon={<FileText className="h-4 w-4" />} label="Templates" href="/templates" />
              <SidebarItem icon={<Users className="h-4 w-4" />} label="Guild & Team" href="/team" />
              <SidebarItem icon={<BarChart3 className="h-4 w-4" />} label="Analytics" href="/analytics" />
              <SidebarItem icon={<Trophy className="h-4 w-4" />} label="Hall of Records" href="/records" />
            </nav>
          </div>

          {/* User Profile Footer Card */}
          <div className="flex items-center gap-3 border-t border-amber-900/30 px-2 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 font-serif text-xs font-bold text-stone-950 shadow">
              SL
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-serif text-xs font-bold text-amber-100">Sahbana</span>
                <span className="rounded border border-amber-800/50 bg-amber-950/80 px-1 text-[9px] text-amber-400">
                  Level 12
                </span>
              </div>
              <p className="text-[10px] tracking-wider text-stone-400 uppercase">Architect</p>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            MAIN CONTENT AREA (Right Parchment Pane)
            ========================================================================= */}
        <main className="bg-parchment relative flex flex-1 flex-col overflow-y-auto text-[#1c120c]">
          {/* Subtle Paper-Grain Background Texture Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1c120c_1px,_transparent_1px)] [background-size:16px_16px] opacity-[0.025] mix-blend-multiply" />

          {/* Top Header / Action Bar (Server Rendered Shell) */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ebdcca] bg-[#fbf8f3]/90 px-8 py-5 backdrop-blur-md">
            <div className="font-sans text-xs tracking-wide text-stone-500">
              Workspace <span className="mx-1.5 text-stone-300">/</span>{' '}
              <span className="font-medium text-stone-800">Command Center</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                aria-label="Search quests"
                className="flex h-9 w-9 items-center justify-center rounded border border-[#d8ccbc] text-stone-600 transition-colors hover:bg-[#f2ebdf]"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                aria-label="View notifications"
                className="flex h-9 w-9 items-center justify-center rounded border border-[#d8ccbc] text-stone-600 transition-colors hover:bg-[#f2ebdf]"
              >
                <Sparkles className="h-4 w-4 text-amber-700" />
              </button>
              <button className="flex items-center gap-2 rounded border border-[#52372a] bg-[#3d271d] px-4 py-2 text-xs font-bold tracking-wider text-[#fbf8f3] uppercase shadow transition-all hover:bg-[#2b1b14]">
                <Plus className="h-3.5 w-3.5" />
                New Quest
              </button>
            </div>
          </header>

          {/* =========================================================================
              DYNAMIC PAGE INJECTION
              ========================================================================= */}
          <div className="relative z-10 h-full w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Simple internal helper for the static links
function SidebarItem({ icon, label, href = '#' }: { icon: React.ReactNode; label: string; href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded px-3 py-2 text-xs font-medium text-stone-400 transition-colors hover:bg-[#281a13] hover:text-stone-200"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
