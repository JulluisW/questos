import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { failed, ok } from '@/data/result';
import { canManageRole, type MyGuild } from '@/lib/queries';

/**
 * Guilds where the user is boss or manager: the places they may forge a
 * campaign in (besides "solo"). Cached per request, so every Forge button on a
 * page shares one query.
 */
export const getManagedGuilds = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guild_members')
    .select('role, guilds(id, name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (error) return failed('getManagedGuilds', error);

  const guilds: MyGuild[] = data
    .filter((m) => m.guilds)
    .map((m) => ({ id: m.guilds!.id, name: m.guilds!.name, role: m.role ?? 'worker' }));

  // 📌 READ-ME: this filter only decides which options the dialog shows.
  // It is not the security check: RLS on `campaigns` rejects a worker's insert
  // even if someone sends the request by hand.
  return ok(guilds.filter((g) => canManageRole(g.role)));
});
