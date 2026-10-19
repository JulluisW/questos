export type QuestStatus = 'pending' | 'in-progress' | 'completed';

export type Quest = {
  id: string;
  text: string;
  campaign: string;
  is_milestone: boolean;
  status: QuestStatus;
  archived_at: string | null;
};
