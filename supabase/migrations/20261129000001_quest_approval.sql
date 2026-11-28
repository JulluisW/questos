-- ============================================================================
-- Quest approval (build-plan item 25)
--
-- In a guild campaign a worker can no longer complete a quest on their own.
-- The worker who claimed it asks for approval; a boss or manager approves it
-- (status -> completed, so XP follows) or sends it back to in-progress with a
-- short reason. Solo campaigns, bosses and managers complete directly.
--
--   1. Review columns on quests (no client UPDATE grant: RPCs write them)
--   2. guard_quest_update: workers cannot move a quest into or out of completed
--   3. clear_quest_review: a status or assignee change ends an open request,
--      and an INSERT can never start with review values
--   4. request_quest_approval / decide_quest_approval RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columns. Readable through the existing quest SELECT policy. They are not
--    added to the column-level UPDATE grant, so only the RPCs below write them.
-- ----------------------------------------------------------------------------
ALTER TABLE public.quests
  ADD COLUMN review_requested_at TIMESTAMPTZ,
  ADD COLUMN review_requested_by UUID
    CONSTRAINT quests_review_requested_by_fkey REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN return_note TEXT
    CONSTRAINT quests_return_note_length CHECK (return_note IS NULL OR char_length(return_note) BETWEEN 1 AND 200);

CREATE INDEX idx_quests_review_requested
  ON public.quests (review_requested_at)
  WHERE review_requested_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Guard: same rules as before, plus completed is reached only by approval.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_quest_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL editor / seeds run without a JWT: no guard.
  -- Solo owners, bosses and managers pass here, so they complete directly.
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

  -- Workers move quests between pending and in-progress only.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND (NEW.status = 'completed' OR OLD.status = 'completed') THEN
    RAISE EXCEPTION 'A boss or manager must approve this quest'
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

-- ----------------------------------------------------------------------------
-- 3. Any status or assignee change ends an open request: a manual move, a
--    release, or release_quests_on_member_leave. Completion also clears the
--    send-back reason. Clients keep the table's INSERT grant (managers post
--    quests), so an insert is stripped of review values here: a request only
--    ever comes from request_quest_approval.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clear_quest_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.review_requested_at := NULL;
    NEW.review_requested_by := NULL;
    NEW.return_note := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
  OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    NEW.review_requested_at := NULL;
    NEW.review_requested_by := NULL;
  END IF;
  IF NEW.status = 'completed' THEN
    NEW.return_note := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quests_clear_review ON public.quests;
CREATE TRIGGER trg_quests_clear_review
  BEFORE INSERT OR UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.clear_quest_review();

-- ----------------------------------------------------------------------------
-- 4a. The assignee (a worker in a guild campaign) asks for approval.
--     Returns the campaign id so the app can refresh the right board.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_quest_approval(p_quest_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest    public.quests%ROWTYPE;
  v_guild_id UUID;
BEGIN
  SELECT * INTO v_quest FROM public.quests WHERE id = p_quest_id;
  IF NOT FOUND OR NOT public.can_access_campaign(v_quest.campaign_id) THEN
    RAISE EXCEPTION 'That quest could not be found' USING ERRCODE = 'P0002';
  END IF;

  SELECT guild_id INTO v_guild_id FROM public.campaigns WHERE id = v_quest.campaign_id;
  IF v_guild_id IS NULL THEN
    RAISE EXCEPTION 'Approval is only for guild campaigns';
  END IF;
  IF public.can_manage_campaign(v_quest.campaign_id) THEN
    RAISE EXCEPTION 'Bosses and managers complete quests directly';
  END IF;
  IF v_quest.status = 'completed' THEN
    RAISE EXCEPTION 'This quest is already completed';
  END IF;
  IF v_quest.assignee_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the quest''s assignee can request approval' USING ERRCODE = '42501';
  END IF;

  UPDATE public.quests
  SET review_requested_at = NOW(),
      review_requested_by = auth.uid(),
      return_note         = NULL
  WHERE id = p_quest_id
    AND review_requested_at IS NULL
    -- Rechecked here, not only above: a manager may complete or reassign the
    -- quest between the read and this update.
    AND status <> 'completed'
    AND assignee_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quest is already awaiting approval';
  END IF;

  RETURN v_quest.campaign_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_quest_approval(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.request_quest_approval(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4b. A boss or manager approves (-> completed) or sends back (-> in-progress
--     with a reason). The conditional UPDATE makes a second, simultaneous
--     decision fail cleanly instead of overwriting the first.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decide_quest_approval(p_quest_id UUID, p_approve BOOLEAN, p_note TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
  -- Strips every kind of whitespace (newlines and tabs too), not just spaces.
  v_note        TEXT := NULLIF(regexp_replace(p_note, '^\s+|\s+$', '', 'g'), '');
BEGIN
  SELECT campaign_id INTO v_campaign_id FROM public.quests WHERE id = p_quest_id;
  IF NOT FOUND OR NOT public.can_access_campaign(v_campaign_id) THEN
    RAISE EXCEPTION 'That quest could not be found' USING ERRCODE = 'P0002';
  END IF;
  IF NOT public.can_manage_campaign(v_campaign_id) THEN
    RAISE EXCEPTION 'Only the guild boss or a manager can approve quests' USING ERRCODE = '42501';
  END IF;
  IF NOT COALESCE(p_approve, FALSE) AND (v_note IS NULL OR char_length(v_note) > 200) THEN
    RAISE EXCEPTION 'Give a reason (1-200 characters) when sending a quest back';
  END IF;

  IF COALESCE(p_approve, FALSE) THEN
    UPDATE public.quests
    SET status = 'completed',
        review_requested_at = NULL,
        review_requested_by = NULL,
        return_note = NULL
    WHERE id = p_quest_id
      AND review_requested_at IS NOT NULL;
  ELSE
    UPDATE public.quests
    SET status = 'in-progress',
        review_requested_at = NULL,
        review_requested_by = NULL,
        return_note = v_note
    WHERE id = p_quest_id
      AND review_requested_at IS NOT NULL;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quest is not awaiting approval';
  END IF;

  RETURN v_campaign_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decide_quest_approval(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.decide_quest_approval(UUID, BOOLEAN, TEXT) TO authenticated;
