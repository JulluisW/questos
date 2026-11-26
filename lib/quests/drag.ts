import { COLUMN_IDS } from '@/lib/quests/constants';
import type { Quest, QuestStatus } from '@/types';

/** Maps a dnd-kit `over` id (a column id or a quest id) to the target status. */
export function resolveTargetStatus(quests: Pick<Quest, 'id' | 'status'>[], overId: string): QuestStatus | null {
  if (COLUMN_IDS.includes(overId as QuestStatus)) {
    return overId as QuestStatus;
  }
  return quests.find((q) => q.id === overId)?.status ?? null;
}
