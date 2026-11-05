// scripts/db-test.mjs
// ---------------------------------------------------------------------------
// Row-level security & trigger tests that run without Docker or Supabase.
//
// Boots an in-memory Postgres (PGlite), recreates the bits of Supabase the
// schema relies on (auth.users, auth.uid(), anon/authenticated roles, default
// grants), applies every migration + seed.sql, then impersonates users the same
// way PostgREST does: SET ROLE authenticated + request.jwt.claim.sub.
//
// Run: npm run test:db
// ---------------------------------------------------------------------------
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ARTHUR = '11111111-1111-1111-1111-111111111111'; // guild boss
const MERLIN = '22222222-2222-2222-2222-222222222222'; // guild worker
const OUTSIDER = '77777777-7777-7777-7777-777777777777'; // no guild
const GUILD = '33333333-3333-3333-3333-333333333333';
const GUILD_CAMPAIGN = '44444444-4444-4444-4444-444444444444';
const MERLIN_SOLO = '55555555-5555-5555-5555-555555555555';
const ARTHUR_SOLO = '66666666-6666-6666-6666-666666666666';
const GUINEVERE = '88888888-8888-8888-8888-888888888888'; // Round Table manager, Avalon boss
const AVALON = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; // Arthur is only a manager here
const AVALON_CAMPAIGN = 'c0000000-0000-0000-0000-000000000004';
const DEMO_USERS = [ARTHUR, MERLIN, GUINEVERE, '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'];

const SUPABASE_SHIM = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE SCHEMA auth;
  CREATE SCHEMA extensions;
  CREATE EXTENSION pgcrypto WITH SCHEMA extensions;

  CREATE TABLE auth.users (
    id UUID PRIMARY KEY,
    instance_id UUID,
    email TEXT,
    encrypted_password TEXT,
    email_confirmed_at TIMESTAMPTZ,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    role TEXT,
    aud TEXT,
    is_sso_user BOOLEAN DEFAULT FALSE,
    confirmation_token TEXT,
    recovery_token TEXT,
    email_change TEXT,
    email_change_token_new TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE auth.identities (
    id UUID,
    user_id UUID REFERENCES auth.users(id),
    identity_data JSONB,
    provider TEXT,
    provider_id TEXT,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE (provider, provider_id)
  );

  CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID
  $$;

  GRANT USAGE ON SCHEMA public, auth, extensions TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
`;

/** @type {PGlite} */
let db;

before(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_SHIM);

  const migrationsDir = path.join(root, 'supabase', 'migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      await db.exec(await readFile(path.join(migrationsDir, file), 'utf8'));
    } catch (err) {
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }
  await db.exec(await readFile(path.join(root, 'supabase', 'seed.sql'), 'utf8'));

  // A user with no guild, created through the same signup trigger.
  await db.query(
    `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, 'outsider@questos.dev', '{"username":"outsider"}')`,
    [OUTSIDER]
  );
});

/**
 * Runs `fn` inside a transaction that is always rolled back, so tests never
 * leak state into each other. `as(uid, sql, params)` executes one statement
 * impersonating `uid` (null = anon) and returns { rows, count } or { error }.
 */
async function scenario(fn) {
  await db.exec('BEGIN');
  let n = 0;
  const as = async (uid, sql, params = []) => {
    const sp = `s${n++}`;
    await db.exec(`SAVEPOINT ${sp}`);
    try {
      await db.exec('RESET ROLE');
      await db.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
      await db.exec(`SET LOCAL ROLE ${uid ? 'authenticated' : 'anon'}`);
      const res = await db.query(sql, params);
      await db.exec(`RELEASE SAVEPOINT ${sp}`);
      return { rows: res.rows, count: res.affectedRows ?? res.rows.length };
    } catch (err) {
      await db.exec(`ROLLBACK TO SAVEPOINT ${sp}`);
      return { error: err.message };
    }
  };
  try {
    await fn(as);
  } finally {
    // ROLLBACK also undoes SET LOCAL ROLE, and works even if the tx is aborted.
    await db.exec('ROLLBACK');
  }
}

// ---------------------------------------------------------------------------
// Signup / profiles
// ---------------------------------------------------------------------------
test('signup trigger creates unique usernames for colliding emails', async () => {
  await scenario(async () => {
    await db.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'john@a.com')`);
    await db.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'john@b.com')`);
    const { rows } = await db.query(`SELECT username FROM public.profiles WHERE username LIKE 'john%'`);
    assert.equal(rows.length, 2);
    assert.notEqual(rows[0].username, rows[1].username);
  });
});

test('XP columns are gone', async () => {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE column_name IN ('xp_reward', 'total_xp')`
  );
  assert.equal(rows.length, 0);
});

