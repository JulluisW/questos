import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { failed, ok, type Result } from '@/data/result';
import type { CampaignWithQuests } from '@/types';

// 📌 READ-ME: `createClient()` is called INSIDE every function, never at the
// top of the file. The client carries the visitor's session cookie, and RLS
// uses it to decide which rows come back. A module-level client would be
// created once and shared by every visitor (the bug from the first review).

/** Active campaigns the user can see (their solo ones + their guilds'). */
export async function countActiveCampaigns(): Promise<Result<number>> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) return failed('countActiveCampaigns', error);
  return ok(count ?? 0);
}

/** The most recently updated active campaigns, with quest progress for the card. */
export async function getRecentActiveCampaigns(limit = 3): Promise<Result<CampaignWithQuests[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, quests(id, status), guilds(id, name)')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) return failed('getRecentActiveCampaigns', error);
  return ok(data);
}
