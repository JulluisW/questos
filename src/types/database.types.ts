// Generated-format Supabase types for the QuestOS schema.
// Regenerate after each migration with:
//   supabase gen types typescript --local > types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_generations: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_generations_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      campaigns: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          guild_id: string | null;
          id: string;
          name: string;
          status: Database['public']['Enums']['campaign_status'] | null;
          ultimate_goal: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          guild_id?: string | null;
          id?: string;
          name: string;
          status?: Database['public']['Enums']['campaign_status'] | null;
          ultimate_goal?: string | null;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          status?: Database['public']['Enums']['campaign_status'] | null;
          ultimate_goal?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'campaigns_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaigns_guild_id_fkey';
            columns: ['guild_id'];
            isOneToOne: false;
            referencedRelation: 'guilds';
            referencedColumns: ['id'];
          },
        ];
      };
      guild_invites: {
        Row: {
          created_at: string;
          created_by: string | null;
          expires_at: string;
          guild_id: string;
          id: string;
          revoked_at: string | null;
          token: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          guild_id: string;
          id?: string;
          revoked_at?: string | null;
          token?: string;
        };
        Update: {
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'guild_invites_guild_id_fkey';
            columns: ['guild_id'];
            isOneToOne: false;
            referencedRelation: 'guilds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'guild_invites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      guild_members: {
        Row: {
          guild_id: string;
          id: string;
          joined_at: string | null;
          role: Database['public']['Enums']['guild_role'] | null;
          user_id: string;
        };
        Insert: {
          guild_id: string;
          id?: string;
          joined_at?: string | null;
          role?: Database['public']['Enums']['guild_role'] | null;
          user_id: string;
        };
        Update: {
          role?: Database['public']['Enums']['guild_role'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'guild_members_guild_id_fkey';
            columns: ['guild_id'];
            isOneToOne: false;
            referencedRelation: 'guilds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'guild_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      guilds: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      quests: {
        Row: {
          archived_at: string | null;
          assignee_id: string | null;
          campaign_id: string;
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_milestone: boolean | null;
          priority: Database['public']['Enums']['quest_priorities'] | null;
          status: Database['public']['Enums']['quest_status'] | null;
          title: string;
        };
        Insert: {
          archived_at?: string | null;
          assignee_id?: string | null;
          campaign_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_milestone?: boolean | null;
          priority?: Database['public']['Enums']['quest_priorities'] | null;
          status?: Database['public']['Enums']['quest_status'] | null;
          title: string;
        };
        Update: {
          archived_at?: string | null;
          assignee_id?: string | null;
          description?: string | null;
          is_milestone?: boolean | null;
          priority?: Database['public']['Enums']['quest_priorities'] | null;
          status?: Database['public']['Enums']['quest_status'] | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quests_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quests_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_guild_invite: {
        Args: { p_token: string };
        Returns: string;
      };
      account_exists_for_email: {
        Args: { p_email: string };
        Returns: boolean;
      };
      can_access_campaign: {
        Args: { p_campaign_id: string };
        Returns: boolean;
      };
      can_manage_campaign: {
        Args: { p_campaign_id: string };
        Returns: boolean;
      };
      can_manage_guild: {
        Args: { p_guild_id: string };
        Returns: boolean;
      };
      create_guild: {
        Args: { p_name: string };
        Returns: string;
      };
      forge_campaign_with_quests: {
        Args: {
          p_guild_id: string | null;
          p_name: string;
          p_quests: Json;
          p_ultimate_goal: string | null;
        };
        Returns: string;
      };
      get_my_guild_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      get_my_guild_role: {
        Args: { p_guild_id: string };
        Returns: Database['public']['Enums']['guild_role'];
      };
      get_my_xp: {
        Args: Record<PropertyKey, never>;
        Returns: {
          level: number;
          level_xp: number;
          next_level_xp: number;
          xp: number;
        }[];
      };
      level_for_xp: {
        Args: { p_xp: number };
        Returns: number;
      };
      preview_guild_invite: {
        Args: { p_token: string };
        Returns: {
          already_member: boolean;
          guild_id: string;
          guild_name: string;
          member_count: number;
        }[];
      };
      quest_xp: {
        Args: {
          p_is_milestone: boolean;
          p_priority: Database['public']['Enums']['quest_priorities'];
        };
        Returns: number;
      };
    };
    Enums: {
      campaign_status: 'active' | 'archived' | 'completed';
      guild_role: 'boss' | 'manager' | 'worker';
      quest_priorities: 'low' | 'medium' | 'high';
      quest_status: 'pending' | 'in-progress' | 'completed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export const Constants = {
  public: {
    Enums: {
      campaign_status: ['active', 'archived', 'completed'],
      guild_role: ['boss', 'manager', 'worker'],
      quest_priorities: ['low', 'medium', 'high'],
      quest_status: ['pending', 'in-progress', 'completed'],
    },
  },
} as const;
