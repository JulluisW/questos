import { COLUMN_IDS } from '@/lib/quests/constants';
import type { Quest, QuestStatus } from '@/types';

/** Maps a dnd-kit `over` id (a column id or a quest id) to the target status. */
export function resolveTargetStatus(quests: Pick<Quest, 'id' | 'status'>[], overId: string): QuestStatus | null {
  if (COLUMN_IDS.includes(overId as QuestStatus)) {
    return overId as QuestStatus;
  }
  return quests.find((q) => q.id === overId)?.status ?? null;
}

const POSITION_STEP = 1024;

/** A position that sorts between two neighbours (either may be missing). */
export function positionBetween(before?: number, after?: number): number {
  if (before !== undefined && after !== undefined) return (before + after) / 2;
  if (before !== undefined) return before + POSITION_STEP;
  if (after !== undefined) return after - POSITION_STEP;
  return POSITION_STEP;
}

type Positioned = Pick<Quest, 'id' | 'position'>;

/**
 * The new position for `draggedId` dropped on `overId` within `column` (that
 * column's quests, sorted by position). Returns null when the order would not
 * change. Same column: the card takes the `over` card's slot (dnd-kit's
 * arrayMove semantics). Another column: it goes just before the `over` card.
 * Dropped on the column itself: it goes to the bottom.
 */
export function positionForDrop(column: Positioned[], draggedId: string, overId: string): number | null {
  const fromIndex = column.findIndex((q) => q.id === draggedId);
  const overIndex = column.findIndex((q) => q.id === overId);
  const others = column.filter((q) => q.id !== draggedId);

  let insertAt: number;
  if (overIndex === -1) {
    if (fromIndex !== -1 && fromIndex === column.length - 1) return null;
    insertAt = others.length;
  } else if (fromIndex === -1) {
    insertAt = overIndex;
  } else {
    if (fromIndex === overIndex) return null;
    insertAt = overIndex;
  }

  return positionBetween(others[insertAt - 1]?.position, others[insertAt]?.position);
}
