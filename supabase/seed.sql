-- ============================================================================
-- FILE: supabase/seed.sql
-- PURPOSE: Showcase data for QuestOS demos and local development
--
-- Every demo account uses the password 12345678.
--
--   arthur@questos.dev     Boss of Round Table Engineering, manager in Avalon
--                          Creative, plus two solo campaigns. Start here.
--   guinevere@questos.dev  Manager in Round Table, boss of Avalon Creative
--   merlin@questos.dev     Worker in Round Table, plus a solo campaign
--   lancelot@questos.dev   Worker in Round Table
--   gawain@questos.dev     Worker in Round Table and Avalon Creative
--
-- All timestamps are relative to NOW(), so the dashboard ("completed this
-- week"), the Hall of Records and the campaign ordering look recent whenever
-- the seed runs.
--
-- Re-runnable: running this file again (psql -f supabase/seed.sql) resets the
-- demo accounts. It deletes guilds they lead, campaigns they created and their
-- AI usage, then recreates everything below. Other users are not touched.
--
-- Invite tokens are random on purpose: a token committed to a public repo
-- would let anyone join the demo guild on a hosted database.
-- ============================================================================

DO $$
DECLARE
  v_password    TEXT := extensions.crypt('12345678', extensions.gen_salt('bf'));

  -- People
  v_arthur      UUID := '11111111-1111-1111-1111-111111111111';
  v_merlin      UUID := '22222222-2222-2222-2222-222222222222';
  v_guinevere   UUID := '88888888-8888-8888-8888-888888888888';
  v_lancelot    UUID := '99999999-9999-9999-9999-999999999999';
  v_gawain      UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_demo_users  UUID[];

  -- Guilds
  v_round_table UUID := '33333333-3333-3333-3333-333333333333';
  v_avalon      UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  -- Campaigns
  c_auth        UUID := '44444444-4444-4444-4444-444444444444'; -- Round Table, active
  c_mobile      UUID := 'c0000000-0000-0000-0000-000000000001'; -- Round Table, active
  c_analytics   UUID := 'c0000000-0000-0000-0000-000000000002'; -- Round Table, completed
  c_migration   UUID := 'c0000000-0000-0000-0000-000000000003'; -- Round Table, archived
  c_tournament  UUID := 'c0000000-0000-0000-0000-000000000004'; -- Avalon, active
  c_marathon    UUID := '66666666-6666-6666-6666-666666666666'; -- Arthur solo, active
  c_lute        UUID := 'c0000000-0000-0000-0000-000000000005'; -- Arthur solo, completed
  c_alchemy     UUID := '55555555-5555-5555-5555-555555555555'; -- Merlin solo, active
BEGIN
  v_demo_users := ARRAY[v_arthur, v_merlin, v_guinevere, v_lancelot, v_gawain];

  -- --------------------------------------------------------------------------
  -- 0. Reset earlier demo data so the seed can be run again
  -- --------------------------------------------------------------------------
  DELETE FROM public.guilds g
  WHERE g.id IN (v_round_table, v_avalon)
     OR EXISTS (
       SELECT 1 FROM public.guild_members m
       WHERE m.guild_id = g.id AND m.role = 'boss' AND m.user_id = ANY (v_demo_users)
     );
  DELETE FROM public.campaigns
  WHERE created_by = ANY (v_demo_users)
     OR id IN (c_auth, c_mobile, c_analytics, c_migration, c_tournament, c_marathon, c_lute, c_alchemy);
  DELETE FROM public.guild_members WHERE user_id = ANY (v_demo_users);
  DELETE FROM public.ai_generations WHERE user_id = ANY (v_demo_users);

  -- --------------------------------------------------------------------------
  -- 1. Accounts (the auth.users trigger creates public.profiles)
  --    GoTrue fails to sign in users whose token columns are NULL, so they are
  --    set to empty strings.
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud, is_sso_user,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    created_at, updated_at
  )
  SELECT
    u.id, '00000000-0000-0000-0000-000000000000', u.email, v_password, NOW() - u.ago,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('username', u.username, 'full_name', u.full_name),
    'authenticated', 'authenticated', false,
    '', '', '', '',
    NOW() - u.ago, NOW() - u.ago
  FROM (VALUES
    (v_arthur,    'arthur@questos.dev',    'arthur',    'Arthur Pendragon', INTERVAL '75 days'),
    (v_guinevere, 'guinevere@questos.dev', 'guinevere', 'Guinevere',        INTERVAL '74 days'),
    (v_merlin,    'merlin@questos.dev',    'merlin',    'Merlin Ambrosius', INTERVAL '70 days'),
    (v_lancelot,  'lancelot@questos.dev',  'lancelot',  'Lancelot du Lac',  INTERVAL '40 days'),
    (v_gawain,    'gawain@questos.dev',    'gawain',    'Sir Gawain',       INTERVAL '25 days')
  ) AS u (id, email, username, full_name, ago)
  ON CONFLICT (id) DO UPDATE
  SET
    email                  = EXCLUDED.email,
    encrypted_password     = EXCLUDED.encrypted_password,
    email_confirmed_at     = EXCLUDED.email_confirmed_at,
    raw_app_meta_data      = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data     = EXCLUDED.raw_user_meta_data,
    confirmation_token     = '',
    recovery_token         = '',
    email_change           = '',
    email_change_token_new = '';

  -- GoTrue keys email identities by user id. Older seeds used the email
  -- address, so existing rows are replaced rather than upserted.
  DELETE FROM auth.identities WHERE provider = 'email' AND user_id = ANY (v_demo_users);
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  SELECT
    u.id, u.id,
    jsonb_build_object('sub', u.id::TEXT, 'email', u.email, 'email_verified', true),
    'email', u.id::TEXT, NOW(), u.created_at, NOW()
  FROM auth.users u
  WHERE u.id = ANY (v_demo_users);

  -- Profiles already exist on a re-run, so refresh the display names.
  -- (Usernames are left alone because another user may have taken one since.)
  UPDATE public.profiles p
  SET full_name = u.raw_user_meta_data->>'full_name', avatar_url = NULL
  FROM auth.users u
  WHERE p.id = u.id AND u.id = ANY (v_demo_users);

  -- --------------------------------------------------------------------------
  -- 2. Guilds, members and an open invite link
  -- --------------------------------------------------------------------------
  INSERT INTO public.guilds (id, name, slug, created_at)
  VALUES
    (v_round_table, 'Round Table Engineering', 'round-table',     NOW() - INTERVAL '60 days'),
    (v_avalon,      'Avalon Creative',         'avalon-creative', NOW() - INTERVAL '30 days');

  INSERT INTO public.guild_members (guild_id, user_id, role, joined_at)
  VALUES
    (v_round_table, v_arthur,    'boss',    NOW() - INTERVAL '60 days'),
    (v_round_table, v_guinevere, 'manager', NOW() - INTERVAL '59 days'),
    (v_round_table, v_merlin,    'worker',  NOW() - INTERVAL '55 days'),
    (v_round_table, v_lancelot,  'worker',  NOW() - INTERVAL '38 days'),
    (v_round_table, v_gawain,    'worker',  NOW() - INTERVAL '21 days'),
    (v_avalon,      v_guinevere, 'boss',    NOW() - INTERVAL '30 days'),
    (v_avalon,      v_arthur,    'manager', NOW() - INTERVAL '28 days'),
    (v_avalon,      v_gawain,    'worker',  NOW() - INTERVAL '16 days');

  INSERT INTO public.guild_invites (guild_id, created_by, created_at, expires_at)
  VALUES (v_round_table, v_arthur, NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days');

  -- --------------------------------------------------------------------------
  -- 3. Campaigns: every status, solo and guild
  --    updated_at orders the dashboard: Excalibur, Marathon, Mobile App.
  -- --------------------------------------------------------------------------
  INSERT INTO public.campaigns (id, guild_id, name, ultimate_goal, status, created_by, created_at, updated_at)
  VALUES
    (c_auth, v_round_table, 'Excalibur Auth Launch',
      'Ship secure email sign-in with edge session checks for every knight in the realm',
      'active', v_arthur, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 hour'),
    (c_mobile, v_round_table, 'Round Table Mobile App',
      'Release an iOS and Android companion app so knights can update quests from the field',
      'active', v_guinevere, NOW() - INTERVAL '9 days', NOW() - INTERVAL '1 day'),
    (c_analytics, v_round_table, 'Grail Analytics Dashboard',
      'Give the council one page that shows which campaigns are on track',
      'completed', v_arthur, NOW() - INTERVAL '42 days', NOW() - INTERVAL '22 days'),
    (c_migration, v_round_table, 'Legacy Scroll Migration',
      'Move the old spreadsheet quest log into QuestOS',
      'archived', v_arthur, NOW() - INTERVAL '38 days', NOW() - INTERVAL '25 days'),
    (c_tournament, v_avalon, 'Spring Tournament Launch',
      'Sell every seat at the Spring Tournament with a two-week launch campaign',
      'active', v_guinevere, NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days'),
    (c_marathon, NULL, 'Marathon Preparation',
      'Finish the Camelot half-marathon in under two hours',
      'active', v_arthur, NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 hours'),
    (c_lute, NULL, 'Learn the Lute',
      'Play three songs at the midsummer feast',
      'completed', v_arthur, NOW() - INTERVAL '60 days', NOW() - INTERVAL '31 days'),
    (c_alchemy, NULL, 'Personal Alchemy Experiments',
      'Perfect three hydration potions before the winter solstice',
      'active', v_merlin, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days');

  -- --------------------------------------------------------------------------
  -- 4. Quests
  --    The completed_at trigger stamps NOW() on insert, so completed quests
  --    are backdated afterwards from done_ago (an UPDATE that does not touch
  --    status does not fire that trigger). Assignees are still checked by the
  --    validate_quest_assignee trigger.
  -- --------------------------------------------------------------------------
  DROP TABLE IF EXISTS seed_quests;
  CREATE TEMP TABLE seed_quests (
    campaign_id  UUID,
    title        TEXT,
    description  TEXT,
    status       public.quest_status,
    priority     public.quest_priorities,
    is_milestone BOOLEAN,
    assignee_id  UUID,
    created_ago  INTERVAL,
    done_ago     INTERVAL
  ) ON COMMIT DROP;

  INSERT INTO seed_quests VALUES
    -- Excalibur Auth Launch (4/10): the main demo board, every column busy
    (c_auth, 'Set up Supabase Auth with email sign-in',
      'Email and password provider with confirmation emails on the local stack',
      'completed', 'high', false, v_arthur, '20 days', '18 days'),
    (c_auth, 'Design the sign-in parchment',
      'Login and signup screens in the tavern style, mobile first',
      'completed', 'medium', false, v_guinevere, '20 days', '15 days'),
    (c_auth, 'Configure proxy.ts session gate',
      'Redirect signed-out visitors to /login before any page renders',
      'completed', 'high', true, v_arthur, '19 days', '9 days'),
    (c_auth, 'Validate auth forms with Zod',
      'Friendly field errors for email and password, never raw database messages',
      'completed', 'medium', false, v_lancelot, '17 days', '4 days'),
    (c_auth, 'Audit row-level security policies',
      'Workers may only move status on quests inside their own guild',
      'in-progress', 'high', false, v_merlin, '16 days', NULL),
    (c_auth, 'Add password reset emails',
      'A reset link that expires after one hour',
      'in-progress', 'medium', false, v_lancelot, '12 days', NULL),
    (c_auth, 'Write invite link flow',
      'Bosses share a link, new knights join as workers',
      'pending', 'medium', false, NULL, '10 days', NULL),
    (c_auth, 'Rate-limit failed sign-ins',
      'Lock an account for 15 minutes after five failed attempts',
      'pending', 'high', false, v_gawain, '8 days', NULL),
    (c_auth, 'Write the security runbook',
      'How to rotate keys and revoke sessions if a scroll leaks',
      'pending', 'low', false, NULL, '6 days', NULL),
    (c_auth, 'Launch to the whole realm',
      'Production deploy with monitoring and a rollback plan',
      'pending', 'high', true, NULL, '5 days', NULL),

    -- Round Table Mobile App (2/7): early stage
    (c_mobile, 'Pick a cross-platform framework',
      'Compare Expo and Flutter against our existing TypeScript code',
      'completed', 'high', false, v_merlin, '9 days', '7 days'),
    (c_mobile, 'Sketch the five core screens',
      'Board, quest detail, check-in, notifications and profile',
      'completed', 'medium', false, v_guinevere, '9 days', '3 days'),
    (c_mobile, 'Share Supabase types with the web app',
      'One generated types package used by both apps',
      'in-progress', 'medium', false, v_merlin, '7 days', NULL),
    (c_mobile, 'Build an offline check-in queue',
      'Store updates on the device and sync them when the signal returns',
      'pending', 'high', false, v_gawain, '6 days', NULL),
    (c_mobile, 'Push notifications for assigned quests',
      NULL,
      'pending', 'medium', false, NULL, '5 days', NULL),
    (c_mobile, 'TestFlight beta for the inner circle',
      'Ten knights use the app for one week and report back',
      'pending', 'high', true, NULL, '5 days', NULL),
    (c_mobile, 'App Store screenshots and listing',
      NULL,
      'pending', 'low', false, v_guinevere, '4 days', NULL),

    -- Grail Analytics Dashboard (5/5): finished campaign
    (c_analytics, 'Define the five metrics the council cares about',
      'Interview each council member and agree on one definition per metric',
      'completed', 'high', false, v_arthur, '42 days', '40 days'),
    (c_analytics, 'Write SQL views for campaign progress',
      NULL,
      'completed', 'high', false, v_merlin, '41 days', '35 days'),
    (c_analytics, 'Chart weekly completions',
      'One bar per week, with milestones highlighted',
      'completed', 'medium', false, v_lancelot, '38 days', '30 days'),
    (c_analytics, 'Export the report as CSV',
      NULL,
      'completed', 'low', false, v_merlin, '35 days', '27 days'),
    (c_analytics, 'Present the dashboard to the council',
      'Fifteen-minute demo at the Round Table, then a feedback round',
      'completed', 'high', true, v_arthur, '40 days', '23 days'),

    -- Legacy Scroll Migration (2/3): archived before it finished
    (c_migration, 'Export the old spreadsheet',
      NULL,
      'completed', 'low', false, v_merlin, '38 days', '36 days'),
    (c_migration, 'Map spreadsheet columns to quest fields',
      NULL,
      'completed', 'medium', false, v_merlin, '37 days', '33 days'),
    (c_migration, 'Import 300 historical quests',
      'Shelved: the council chose a fresh start over importing old quests',
      'pending', 'medium', false, NULL, '36 days', NULL),

    -- Spring Tournament Launch (3/6): Arthur is only a manager here
    (c_tournament, 'Write the tournament announcement',
      NULL,
      'completed', 'high', false, v_guinevere, '14 days', '11 days'),
    (c_tournament, 'Design banners and social posts',
      'Three sizes per post, all in the Avalon colours',
      'completed', 'medium', false, v_gawain, '13 days', '6 days'),
    (c_tournament, 'Book the herald for opening day',
      NULL,
      'completed', 'low', false, v_arthur, '12 days', '2 days'),
    (c_tournament, 'Launch early-bird ticket sales',
      'The first 100 seats at a discount, ending Friday',
      'in-progress', 'high', true, v_arthur, '10 days', NULL),
    (c_tournament, 'Send a reminder raven to past attendees',
      NULL,
      'pending', 'medium', false, v_gawain, '8 days', NULL),
    (c_tournament, 'Collect feedback after the tournament',
      'A five-question survey sent the morning after',
      'pending', 'low', false, NULL, '7 days', NULL),

    -- Marathon Preparation (4/8): Arthur solo
    (c_marathon, 'Buy proper running boots',
      'No more plate armour on the track',
      'completed', 'low', false, v_arthur, '25 days', '24 days'),
    (c_marathon, 'Build a 12-week training plan',
      'Three easy runs, one long run and one rest day each week',
      'completed', 'high', false, v_arthur, '24 days', '22 days'),
    (c_marathon, 'Run 5k without stopping',
      NULL,
      'completed', 'medium', false, v_arthur, '24 days', '17 days'),
    (c_marathon, 'Complete a 10k long run',
      NULL,
      'completed', 'high', true, v_arthur, '20 days', '5 days'),
    (c_marathon, 'Run 5k three times this week',
      NULL,
      'in-progress', 'medium', false, v_arthur, '6 days', NULL),
    (c_marathon, 'Register for the Camelot half-marathon',
      'Early registration closes at the end of the month',
      'pending', 'medium', false, NULL, '6 days', NULL),
    (c_marathon, 'Complete a 15k long run',
      NULL,
      'pending', 'high', true, v_arthur, '5 days', NULL),
    (c_marathon, 'Race day: finish in under two hours',
      NULL,
      'pending', 'high', true, NULL, '25 days', NULL),

    -- Learn the Lute (3/3): Arthur solo, finished
    (c_lute, 'Find a lute teacher',
      NULL,
      'completed', 'low', false, v_arthur, '60 days', '58 days'),
    (c_lute, 'Practise 20 minutes every day for a month',
      NULL,
      'completed', 'medium', false, v_arthur, '58 days', '35 days'),
    (c_lute, 'Play three songs at the midsummer feast',
      NULL,
      'completed', 'high', true, v_arthur, '50 days', '31 days'),

    -- Personal Alchemy Experiments (2/6): Merlin solo
    (c_alchemy, 'Order fresh mandrake root',
      NULL,
      'completed', 'low', false, v_merlin, '15 days', '13 days'),
    (c_alchemy, 'Calibrate the copper still',
      'It has been running two degrees hot since the spring',
      'completed', 'medium', false, v_merlin, '14 days', '6 days'),
    (c_alchemy, 'Brew elderflower electrolyte tonic',
      'Second of three potions',
      'in-progress', 'medium', false, v_merlin, '10 days', NULL),
    (c_alchemy, 'Brew beetroot & ginger hydration formula',
      'First of three potions',
      'pending', 'low', false, v_merlin, '15 days', NULL),
    (c_alchemy, 'Record results in the grimoire',
      NULL,
      'pending', 'low', false, NULL, '9 days', NULL),
    (c_alchemy, 'Present three potions at the solstice',
      NULL,
      'pending', 'high', true, v_merlin, '15 days', NULL);

  INSERT INTO public.quests (campaign_id, title, description, status, priority, is_milestone, assignee_id, created_at)
  SELECT campaign_id, title, description, status, priority, is_milestone, assignee_id, NOW() - created_ago
  FROM seed_quests
  ORDER BY campaign_id, created_ago DESC;

  UPDATE public.quests q
  SET completed_at = NOW() - s.done_ago
  FROM seed_quests s
  WHERE q.campaign_id = s.campaign_id
    AND q.title = s.title
    AND s.status = 'completed';

  -- One request awaiting approval (item 25), so the Approvals page and the
  -- card mark have something to show: Merlin asked Arthur and Guinevere.
  UPDATE public.quests
  SET review_requested_at = NOW() - INTERVAL '2 hours',
      review_requested_by = v_merlin
  WHERE campaign_id = c_auth
    AND title = 'Audit row-level security policies';

  DROP TABLE seed_quests;
END $$;
