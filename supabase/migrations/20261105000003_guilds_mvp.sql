-- ============================================================================
-- GUILDS MVP
--   1. Role helpers (boss / manager / worker)
--   2. Role-aware campaign + quest policies
--   3. Worker guard: workers may only move status / claim quests
--   4. Assignee must belong to the campaign's audience
--   5. Membership management (role change, remove, leave)
--   6. Invite links + RPCs: create_guild, preview/accept invite
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Role helpers (SECURITY DEFINER: read guild_members without RLS recursion)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_guild_role(p_guild_id UUID)
RETURNS public.guild_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.guild_members
  WHERE guild_id = p_guild_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_manage_guild(p_guild_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_my_guild_role(p_guild_id) IN ('boss', 'manager'), FALSE);
$$;

-- Solo campaign -> creator; guild campaign -> boss or manager of that guild
CREATE OR REPLACE FUNCTION public.can_manage_campaign(p_campaign_id UUID)
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
        OR (c.guild_id IS NOT NULL AND public.can_manage_guild(c.guild_id))
      )
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Role-aware policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "campaigns_insert" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_update" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_delete" ON public.campaigns;

CREATE POLICY "campaigns_insert"
ON public.campaigns FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (guild_id IS NULL OR public.can_manage_guild(guild_id))
);

CREATE POLICY "campaigns_update"
ON public.campaigns FOR UPDATE TO authenticated
USING (
  (guild_id IS NULL AND created_by = auth.uid())
  OR (guild_id IS NOT NULL AND public.can_manage_guild(guild_id))
)
WITH CHECK (
  (guild_id IS NULL AND created_by = auth.uid())
  OR (guild_id IS NOT NULL AND public.can_manage_guild(guild_id))
);

CREATE POLICY "campaigns_delete"
ON public.campaigns FOR DELETE TO authenticated
USING (
  (guild_id IS NULL AND created_by = auth.uid())
  OR (guild_id IS NOT NULL AND public.get_my_guild_role(guild_id) = 'boss')
);

DROP POLICY IF EXISTS "quests_insert" ON public.quests;
DROP POLICY IF EXISTS "quests_delete" ON public.quests;

CREATE POLICY "quests_insert"
ON public.quests FOR INSERT TO authenticated
WITH CHECK (public.can_manage_campaign(campaign_id));

CREATE POLICY "quests_delete"
ON public.quests FOR DELETE TO authenticated
USING (public.can_manage_campaign(campaign_id));
-- quests_update stays "any member of the campaign"; the guard below narrows workers.

-- ----------------------------------------------------------------------------
-- 3. Worker guard
-- ----------------------------------------------------------------------------
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
  OR NEW.archived_at  IS DISTINCT FROM OLD.archived_at THEN
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

DROP TRIGGER IF EXISTS trg_quests_guard_update ON public.quests;
CREATE TRIGGER trg_quests_guard_update
  BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.guard_quest_update();

-- ----------------------------------------------------------------------------
-- 4. Assignee validation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_quest_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guild_id UUID;
  v_creator  UUID;
BEGIN
  IF NEW.assignee_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT guild_id, created_by INTO v_guild_id, v_creator
  FROM public.campaigns WHERE id = NEW.campaign_id;

  IF v_guild_id IS NULL THEN
    IF NEW.assignee_id IS DISTINCT FROM v_creator THEN
      RAISE EXCEPTION 'Solo campaign quests can only be assigned to the campaign owner'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.guild_members
    WHERE guild_id = v_guild_id AND user_id = NEW.assignee_id
  ) THEN
    RAISE EXCEPTION 'Assignee must be a member of the guild'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quests_validate_assignee ON public.quests;
CREATE TRIGGER trg_quests_validate_assignee
  BEFORE INSERT OR UPDATE OF assignee_id ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.validate_quest_assignee();

-- ----------------------------------------------------------------------------
-- 5. Membership management
-- ----------------------------------------------------------------------------
-- Only the role column is ever updatable through the API.
REVOKE INSERT, UPDATE ON public.guild_members FROM authenticated, anon;
GRANT  UPDATE (role) ON public.guild_members TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.guilds FROM authenticated, anon;

-- Boss promotes/demotes non-boss members between manager and worker.
CREATE POLICY "guild_members_update_role_by_boss"
ON public.guild_members FOR UPDATE TO authenticated
USING (public.get_my_guild_role(guild_id) = 'boss' AND role <> 'boss')
WITH CHECK (public.get_my_guild_role(guild_id) = 'boss' AND role IN ('manager', 'worker'));

