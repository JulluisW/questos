export type QuestStatus = 'pending' | 'in-progress' | 'completed';

// export type Quest = {
//   id: string;
//   text: string;
//   campaign: string;
//   is_milestone: boolean;
//   status: QuestStatus;
//   archived_at: string | null;
// };

export type Quest = {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  status: QuestStatus;
  is_milestone: boolean;
  xp_reward: number;
  assignee_id: string | null;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
};
