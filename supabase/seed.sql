-- ============================================================================
-- FILE: supabase/seed.sql
-- PURPOSE: Automated Local Seed Fixtures for QuestOS
-- ============================================================================

DO $$
DECLARE
  v_password TEXT := extensions.crypt('12345678', extensions.gen_salt('bf'));
  v_arthur_id UUID := '11111111-1111-1111-1111-111111111111';
  v_merlin_id UUID := '22222222-2222-2222-2222-222222222222';
  v_guild_id  UUID := '33333333-3333-3333-3333-333333333333';
  v_guild_camp_id UUID := '44444444-4444-4444-4444-444444444444';
  v_solo_camp_id  UUID := '55555555-5555-5555-5555-555555555555';
BEGIN

  -- 1. Create Accounts in auth.users (with GoTrue raw_app_meta_data)
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

  -- 2. Register GoTrue Provider Mapping in auth.identities
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

  -- 3. Create Guild
  INSERT INTO public.guilds (id, name, slug)
  VALUES (v_guild_id, 'Round Table Engineering', 'round-table')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Add Arthur as Guild Boss
  INSERT INTO public.guild_members (guild_id, user_id, role)
  VALUES (v_guild_id, v_arthur_id, 'boss')
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  -- 5. Create Guild Campaign
  INSERT INTO public.campaigns (id, guild_id, name, ultimate_goal, created_by)
  VALUES (
    v_guild_camp_id, v_guild_id, 'Excalibur OAuth Middleware',
    'Implement Next.js 16 Edge Session Proxy with Supabase SSR', v_arthur_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- 6. Create Solo Campaign
  INSERT INTO public.campaigns (id, guild_id, name, ultimate_goal, created_by)
  VALUES (
    v_solo_camp_id, NULL, 'Merlin Personal Alchemy Experiments',
    'Refactor cold-pressed potion recipes with Next.js App Router', v_merlin_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- 7. Insert Quests
  INSERT INTO public.quests (
    campaign_id, title, description, status, priority, is_milestone, xp_reward, assignee_id
  )
  VALUES
    (
      v_guild_camp_id, 'Configure proxy.ts Edge Cookie Reader',
      'Ensure unauthenticated users get redirected to /login in <15ms',
      'completed', 'high', true, 250, v_arthur_id
    ),
    (
      v_guild_camp_id, 'Audit Mercenary RLS Policies',
      'Ensure external contractors can only update status on assigned tasks',
      'in-progress', 'medium', false, NULL, v_merlin_id
    ),
    (
      v_solo_camp_id, 'Brew Beetroot & Ginger Hydration Formula',
      'Solo task inside personal campaign',
      'pending', 'low', false, 50, v_merlin_id
    )
  ON CONFLICT DO NOTHING;

END $$;