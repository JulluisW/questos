-- ============================================================================
-- FILE: supabase/seed.sql
-- PURPOSE: Local / demo seed fixtures for QuestOS
--
-- Demo accounts (password: 12345678)
--   arthur@questos.dev  -> boss of "Round Table Engineering" + a solo campaign
--   merlin@questos.dev  -> worker in the guild + his own solo campaign
-- ============================================================================

DO $$
DECLARE
  v_password      TEXT := extensions.crypt('12345678', extensions.gen_salt('bf'));
  v_arthur_id     UUID := '11111111-1111-1111-1111-111111111111';
  v_merlin_id     UUID := '22222222-2222-2222-2222-222222222222';
  v_guild_id      UUID := '33333333-3333-3333-3333-333333333333';
  v_guild_camp_id UUID := '44444444-4444-4444-4444-444444444444';
  v_solo_camp_id  UUID := '55555555-5555-5555-5555-555555555555';
  v_arthur_solo   UUID := '66666666-6666-6666-6666-666666666666';
BEGIN

  -- 1. Accounts (auth.users -> trigger creates public.profiles)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud, is_sso_user
  )
  VALUES
    (
      v_arthur_id, '00000000-0000-0000-0000-000000000000', 'arthur@questos.dev', v_password, NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"username": "arthur_boss", "full_name": "King Arthur"}'::jsonb,
      'authenticated', 'authenticated', false
    ),
    (
      v_merlin_id, '00000000-0000-0000-0000-000000000000', 'merlin@questos.dev', v_password, NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"username": "merlin_wizard", "full_name": "Merlin Ambrosius"}'::jsonb,
      'authenticated', 'authenticated', false
    )
  ON CONFLICT (id) DO UPDATE
  SET
    encrypted_password = EXCLUDED.encrypted_password,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data;

  -- 2. GoTrue identities (required for email/password sign-in)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES
    (
      v_arthur_id, v_arthur_id,
      format('{"sub":"%s","email":"arthur@questos.dev"}', v_arthur_id)::jsonb,
      'email', 'arthur@questos.dev', NOW(), NOW(), NOW()
    ),
    (
      v_merlin_id, v_merlin_id,
      format('{"sub":"%s","email":"merlin@questos.dev"}', v_merlin_id)::jsonb,
      'email', 'merlin@questos.dev', NOW(), NOW(), NOW()
    )
  ON CONFLICT (provider, provider_id) DO UPDATE
  SET identity_data = EXCLUDED.identity_data;

  -- 3. Guild with Arthur as boss and Merlin as worker
  INSERT INTO public.guilds (id, name, slug)
  VALUES (v_guild_id, 'Round Table Engineering', 'round-table')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.guild_members (guild_id, user_id, role)
  VALUES
    (v_guild_id, v_arthur_id, 'boss'),
    (v_guild_id, v_merlin_id, 'worker')
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  -- 4. Campaigns
  INSERT INTO public.campaigns (id, guild_id, name, ultimate_goal, created_by)
  VALUES
    (
      v_guild_camp_id, v_guild_id, 'Excalibur Auth Launch',
      'Ship secure email sign-in with edge session checks for the whole realm', v_arthur_id
    ),
    (
      v_arthur_solo, NULL, 'Marathon Preparation',
      'Finish the Camelot half-marathon under two hours', v_arthur_id
    ),
    (
      v_solo_camp_id, NULL, 'Personal Alchemy Experiments',
      'Perfect three hydration potions before the winter solstice', v_merlin_id
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Quests (completed_at is filled by trigger from status)
  INSERT INTO public.quests (campaign_id, title, description, status, priority, is_milestone, assignee_id)
  VALUES
    -- Guild campaign
    (v_guild_camp_id, 'Configure proxy.ts session gate',
      'Redirect unauthenticated visitors to /login before any page renders',
      'completed', 'high', true, v_arthur_id),
    (v_guild_camp_id, 'Audit row-level security policies',
      'Workers may only move status on quests inside their own guild',
      'in-progress', 'high', false, v_merlin_id),
    (v_guild_camp_id, 'Design the sign-in parchment',
      'Login and signup screens in the tavern style',
      'completed', 'medium', false, v_merlin_id),
    (v_guild_camp_id, 'Write invite link flow',
      'Bosses share a link, new knights join as workers',
      'pending', 'medium', false, NULL),
    (v_guild_camp_id, 'Launch to the whole realm',
      'Production deploy with monitoring',
      'pending', 'high', true, NULL),
    -- Arthur solo
    (v_arthur_solo, 'Run 5k three times this week', NULL, 'in-progress', 'medium', false, v_arthur_id),
    (v_arthur_solo, 'Buy proper running boots', 'No more plate armour on the track', 'completed', 'low', false, v_arthur_id),
    (v_arthur_solo, 'Complete a 15k long run', NULL, 'pending', 'high', true, NULL),
    -- Merlin solo
    (v_solo_camp_id, 'Brew beetroot & ginger hydration formula',
      'First of three potions', 'pending', 'low', false, v_merlin_id)
  ON CONFLICT DO NOTHING;

END $$;
