'use client';

import { useActionState } from 'react';
import { KeyRound } from 'lucide-react';
import { updatePasswordAction } from '@/actions/auth';
import { SubmitButton } from '@/components/ui/submit-button';
import { Notice } from '@/components/ui/notice';
import { PASSWORD_MIN } from '@/lib/auth-constants';

const inputClass =
  'focus:ring-wood w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-transparent focus:ring-2 focus:outline-none';
const labelClass = 'mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase';

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, null);

  return (
    <div className="bg-parchment relative flex w-full flex-col justify-center p-8 font-sans text-[#1c120c] md:w-1/2 md:p-12 lg:p-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-8">
          <span className="mb-1 block font-serif text-xs font-semibold tracking-wider text-amber-800 uppercase">
            New Key
          </span>
          <h1 className="font-serif text-2xl leading-tight font-bold text-[#1a0f0a] md:text-3xl">
            Choose a new password
          </h1>
          <p className="mt-2 font-sans text-sm font-normal text-stone-600">
            At least {PASSWORD_MIN} characters. You&apos;ll sign in again with it afterwards.
          </p>
        </div>

        <form action={action} className="space-y-4">
          {state?.error && <Notice tone="error">{state.error}</Notice>}

          <div>
            <label htmlFor="password" className={labelClass}>
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN}
              className={inputClass}
            />
          </div>

          <SubmitButton size="lg" className="mt-2 w-full tracking-widest" pendingLabel="Forging the new key…">
            Save new password
            <KeyRound className="h-4 w-4" />
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
