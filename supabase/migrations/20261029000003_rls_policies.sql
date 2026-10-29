-- ============================================================================
-- FILE 3: ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 2. GUILDS (Uses SECURITY DEFINER helper)
CREATE POLICY "Guild members can view their guild"
ON public.guilds FOR SELECT TO authenticated
USING (id IN (SELECT public.get_my_guild_ids()));

-- 3. GUILD MEMBERS (Fixed: Uses SECURITY DEFINER helper to prevent self-recursion)
CREATE POLICY "View teammates in same guild"
ON public.guild_members FOR SELECT TO authenticated
USING (guild_id IN (SELECT public.get_my_guild_ids()));

-- 4. CAMPAIGNS (Solo vs Guild Branching)
CREATE POLICY "View campaign policy"
ON public.campaigns FOR SELECT TO authenticated
USING (
  CASE 
    WHEN guild_id IS NULL THEN created_by = auth.uid()
    ELSE guild_id IN (SELECT public.get_my_guild_ids())
  END
);

CREATE POLICY "Create campaign policy"
ON public.campaigns FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Update campaign policy"
ON public.campaigns FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR (
    guild_id IS NOT NULL 
    AND guild_id IN (SELECT public.get_my_guild_ids())
  )
);

-- 5. QUESTS (Uses SECURITY DEFINER helper across all campaign checks)
CREATE POLICY "View quest policy"
ON public.quests FOR SELECT TO authenticated
USING (
  assignee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = quests.campaign_id
      AND (
        c.created_by = auth.uid()
        OR (c.guild_id IS NOT NULL AND c.guild_id IN (SELECT public.get_my_guild_ids()))
      )
  )
);

CREATE POLICY "Insert quest policy"
ON public.quests FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = quests.campaign_id
      AND (
        c.created_by = auth.uid()
        OR (c.guild_id IS NOT NULL AND c.guild_id IN (SELECT public.get_my_guild_ids()))
      )
  )
);

CREATE POLICY "Update quest status policy"
ON public.quests FOR UPDATE TO authenticated
USING (
  assignee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = quests.campaign_id
      AND (
        c.created_by = auth.uid()
        OR (c.guild_id IS NOT NULL AND c.guild_id IN (SELECT public.get_my_guild_ids()))
      )
  )
);