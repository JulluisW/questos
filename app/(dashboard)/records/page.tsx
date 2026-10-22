'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Archive() {
  useEffect(() => {}, []);
  return (
    <div className="font-body text-ink flex min-h-full flex-1 items-center justify-center p-5">
      <main
        id="tavern-board"
        className="tavern-board border-wood bg-parchment w-full max-w-275 rounded border-16 px-6 py-10 shadow-[0_25px_50px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(92,64,51,0.15)] md:px-10"
      >
        <header className="tavern-header border-wood/30 relative mb-10 border-b-2 pb-5 text-center">
          <Link
            href={'/'}
            className="font-body text-ink/50 hover:text-ink/80 absolute top-0 left-0 cursor-pointer text-xs underline-offset-2 transition-colors hover:underline"
          >
            Back to Home
          </Link>
          <button
            type="button"
            className="font-body text-ink/50 hover:text-ink/80 absolute top-0 right-0 cursor-pointer text-xs underline-offset-2 transition-colors hover:underline"
          >
            Sign Out
          </button>
          <h1 className="font-heading text-ink text-[2.5rem] tracking-[3px] uppercase">The Valhalla</h1>
          <p className="subtitle font-body mt-2 text-[#4b3d39] italic">Official Hall of Records</p>
        </header>
        <div className="flex flex-col gap-2"></div>
      </main>
    </div>
  );
}
