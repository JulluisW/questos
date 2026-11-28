import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { failed, ok, type Result } from '@/data/result';
import { containsPattern } from '@/lib/search';
import type { CampaignBoard, CampaignStatus, CampaignWithQuests } from '@/types';

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

export type CampaignSort = 'updated' | 'created' | 'name';

const CAMPAIGN_ORDER: Record<CampaignSort, { column: 'updated_at' | 'created_at' | 'name'; ascending: boolean }> = {
  updated: { column: 'updated_at', ascending: false },
  created: { column: 'created_at', ascending: false },
  name: { column: 'name', ascending: true },
};

/** Every campaign the user can see with this status, optionally searched by name or goal. */
export async function getCampaignsByStatus(
  status: CampaignStatus,
  { q = '', sort = 'updated' }: { q?: string; sort?: CampaignSort } = {}
): Promise<Result<CampaignWithQuests[]>> {
  const supabase = await createClient();
  const order = CAMPAIGN_ORDER[sort];
  let query = supabase.from('campaigns').select('*, quests(id, status), guilds(id, name)').eq('status', status);
  // A plain ilike on the generated search_text column: user text never goes into `.or()`.
  if (q) query = query.ilike('search_text', containsPattern(q));
  const { data, error } = await query.order(order.column, { ascending: order.ascending });

  if (error) return failed('getCampaignsByStatus', error);
  return ok(data);
}

/**
 * One campaign with its guild and quests (oldest first) for the quest board.
 * `ok(null)` means missing or hidden by RLS: the page shows "not found" for
 * both, so it never reveals that a hidden campaign exists. Cached per request,
 * so `generateMetadata` and the page share one query.
 */
export const getCampaignBoard = cache(async (id: string): Promise<Result<CampaignBoard | null>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, guilds(id, name), quests(*)')
    .eq('id', id)
    .order('position', { referencedTable: 'quests', ascending: true })
    .order('created_at', { referencedTable: 'quests', ascending: true })
    .maybeSingle();

  if (error) return failed('getCampaignBoard', error);
  return ok(data);
});

/** The most recently touched active campaign the user can see, if any. */
export async function getLatestActiveCampaignId(): Promise<Result<string | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return failed('getLatestActiveCampaignId', error);
  return ok(data?.id ?? null);
}
