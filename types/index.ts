// types/index.ts
import type { Database } from '@/types/database.types';

// Generic Row/Insert/Update extractors
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Clean application domain aliases
export type Profile = Tables<'profiles'>;
export type Guild = Tables<'guilds'>;
export type GuildMember = Tables<'guild_members'>;
export type Campaign = Tables<'campaigns'>;
export type Quest = Tables<'quests'>;

// Database Enum Types
export type GuildRole = Enums<'guild_role'>;
export type QuestStatus = Enums<'quest_status'>;
export type CampaignStatus = Enums<'campaign_status'>;

// Composite type for Server Component queries fetching nested relations
export type CampaignWithQuests = Campaign & {
  quests: Quest[];
};
