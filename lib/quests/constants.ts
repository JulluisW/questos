import type { Quest, QuestStatus } from '@/types/quest';

export const STORAGE_KEY = 'daily_quests_v1';

export const XP_PER_QUEST = 50;
export const XP_PER_MILESTONE = 250;

export const COLUMN_IDS: QuestStatus[] = ['pending', 'in-progress', 'completed'];

export const COLUMN_LABELS: Record<QuestStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
};
