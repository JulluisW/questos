-- ============================================================================
-- FILE 1: TABLES, ENUMS & INDEXES
-- ============================================================================

CREATE TYPE public.guild_role AS ENUM ('boss', 'manager', 'worker');
CREATE TYPE public.quest_status AS ENUM ('pending', 'in-progress', 'completed');
CREATE TYPE public.quest_priorities as ENUM ('low', 'medium', 'high');
CREATE TYPE public.campaign_status AS ENUM ('active', 'archived', 'completed');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_xp INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GUILDS
CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GUILD MEMBERS
CREATE TABLE public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.guild_role DEFAULT 'worker',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_guild_member UNIQUE (guild_id, user_id)
);

CREATE UNIQUE INDEX uq_single_guild_boss 
ON public.guild_members (guild_id) 
WHERE role = 'boss';

-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE, -- NULL = Solo Campaign
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 60),
  ultimate_goal TEXT CHECK (char_length(ultimate_goal) <= 200),
  status public.campaign_status DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUESTS
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 80),
  description TEXT CHECK (char_length(description) <= 200),
  status public.quest_status DEFAULT 'pending',
  priority public.quest_priorities DEFAULT 'low',
  is_milestone BOOLEAN DEFAULT FALSE,
  xp_reward INT CHECK (xp_reward IS NULL OR (xp_reward >= 10 AND xp_reward <= 500)),
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX idx_guild_members_user_guild ON public.guild_members(user_id, guild_id);
CREATE INDEX idx_campaigns_guild_status ON public.campaigns(guild_id, status) WHERE guild_id IS NOT NULL;
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by) WHERE guild_id IS NULL;
CREATE INDEX idx_quests_campaign_status ON public.quests(campaign_id, status);
CREATE INDEX idx_quests_assignee ON public.quests(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_quests_priority ON public.quests(priority);