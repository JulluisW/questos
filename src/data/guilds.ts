import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { failed, ok, type Result } from '@/data/result';
import { canManageRole, type MyGuild } from '@/lib/queries';
import { displayName, getInitials } from '@/lib/utils';
import type { BoardMember, CampaignBoard, GuildRole } from '@/types';

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

type BoardAudience = Pick<CampaignBoard, 'id' | 'guild_id' | 'created_by'>;

/** People a quest on this campaign may be assigned to: the guild's members, or the solo owner. */
export async function getBoardMembers(campaign: BoardAudience): Promise<Result<BoardMember[]>> {
  const supabase = await createClient();

  if (campaign.guild_id) {
    const { data, error } = await supabase
      .from('guild_members')
      .select('user_id, profiles(full_name, username)')
      .eq('guild_id', campaign.guild_id);

    if (error) return failed('getBoardMembers', error);
    return ok(
      data.map((m) => {
        const name = displayName(m.profiles);
        return { id: m.user_id, name, initials: getInitials(name) };
      })
    );
  }

  if (!campaign.created_by) return ok([]);
  const { data: owner, error } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', campaign.created_by)
    .maybeSingle();

  if (error) return failed('getBoardMembers', error);
  if (!owner) return ok([]);
  const name = displayName(owner);
  return ok([{ id: owner.id, name, initials: getInitials(name) }]);
}

/**
 * What the signed-in user may do on this board. An RPC error is a failure,
 * not "no rights", so the page shows a retry instead of silently hiding
 * controls.
 */
export async function getBoardPermissions(
  campaign: BoardAudience
): Promise<Result<{ canManage: boolean; myRole: GuildRole | null }>> {
  const supabase = await createClient();

  // 📌 READ-ME: these only decide which buttons the page shows. RLS and the
  // guard_quest_update trigger are the real checks, so a wrong answer here
  // can hide a button but never grant a write.
  const [manage, role] = await Promise.all([
    supabase.rpc('can_manage_campaign', { p_campaign_id: campaign.id }),
    campaign.guild_id
      ? supabase.rpc('get_my_guild_role', { p_guild_id: campaign.guild_id })
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (manage.error) return failed('getBoardPermissions', manage.error);
  if (role.error) return failed('getBoardPermissions', role.error);
  return ok({ canManage: Boolean(manage.data), myRole: role.data ?? null });
}
