'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Swords } from 'lucide-react';
import { signUpWithEmail } from '@/actions/auth';
import { SubmitButton } from '@/components/ui/submit-button';
import { Notice } from '@/components/ui/notice';
import { PASSWORD_MIN } from '@/lib/auth-constants';

const inputClass =
  'focus:ring-wood w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-transparent focus:ring-2 focus:outline-none';
const labelClass = 'mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase';

export function SignUpForm({ next }: { next?: string }) {
  const [signUpState, signUpAction] = useActionState(signUpWithEmail, null);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <div className="relative flex w-full flex-col justify-center overflow-y-auto bg-parchment p-8 font-sans text-[#1c120c] md:w-1/2 md:p-12 lg:p-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-8">
          <span className="mb-1 block font-serif text-xs font-semibold tracking-wider text-amber-800 uppercase">
            Member Registry
          </span>
          <h1 className="font-serif text-2xl leading-tight font-bold text-[#1a0f0a] md:text-3xl">Enlist in QuestOS</h1>
          <p className="mt-2 font-sans text-sm font-normal text-stone-600">
            Create your account to forge campaigns, found a guild, or join an existing party.
          </p>
        </div>

        <form action={signUpAction} className="space-y-4">
          {signUpState?.error && <Notice tone="error">{signUpState.error}</Notice>}
          {next && <input type="hidden" name="next" value={next} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className={labelClass}>
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                maxLength={80}
                placeholder="Arthur Pendragon"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="username" className={labelClass}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                pattern="[a-zA-Z0-9_]{3,30}"
                title="3-30 letters, numbers or underscores"
                placeholder="arthur_p"
                className={inputClass}
              />
            </div>
          </div>

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN}
                placeholder="8+ characters"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <SubmitButton size="lg" className="mt-2 w-full tracking-widest" pendingLabel="Forging your account…">
            Create your account
            <Swords className="h-4 w-4" />
          </SubmitButton>
        </form>

        <p className="mt-8 text-center font-sans text-xs text-stone-500">
          Already registered at the Tavern?{' '}
          <Link href={loginHref} className="font-serif font-bold text-amber-800 underline transition-colors hover:text-amber-950">
            Sign in to your realm
          </Link>
        </p>
      </div>
    </div>
  );
}
