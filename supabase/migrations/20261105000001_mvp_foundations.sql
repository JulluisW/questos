-- ============================================================================
-- MVP FOUNDATIONS
--   1. Remove the XP system (deferred to post-MVP)
--   2. Shared access helper + rewritten campaign/quest RLS policies
--      (closes cross-guild campaign injection and quest re-parenting)
--   3. Column-level UPDATE grants (ownership columns become immutable)
--   4. Housekeeping triggers: completed_at, campaigns.updated_at
--   5. Collision-safe usernames on signup
--   6. forge_campaign_with_quests without XP, pinned search_path
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. XP removal
-- ----------------------------------------------------------------------------
ALTER TABLE public.quests   DROP COLUMN IF EXISTS xp_reward;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_xp;

-- ----------------------------------------------------------------------------
-- 2. Access helper: can the current user see/work inside a campaign?
--    Solo campaign  -> only its creator
--    Guild campaign -> any member of that guild
--    SECURITY DEFINER so quest policies don't recurse through campaigns RLS.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_campaign(p_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND (
        (c.guild_id IS NULL AND c.created_by = auth.uid())
        OR (c.guild_id IS NOT NULL AND c.guild_id IN (SELECT public.get_my_guild_ids()))
      )
  );
$$;

-- Campaigns -------------------------------------------------------------------
DROP POLICY IF EXISTS "View campaign policy"   ON public.campaigns;
DROP POLICY IF EXISTS "Create campaign policy" ON public.campaigns;
DROP POLICY IF EXISTS "Update campaign policy" ON public.campaigns;

CREATE POLICY "campaigns_select"
ON public.campaigns FOR SELECT TO authenticated
USING (
  (guild_id IS NULL AND created_by = auth.uid())
  OR (guild_id IS NOT NULL AND guild_id IN (SELECT public.get_my_guild_ids()))
);

CREATE POLICY "campaigns_insert"
ON public.campaigns FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (guild_id IS NULL OR guild_id IN (SELECT public.get_my_guild_ids()))
);

CREATE POLICY "campaigns_update"
ON public.campaigns FOR UPDATE TO authenticated
USING (
  (guild_id IS NULL AND created_by = auth.uid())
  OR (guild_id IS NOT NULL AND guild_id IN (SELECT public.get_my_guild_ids()))
)
WITH CHECK (
  (guild_id IS NULL AND created_by = auth.uid())
  OR (guild_id IS NOT NULL AND guild_id IN (SELECT public.get_my_guild_ids()))
);

CREATE POLICY "campaigns_delete"
ON public.campaigns FOR DELETE TO authenticated
USING (guild_id IS NULL AND created_by = auth.uid());

-- Quests ----------------------------------------------------------------------
DROP POLICY IF EXISTS "View quest policy"          ON public.quests;
DROP POLICY IF EXISTS "Insert quest policy"        ON public.quests;
DROP POLICY IF EXISTS "Update quest status policy" ON public.quests;

CREATE POLICY "quests_select"
ON public.quests FOR SELECT TO authenticated
USING (public.can_access_campaign(campaign_id));

CREATE POLICY "quests_insert"
ON public.quests FOR INSERT TO authenticated
WITH CHECK (public.can_access_campaign(campaign_id));

CREATE POLICY "quests_update"
ON public.quests FOR UPDATE TO authenticated
USING (public.can_access_campaign(campaign_id))
WITH CHECK (public.can_access_campaign(campaign_id));

CREATE POLICY "quests_delete"
ON public.quests FOR DELETE TO authenticated
USING (public.can_access_campaign(campaign_id));

-- Profiles: explicit WITH CHECK so a row can't be re-keyed to another user
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. Column-level UPDATE grants
--    Ownership / parent columns (created_by, guild_id, campaign_id, id, ...)
--    can no longer be changed through the API at all.
-- ----------------------------------------------------------------------------
REVOKE UPDATE ON public.campaigns FROM authenticated, anon;
GRANT  UPDATE (name, ultimate_goal, status) ON public.campaigns TO authenticated;

REVOKE UPDATE ON public.quests FROM authenticated, anon;
GRANT  UPDATE (title, description, status, priority, is_milestone, assignee_id, archived_at)
  ON public.quests TO authenticated;

REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT  UPDATE (username, full_name, avatar_url) ON public.profiles TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. Housekeeping triggers
-- ----------------------------------------------------------------------------
-- completed_at is derived from status, never trusted from the client
CREATE OR REPLACE FUNCTION public.sync_quest_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed' THEN
      NEW.completed_at := NOW();
    END IF;
  ELSE
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quests_completed_at ON public.quests;
CREATE TRIGGER trg_quests_completed_at
  BEFORE INSERT OR UPDATE OF status ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.sync_quest_completed_at();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_quests_completed_at
  ON public.quests (completed_at DESC) WHERE completed_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Collision-safe usernames
--    "john@a.com" and "john@b.com" no longer break signup on the UNIQUE index.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base     TEXT;
  v_username TEXT;
BEGIN
  v_base := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'adventurer'
  );
  v_username := v_base;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := v_base || '_' || substr(md5(random()::TEXT), 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    v_username,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Atomic campaign + quest creation (XP-free)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forge_campaign_with_quests(
  p_name TEXT,
  p_ultimate_goal TEXT,
  p_guild_id UUID,
  p_quests JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER -- RLS of the calling user still applies
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
  v_quest JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_name IS NULL OR char_length(trim(p_name)) < 3 OR char_length(trim(p_name)) > 60 THEN
    RAISE EXCEPTION 'Campaign name must be between 3 and 60 characters';
  END IF;

  INSERT INTO public.campaigns (name, ultimate_goal, guild_id, created_by)
  VALUES (trim(p_name), NULLIF(trim(p_ultimate_goal), ''), p_guild_id, auth.uid())
  RETURNING id INTO v_campaign_id;

  IF p_quests IS NOT NULL AND jsonb_typeof(p_quests) = 'array' AND jsonb_array_length(p_quests) > 0 THEN
    FOR v_quest IN SELECT * FROM jsonb_array_elements(p_quests)
    LOOP
      INSERT INTO public.quests (campaign_id, title, description, status, priority, is_milestone)
      VALUES (
        v_campaign_id,
        v_quest->>'title',
        v_quest->>'description',
        COALESCE((v_quest->>'status')::public.quest_status, 'pending'),
        COALESCE((v_quest->>'priority')::public.quest_priorities, 'low'),
        COALESCE((v_quest->>'is_milestone')::BOOLEAN, FALSE)
      );
    END LOOP;
  END IF;

  RETURN v_campaign_id;
END;
$$;
