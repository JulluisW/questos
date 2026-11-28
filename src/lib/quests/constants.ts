import type { CampaignStatus, QuestPriority, QuestStatus } from '@/types';

export const COLUMN_IDS: QuestStatus[] = ['pending', 'in-progress', 'completed'];

export const COLUMN_LABELS: Record<QuestStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

export const PRIORITIES: QuestPriority[] = ['low', 'medium', 'high'];

export const PRIORITY_STYLES: Record<QuestPriority, string> = {
  low: 'bg-stone-100 text-stone-600 border-stone-300',
  medium: 'bg-amber-50 text-amber-800 border-amber-300',
  high: 'bg-red-50 text-red-800 border-red-300',
};

export const CAMPAIGN_STATUS_STYLES: Record<CampaignStatus, string> = {
  active: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-stone-200 text-stone-600',
};

export const QUEST_TITLE_MAX = 80;
export const QUEST_DESCRIPTION_MAX = 200;
export const CAMPAIGN_NAME_MAX = 60;
export const CAMPAIGN_GOAL_MAX = 200;
export const DIRECTIVE_MAX = 500;
export const RETURN_NOTE_MAX = 200;
