import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { CampaignTimelineData, HistorySource, TimelineEvent } from './types';

/**
 * Loads everything the campaign timeline needs in three round trips.
 * Returns `null` when the campaign does not exist or is not visible (RLS).
 */
export async function getCampaignTimelineData(campaignId: string): Promise<CampaignTimelineData | null> {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name, ultimate_goal, status, created_at, quests (*)')
    .eq('id', campaignId)
    .single();

  if (error || !campaign) return null;

  const { quests, ...campaignFields } = campaign;

  const { data: eventRows, error: eventsError } = await supabase
    .from('quest_status_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('changed_at', { ascending: true });

  let historySource: HistorySource = 'log';
  let events: TimelineEvent[] = [];

  if (eventsError) {
    // Most likely the 20261104000001 migration has not been applied yet.
    // The timeline still works, reconstructing history from quest timestamps.
    console.warn('[timeline] quest_status_events unavailable, deriving history:', eventsError.message);
    historySource = 'derived';
  } else {
    events = (eventRows ?? []).map((row) => ({
      id: row.id,
      questId: row.quest_id,
      from: row.from_status,
      to: row.to_status,
      at: row.changed_at,
      by: row.changed_by,
      inferred: row.is_inferred,
    }));
  }

  const personIds = new Set<string>();
  for (const event of events) if (event.by) personIds.add(event.by);
  for (const quest of quests ?? []) if (quest.assignee_id) personIds.add(quest.assignee_id);

  const people: Record<string, string> = {};
  if (personIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', [...personIds]);
    for (const profile of profiles ?? []) {
      people[profile.id] = profile.full_name || profile.username;
    }
  }

  return {
    campaign: campaignFields,
    quests: quests ?? [],
    events,
    people,
    historySource,
  };
}
