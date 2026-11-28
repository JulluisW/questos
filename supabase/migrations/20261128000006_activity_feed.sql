-- ============================================================================
-- ACTIVITY FEED (build-plan item 23)
--   Derived on read from existing timestamps: no new table. The main feed is
--   SECURITY INVOKER, so the existing RLS decides every row a user sees.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_activity_feed(p_limit INTEGER DEFAULT 15)
RETURNS TABLE (
  kind TEXT,
  occurred_at TIMESTAMPTZ,
  ref_id TEXT,
  campaign_id UUID,
  campaign_name TEXT,
  guild_name TEXT,
  actor TEXT,
  detail TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH lim AS (SELECT LEAST(GREATEST(COALESCE(p_limit, 15), 1), 50) AS n)
  SELECT e.* FROM (
    (SELECT 'quest_completed'::TEXT, q.completed_at, q.id::TEXT, c.id, c.name, NULL::TEXT, NULL::TEXT, q.title
     FROM public.quests q
     JOIN public.campaigns c ON c.id = q.campaign_id
     WHERE q.completed_at IS NOT NULL
     ORDER BY q.completed_at DESC
     LIMIT (SELECT n FROM lim))
    UNION ALL
    (SELECT 'campaign_created', c.created_at, c.id::TEXT, c.id, c.name, NULL, p.username, NULL
     FROM public.campaigns c
     LEFT JOIN public.profiles p ON p.id = c.created_by
     WHERE c.template_id IS NULL AND c.created_at IS NOT NULL
     ORDER BY c.created_at DESC
     LIMIT (SELECT n FROM lim))
    UNION ALL
    (SELECT 'template_adopted', c.created_at, c.id::TEXT, c.id, c.name, NULL, p.username, NULL
     FROM public.campaigns c
     LEFT JOIN public.profiles p ON p.id = c.created_by
     WHERE c.template_id IS NOT NULL AND c.created_at IS NOT NULL
     ORDER BY c.created_at DESC
     LIMIT (SELECT n FROM lim))
    UNION ALL
    (SELECT 'member_joined', m.joined_at, m.id::TEXT, NULL::UUID, NULL, g.name, p.username, NULL
     FROM public.guild_members m
     JOIN public.guilds g ON g.id = m.guild_id
     LEFT JOIN public.profiles p ON p.id = m.user_id
     WHERE m.joined_at IS NOT NULL
     ORDER BY m.joined_at DESC
     LIMIT (SELECT n FROM lim))
  ) AS e (kind, occurred_at, ref_id, campaign_id, campaign_name, guild_name, actor, detail)
  ORDER BY e.occurred_at DESC
  LIMIT (SELECT n FROM lim);
$$;

-- 📌 READ-ME: the one exception to "only what you can already see". A
-- template's creator learns that someone adopted it: the adopter's username
-- and the time, never the adopted campaign's id, name or contents. Adoptions
-- the creator can already see in the main feed are skipped, so nothing
-- appears twice. The creator must still be able to see the template itself:
-- after leaving its guild they learn nothing more about it.
CREATE OR REPLACE FUNCTION public.get_my_template_adoptions(p_limit INTEGER DEFAULT 15)
RETURNS TABLE (occurred_at TIMESTAMPTZ, template_id UUID, template_name TEXT, adopter_username TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.created_at, t.id, t.name, p.username
  FROM public.campaigns a
  JOIN public.campaigns t ON t.id = a.template_id
  LEFT JOIN public.profiles p ON p.id = a.created_by
  WHERE auth.uid() IS NOT NULL
    AND t.created_by = auth.uid()
    AND public.can_access_campaign(t.id)
    AND a.created_by IS DISTINCT FROM auth.uid()
    AND NOT public.can_access_campaign(a.id)
  ORDER BY a.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 15), 1), 50);
$$;

REVOKE EXECUTE ON FUNCTION public.get_activity_feed(INTEGER)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_template_adoptions(INTEGER) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_activity_feed(INTEGER)         TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_template_adoptions(INTEGER) TO authenticated;
