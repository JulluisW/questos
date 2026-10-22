'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUpWithEmail } from '@/actions/auth';
import { SubmitButton } from './submit-button';
// import { loginWithGoogle, loginWithMicrosoft } from '@/actions/auth-oauth';

interface AuthFormProps {
  errorMessage?: string;
}

export function SignUpForm({ errorMessage }: AuthFormProps) {
  const [signUpState, signUpAction, signUpIsPending] = useActionState(signUpWithEmail, null);

  return (
    <div className="bg-parchment relative flex w-full flex-col justify-center p-8 font-sans text-[#1c120c] md:w-1/2 md:p-12 lg:p-16">
      {/* Subtle Paper-Grain Background Overlay */}
      <div className="bg-parchment pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Greeting Header */}
        <div className="mb-8">
          <span className="mb-1 block font-serif text-xs font-semibold tracking-wider text-amber-800 uppercase">
            Tavern Gate
          </span>
          <h3 className="font-serif text-2xl leading-tight font-bold text-[#1a0f0a] md:text-3xl">
            Welcome back, Architect
          </h3>
          <p className="mt-2 font-sans text-sm font-normal text-stone-600">
            Masuk untuk melanjutkan campaign dan melihat progress tim.
          </p>
        </div>

        {/* Server-Side Error Rendering */}
        {errorMessage && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 font-sans text-xs text-red-800">
            {errorMessage}
          </div>
        )}

        {/* Form Native Server Action */}
        <form action={signUpAction} className="space-y-4">
          {signUpState?.error && (
            <div className="rounded border border-red-800/40 bg-red-950/40 p-3 font-sans text-xs text-red-400">
              {signUpState.error}
            </div>
          )}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="username"
              className="w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-transparent focus:ring-2 focus:ring-[#5c4033] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              className="w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-transparent focus:ring-2 focus:ring-[#5c4033] focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="font-serif text-xs text-amber-800 underline transition-colors hover:text-amber-950"
              >
                Forgot?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-transparent focus:ring-2 focus:ring-[#5c4033] focus:outline-none"
            />
          </div>

          {/* Extracted Client Component for Loading UI */}
          <SubmitButton />
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d3c8ba]/60" />
          </div>
          <span className="relative bg-[#fbf8f3] px-3 font-sans text-[10px] tracking-wider text-stone-400 uppercase">
            atau lanjutkan dengan
          </span>
        </div>

        {/* OAuth Buttons (Wrapped in their own forms for Server Actions) */}
        <div className="grid grid-cols-2 gap-3">
          <form action={/* loginWithGoogle */ undefined} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded border border-[#d3c8ba] bg-[#f5f1ea] px-4 py-2.5 font-sans text-xs font-semibold text-[#403026] transition-all hover:bg-[#ebe5d9]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.61 0 3.05.55 4.19 1.64l3.12-3.12c-2.07-1.92-4.78-3.08-7.31-3.08C7.57.48 3.75 3 1.77 6.84l3.77 2.92C6.46 6.88 9 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.52 12.3c0-.82-.07-1.61-.21-2.38H12v4.51h6.46c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.96 3.37-4.85 3.37-8.47z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.54 14.28c-.24-.71-.38-1.47-.38-2.28s.14-1.57.38-2.28L1.77 6.8A11.94 11.94 0 000 12c0 1.9.44 3.7 1.23 5.32l4.31-3.04z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.96-1.07 7.95-2.91l-3.63-2.82c-1.12.75-2.55 1.21-4.32 1.21-3 0-5.54-1.84-6.46-4.72L1.23 16.8A11.94 11.94 0 0012 23z"
                />
              </svg>
              Google
            </button>
          </form>

          <form action={/* loginWithMicrosoft */ undefined} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded border border-[#d3c8ba] bg-[#f5f1ea] px-4 py-2.5 font-sans text-xs font-semibold text-[#403026] transition-all hover:bg-[#ebe5d9]"
            >
              <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none">
                <path fill="#F25022" d="M0 0h11v11H0z" />
                <path fill="#7FBA00" d="M12 0h11v11H12z" />
                <path fill="#00A4EF" d="M0 12h11v11H0z" />
                <path fill="#FFB900" d="M12 12h11v11H12z" />
              </svg>
              Microsoft
            </button>
          </form>
        </div>

        <p className="mt-8 text-center font-sans text-xs text-stone-500">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-serif font-bold text-amber-800 underline transition-colors hover:text-amber-950"
          >
            Create your guild
          </Link>
        </p>
      </div>
    </div>
  );
}