test('users cannot edit someone else profile', async () => {
  await scenario(async (as) => {
    const res = await as(MERLIN, `UPDATE public.profiles SET full_name = 'hacked' WHERE id = $1`, [ARTHUR]);
    assert.equal(res.count, 0);
    const own = await as(MERLIN, `UPDATE public.profiles SET full_name = 'Merlin the Wise' WHERE id = $1`, [MERLIN]);
    assert.equal(own.count, 1);
  });
});

// ---------------------------------------------------------------------------
// Campaign visibility & creation
// ---------------------------------------------------------------------------
test('campaign visibility: solo is private, guild is shared with members', async () => {
  await scenario(async (as) => {
    const arthur = (await as(ARTHUR, `SELECT id FROM public.campaigns`)).rows.map((r) => r.id);
    assert.ok(arthur.includes(GUILD_CAMPAIGN) && arthur.includes(ARTHUR_SOLO) && arthur.includes(AVALON_CAMPAIGN));
    assert.ok(!arthur.includes(MERLIN_SOLO), 'Arthur must not see Merlin solo campaign');

    const merlin = (await as(MERLIN, `SELECT id FROM public.campaigns`)).rows.map((r) => r.id);
    assert.ok(merlin.includes(GUILD_CAMPAIGN) && merlin.includes(MERLIN_SOLO));
    assert.ok(!merlin.includes(ARTHUR_SOLO), 'Merlin must not see Arthur solo campaign');
    assert.ok(!merlin.includes(AVALON_CAMPAIGN), 'Merlin is not in Avalon');

    const outsider = await as(OUTSIDER, `SELECT id FROM public.campaigns`);
    assert.equal(outsider.rows.length, 0);

    const anon = await as(null, `SELECT id FROM public.campaigns`);
    assert.equal(anon.rows.length, 0);
  });
});

test('outsiders cannot inject campaigns into a guild', async () => {
  await scenario(async (as) => {
    const res = await as(
      OUTSIDER,
      `INSERT INTO public.campaigns (name, guild_id, created_by) VALUES ('Trojan horse', $1, $2)`,
      [GUILD, OUTSIDER]
    );
    assert.match(res.error ?? '', /row-level security/);
  });
});

test('workers cannot create guild campaigns, bosses can', async () => {
  await scenario(async (as) => {
    const worker = await as(MERLIN, `SELECT public.forge_campaign_with_quests('Side quest', NULL, $1, '[]')`, [GUILD]);
    assert.match(worker.error ?? '', /row-level security/);

    const boss = await as(
      ARTHUR,
      `SELECT public.forge_campaign_with_quests('Grail Search', 'Find it', $1,
         '[{"title":"Consult the map","priority":"high"},{"title":"Pack provisions","is_milestone":true}]') AS id`,
      [GUILD]
    );
    assert.ok(boss.rows?.[0]?.id, boss.error);
    const quests = await as(ARTHUR, `SELECT title FROM public.quests WHERE campaign_id = $1`, [boss.rows[0].id]);
    assert.equal(quests.rows.length, 2);
  });
});

test('campaign ownership columns are immutable', async () => {
  await scenario(async (as) => {
    const res = await as(ARTHUR, `UPDATE public.campaigns SET created_by = $1 WHERE id = $2`, [MERLIN, ARTHUR_SOLO]);
    assert.match(res.error ?? '', /permission denied/);
    const guild = await as(ARTHUR, `UPDATE public.campaigns SET guild_id = NULL WHERE id = $1`, [GUILD_CAMPAIGN]);
    assert.match(guild.error ?? '', /permission denied/);
  });
});

test('campaign status: owner archives own solo, worker cannot touch guild campaign', async () => {
  await scenario(async (as) => {
    const own = await as(ARTHUR, `UPDATE public.campaigns SET status = 'archived' WHERE id = $1`, [ARTHUR_SOLO]);
    assert.equal(own.count, 1);
    const worker = await as(MERLIN, `UPDATE public.campaigns SET status = 'archived' WHERE id = $1`, [GUILD_CAMPAIGN]);
    assert.equal(worker.count, 0);
  });
});

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------
test('quests cannot be moved to another campaign', async () => {
  await scenario(async (as) => {
    const res = await as(
      ARTHUR,
      `UPDATE public.quests SET campaign_id = $1 WHERE campaign_id = $2`,
      [MERLIN_SOLO, ARTHUR_SOLO]
    );
    assert.match(res.error ?? '', /permission denied/);
  });
});

