-- ============================================================================
-- CAMPAIGN TEMPLATES (build-plan item 22)
--   A template is a campaign its creator deliberately shares. Every signed-in
--   user can list shared templates and start a campaign from one. Stats are
--   aggregate counts only: nobody learns who adopted a template.
-- ============================================================================

ALTER TABLE public.campaigns
  ADD COLUMN shared_at   TIMESTAMPTZ,
  ADD COLUMN template_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX idx_campaigns_shared ON public.campaigns (shared_at) WHERE shared_at IS NOT NULL;
CREATE INDEX idx_campaigns_template ON public.campaigns (template_id) WHERE template_id IS NOT NULL;

-- 📌 READ-ME: clients may only insert these columns. shared_at and
-- template_id are set solely by the functions below, so nobody can fake an
-- adoption or share a campaign they did not create.
REVOKE INSERT ON public.campaigns FROM authenticated, anon;
GRANT  INSERT (name, ultimate_goal, status, guild_id, created_by) ON public.campaigns TO authenticated;

-- 📌 READ-ME: a template is live only while its creator still exists and,
-- for a guild campaign, is still a boss or manager of that guild. Leaving the
-- guild, being removed or being demoted takes the template down at once, so a
-- former member can never keep reading or copying the guild's plan.
CREATE OR REPLACE FUNCTION public.is_live_template(p_campaign_id UUID)
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
      AND c.shared_at IS NOT NULL
      AND c.created_by IS NOT NULL
      AND (
        c.guild_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.guild_members m
          WHERE m.guild_id = c.guild_id AND m.user_id = c.created_by AND m.role IN ('boss', 'manager')
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.set_campaign_shared(p_campaign_id UUID, p_shared BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- Stopping is always allowed for the creator; sharing a guild campaign also
  -- needs them to still manage that guild.
  UPDATE public.campaigns
  SET shared_at = CASE WHEN p_shared THEN COALESCE(shared_at, NOW()) END
  WHERE id = p_campaign_id
    AND created_by = auth.uid()
    AND (NOT p_shared OR guild_id IS NULL OR public.can_manage_guild(guild_id));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only the campaign''s creator can share it as a template, and only while they manage its guild.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_templates()
RETURNS TABLE (
  id UUID,
  name TEXT,
  ultimate_goal TEXT,
  creator_username TEXT,
  shared_at TIMESTAMPTZ,
  is_mine BOOLEAN,
  quest_count INTEGER,
  top_quests JSONB,
  adopted INTEGER,
  finished INTEGER,
  users INTEGER,
  guilds INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.name,
    t.ultimate_goal,
    p.username,
    t.shared_at,
    t.created_by = auth.uid(),
    (SELECT COUNT(*) FROM public.quests q WHERE q.campaign_id = t.id)::INTEGER,
    COALESCE((
      SELECT jsonb_agg(top.title ORDER BY top.position, top.created_at)
      FROM (
        SELECT q.title, q.position, q.created_at
        FROM public.quests q
        WHERE q.campaign_id = t.id
        ORDER BY q.position, q.created_at
        LIMIT 5
      ) top
    ), '[]'::jsonb),
    COALESCE(stats.adopted, 0),
    COALESCE(stats.finished, 0),
    COALESCE(stats.users, 0),
    COALESCE(stats.guilds, 0)
  FROM public.campaigns t
  LEFT JOIN public.profiles p ON p.id = t.created_by
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::INTEGER AS adopted,
      COUNT(*) FILTER (WHERE a.status = 'completed')::INTEGER AS finished,
      COUNT(DISTINCT a.created_by) FILTER (WHERE a.guild_id IS NULL)::INTEGER AS users,
      COUNT(DISTINCT a.guild_id)::INTEGER AS guilds
    FROM public.campaigns a
    WHERE a.template_id = t.id
  ) stats ON TRUE
  WHERE auth.uid() IS NOT NULL
    AND public.is_live_template(t.id)
  ORDER BY COALESCE(stats.adopted, 0) DESC, t.shared_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.adopt_template(p_template_id UUID, p_guild_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template public.campaigns%ROWTYPE;
  v_campaign_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_template FROM public.campaigns WHERE id = p_template_id AND public.is_live_template(id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This template is no longer shared.';
  END IF;

  IF p_guild_id IS NOT NULL AND NOT public.can_manage_guild(p_guild_id) THEN
    RAISE EXCEPTION 'Only the guild boss or a manager can add campaigns to this guild.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.campaigns (name, ultimate_goal, guild_id, created_by, template_id)
  VALUES (v_template.name, v_template.ultimate_goal, p_guild_id, auth.uid(), v_template.id)
  RETURNING id INTO v_campaign_id;

  -- Copies keep the template's board order (the position trigger appends in
  -- insert order); they start pending and unassigned.
  INSERT INTO public.quests (campaign_id, title, description, priority, is_milestone)
  SELECT v_campaign_id, q.title, q.description, q.priority, q.is_milestone
  FROM public.quests q
  WHERE q.campaign_id = v_template.id
  ORDER BY q.position, q.created_at;

  RETURN v_campaign_id;
END;
$$;

-- Used only inside the functions above; no client may call it.
REVOKE EXECUTE ON FUNCTION public.is_live_template(UUID)            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_campaign_shared(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_templates()                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.adopt_template(UUID, UUID)        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_campaign_shared(UUID, BOOLEAN) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.list_templates()                  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.adopt_template(UUID, UUID)        TO authenticated;
