export type QuestStatus = 'pending' | 'in-progress' | 'completed';

export type Quest = {
  id: string;
  text: string;
  campaign: string;
  isMilestone: boolean;
  status: QuestStatus;
  archivedAt: string | null;
};
