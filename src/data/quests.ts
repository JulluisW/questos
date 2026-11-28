import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { failed, ok, type Result } from '@/data/result';
import { daysAgoIso } from '@/lib/utils';
import { containsPattern } from '@/lib/search';
import type { Campaign, Quest } from '@/types';

// 📌 READ-ME: `.or()` takes a raw PostgREST filter string. Only ever put
// trusted values in it, like `userId` from Supabase Auth (a UUID). Never put
// user input from a form or the URL in it: it could change the filter.
const assignedToOrUnassigned = (userId: string) => `assignee_id.eq.${userId},assignee_id.is.null`;

/** Quests not yet completed that are yours or unclaimed. */
export async function countOpenQuestsFor(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'completed')
    .or(assignedToOrUnassigned(userId));

  if (error) return failed('countOpenQuestsFor', error);
  return ok(count ?? 0);
}

export async function countCompletedThisWeek() {
  const supabase = await createClient();

  // 📌 READ-ME: the date is computed inside the function, on every call. At
  // the top of the file it would be computed once when the server starts, and
  // "this week" would never move forward.
  const weekAgo = daysAgoIso(7);

  const { count, error } = await supabase
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', weekAgo);

  if (error) return failed('countCompletedThisWeek', error);
  return ok(count ?? 0);
}

/** Open quests in active campaigns: in-progress first, then oldest first. */
export async function getOpenQuestsFor(userId: string, limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, status, priority, is_milestone, campaigns!inner(id, name, status)')
    .in('status', ['in-progress', 'pending'])
    .or(assignedToOrUnassigned(userId))
    .eq('campaigns.status', 'active')
    .order('status', { ascending: false }) // enum order is pending < in-progress, so desc = in-progress first
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return failed('getOpenQuestsFor', error);
  return ok(data);
}

type CompletedQuest = Pick<Quest, 'id' | 'title' | 'completed_at' | 'is_milestone'> & {
  campaigns: Pick<Campaign, 'id' | 'name'> | null;
};

/** Completed quests across every campaign the user can see, newest first. */
export async function getRecentlyCompletedQuests(limit = 5): Promise<Result<CompletedQuest[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, completed_at, is_milestone, campaigns(id, name)')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) return failed('getRecentlyCompletedQuests', error);
  return ok(data);
}

export const RECORDS_PAGE_SIZE = 25;

/**
 * One page of the Hall of Records, with exact totals. Three requests run in
 * parallel, so the page costs one round trip.
 */
export async function getCompletedQuestsPage(
  page: number,
  q = ''
): Promise<Result<{ quests: CompletedQuest[]; total: number; milestones: number; pageSize: number }>> {
  const supabase = await createClient();
  const from = (page - 1) * RECORDS_PAGE_SIZE;
  // A plain ilike on the title, applied to the rows and both counts alike.
  const pattern = q ? containsPattern(q) : null;

  const rowsQuery = supabase
    .from('quests')
    .select('id, title, completed_at, is_milestone, campaigns(id, name)')
    .eq('status', 'completed');
  const totalQuery = supabase.from('quests').select('id', { count: 'exact', head: true }).eq('status', 'completed');
  const milestonesQuery = supabase
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
    .eq('is_milestone', true);

  const [rows, total, milestones] = await Promise.all([
    (pattern ? rowsQuery.ilike('title', pattern) : rowsQuery)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .range(from, from + RECORDS_PAGE_SIZE - 1),
    pattern ? totalQuery.ilike('title', pattern) : totalQuery,
    pattern ? milestonesQuery.ilike('title', pattern) : milestonesQuery,
  ]);

  // 📌 READ-ME: asking for a page past the last record is not a failure.
  // PostgREST answers it with "416 Range Not Satisfiable" (code PGRST103), so
  // that one code means "this page is empty", not "show the retry box".
  const pastTheEnd = rows.error?.code === 'PGRST103';
  if (rows.error && !pastTheEnd) return failed('getCompletedQuestsPage', rows.error);
  if (total.error) return failed('getCompletedQuestsPage', total.error);
  if (milestones.error) return failed('getCompletedQuestsPage', milestones.error);

  return ok({
    quests: pastTheEnd ? [] : (rows.data ?? []),
    total: total.count ?? 0,
    milestones: milestones.count ?? 0,
    pageSize: RECORDS_PAGE_SIZE,
  });
}

export type PendingApproval = Pick<Quest, 'id' | 'title' | 'priority' | 'is_milestone' | 'review_requested_at'> & {
  requester: { username: string; full_name: string | null } | null;
  campaigns: Pick<Campaign, 'id' | 'name' | 'guild_id'> & { guilds: { name: string } | null };
};

/**
 * Open approval requests in the given guilds (the ones the user bosses or
 * manages), oldest first. `guildIds` come from getManagedGuilds, never from
 * user input. RLS still decides which quests are visible at all.
 */
export async function getPendingApprovals(guildIds: string[]): Promise<Result<PendingApproval[]>> {
  if (guildIds.length === 0) return ok([]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quests')
    .select(
      'id, title, priority, is_milestone, review_requested_at, requester:profiles!quests_review_requested_by_fkey(username, full_name), campaigns!inner(id, name, guild_id, guilds(name))'
    )
    .not('review_requested_at', 'is', null)
    .in('campaigns.guild_id', guildIds)
    .order('review_requested_at', { ascending: true });

  if (error) return failed('getPendingApprovals', error);
  return ok(data);
}
