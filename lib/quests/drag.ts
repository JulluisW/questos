import { COLUMN_IDS } from "@/lib/quests/constants";
import type { Quest, QuestStatus } from "@/types/quest";

export function resolveTargetStatus(
  quests: Quest[],
  overId: string
): QuestStatus | null {
  if (COLUMN_IDS.includes(overId as QuestStatus)) {
    return overId as QuestStatus;
  }

  const overQuest = quests.find((q) => q.id === overId);
  return overQuest?.status ?? null;
}

export function applyQuestDrag(
  quests: Quest[],
  draggedId: string,
  overId: string,
  targetStatus: QuestStatus
): Quest[] {
  const moving = quests.find((q) => q.id === draggedId);
  if (!moving) return quests;

  const withoutActive = quests.filter((q) => q.id !== draggedId);
  const updatedQuest: Quest = { ...moving, status: targetStatus };

  const targetColumn = withoutActive.filter((q) => q.status === targetStatus);

  if (COLUMN_IDS.includes(overId as QuestStatus)) {
    return [...withoutActive, updatedQuest];
  }

  const overIndex = targetColumn.findIndex((q) => q.id === overId);
  const insertAt = overIndex === -1 ? targetColumn.length : overIndex;
  targetColumn.splice(insertAt, 0, updatedQuest);

  const otherColumns = withoutActive.filter((q) => q.status !== targetStatus);
  return [...otherColumns, ...targetColumn];
}
