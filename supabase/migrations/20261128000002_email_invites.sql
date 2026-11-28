-- ============================================================================
-- EMAIL INVITES (build-plan item 19)
--   A boss or manager invites an email address. No email is sent: a signed-in
--   user whose CONFIRMED account email matches sees the invite on the Team
--   page and can accept it, joining as a worker (the same as a link invite).
-- ============================================================================

CREATE TABLE public.guild_email_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id    UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  email       TEXT NOT NULL CHECK (
                email = lower(trim(email))
                AND char_length(email) BETWEEN 3 AND 254
                AND position('@' IN email) > 1
              ),
  created_by  UUID DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  revoked_at  TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);

-- One live invite per guild and email. Expired-but-live rows are revoked by
-- create_email_invite before it inserts, so an address can be re-invited.
CREATE UNIQUE INDEX uq_guild_email_invites_live
  ON public.guild_email_invites (guild_id, email)
  WHERE revoked_at IS NULL AND accepted_at IS NULL;
CREATE INDEX idx_guild_email_invites_email ON public.guild_email_invites (email);

ALTER TABLE public.guild_email_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guild_email_invites_select_managers"
ON public.guild_email_invites FOR SELECT TO authenticated
USING (public.can_manage_guild(guild_id));

CREATE POLICY "guild_email_invites_insert_managers"
ON public.guild_email_invites FOR INSERT TO authenticated
WITH CHECK (public.can_manage_guild(guild_id) AND created_by = auth.uid());

CREATE POLICY "guild_email_invites_revoke_managers"
ON public.guild_email_invites FOR UPDATE TO authenticated
USING (public.can_manage_guild(guild_id))
WITH CHECK (public.can_manage_guild(guild_id));

REVOKE UPDATE, DELETE ON public.guild_email_invites FROM authenticated, anon;
GRANT  UPDATE (revoked_at) ON public.guild_email_invites TO authenticated;

-- SECURITY INVOKER: RLS decides who may invite (boss or manager only).
CREATE OR REPLACE FUNCTION public.create_email_invite(p_guild_id UUID, p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_id    UUID;
BEGIN
  UPDATE public.guild_email_invites
  SET revoked_at = NOW()
  WHERE guild_id = p_guild_id
    AND email = v_email
    AND revoked_at IS NULL
    AND accepted_at IS NULL
    AND expires_at <= NOW();

  INSERT INTO public.guild_email_invites (guild_id, email, created_by)
  VALUES (p_guild_id, v_email, auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION '% already has a pending invite to this guild.', v_email;
END;
$$;

-- 📌 READ-ME: the invitee is identified by auth.uid() and that account's
-- CONFIRMED email, read here because auth.users is not readable by clients.
-- It returns only guild name and expiry: never the inviter or other emails.
CREATE OR REPLACE FUNCTION public.get_my_email_invites()
RETURNS TABLE (id UUID, guild_id UUID, guild_name TEXT, expires_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.guild_id, g.name, i.expires_at
  FROM public.guild_email_invites i
  JOIN public.guilds g ON g.id = i.guild_id
  JOIN auth.users u ON u.id = auth.uid()
  WHERE u.email_confirmed_at IS NOT NULL
    AND i.email = lower(u.email)
    AND i.revoked_at IS NULL
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW()
    AND NOT EXISTS (
      SELECT 1 FROM public.guild_members m WHERE m.guild_id = i.guild_id AND m.user_id = auth.uid()
    )
  ORDER BY i.created_at DESC;
$$;

-- Every failure raises the same message, so it never confirms that an
-- invite for someone else exists.
CREATE OR REPLACE FUNCTION public.accept_email_invite(p_invite_id UUID)
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

  SELECT i.guild_id INTO v_guild_id
  FROM public.guild_email_invites i
  JOIN auth.users u ON u.id = auth.uid()
  WHERE i.id = p_invite_id
    AND u.email_confirmed_at IS NOT NULL
    AND i.email = lower(u.email)
    AND i.revoked_at IS NULL
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW()
  FOR UPDATE OF i;

  IF v_guild_id IS NULL THEN
    RAISE EXCEPTION 'This invitation is no longer valid.';
  END IF;

  INSERT INTO public.guild_members (guild_id, user_id, role)
  VALUES (v_guild_id, auth.uid(), 'worker')
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  UPDATE public.guild_email_invites SET accepted_at = NOW() WHERE id = p_invite_id;

  RETURN v_guild_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_email_invite(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_email_invites()          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_email_invite(UUID)       FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_email_invite(UUID, TEXT) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_email_invites()          TO authenticated;
GRANT  EXECUTE ON FUNCTION public.accept_email_invite(UUID)       TO authenticated;
