# QuestOS

**Turn a goal into a campaign, let the AI Oracle break it into quests, and run them on a parchment Kanban board.**

QuestOS is a medieval-themed task manager built with Next.js 16, Supabase and the Vercel AI SDK. It works solo out of the box; guilds let small teams share campaigns with simple roles.

## Features

- **Campaigns**: forge a campaign with an ultimate goal; mark it completed or archive it.
- **AI Oracle**: "Forge with Oracle" (or "Ask the Oracle" on any board) turns a directive into 3–8 structured quests using a Zod schema. It runs on local Ollama by default and switches to OpenAI with one env var.
- **Quest board**: drag-and-drop Kanban (pointer or keyboard) with optimistic updates and rollback; create, edit, delete and assign quests; milestones and priorities.
- **Command Center**: active campaigns with progress, your open quests, and recent completions.
- **Guilds**: found a guild, share an invite link, and manage roles. Bosses and managers plan, workers move and claim quests.
- **Hall of Records**: every completed quest, chronicled.

## Security model

All authorization lives in Postgres row-level security, so the UI is never trusted:

| Who | Can |
| --- | --- |
| Solo campaign owner | everything on their own campaign |
| Guild boss | everything in the guild, delete campaigns, change roles, remove members |
| Guild manager | create/edit campaigns and quests, create invite links |
| Guild worker | view guild campaigns, move quest status, claim/release quests |
| Anyone else | nothing |

Ownership columns (`created_by`, `guild_id`, `campaign_id`) are immutable through column-level grants, `completed_at` is derived by trigger, and AI usage is rate-limited per user through an append-only ledger. [`scripts/db-test.mjs`](scripts/db-test.mjs) tests these rules against an in-memory Postgres.

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

**Hosted:** link your project and push the migrations:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

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

Start with **Arthur**: his dashboard has active, completed and archived campaigns, a busy board (*Excalibur Auth Launch*), a pending invite link and weeks of history in the Hall of Records. Then open the same board as **Merlin** in a second browser profile: as a worker he can drag and claim quests but not edit them.

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
  app/(dashboard)/  dashboard, campaigns, board/[campaignId], team, join/[token], records
  components/ui/    shared primitives (Button, ParchmentDialog, SubmitButton, Notice…)
  data/             server-only reads that return a Result (dashboard sections)
  lib/ai/           provider switch, Zod schemas, Oracle service
  lib/supabase/     typed server/browser clients + session proxy
  proxy.ts          session refresh and signed-out redirects
supabase/           append-only migrations and seed
scripts/            database test suite
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for data flow and design decisions.

## Roadmap

XP and levels (derived from completed quests), email invites, OAuth sign-in, persisted quest ordering, filter/search, campaign templates, an activity feed.
