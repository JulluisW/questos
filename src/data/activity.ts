import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/data/auth';
import { failed, ok, type Result } from '@/data/result';
import type { ActivityItem } from '@/types';

type FeedRow = {
  kind: string;
  occurred_at: string;
  ref_id: string;
  campaign_id: string | null;
  campaign_name: string | null;
  guild_name: string | null;
  actor: string | null;
  detail: string | null;
};

function fromFeedRow(r: FeedRow): ActivityItem | null {
  const base = { key: `${r.kind}:${r.ref_id}`, at: r.occurred_at };
  switch (r.kind) {
    case 'quest_completed':
      return r.campaign_id && r.campaign_name && r.detail
        ? {
            ...base,
            kind: 'quest_completed',
            campaignId: r.campaign_id,
            campaignName: r.campaign_name,
            questTitle: r.detail,
          }
        : null;
    case 'campaign_created':
    case 'template_adopted':
      return r.campaign_id && r.campaign_name
        ? { ...base, kind: r.kind, campaignId: r.campaign_id, campaignName: r.campaign_name, actor: r.actor }
        : null;
    case 'member_joined':
      return r.guild_name ? { ...base, kind: 'member_joined', guildName: r.guild_name, actor: r.actor } : null;
    default:
      return null;
  }
}

/**
 * Recent changes across the user's campaigns and guilds, newest first. The
 * main feed is filtered by RLS; adoptions of the user's own templates come
 * from a separate function that reveals only the adopter's username.
 */
export async function getActivityFeed(limit = 15): Promise<Result<ActivityItem[]>> {
  await requireUser();
  const supabase = await createClient();
  const [feed, adoptions] = await Promise.all([
    supabase.rpc('get_activity_feed', { p_limit: limit }),
    supabase.rpc('get_my_template_adoptions', { p_limit: limit }),
  ]);
  if (feed.error) return failed('getActivityFeed', feed.error);
  if (adoptions.error) return failed('getActivityFeed', adoptions.error);

  const items: ActivityItem[] = [
    ...(feed.data ?? []).map(fromFeedRow).filter((i): i is ActivityItem => i !== null),
    ...(adoptions.data ?? []).map((a, i): ActivityItem => ({
      kind: 'my_template_adopted',
      key: `my_template_adopted:${a.template_id}:${a.occurred_at}:${i}`,
      at: a.occurred_at,
      templateId: a.template_id,
      templateName: a.template_name,
      actor: a.adopter_username,
    })),
  ];

  return ok(items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit));
}
