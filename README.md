# QuestOS

**Turn a goal into a campaign, let the AI Oracle break it into quests, and run them on a parchment Kanban board.**

QuestOS is a medieval-themed task manager built with Next.js 16, Supabase and the Vercel AI SDK. It works solo out of the box; guilds let small teams share campaigns with simple roles.

## Features

- **Accounts**: email/password sign-up and sign-in, and a "Forgot your password?" flow that emails a reset link through Supabase Auth (an unknown email gets "No account found").
- **Campaigns**: forge a campaign with an ultimate goal; mark it completed or archive it.
- **Templates**: a campaign's creator can share it as a template. Every signed-in user can browse templates on `/templates`, see how often each was adopted and finished, and start their own copy, solo or for a guild they manage.
- **AI Oracle**: "Forge with Oracle" (or "Ask the Oracle" on any board) turns a directive into 3–8 structured quests using a Zod schema. It runs on local Ollama by default and switches to OpenAI with one env var.
- **Quest board**: drag-and-drop Kanban (pointer or keyboard) with optimistic updates and rollback; bosses, managers and solo owners reorder cards within Pending and In Progress, and the order survives a reload; create, edit, delete and assign quests; milestones and priorities.
- **Command Center**: your level, active campaigns with progress, your open quests, recent completions, and a recent-activity feed (quests completed, campaigns forged, members joined, templates adopted) across your campaigns and guilds.
- **XP and levels**: every completed quest earns XP for its campaign's creator (low 10, medium 20, high 30, +20 for a milestone). Postgres adds it up on read (`get_my_xp()`), so no client can write it. Level 2 starts at 100 XP and each level needs 100 more than the last.
- **Guilds**: found a guild, share an invite link or invite an email address, and manage roles. Bosses and managers plan, workers move and claim quests.
- **Quest approval**: in a guild campaign a worker cannot complete a quest alone. The worker who claimed it opens the quest's details and requests approval; a boss or manager approves it (it completes and earns XP) or sends it back to In Progress with a short reason. `/approvals` lists every open request in the guilds you boss or manage.
- **Hall of Records**: every completed quest, chronicled, with title search and pagination.
- **Search and filters**: search campaigns by name or goal and sort them; search and filter the quest board by priority, assignee and milestone. Every choice lives in the URL, so it survives a reload and can be shared.

## Security model

All authorization lives in Postgres row-level security, so the UI is never trusted:

| Who | Can |
| --- | --- |
| Solo campaign owner | everything on their own campaign |
| Guild boss | everything in the guild, delete campaigns, change roles, remove members |
| Guild manager | create/edit campaigns and quests, create invite links and email invites |
| Guild worker | view guild campaigns, move quests between Pending and In Progress, claim/release quests, request approval for their own quest |
| Anyone else | nothing |

Email invites send no email: the invitee sees them on the Team page after signing in with that confirmed address, and only the guild's boss and managers can see which emails were invited. Ownership columns (`created_by`, `guild_id`, `campaign_id`) are immutable through column-level grants, `completed_at` is derived by trigger, and AI usage is rate-limited per user through an append-only ledger. [`scripts/db-test.mjs`](scripts/db-test.mjs) tests these rules against an in-memory Postgres.

## Tech stack

Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 · Tailwind CSS v4 · Supabase (Auth, Postgres, RLS) · Vercel AI SDK v7 · Zod v4 · dnd-kit · PGlite (DB tests)

## Getting started

### 1. Database

**Local (recommended):** requires Docker and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase init           # first time only: creates supabase/config.toml (commit it)
supabase start          # boots Postgres/Auth locally
supabase db reset       # applies supabase/migrations + supabase/seed.sql
supabase status         # prints the API URL and anon key
```

**Hosted:** follow the [Deploy](#deploy) runbook. Pushing the migrations to an existing project drops data, so back it up first.

### 2. AI Oracle (optional)

```bash
ollama pull llama3.2
ollama serve            # exposes http://localhost:11434
```

Or set `OPENAI_API_KEY` to use OpenAI instead. **OpenAI is the production provider:** on the deployed site, set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-6-luna`). Without any provider in production, the Oracle buttons are disabled.

### 3. App

```bash
cp .env.example .env.local   # fill in the Supabase URL + anon key
npm install
npm run dev                  # http://localhost:3000
```

### Demo accounts (seed data)

Every account uses the password `12345678`.

| Email | Round Table Engineering | Avalon Creative | Solo campaigns |
| --- | --- | --- | --- |
| `arthur@questos.dev` | boss | manager | Marathon Preparation, Learn the Lute |
| `guinevere@questos.dev` | manager | boss | — |
| `merlin@questos.dev` | worker | — | Personal Alchemy Experiments |
| `lancelot@questos.dev` | worker | — | — |
| `gawain@questos.dev` | worker | worker | — |

Start with **Arthur**: his dashboard has active, completed and archived campaigns, a busy board (*Excalibur Auth Launch*), a pending invite link and weeks of history in the Hall of Records. Then open the same board as **Merlin** in a second browser profile: as a worker he can drag and claim quests but not edit or complete them. His *Audit row-level security policies* quest is already awaiting approval: approve it or send it back as Arthur on `/approvals`.

