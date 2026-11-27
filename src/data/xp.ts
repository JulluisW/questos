import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/data/auth';
import { failed, ok, type Result } from '@/data/result';
import type { MyXp } from '@/types';

// 📌 READ-ME: XP is not a column. Postgres adds it up from completed quests on
// every call (`get_my_xp()`), so there is nothing a client could overwrite.
// `cache()` lets the sidebar and the Command Center card share one RPC per
// request.

/** The signed-in user's XP and level. */
export const getMyXp = cache(async (): Promise<Result<MyXp>> => {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_my_xp').single();
  if (error) return failed('getMyXp', error);

  return ok({
    xp: data.xp,
    level: data.level,
    levelXp: data.level_xp,
    nextLevelXp: data.next_level_xp,
  });
});

/** How far through the current level, 0-100. */
export function levelProgress({ xp, levelXp, nextLevelXp }: MyXp) {
  return ((xp - levelXp) / (nextLevelXp - levelXp)) * 100;
}