test('outsiders cannot read or add quests to other campaigns', async () => {
  await scenario(async (as) => {
    const read = await as(OUTSIDER, `SELECT id FROM public.quests`);
    assert.equal(read.rows.length, 0);
    const insert = await as(OUTSIDER, `INSERT INTO public.quests (campaign_id, title) VALUES ($1, 'Sneaky')`, [
      ARTHUR_SOLO,
    ]);
    assert.match(insert.error ?? '', /row-level security/);
  });
});

test('workers can move status, and completed_at follows status', async () => {
  await scenario(async (as) => {
    const res = await as(
      MERLIN,
      `UPDATE public.quests SET status = 'completed'
       WHERE campaign_id = $1 AND title = 'Write invite link flow' RETURNING completed_at`,
      [GUILD_CAMPAIGN]
    );
    assert.equal(res.count, 1, res.error);
    assert.ok(res.rows[0].completed_at);

    const back = await as(
      MERLIN,
      `UPDATE public.quests SET status = 'pending'
       WHERE campaign_id = $1 AND title = 'Write invite link flow' RETURNING completed_at`,
      [GUILD_CAMPAIGN]
    );
    assert.equal(back.rows[0].completed_at, null);
  });
});

test('workers cannot edit quest details, create or delete quests', async () => {
  await scenario(async (as) => {
    const edit = await as(MERLIN, `UPDATE public.quests SET title = 'Renamed' WHERE campaign_id = $1`, [
      GUILD_CAMPAIGN,
    ]);
    assert.match(edit.error ?? '', /boss or a manager/);

    const create = await as(MERLIN, `INSERT INTO public.quests (campaign_id, title) VALUES ($1, 'Mine now')`, [
      GUILD_CAMPAIGN,
    ]);
    assert.match(create.error ?? '', /row-level security/);

    const del = await as(MERLIN, `DELETE FROM public.quests WHERE campaign_id = $1`, [GUILD_CAMPAIGN]);
    assert.equal(del.count, 0);
  });
});

test('workers can claim an open quest but not assign others', async () => {
  await scenario(async (as) => {
    const claim = await as(
      MERLIN,
      `UPDATE public.quests SET assignee_id = $1 WHERE campaign_id = $2 AND title = 'Write invite link flow'`,
      [MERLIN, GUILD_CAMPAIGN]
    );
    assert.equal(claim.count, 1, claim.error);

    const assignBoss = await as(
      MERLIN,
      `UPDATE public.quests SET assignee_id = $1 WHERE campaign_id = $2 AND title = 'Launch to the whole realm'`,
      [ARTHUR, GUILD_CAMPAIGN]
    );
    assert.match(assignBoss.error ?? '', /claim or release/);
  });
});

test('bosses manage quests; assignees must belong to the guild', async () => {
  await scenario(async (as) => {
    const edit = await as(ARTHUR, `UPDATE public.quests SET title = 'Ship it' WHERE campaign_id = $1 AND title = 'Launch to the whole realm'`, [
      GUILD_CAMPAIGN,
    ]);
    assert.equal(edit.count, 1, edit.error);

    const badAssignee = await as(
      ARTHUR,
      `INSERT INTO public.quests (campaign_id, title, assignee_id) VALUES ($1, 'Hire outsider', $2)`,
      [GUILD_CAMPAIGN, OUTSIDER]
    );
    assert.match(badAssignee.error ?? '', /member of the guild/);

    const del = await as(ARTHUR, `DELETE FROM public.quests WHERE campaign_id = $1`, [GUILD_CAMPAIGN]);
    assert.ok(del.count > 0);
  });
});

test('solo quests can only be assigned to the owner', async () => {
  await scenario(async (as) => {
    const res = await as(
      ARTHUR,
      `INSERT INTO public.quests (campaign_id, title, assignee_id) VALUES ($1, 'Delegate', $2)`,
      [ARTHUR_SOLO, MERLIN]
    );
    assert.match(res.error ?? '', /campaign owner/);
  });
});

// ---------------------------------------------------------------------------
// Guilds, roles, invites
// ---------------------------------------------------------------------------
test('create_guild makes the caller boss', async () => {
  await scenario(async (as) => {
    const res = await as(OUTSIDER, `SELECT public.create_guild('Knights of Rust') AS id`);
    assert.ok(res.rows?.[0]?.id, res.error);
    const role = await as(OUTSIDER, `SELECT public.get_my_guild_role($1) AS role`, [res.rows[0].id]);
    assert.equal(role.rows[0].role, 'boss');

    const direct = await as(OUTSIDER, `INSERT INTO public.guilds (name, slug) VALUES ('Direct', 'direct')`);
    assert.match(direct.error ?? '', /permission denied/);
  });
});

