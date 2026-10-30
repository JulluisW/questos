
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "campaigns": {
                  Row: {
                    "created_at": string | null,"created_by": string | null,"guild_id": string | null,"id": string,"name": string,"status": Database["public"]['Enums']["campaign_status"] | null,"ultimate_goal": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by"?: string | null,"guild_id"?: string | null,"id"?: string,"name": string,"status"?: Database["public"]['Enums']["campaign_status"] | null,"ultimate_goal"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"created_by"?: string | null,"guild_id"?: string | null,"id"?: string,"name"?: string,"status"?: Database["public"]['Enums']["campaign_status"] | null,"ultimate_goal"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaigns_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "campaigns_guild_id_fkey"
      columns: ["guild_id"]
isOneToOne: false
      referencedRelation: "guilds"
      referencedColumns: ["id"]
    }
                  ]
                },"guild_members": {
                  Row: {
                    "guild_id": string,"id": string,"joined_at": string | null,"role": Database["public"]['Enums']["guild_role"] | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "guild_id": string,"id"?: string,"joined_at"?: string | null,"role"?: Database["public"]['Enums']["guild_role"] | null,"user_id": string
                  }
                  Update: {
                    "guild_id"?: string,"id"?: string,"joined_at"?: string | null,"role"?: Database["public"]['Enums']["guild_role"] | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "guild_members_guild_id_fkey"
      columns: ["guild_id"]
isOneToOne: false
      referencedRelation: "guilds"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guild_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"guilds": {
                  Row: {
                    "created_at": string | null,"id": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"full_name": string | null,"id": string,"total_xp": number | null,"updated_at": string | null,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"full_name"?: string | null,"id": string,"total_xp"?: number | null,"updated_at"?: string | null,"username": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"full_name"?: string | null,"id"?: string,"total_xp"?: number | null,"updated_at"?: string | null,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quests": {
                  Row: {
                    "archived_at": string | null,"assignee_id": string | null,"campaign_id": string,"completed_at": string | null,"created_at": string | null,"description": string | null,"id": string,"is_milestone": boolean | null,"priority": Database["public"]['Enums']["quest_priorities"] | null,"status": Database["public"]['Enums']["quest_status"] | null,"title": string,"xp_reward": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"assignee_id"?: string | null,"campaign_id": string,"completed_at"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_milestone"?: boolean | null,"priority"?: Database["public"]['Enums']["quest_priorities"] | null,"status"?: Database["public"]['Enums']["quest_status"] | null,"title": string,"xp_reward"?: number | null
                  }
                  Update: {
                    "archived_at"?: string | null,"assignee_id"?: string | null,"campaign_id"?: string,"completed_at"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_milestone"?: boolean | null,"priority"?: Database["public"]['Enums']["quest_priorities"] | null,"status"?: Database["public"]['Enums']["quest_status"] | null,"title"?: string,"xp_reward"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quests_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quests_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "get_my_guild_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           }
          }
          Enums: {
            "campaign_status": "active"|"archived"|"completed","guild_role": "boss"|"manager"|"worker","quest_priorities": "low"|"medium"|"high","quest_status": "pending"|"in-progress"|"completed"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "campaign_status": ["active", "archived", "completed"],"guild_role": ["boss", "manager", "worker"],"quest_priorities": ["low", "medium", "high"],"quest_status": ["pending", "in-progress", "completed"]
          }
        }
} as const
