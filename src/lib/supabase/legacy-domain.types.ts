export type GuildMemberRole = 'boss' | 'manager' | 'worker';
export type QuestStatus = 'pending' | 'in-progress' | 'completed';

export type Guild = {
  id: string;
  name: string;
  created_at: string;
};

export type GuildMember = {
  id: string;
  guild_id: string;
  user_id: string;
  role: GuildMemberRole;
  joined_at: string;
};

export type Campaign = {
  id: string;
  guild_id: string;
  name: string;
  ultimate_goal: string | null;
  created_by: string;
  created_at: string;
};

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

// ----------------------------------------------------------------------
// COMPOSITE TYPES (For UI Rendering)
// ----------------------------------------------------------------------

export type CampaignWithQuests = Campaign & {
  quests: Quest[];
};
