import { COLUMN_IDS } from '@/lib/quests/constants';
import type { Quest, QuestStatus } from '@/types/quest';

function resolveCampaign(raw: Record<string, unknown>): string {
  if (typeof raw.campaign === 'string' && raw.campaign.trim() !== '') {
    return raw.campaign.trim();
  }

  if (raw.category === 'fitness') return 'Hardware';
  if (raw.category === 'career') return 'Main Quest';

  return 'General Campaign';
}

export function normalizeQuest(raw: unknown): Quest {
  const q = raw as Record<string, unknown>;
  let status: QuestStatus = 'pending';

  if (typeof q.status === 'string' && COLUMN_IDS.includes(q.status as QuestStatus)) {
    status = q.status as QuestStatus;
  } else if (q.completed === true) {
    status = 'completed';
  }

  return {
    id: String(q.id),
    text: String(q.text),
    campaign: resolveCampaign(q),
    isMilestone: q.isMilestone === true,
    status,
    archivedAt: typeof q.archived_at === 'string' ? q.archived_at : null,
  };
}
