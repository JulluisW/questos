import type { Database } from '@/types/database.types';

export type { Database };

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

// Domain aliases
export type Profile = Tables<'profiles'>;
export type Guild = Tables<'guilds'>;
export type GuildMember = Tables<'guild_members'>;
export type GuildInvite = Tables<'guild_invites'>;
export type Campaign = Tables<'campaigns'>;
export type Quest = Tables<'quests'>;

export type GuildRole = Enums<'guild_role'>;
export type QuestStatus = Enums<'quest_status'>;
export type QuestPriority = Enums<'quest_priorities'>;
export type CampaignStatus = Enums<'campaign_status'>;

// Composite shapes used by Server Component queries
export type CampaignWithQuests = Campaign & {
  quests: Pick<Quest, 'id' | 'status'>[];
  guilds: Pick<Guild, 'id' | 'name'> | null;
};

/** A person a quest can be assigned to on a given board. */
export type BoardMember = {
  id: string;
  name: string;
  initials: string;
};

/** Standard server action result. */
export type ActionState<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;
