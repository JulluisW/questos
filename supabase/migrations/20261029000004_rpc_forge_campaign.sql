-- ============================================================================
-- DAY 7 RPC: Atomic Campaign & Quest Batch Insertion
-- File: supabase/migrations/20261029000004_rpc_forge_campaign.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.forge_campaign_with_quests(
  p_name TEXT,
  p_ultimate_goal TEXT,
  p_guild_id UUID,
  p_quests JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER -- Enforces RLS policies of the calling user
AS $$
DECLARE
  v_campaign_id UUID;
  v_quest JSONB;
BEGIN
  -- 1. Validate inputs
  IF char_length(p_name) < 3 OR char_length(p_name) > 60 THEN
    RAISE EXCEPTION 'Campaign name must be between 3 and 60 characters';
  END IF;

  -- 2. Insert Parent Campaign
  INSERT INTO public.campaigns (
    name,
    ultimate_goal,
    guild_id,
    created_by
  )
  VALUES (
    p_name,
    p_ultimate_goal,
    p_guild_id,
    auth.uid()
  )
  RETURNING id INTO v_campaign_id;

  -- 3. Batch insert nested quests if array is non-empty
  IF p_quests IS NOT NULL AND jsonb_array_length(p_quests) > 0 THEN
    FOR v_quest IN SELECT * FROM jsonb_array_elements(p_quests)
    LOOP
      INSERT INTO public.quests (
        campaign_id,
        title,
        description,
        status,
        priority,
        is_milestone,
        xp_reward,
        assignee_id
      )
      VALUES (
        v_campaign_id,
        (v_quest->>'title')::TEXT,
        (v_quest->>'description')::TEXT,
        COALESCE((v_quest->>'status')::public.quest_status, 'pending'),
        COALESCE((v_quest->>'priority')::public.quest_priorities, 'low'),
        COALESCE((v_quest->>'is_milestone')::BOOLEAN, false),
        (v_quest->>'xp_reward')::INT,
        (v_quest->>'assignee_id')::UUID
      );
    END LOOP;
  END IF;

  RETURN v_campaign_id;
END;
$$;