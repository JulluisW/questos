'use server';

import { Swords } from 'lucide-react';
import { AuthForm } from './components/auth-form';
import { SignUpForm } from './components/signup-form';

interface CornerDecorationProps {
  className?: string;
}

export async function CornerOrnament({ className }: CornerDecorationProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer corner frame bracket */}
      <path d="M2 22V2H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Intricate inner diagonal arrow decoration / spear tip pointing inward */}
      <path d="M2 2L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 5V9H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Tiny medieval flourish accent dots */}
      <circle cx="14" cy="2" r="1" className="fill-current" />
      <circle cx="2" cy="14" r="1" className="fill-current" />
      {/* Inner fine-line arrow cross accent */}
      <path d="M4.5 4.5L6.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export default async function LoginPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#1c120c] p-0 font-sans text-neutral-100 antialiased">
      <div className="relative flex h-185 flex-col overflow-hidden rounded-full border-4 border-[#332219] bg-[#170e0a] p-5 shadow-2xl md:flex-row md:rounded-lg">
        {/* TOP LEFT */}
        <CornerOrnament className="absolute top-1 left-1 hidden h-8 w-8 text-amber-600/40 md:block" />
        {/* TOP RIGHT - Rotated 90deg */}
        <CornerOrnament className="absolute top-1 right-1 hidden h-8 w-8 rotate-90 text-amber-600/40 md:block" />
        {/* BOTTOM LEFT - Rotated 270deg */}
        <CornerOrnament className="absolute bottom-1 left-1 hidden h-8 w-8 -rotate-90 text-amber-600/40 md:block" />
        {/* BOTTOM RIGHT - Rotated 180deg */}
        <CornerOrnament className="absolute right-1 bottom-1 hidden h-8 w-8 rotate-180 text-amber-600/40 md:block" />

        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden border-b border-[#332219] bg-[radial-gradient(circle_at_30%_20%,#382419_0%,#170e0a_60%)] p-8 md:w-1/2 md:border-r md:border-b-0 md:p-12">
          {/* Subtle gold overlay ambient blur */}
          <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-tr from-amber-900/10 via-transparent to-amber-500/5" />

          {/* Top Brand Block */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-amber-600/40 bg-[#170e0a] font-serif text-lg font-bold text-amber-500 shadow-inner">
              Q
            </div>
            <div>
              <h1 className="font-serif text-sm font-bold tracking-wider text-amber-500 uppercase">QUESTOS</h1>
              <p className="-mt-0.5 text-[10px] tracking-widest text-amber-600/80 uppercase">Turn goals into legends</p>
            </div>
          </div>

          {/* Headline and Narrative Section */}
          <div className="relative z-10 my-12 max-w-md md:my-auto">
            <span className="mb-3 inline-flex items-center gap-1.5 font-serif text-xs font-semibold tracking-widest text-amber-500/90 uppercase">
              <Swords className="size-4" />
              The Guild Begins Here
            </span>
            <h2 className="mb-4 font-serif text-3xl leading-tight font-medium text-amber-50/90 md:text-4xl">
              Every goal deserves a <span className="font-serif text-amber-500 italic">campaign.</span>
            </h2>
            <p className="font-sans text-sm leading-relaxed font-light text-stone-300">
              Bangun ritme kerja, selesaikan milestone, dan abadikan pencapaian dalam satu sistem yang terasa hidup.
            </p>
          </div>

          {/* B2B Metrics Section */}
          <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-amber-900/30 pt-6">
            <div className="flex flex-col">
              <span className="font-serif text-2xl leading-none font-bold text-amber-500">86%</span>
              <span className="mt-1 font-sans text-[10px] leading-tight tracking-wide text-stone-400 uppercase">
                Better completion
              </span>
            </div>
            <div className="flex flex-col border-l border-amber-900/30 pl-4">
              <span className="font-serif text-2xl leading-none font-bold text-amber-500">24K</span>
              <span className="mt-1 font-sans text-[10px] leading-tight tracking-wide text-stone-400 uppercase">
                Active quests
              </span>
            </div>
            <div className="flex flex-col border-l border-amber-900/30 pl-4">
              <span className="font-serif text-2xl leading-none font-bold text-amber-500">4.9/5</span>
              <span className="mt-1 font-sans text-[10px] leading-tight tracking-wide text-stone-400 uppercase">
                Team rating
              </span>
            </div>
          </div>
        </div>
        <AuthForm />
        <SignUpForm />
      </div>
    </div>
  );
}
