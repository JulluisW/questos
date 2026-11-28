import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { failed, ok, type Result } from '@/data/result';
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

/** Every campaign the user can see with this status, newest activity first. */
export async function getCampaignsByStatus(status: CampaignStatus): Promise<Result<CampaignWithQuests[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, quests(id, status), guilds(id, name)')
    .eq('status', status)
    .order('updated_at', { ascending: false });

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
