-- ============================================================================
-- PERSISTED QUEST ORDERING (build-plan item 20)
--   quests.position orders cards inside a board column. Lower sorts first;
--   values only mean something relative to other quests in the same campaign.
--   Only a boss, manager or solo owner may change it (guard_quest_update).
-- ============================================================================

ALTER TABLE public.quests ADD COLUMN position DOUBLE PRECISION;

-- Existing quests keep the order the board showed before (creation order).
UPDATE public.quests q
SET position = ranked.rn * 1024
FROM (
  SELECT id, row_number() OVER (PARTITION BY campaign_id ORDER BY created_at, id) AS rn
  FROM public.quests
) ranked
WHERE q.id = ranked.id;

-- 📌 READ-ME: a new quest goes after the last card of its own campaign,
-- whatever reordering happened before. SECURITY DEFINER so the MAX is not
-- narrowed by RLS. Inserts that pass an explicit position keep it.
CREATE OR REPLACE FUNCTION public.set_quest_position()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(q.position), 0) + 1024 INTO NEW.position
    FROM public.quests q
    WHERE q.campaign_id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quests_set_position
  BEFORE INSERT ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.set_quest_position();

-- NOT NULL is checked after BEFORE triggers, so inserts may omit position.
ALTER TABLE public.quests ALTER COLUMN position SET NOT NULL;

CREATE INDEX idx_quests_campaign_position ON public.quests (campaign_id, position);

GRANT UPDATE (position) ON public.quests TO authenticated;

-- Same rules as 20261105000003_guilds_mvp.sql, plus: workers cannot reorder.
CREATE OR REPLACE FUNCTION public.guard_quest_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL editor / seeds run without a JWT: no guard.
  IF auth.uid() IS NULL OR public.can_manage_campaign(OLD.campaign_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.title        IS DISTINCT FROM OLD.title
  OR NEW.description  IS DISTINCT FROM OLD.description
  OR NEW.priority     IS DISTINCT FROM OLD.priority
  OR NEW.is_milestone IS DISTINCT FROM OLD.is_milestone
  OR NEW.archived_at  IS DISTINCT FROM OLD.archived_at
  OR NEW.position     IS DISTINCT FROM OLD.position THEN
    RAISE EXCEPTION 'Only the guild boss or a manager can edit quest details'
      USING ERRCODE = '42501';
  END IF;

  -- Workers may claim an unassigned quest or drop their own claim, nothing else.
  IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id
     AND NOT (OLD.assignee_id IS NULL AND NEW.assignee_id = auth.uid())
     AND NOT (OLD.assignee_id = auth.uid() AND NEW.assignee_id IS NULL) THEN
    RAISE EXCEPTION 'Workers can only claim or release their own quests'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
