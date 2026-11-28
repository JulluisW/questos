'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { requestPasswordResetAction } from '@/actions/auth';
import { SubmitButton } from '@/components/ui/submit-button';
import { Notice } from '@/components/ui/notice';

const inputClass =
  'focus:ring-wood w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-transparent focus:ring-2 focus:outline-none';
const labelClass = 'mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase';

export function ForgotPasswordForm({ linkError }: { linkError?: string }) {
  const [state, action] = useActionState(requestPasswordResetAction, null);
  // A fresh submit replaces the expired-link notice with its own result.
  const error = state ? state.error : linkError;

  return (
    <div className="bg-parchment relative flex w-full flex-col justify-center p-8 font-sans text-[#1c120c] md:w-1/2 md:p-12 lg:p-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-8">
          <span className="mb-1 block font-serif text-xs font-semibold tracking-wider text-amber-800 uppercase">
            Lost Key
          </span>
          <h1 className="font-serif text-2xl leading-tight font-bold text-[#1a0f0a] md:text-3xl">
            Reset your password
          </h1>
          <p className="mt-2 font-sans text-sm font-normal text-stone-600">
            Enter the email you signed up with and we&apos;ll send you a link to choose a new password.
          </p>
        </div>

        <form action={action} className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          {state?.message && <Notice tone="success">{state.message}</Notice>}

          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className={inputClass}
            />
          </div>

          <SubmitButton size="lg" className="mt-2 w-full tracking-widest" pendingLabel="Sending the raven…">
            Send reset link
            <Mail className="h-4 w-4" />
          </SubmitButton>
        </form>

        <p className="mt-6 text-center font-sans text-xs text-stone-500">
          Remembered it?{' '}
          <Link
            href="/login"
            className="font-serif font-bold text-amber-800 underline transition-colors hover:text-amber-950"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
