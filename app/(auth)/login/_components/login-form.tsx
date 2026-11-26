'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { loginWithEmail } from '@/actions/auth';
import { SubmitButton } from '@/components/ui/submit-button';
import { Notice } from '@/components/ui/notice';

const inputClass =
  'focus:ring-wood w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-transparent focus:ring-2 focus:outline-none';
const labelClass = 'mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase';

interface LoginFormProps {
  notice?: string;
  next?: string;
}

export function LoginForm({ notice, next }: LoginFormProps) {
  const [loginState, loginAction] = useActionState(loginWithEmail, null);
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : '/signup';

  return (
    <div className="relative flex w-full flex-col justify-center bg-parchment p-8 font-sans text-[#1c120c] md:w-1/2 md:p-12 lg:p-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-8">
          <span className="mb-1 block font-serif text-xs font-semibold tracking-wider text-amber-800 uppercase">
            Tavern Gate
          </span>
          <h1 className="font-serif text-2xl leading-tight font-bold text-[#1a0f0a] md:text-3xl">
            Welcome back, Architect
          </h1>
          <p className="mt-2 font-sans text-sm font-normal text-stone-600">
            Masuk untuk melanjutkan campaign dan melihat progress tim.
          </p>
        </div>

        {notice && (
          <Notice tone="success" className="mb-4">
            {notice}
          </Notice>
        )}

        <form action={loginAction} className="space-y-4">
          {loginState?.error && <Notice tone="error">{loginState.error}</Notice>}
          {next && <input type="hidden" name="next" value={next} />}

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

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <SubmitButton size="lg" className="mt-2 w-full tracking-widest" pendingLabel="Opening the gate…">
            Sign In to QuestOS
            <Compass className="h-4 w-4" />
          </SubmitButton>
        </form>

        <p className="mt-6 rounded border border-dashed border-[#d3c8ba] bg-[#f5f1ea]/70 p-3 text-center font-sans text-[11px] text-stone-600">
          Demo account: <code className="font-semibold">arthur@questos.dev</code> / <code className="font-semibold">12345678</code>
        </p>

        <p className="mt-6 text-center font-sans text-xs text-stone-500">
          Belum punya akun?{' '}
          <Link href={signupHref} className="font-serif font-bold text-amber-800 underline transition-colors hover:text-amber-950">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
