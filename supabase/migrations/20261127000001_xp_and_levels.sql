-- ============================================================================
-- XP AND LEVELS (build-plan item 18)
--   XP is derived on read from completed quests. It is never stored and never
--   written by a client: the only way to change it is to change a quest's
--   status, priority or milestone flag, which RLS and guard_quest_update
--   already control.
--
--   Credit:  every completed quest earns XP for its campaign's creator
--            (campaigns.created_by), solo or guild. The assignee does not matter.
--   Amount:  low 10, medium 20, high 30, +20 for a milestone (quest_xp).
--   Levels:  reaching level L takes 50 * L * (L - 1) total XP
--            (level 2 at 100, 3 at 300, 4 at 600, 5 at 1000).
--
--   Functions only: no tables or columns change, nothing to back up.
-- ============================================================================

-- The one place that decides what a quest is worth. A later boss-set XP value
-- replaces this function. priority and is_milestone are nullable columns:
-- a NULL priority is worth 0 base XP and a NULL milestone counts as false.
CREATE OR REPLACE FUNCTION public.quest_xp(p_priority public.quest_priorities, p_is_milestone BOOLEAN)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (CASE p_priority
            WHEN 'low'    THEN 10
            WHEN 'medium' THEN 20
            WHEN 'high'   THEN 30
            ELSE 0
          END)
       + (CASE WHEN COALESCE(p_is_milestone, FALSE) THEN 20 ELSE 0 END);
$$;

-- The largest L >= 1 with 50 * L * (L - 1) <= p_xp. The sqrt estimate is done
-- in numeric, then nudged by exact integer checks so rounding can never put a
-- user one level off at a boundary. NULL or negative input is level 1.
CREATE OR REPLACE FUNCTION public.level_for_xp(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_xp    BIGINT := GREATEST(COALESCE(p_xp, 0), 0);
  v_level BIGINT := GREATEST(floor((1 + sqrt(1 + 8 * v_xp::numeric / 100)) / 2)::BIGINT, 1);
BEGIN
  WHILE 50 * v_level * (v_level - 1) > v_xp LOOP
    v_level := v_level - 1;
  END LOOP;
  WHILE 50 * (v_level + 1) * v_level <= v_xp LOOP
    v_level := v_level + 1;
  END LOOP;
  RETURN v_level;
END;
$$;

-- 📌 READ-ME: SECURITY DEFINER with NO arguments. It runs with the owner's
-- rights so a guild campaign's creator keeps that campaign's XP even after
-- leaving the guild (RLS would hide those quests from them). Because the only
-- actor is auth.uid(), nobody can ask for another user's total.
CREATE OR REPLACE FUNCTION public.get_my_xp()
RETURNS TABLE (xp INTEGER, level INTEGER, level_xp INTEGER, next_level_xp INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH total AS (
    SELECT COALESCE(SUM(public.quest_xp(q.priority, q.is_milestone)), 0)::INTEGER AS xp
    FROM public.quests q
    JOIN public.campaigns c ON c.id = q.campaign_id
    WHERE q.status = 'completed'
      AND c.created_by = auth.uid()
  ),
  lvl AS (
    SELECT xp, public.level_for_xp(xp) AS level FROM total
  )
  SELECT xp,
         level,
         50 * level * (level - 1) AS level_xp,
         50 * (level + 1) * level AS next_level_xp
  FROM lvl;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_xp() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_xp() TO authenticated;