-- Boss removes non-boss members; anyone but the boss can leave on their own.
CREATE POLICY "guild_members_delete"
ON public.guild_members FOR DELETE TO authenticated
USING (
  role <> 'boss'
  AND (user_id = auth.uid() OR public.get_my_guild_role(guild_id) = 'boss')
);

-- Departing members release their quests in that guild.
CREATE OR REPLACE FUNCTION public.release_quests_on_member_leave()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quests q
  SET assignee_id = NULL
  FROM public.campaigns c
  WHERE q.campaign_id = c.id
    AND c.guild_id = OLD.guild_id
    AND q.assignee_id = OLD.user_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guild_members_release_quests ON public.guild_members;
CREATE TRIGGER trg_guild_members_release_quests
  AFTER DELETE ON public.guild_members
  FOR EACH ROW EXECUTE FUNCTION public.release_quests_on_member_leave();

-- ----------------------------------------------------------------------------
-- 6. Invites + guild RPCs
-- ----------------------------------------------------------------------------
CREATE TABLE public.guild_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id   UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  token      UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by UUID DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_guild_invites_guild ON public.guild_invites (guild_id, created_at DESC);

ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guild_invites_select_managers"
ON public.guild_invites FOR SELECT TO authenticated
USING (public.can_manage_guild(guild_id));

CREATE POLICY "guild_invites_insert_managers"
ON public.guild_invites FOR INSERT TO authenticated
WITH CHECK (public.can_manage_guild(guild_id) AND created_by = auth.uid());

CREATE POLICY "guild_invites_revoke_managers"
ON public.guild_invites FOR UPDATE TO authenticated
USING (public.can_manage_guild(guild_id))
WITH CHECK (public.can_manage_guild(guild_id));

REVOKE UPDATE, DELETE ON public.guild_invites FROM authenticated, anon;
GRANT  UPDATE (revoked_at) ON public.guild_invites TO authenticated;

-- Create a guild and make the caller its boss, atomically.
CREATE OR REPLACE FUNCTION public.create_guild(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name     TEXT := trim(p_name);
  v_slug     TEXT;
  v_guild_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_name IS NULL OR char_length(v_name) < 3 OR char_length(v_name) > 60 THEN
    RAISE EXCEPTION 'Guild name must be between 3 and 60 characters';
  END IF;

  v_slug := trim(BOTH '-' FROM lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')));
  v_slug := COALESCE(NULLIF(v_slug, ''), 'guild') || '-' || substr(md5(random()::TEXT), 1, 6);

  INSERT INTO public.guilds (name, slug) VALUES (v_name, v_slug)
  RETURNING id INTO v_guild_id;

  INSERT INTO public.guild_members (guild_id, user_id, role)
  VALUES (v_guild_id, auth.uid(), 'boss');

  RETURN v_guild_id;
END;
$$;

-- Lets a not-yet-member see which guild an invite is for.
CREATE OR REPLACE FUNCTION public.preview_guild_invite(p_token UUID)
RETURNS TABLE (guild_id UUID, guild_name TEXT, member_count BIGINT, already_member BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    (SELECT COUNT(*) FROM public.guild_members m WHERE m.guild_id = g.id),
    EXISTS (SELECT 1 FROM public.guild_members m WHERE m.guild_id = g.id AND m.user_id = auth.uid())
  FROM public.guild_invites i
  JOIN public.guilds g ON g.id = i.guild_id
  WHERE i.token = p_token
    AND i.revoked_at IS NULL
    AND i.expires_at > NOW()
    AND auth.uid() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.accept_guild_invite(p_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guild_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT guild_id INTO v_guild_id
  FROM public.guild_invites
  WHERE token = p_token AND revoked_at IS NULL AND expires_at > NOW();

  IF v_guild_id IS NULL THEN
    RAISE EXCEPTION 'This invite link is invalid or has expired';
  END IF;

  INSERT INTO public.guild_members (guild_id, user_id, role)
  VALUES (v_guild_id, auth.uid(), 'worker')
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  RETURN v_guild_id;
END;
$$;

-- Functions are executable by PUBLIC by default; limit these to signed-in users.
REVOKE EXECUTE ON FUNCTION public.create_guild(TEXT)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.preview_guild_invite(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_guild_invite(UUID)  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_guild(TEXT)         TO authenticated;
GRANT  EXECUTE ON FUNCTION public.preview_guild_invite(UUID) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.accept_guild_invite(UUID)  TO authenticated;
