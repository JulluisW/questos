import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1c120c] p-0 font-sans text-neutral-100 antialiased md:p-3">
      {/* Outer RPG Bezel / Window Frame */}
      <div className="relative flex max-h-[95vh] min-h-205 w-full max-w-360 overflow-hidden rounded-lg border-4 border-[#332219] bg-[#170e0a] shadow-2xl">
        <AppSidebar />

        {/* =========================================================================
            MAIN CONTENT AREA (Right Parchment Pane)
            ========================================================================= */}
        <main className="bg-parchment relative flex flex-1 flex-col overflow-y-auto text-[#1c120c]">
          {/* Subtle Paper-Grain Background Texture Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1c120c_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.025] mix-blend-multiply" />

          <AppHeader />

          {/* =========================================================================
              DYNAMIC PAGE INJECTION
              ========================================================================= */}
          <div className="relative z-10 h-full w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
