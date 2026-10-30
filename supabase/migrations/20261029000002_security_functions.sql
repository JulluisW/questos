-- ============================================================================
-- FILE 2: SECURITY DEFINER FUNCTIONS & TRIGGERS
-- ============================================================================

-- 1. Helper Function: Fetches guild IDs bypassing RLS (Prevents 42P17 recursion)
CREATE OR REPLACE FUNCTION public.get_my_guild_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT guild_id 
  FROM public.guild_members 
  WHERE user_id = auth.uid();
$$;

-- 2. Trigger Function: Sync auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();