import type { ServerSupabase } from '@/lib/supabase/server';
import type { GuildRole } from '@/types';

export type MyGuild = { id: string; name: string; role: GuildRole };

/** Guilds the user belongs to, with their role in each. */
export async function getMyGuilds(supabase: ServerSupabase, userId: string): Promise<MyGuild[]> {
  const { data } = await supabase
    .from('guild_members')
    .select('role, guilds(id, name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  return (data ?? [])
    .filter((m) => m.guilds)
    .map((m) => ({ id: m.guilds!.id, name: m.guilds!.name, role: m.role ?? 'worker' }));
}

export function canManageRole(role: GuildRole | null | undefined) {
  return role === 'boss' || role === 'manager';
}