test('invite links: create, preview, accept, revoke', async () => {
  await scenario(async (as) => {
    const workerInvite = await as(MERLIN, `INSERT INTO public.guild_invites (guild_id, created_by) VALUES ($1, $2)`, [
      GUILD,
      MERLIN,
    ]);
    assert.match(workerInvite.error ?? '', /row-level security/);

    const invite = await as(
      ARTHUR,
      `INSERT INTO public.guild_invites (guild_id, created_by) VALUES ($1, $2) RETURNING token`,
      [GUILD, ARTHUR]
    );
    const token = invite.rows?.[0]?.token;
    assert.ok(token, invite.error);

    const preview = await as(OUTSIDER, `SELECT * FROM public.preview_guild_invite($1)`, [token]);
    assert.equal(preview.rows[0].guild_name, 'Round Table Engineering');
    assert.equal(preview.rows[0].already_member, false);

    const anonPreview = await as(null, `SELECT * FROM public.preview_guild_invite($1)`, [token]);
    assert.match(anonPreview.error ?? '', /permission denied/);

    const accept = await as(OUTSIDER, `SELECT public.accept_guild_invite($1) AS guild_id`, [token]);
    assert.equal(accept.rows?.[0]?.guild_id, GUILD, accept.error);

    const sees = await as(OUTSIDER, `SELECT id FROM public.campaigns WHERE id = $1`, [GUILD_CAMPAIGN]);
    assert.equal(sees.rows.length, 1);

    const revoke = await as(ARTHUR, `UPDATE public.guild_invites SET revoked_at = NOW() WHERE token = $1`, [token]);
    assert.equal(revoke.count, 1);
    const reuse = await as(MERLIN, `SELECT public.accept_guild_invite($1)`, [token]);
    assert.match(reuse.error ?? '', /invalid or has expired/);
  });
});

test('boss promotes worker to manager, who can then edit quests', async () => {
  await scenario(async (as) => {
    const selfPromote = await as(MERLIN, `UPDATE public.guild_members SET role = 'manager' WHERE user_id = $1`, [
      MERLIN,
    ]);
    assert.equal(selfPromote.count, 0);

    const promote = await as(ARTHUR, `UPDATE public.guild_members SET role = 'manager' WHERE user_id = $1 AND guild_id = $2`, [
      MERLIN,
      GUILD,
    ]);
    assert.equal(promote.count, 1, promote.error);

    const crown = await as(ARTHUR, `UPDATE public.guild_members SET role = 'boss' WHERE user_id = $1 AND guild_id = $2`, [
      MERLIN,
      GUILD,
    ]);
    assert.ok(crown.error, 'boss role cannot be handed out');

    const edit = await as(MERLIN, `UPDATE public.quests SET title = 'Audit RLS (manager)' WHERE campaign_id = $1 AND title = 'Audit row-level security policies'`, [
      GUILD_CAMPAIGN,
    ]);
    assert.equal(edit.count, 1, edit.error);
  });
});

test('leaving a guild releases assigned quests; boss cannot leave', async () => {
  await scenario(async (as) => {
    const leave = await as(MERLIN, `DELETE FROM public.guild_members WHERE user_id = $1 AND guild_id = $2`, [
      MERLIN,
      GUILD,
    ]);
    assert.equal(leave.count, 1, leave.error);
    const { rows } = await db.query(`SELECT count(*)::int AS n FROM public.quests WHERE campaign_id = $1 AND assignee_id = $2`, [
      GUILD_CAMPAIGN,
      MERLIN,
    ]);
    assert.equal(rows[0].n, 0);

    const bossLeave = await as(ARTHUR, `DELETE FROM public.guild_members WHERE user_id = $1 AND guild_id = $2`, [
      ARTHUR,
      GUILD,
    ]);
    assert.equal(bossLeave.count, 0);
  });
});

