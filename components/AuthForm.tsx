'use client';

import { supabase } from '@/lib/supabase/client';
import { useState, type FormEvent } from 'react';

type AuthMode = 'signIn' | 'signUp';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runAuth = async (mode: AuthMode) => {
    setError(null);
    setIsSubmitting(true);

    const credentials = { email: email.trim(), password };

    const { error: authError } =
      mode === 'signIn' ? await supabase.auth.signInWithPassword(credentials) : await supabase.auth.signUp(credentials);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void runAuth('signIn');
  };

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-5 font-body text-ink">
      <section
        className="tavern-board w-full max-w-md rounded border-16 border-wood bg-parchment px-8 py-10 shadow-[0_25px_50px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(92,64,51,0.15)]"
        aria-labelledby="auth-heading"
      >
        <header className="mb-8 border-b-2 border-wood/30 pb-5 text-center">
          <h1 id="auth-heading" className="font-heading text-[2rem] uppercase tracking-[3px] text-ink">
            Tavern Gate
          </h1>
          <p className="mt-2 font-body text-sm italic text-[#4b3d39]">Sign in to post quests on the notice board</p>
        </header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="font-heading text-xs font-bold uppercase tracking-[2px] text-ink/80">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-0 border-b-2 border-wood bg-transparent px-1 py-2 font-body text-base text-ink outline-none placeholder:italic placeholder:text-ink/40 focus:border-accent-career"
              placeholder="adventurer@tavern.local"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-heading text-xs font-bold uppercase tracking-[2px] text-ink/80">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-0 border-b-2 border-wood bg-transparent px-1 py-2 font-body text-base text-ink outline-none placeholder:italic placeholder:text-ink/40 focus:border-accent-career"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 cursor-pointer rounded border-2 border-wood bg-wood px-4 py-2.5 font-heading text-sm font-extrabold uppercase tracking-[1px] text-parchment transition-all duration-200 hover:bg-parchment hover:text-wood disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign In
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void runAuth('signUp')}
              className="flex-1 cursor-pointer rounded border-2 border-wood/70 bg-parchment px-4 py-2.5 font-heading text-sm font-extrabold uppercase tracking-[1px] text-wood transition-all duration-200 hover:border-wood hover:bg-[#fff8e7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign Up
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
