import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// 📌 READ-ME: `cache()` from React dedupes calls within ONE request. The
// header, the stats and the quest list can all call `requireUser()`, and
// Supabase Auth is still asked only once per page load. It never shares
// results between users or between requests, so it is safe for per-user data.

/** The signed-in user. Redirects to /login when there is none. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // 📌 READ-ME: this is the real auth check, close to the data (not in the
  // layout, which doesn't re-render on client navigation). proxy.ts redirects
  // earlier; this catches anything that slips past it. Inside a streamed
  // <Suspense> section, redirect() arrives as a client-side redirect.
  if (!data.user) redirect('/login');

  return data.user;
});

/** Name fields for greetings. Falls back to the email name if the profile row is missing. */
export const getProfile = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const username = profile?.username ?? user.email?.split('@')[0] ?? 'adventurer';
  return { id: user.id, username, full_name: profile?.full_name ?? null };
});