Dates in the seed are relative to the moment it runs, so the dashboard always looks current. Running `psql "$DB_URL" -f supabase/seed.sql` again resets the demo accounts to this state.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next.js route types, then TypeScript with no emit |
| `npm run test:db` | Applies all migrations + seed to an in-memory Postgres and tests the RLS/trigger rules (no Docker needed) |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, `test:db` and build on every pull request and every push to `main`. It needs no secrets.

## Project structure

```
src/
  actions/          Server Actions (auth, campaigns, quests, oracle, guilds)
  app/(auth)/       login, signup
  app/(dashboard)/  dashboard, campaigns, board/[campaignId], approvals, team, join/[token], records
  components/ui/    shared primitives (Button, ParchmentDialog, SubmitButton, Notice…)
  data/             server-only reads that return a Result (dashboard sections)
  lib/ai/           provider switch, Zod schemas, Oracle service
  lib/supabase/     typed server/browser clients + session proxy
  proxy.ts          session refresh and signed-out redirects
supabase/           append-only migrations and seed
scripts/            database test suite
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for data flow and design decisions.

## Deploy

The app runs on **Vercel** with a **hosted Supabase** project. Follow these steps in order. Steps 2 to 4 are read-only; step 5 changes the database and cannot be undone without the backup from step 2.

Supabase CLI flags change between versions, so confirm each command with `supabase <command> --help` before running it.

### 1. Before you start

- CI is green on `main` (lint, typecheck, `test:db`, build).
- The Supabase CLI is installed and logged in (`supabase login`).
- You have a Vercel account connected to this GitHub repository.

### 2. Back up the hosted database

```bash
supabase link --project-ref <your-project-ref>
supabase db dump -f supabase/dumps/schema-$(date +%F).sql
supabase db dump --data-only -f supabase/dumps/data-$(date +%F).sql
```

The CLI runs `pg_dump` in a container, so Docker must be running. `supabase/dumps/` is git-ignored: backups contain user data and must never be committed.

### 3. Preview the migrations

```bash
supabase migration list        # which migrations the hosted project already has
supabase db push --dry-run     # what would be applied, without applying it
```

### 4. Know the data loss

`supabase/migrations/20261105000001_mvp_foundations.sql` (lines 15 and 16) removes the prototype's XP data:

- `quests.xp_reward` is dropped.
- `profiles.total_xp` is dropped.

Both are permanent. They can only be recovered from the step 2 backup. XP is now a derived value (`supabase/migrations/20261127000001_xp_and_levels.sql`, functions only) and does not read these columns.

### 5. Apply the migrations

```bash
supabase db push
```

**Never run `supabase/seed.sql` against production.** It creates five demo accounts that all share the password `12345678`.

### 6. Supabase Auth URLs

In the Supabase dashboard, under Authentication > URL Configuration:

- **Site URL:** your production origin, for example `https://<your-app>.vercel.app`. Email confirmation links land there, and the user then signs in.
- **Confirm email must stay on** (Authentication > Providers > Email). Email invites trust a *confirmed* address as proof that the person owns it; with confirmation off, anyone could sign up with an invited address and join that guild.
- **Redirect URLs:** add the same origin, plus `<origin>/auth/callback` (the password reset link lands there). To try password reset locally against the hosted project, also add `http://localhost:3000/**` (the reset link carries a `?next=` query, so an exact path entry may not match).

### 7. Vercel project and environment variables

Import the repository in Vercel. The framework (Next.js) and build command (`npm run build`) are detected automatically. Then set these variables for **Production**:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public by design: RLS enforces access |
| `OPENAI_API_KEY` | for the Oracle | Server-only. Without it the Oracle buttons are disabled |
| `OPENAI_MODEL` | no | Defaults to `gpt-6-luna` |
| `AI_HOURLY_LIMIT` | no | Oracle consultations per user per hour (default 10) |
| `NEXT_PUBLIC_SITE_URL` | no | Set it once you have a custom domain; otherwise Vercel's production URL is used for metadata, `robots.txt` and the sitemap |

Do **not** set `OLLAMA_BASE_URL` or `OLLAMA_MODEL` in production (they would point the Oracle at a server that does not exist there), and never add a Supabase service-role key: the app does not use one.

Deploy, or redeploy after changing variables (`NEXT_PUBLIC_*` values are fixed at build time).

### 8. Smoke test

1. Sign up with a new account, confirm the email (confirmation must be on, see step 6), and sign in.
2. Forge a campaign with the Oracle and check that quests appear.
3. Drag a quest to another column and reload: it stays.
4. Found a guild, create an invite link, and open it in a second browser with another account.
5. Complete a quest and check the Hall of Records.
6. Open `/robots.txt`: its sitemap line shows the production URL.

### 9. Rollback

- **App:** use Vercel's instant rollback to the previous deployment.
- **Database:** there is no automatic rollback. Restore from the step 2 backup; anything written after the push is lost.

## Roadmap

Email invites, OAuth sign-in, persisted quest ordering, filter/search, campaign templates, an activity feed.
