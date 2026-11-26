import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { failed, ok } from '@/data/result';
import { daysAgoIso } from '@/lib/utils';

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

export async function getRecentlyCompletedQuests(limit = 5) {
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
