-- ============================================================================
-- PASSWORD RESET: "No account found" (build-plan item 24, user decision
-- 2026-11-28). The reset form tells a visitor when no account uses an email,
-- so it needs a yes/no answer that anon can ask for. Functions only.
-- ============================================================================

-- 📌 READ-ME: SECURITY DEFINER because auth.users is not readable by anon or
-- authenticated. It answers only true/false, never an id or any other column.
-- Anyone with the public anon key can call it, so it deliberately reveals
-- whether an email has an account: the product choice the user made.
CREATE OR REPLACE FUNCTION public.account_exists_for_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE lower(u.email) = lower(trim(p_email))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.account_exists_for_email(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.account_exists_for_email(TEXT) TO anon, authenticated;