test('roles are per guild: a boss elsewhere is only a manager in Avalon', async () => {
  await scenario(async (as) => {
    const role = await as(ARTHUR, `SELECT public.get_my_guild_role($1) AS role`, [AVALON]);
    assert.equal(role.rows[0].role, 'manager');

    const edit = await as(
      ARTHUR,
      `UPDATE public.quests SET priority = 'high' WHERE campaign_id = $1 AND title = 'Collect feedback after the tournament'`,
      [AVALON_CAMPAIGN]
    );
    assert.equal(edit.count, 1, edit.error);

    const managerDelete = await as(ARTHUR, `DELETE FROM public.campaigns WHERE id = $1`, [AVALON_CAMPAIGN]);
    assert.equal(managerDelete.count, 0);
    const bossDelete = await as(GUINEVERE, `DELETE FROM public.campaigns WHERE id = $1`, [AVALON_CAMPAIGN]);
    assert.equal(bossDelete.count, 1, bossDelete.error);
  });
});

// ---------------------------------------------------------------------------
// Showcase seed
// ---------------------------------------------------------------------------
test('seed: completed_at matches status and is backdated', async () => {
  const { rows } = await db.query(`
    SELECT
      count(*) FILTER (WHERE (status = 'completed') <> (completed_at IS NOT NULL))::int AS mismatched,
      count(*) FILTER (WHERE completed_at < created_at)::int AS before_created,
      count(*) FILTER (WHERE completed_at > NOW() - INTERVAL '7 days')::int AS this_week,
      count(*) FILTER (WHERE completed_at < NOW() - INTERVAL '7 days')::int AS older
    FROM public.quests`);
  assert.equal(rows[0].mismatched, 0);
  assert.equal(rows[0].before_created, 0);
  assert.ok(rows[0].this_week > 0, 'dashboard "completed this week" should not be empty');
  assert.ok(rows[0].older > 0, 'Hall of Records should have history');
});

test('seed: every campaign status and quest column is represented', async () => {
  const campaigns = await db.query(`SELECT DISTINCT status::text AS status FROM public.campaigns ORDER BY 1`);
  assert.deepEqual(campaigns.rows.map((r) => r.status), ['active', 'archived', 'completed']);
  const quests = await db.query(`SELECT DISTINCT status FROM public.quests WHERE campaign_id = $1`, [GUILD_CAMPAIGN]);
  assert.equal(quests.rows.length, 3);
});

test('seed: demo accounts can sign in (identities present, no NULL tokens)', async () => {
  const { rows } = await db.query(
    `SELECT u.id
     FROM auth.users u
     JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
     WHERE u.id = ANY($1::uuid[])
       AND u.encrypted_password = extensions.crypt('12345678', u.encrypted_password)
       AND u.confirmation_token = '' AND u.recovery_token = ''
       AND u.email_change = '' AND u.email_change_token_new = ''`,
    [DEMO_USERS]
  );
  assert.equal(rows.length, DEMO_USERS.length);
});

test('seed: re-running resets demo data without duplicates', async () => {
  const snapshot = `
    SELECT
      (SELECT count(*) FROM public.campaigns)::int AS campaigns,
      (SELECT count(*) FROM public.quests)::int AS quests,
      (SELECT count(*) FROM public.guild_members)::int AS members,
      (SELECT count(*) FROM public.guild_invites)::int AS invites,
      (SELECT count(*) FROM auth.identities)::int AS identities`;
  const before = (await db.query(snapshot)).rows[0];
  await scenario(async (as) => {
    const scribble = await as(ARTHUR, `SELECT public.forge_campaign_with_quests('Visitor scribble', NULL, NULL, '[]')`);
    assert.ok(!scribble.error, scribble.error);

    await db.exec('RESET ROLE');
    await db.exec(await readFile(path.join(root, 'supabase', 'seed.sql'), 'utf8'));
    assert.deepEqual((await db.query(snapshot)).rows[0], before);
    const gone = await db.query(`SELECT 1 FROM public.campaigns WHERE name = 'Visitor scribble'`);
    assert.equal(gone.rows.length, 0);
  });
});

// ---------------------------------------------------------------------------
// AI rate-limit ledger
// ---------------------------------------------------------------------------
test('ai_generations: append-only, own rows only', async () => {
  await scenario(async (as) => {
    const own = await as(MERLIN, `INSERT INTO public.ai_generations (campaign_id) VALUES ($1)`, [MERLIN_SOLO]);
    assert.equal(own.count, 1, own.error);
    const forged = await as(MERLIN, `INSERT INTO public.ai_generations (user_id) VALUES ($1)`, [ARTHUR]);
    assert.match(forged.error ?? '', /row-level security/);
    const del = await as(MERLIN, `DELETE FROM public.ai_generations`);
    assert.match(del.error ?? '', /permission denied/);
    const others = await as(ARTHUR, `SELECT id FROM public.ai_generations`);
    assert.equal(others.rows.length, 0);
  });
});
