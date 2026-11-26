import type { ServerSupabase } from '@/lib/supabase/server';
import type { BoardMember, GuildRole } from '@/types';
import { displayName, getInitials } from '@/lib/utils';

export async function getCurrentProfile(supabase: ServerSupabase) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();

  return {
    id: auth.user.id,
    email: auth.user.email ?? '',
    username: profile?.username ?? auth.user.email?.split('@')[0] ?? 'adventurer',
    full_name: profile?.full_name ?? null,
  };
}

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

/** People a quest on this campaign may be assigned to. */
export async function getBoardMembers(
  supabase: ServerSupabase,
  campaign: { guild_id: string | null; created_by: string | null }
): Promise<BoardMember[]> {
  if (campaign.guild_id) {
    const { data } = await supabase
      .from('guild_members')
      .select('user_id, profiles(full_name, username)')
      .eq('guild_id', campaign.guild_id);

    return (data ?? []).map((m) => {
      const name = displayName(m.profiles);
      return { id: m.user_id, name, initials: getInitials(name) };
    });
  }

  if (!campaign.created_by) return [];
  const { data: owner } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', campaign.created_by)
    .maybeSingle();

  if (!owner) return [];
  const name = displayName(owner);
  return [{ id: owner.id, name, initials: getInitials(name) }];
}
