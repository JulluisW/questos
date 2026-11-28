import type { Metadata } from 'next';
import { LogOut } from 'lucide-react';
import { getProfile } from '@/data/auth';
import { getManagedGuilds } from '@/data/guilds';
import { displayName, getInitials } from '@/lib/utils';
import { signOutAction } from '@/actions/auth';
import { MobileNav, PageTitle, SidebarNav } from '@/components/app-shell/nav';
import { SidebarLevel } from '@/components/app-shell/sidebar-level';

// Every signed-in page is private: keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  // Only decides whether the Approvals nav item shows; a failed read hides it.
  const managed = await getManagedGuilds(profile.id);
  const showApprovals = managed.ok && managed.data.length > 0;

  const name = displayName(profile);

  return (
    <div className="flex min-h-screen justify-center bg-[#1c120c] font-sans text-neutral-100 antialiased md:p-3">
      <div className="relative flex h-dvh w-full max-w-360 overflow-hidden bg-[#170e0a] shadow-2xl md:h-[calc(100dvh-1.5rem)] md:rounded-lg md:border-4 md:border-[#332219]">
        {/* Sidebar */}
        <aside className="z-10 hidden w-64 shrink-0 flex-col justify-between border-r border-[#332219] bg-[#1f140f] p-5 select-none md:flex">
          <div>
            <div className="mb-8 flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded border border-amber-600/40 bg-[#170e0a] font-serif text-lg font-bold text-amber-500 shadow-inner">
                Q
              </div>
              <div>
                <p className="font-serif text-sm font-bold tracking-wider text-amber-500 uppercase">QuestOS</p>
                <p className="font-sans text-[10px] tracking-widest text-amber-600/80 uppercase">
                  Turn goals into legends
                </p>
              </div>
            </div>
            <SidebarNav showApprovals={showApprovals} />
          </div>

          <div className="flex items-center gap-3 border-t border-amber-900/30 px-2 pt-4">
            <div
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-amber-700 to-amber-500 font-serif text-xs font-bold text-stone-950 shadow"
            >
              {getInitials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-xs font-bold text-amber-100">{name}</p>
              <p className="truncate text-[10px] tracking-wider text-stone-400">@{profile.username}</p>
              <SidebarLevel />
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="rounded p-1.5 text-stone-400 transition-colors hover:bg-[#281a13] hover:text-amber-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </aside>

        {/* Main parchment pane */}
        <main className="bg-parchment relative flex min-w-0 flex-1 flex-col overflow-y-auto text-[#1c120c]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1c120c_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.025] mix-blend-multiply" />

          <header className="border-wood/30 bg-parchment/95 sticky top-0 z-20 flex flex-col gap-2 border-b px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-8 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <PageTitle />
              <form action={signOutAction} className="md:hidden">
                <button type="submit" className="text-[11px] font-semibold text-stone-600 underline">
                  Sign out
                </button>
              </form>
            </div>
            <MobileNav showApprovals={showApprovals} />
          </header>

          <div className="relative z-10 flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
