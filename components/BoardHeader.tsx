'use client';

import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

type BoardHeaderProps = {
  level: number;
  xpProgress: number;
};

export function BoardHeader({ level, xpProgress }: BoardHeaderProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="tavern-header relative mb-10 border-b-2 border-wood/30 pb-5 text-center">
      <Link
        href={'/archive'}
        className="absolute left-0 top-0 cursor-pointer font-body text-xs text-ink/50 underline-offset-2 transition-colors hover:text-ink/80 hover:underline"
      >
        Hall of Records
      </Link>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="absolute right-0 top-0 cursor-pointer font-body text-xs text-ink/50 underline-offset-2 transition-colors hover:text-ink/80 hover:underline"
      >
        Sign Out
      </button>
      <h1 className="font-heading text-[2.5rem] uppercase tracking-[3px] text-ink">The Daily Quest</h1>
      <p className="subtitle mt-2 font-body italic text-[#4b3d39]">Official Notice Board</p>

      <div className="mx-auto mt-6 max-w-md text-left">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="font-heading text-sm font-bold uppercase tracking-[2px] text-ink">
            Level {level} Architect
          </span>
          <span className="font-body text-xs text-ink/60">{xpProgress} / 100 XP</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded bg-wood"
          role="progressbar"
          aria-valuenow={xpProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${level} progress`}
        >
          <div
            className="h-full rounded-sm bg-linear-to-r from-accent-career to-[#b8860b] transition-[width] duration-500 ease-out"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>
    </header>
  );
}
