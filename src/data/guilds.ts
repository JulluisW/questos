import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { failed, ok, type Result } from '@/data/result';
import { displayName, getInitials } from '@/lib/utils';
import type { BoardMember, CampaignBoard, GuildRole, MyGuild, TeamGuild } from '@/types';

/** Boss and manager may plan a guild's campaigns and manage its invites. */
export function canManageRole(role: GuildRole | null | undefined) {
  return role === 'boss' || role === 'manager';
}

/** Guilds the user belongs to, with their role in each, oldest membership first. */
export const getMyGuilds = cache(async (userId: string): Promise<Result<MyGuild[]>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guild_members')
    .select('role, guilds(id, name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (error) return failed('getMyGuilds', error);
  return ok(
    data.filter((m) => m.guilds).map((m) => ({ id: m.guilds!.id, name: m.guilds!.name, role: m.role ?? 'worker' }))
  );
});

/**
 * Guilds where the user is boss or manager: the places they may forge a
 * campaign in (besides "solo"). Cached per request, so every Forge button on a
 * page shares one query.
 */
export const getManagedGuilds = cache(async (userId: string): Promise<Result<MyGuild[]>> => {
  const guilds = await getMyGuilds(userId);
  if (!guilds.ok) return guilds;

  // 📌 READ-ME: this filter only decides which options the dialog shows.
  // It is not the security check: RLS on `campaigns` rejects a worker's insert
  // even if someone sends the request by hand.
  return ok(guilds.data.filter((g) => canManageRole(g.role)));
});

/**
 * Everything the Team page shows: each guild with its members and, for the
 * guilds the user manages, its live invite links. At most three round trips
 * (guilds, then members and invites in parallel), however many guilds there are.
 */
export async function getTeamOverview(userId: string): Promise<Result<TeamGuild[]>> {
  const guilds = await getMyGuilds(userId);
  if (!guilds.ok) return guilds;
  if (guilds.data.length === 0) return ok([]);

  const allIds = guilds.data.map((g) => g.id);
  // 📌 READ-ME: RLS (`guild_invites_select_managers`) already hides invites
  // from workers. This list only skips a query that would return nothing; it
  // is not the security check.
  const managedIds = guilds.data.filter((g) => canManageRole(g.role)).map((g) => g.id);

  const supabase = await createClient();
  const [members, invites] = await Promise.all([
    supabase
      .from('guild_members')
      .select('id, role, joined_at, user_id, guild_id, profiles(full_name, username)')
      .in('guild_id', allIds)
      .order('joined_at', { ascending: true }),
    managedIds.length > 0
      ? supabase
          .from('guild_invites')
          .select('id, token, expires_at, guild_id')
          .in('guild_id', managedIds)
          .is('revoked_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (members.error) return failed('getTeamOverview', members.error);
  if (invites.error) return failed('getTeamOverview', invites.error);

  return ok(
    guilds.data.map((guild) => ({
      guild,
      members: members.data
        .filter((m) => m.guild_id === guild.id)
        .map(({ id, role, joined_at, user_id, profiles }) => ({ id, role, joined_at, user_id, profiles })),
      invites: (invites.data ?? [])
        .filter((i) => i.guild_id === guild.id)
        .map(({ id, token, expires_at }) => ({ id, token, expires_at })),
    }))
  );
}

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
