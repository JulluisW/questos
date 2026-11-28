# QuestOS (The Daily Quest) — Architecture

> **Living document rule (for humans and AI):** Before editing this file, read the existing `ARCHITECTURE.md` and scan the current codebase. Merge updates intelligently—preserve accurate history, note what changed, and do not blindly overwrite prior sections. Update the [Document history](#document-history) entry for each meaningful revision.

---

## The Vision

**QuestOS** (formerly *The Daily Quest*) is a gamified planning tool dressed as a medieval tavern notice board. A user forges a **campaign** around a goal, the **AI Oracle** breaks it into **quests**, and the quests move across a Kanban board until they land in the Hall of Records.

The MVP is **solo-first**: everything works for one adventurer. **Guilds** are a thin layer on top that let small teams share campaigns with three roles (boss, manager, worker).

The prototype's client-side XP was **removed** for the MVP (see [Evolution](#evolution)). XP and levels are back as values **derived in Postgres** from completed quests (see [XP and levels](#xp-and-levels)); nothing stores or writes them.

---

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Server Actions, `proxy.ts`) | Server Components fetch data; Server Actions mutate it |
| UI | **React 19**, **Tailwind CSS v4**, `class-variance-authority` | Parchment theme, Lora + Inter via `next/font` |
| Drag & drop | **@dnd-kit/core** | Pointer + keyboard dragging between columns |
| Backend | **Supabase** (`@supabase/ssr`) | Auth (cookie sessions), Postgres, RLS, RPC |
| AI | **Vercel AI SDK v7** + `@ai-sdk/openai` | `generateText` + `Output.object` with a Zod schema; Ollama locally, OpenAI in production (default `gpt-6-luna`) |
| Validation | **Zod v4** | Form input, AI output |
| Tests | **PGlite** + `node:test` | RLS/trigger tests on an in-memory Postgres |

---

## Request & Data Flow

```mermaid
flowchart LR
  Browser -->|every request| Proxy[proxy.ts\nupdateSession + getClaims]
  Proxy -->|no session| Login[/login?next=.../]
  Proxy --> RSC[Server Components\napp/(dashboard)/*]
  RSC -->|select via RLS| PG[(Postgres + RLS)]
  Browser -->|form / event| SA[Server Actions\nactions/*]
  SA -->|zod validate| SA
  SA -->|insert/update/rpc as user| PG
  SA -->|consultOracle| AI[src/lib/ai/oracle.ts]
  AI -->|generateText + Output.object| LLM[(Ollama / OpenAI)]
  SA -->|revalidatePath| RSC
```

1. **`src/proxy.ts`** refreshes the Supabase session cookie and redirects signed-out users to `/login?next=<path>` (the path is validated by `safeNextPath`, so open redirects are blocked).
2. **Server Components** query Supabase with the user's cookie client. No ownership filters are added in code; RLS decides what each user sees.
3. **Server Actions** (`src/actions/*`) re-check the session, validate input with Zod (`src/lib/validation.ts`), write with the user's client, map database errors to friendly text (`lib/db-errors.ts`) and call `revalidatePath`.
4. **Password reset** uses Supabase Auth's recovery email. `/forgot-password` calls `resetPasswordForEmail` with a link built from `siteUrl` (never the Host header) after `account_exists_for_email()` confirms the email has an account. An unknown email gets "No account found", a deliberate choice that reveals whether an account exists. The link opens `/auth/callback`, a Route Handler that trades the one-time PKCE code for a session cookie, then `/reset-password` sets the new password and signs out every session. The link only works in the browser that requested it, because the PKCE verifier lives in that browser's cookie.
5. **Search** never puts user text inside a PostgREST `or(...)` or `filter(...)` string. Campaign search is one plain `ilike` on the generated `campaigns.search_text`, Hall of Records search an `ilike` on `title`, and `containsPattern()` (`src/lib/search.ts`) escapes `%`, `_` and `\`. The quest board filters its already-loaded quests in the browser.
6. **Client components** stay small: dialogs use `useActionState`, and the board keeps an optimistic copy of quests that resyncs whenever the server sends fresh props.

### Quest board

`src/app/(dashboard)/board/_components/quest-board.tsx` owns the board state:

| Concern | Approach |
| --- | --- |
| Drag | `useDraggable` cards, `useDroppable` columns, `resolveTargetStatus` maps the drop target |
| Optimistic update | Card moves immediately; on action error it is reverted and an inline notice appears |
| Server sync | "Store previous props" pattern: new `initialQuests` from `revalidatePath` replace local state |
| Keyboard | The grip button is the drag activator; Arrow Left/Right jump between columns (custom `KeyboardCoordinateGetter`) |
| Permissions | `can_manage_campaign` RPC → edit/delete/post controls; guild workers get Claim/Release |

### AI Oracle

`src/lib/ai/oracle.ts` is the single entry point, shared by "Forge with Oracle" and "Ask the Oracle":

1. Checks `isAIEnabled()`. In production a provider must be configured explicitly.
2. Enforces a per-user hourly limit by counting rows in `ai_generations` (RLS scopes the count to the caller), then appends a row.
3. Calls `generateText({ output: Output.object({ schema }) })`. Campaign data is wrapped in tags and the system prompt treats it as data, which blunts prompt injection.
4. Inserts the quests with the user's client, so RLS still applies.

Ollama is called through `ollama.chat()` (Chat Completions); the default OpenAI provider call uses the Responses API, which Ollama does not implement. If the Oracle fails during "Forge with Oracle", the campaign is still created and the board shows a retry banner.

---

## Database Schema

Migrations live in `supabase/migrations` and are **append-only**.

| Table | Purpose | Notes |
| --- | --- | --- |
| `profiles` | One row per auth user | Created by the `handle_new_user` trigger; usernames de-duplicated with a suffix |
| `guilds` | Teams | Created only through `create_guild()` |
| `guild_members` | Membership + `guild_role` | One boss per guild (partial unique index); only `role` is updatable |
| `guild_invites` | Shareable join tokens | 7-day expiry, revocable |
| `guild_email_invites` | Invites addressed to an email | 7-day expiry, revocable; one live invite per guild and email; no email is sent |
| `campaigns` | Goal containers | `guild_id IS NULL` = solo; `status`: active/completed/archived; `search_text` (generated, lowercased name and goal) for search; `shared_at` (shared as a template) and `template_id` (adopted from) |
| `quests` | Work items | `status`, `priority`, `is_milestone`, `assignee_id`, `position` (order within a board column; new quests go last); `completed_at` set by trigger |
| `ai_generations` | Oracle usage ledger | Append-only; drives rate limiting |

### Authorization (RLS)

Helper functions are `SECURITY DEFINER` with a pinned `search_path`, which avoids policy recursion (the 42P17 issue fixed earlier):

- `get_my_guild_ids()`, `get_my_guild_role(guild)`, `can_manage_guild(guild)`
- `can_access_campaign(campaign)`: solo owner or guild member
- `can_manage_campaign(campaign)`: solo owner or guild boss/manager

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| campaigns | owner / members | owner (solo) or boss/manager | owner / boss/manager (name, goal, status only) | owner / boss |
| quests | campaign access | `can_manage_campaign` | campaign access + **worker guard trigger** | `can_manage_campaign` |
| guild_members | same guild | (RPC only) | boss changes role manager↔worker | boss removes, members leave (never the boss) |
| guild_invites | boss/manager | boss/manager | revoke only | — |
| guild_email_invites | boss/manager | boss/manager (`create_email_invite`) | revoke only | — |

Email invites: `get_my_email_invites()` and `accept_email_invite(id)` are `SECURITY DEFINER` and match the invite to the caller's **confirmed** `auth.users.email`, so the client never supplies the address it accepts for. They return only the guild name and expiry, and every failed accept gets the same message, so nobody learns about invites addressed to someone else. Accepting joins as a worker. This relies on Supabase Auth's "Confirm email" staying on: with it off, sign-up marks every address confirmed and an invited address could be claimed by whoever registers it first.

Templates: only a campaign's creator can share it (`set_campaign_shared`), and for a guild campaign only while they still boss or manage that guild. `is_live_template()` hides a template as soon as its creator leaves, is removed or is demoted, or their account is deleted, so a former member can never keep copying the guild's plan. `list_templates()` shows shared templates to every signed-in user: the template's name, goal, first five quest titles, creator username, and aggregate counts (adopted, finished, distinct users and guilds), never who adopted it. `adopt_template()` copies the campaign and its quests (pending, unassigned, same order) into your solo realm or a guild you manage. Clients can insert only `name, ultimate_goal, status, guild_id, created_by` on `campaigns`, so `shared_at` and `template_id` cannot be faked.

Activity feed: derived on read, with no table of its own. `get_activity_feed()` is `SECURITY INVOKER`, so RLS decides every row: quest completions, campaigns created, campaigns started from a template, and member joins, each visible only to people who can already see that campaign or guild. The single exception is `get_my_template_adoptions()` (`SECURITY DEFINER`): a template's creator learns that someone adopted it, with only the adopter's username and the time, never the adopted campaign, and only while the creator can still see the template itself. Adoptions the creator can already see are skipped, so nothing appears twice.

Triggers: `guard_quest_update` (workers may only change status or claim/release; reordering via `position` is boss, manager or solo owner only), `validate_quest_assignee` (the assignee must belong to the campaign's audience), `release_quests_on_member_leave`, `sync_quest_completed_at`, `touch_updated_at`.

### XP and levels

XP is not a column. `get_my_xp()` adds it up on every read, so the only way to change it is to change a quest's status, priority or milestone flag, which the rules above already guard.

- **Credit:** every completed quest earns XP for its **campaign's creator** (`campaigns.created_by`), solo or guild. The assignee does not matter.
- **Amount:** `quest_xp(priority, is_milestone)`: low 10, medium 20, high 30, +20 for a milestone.
- **Levels:** `level_for_xp(xp)`: reaching level L takes `50 * L * (L - 1)` XP (100, 300, 600, 1000 and so on).
- **Access:** `get_my_xp()` is `SECURITY DEFINER` with **no arguments**, so it only ever returns the caller's own total (and keeps XP from a guild campaign after its creator leaves that guild). Only `authenticated` may execute it.

Shown on the Command Center (level card) and in the desktop sidebar, both streamed in their own Suspense boundary through the cached `src/data/xp.ts`.

### Testing

`npm run test:db` boots PGlite, recreates the parts of Supabase the schema needs (`auth.users`, `auth.uid()`, `anon`/`authenticated` roles, default grants), applies every migration plus the seed, and impersonates users the way PostgREST does (`SET ROLE authenticated` + `request.jwt.claim.sub`). Each scenario runs in a rolled-back transaction. Run against only the original four migrations, the suite fails on the cross-guild injection, ownership-change and worker-edit cases, which confirms it detects those regressions.

---

## Project layout

```
src/
  actions/          auth, campaigns, quests, oracle, guilds (Server Actions)
  app/(auth)/       login, signup
  app/(dashboard)/  layout (sidebar), dashboard, campaigns, board, team, join/[token], records
  components/ui/    Button, ParchmentDialog, SubmitButton, ConfirmDialog, Notice, FormField…
  components/       app-shell nav, campaign card + forge dialog
  data/             server-only reads returning Result: auth, campaigns, quests, guilds
  lib/ai/           models.ts (provider switch), schemas.ts, oracle.ts
  lib/supabase/     server.ts, client.ts, proxy.ts (typed with Database)
  lib/              queries.ts, validation.ts, db-errors.ts, utils.ts, quests/
  types/            database.types.ts (generated format) + index.ts aliases
  proxy.ts          session refresh and signed-out redirects
supabase/           migrations/, seed.sql
scripts/            db-test.mjs
```

---

## Evolution

| Phase | What it was | What happened to it |
| --- | --- | --- |
| 1. Prototype | Browser-only board, `localStorage` (`daily_quests_v1`), client-side XP (+50 / +250 milestone, level = ⌊xp/100⌋+1) | Storage module removed; XP removed for the MVP |
| 2. Cloud MVP | Single `app/page.tsx`, `useQuests`/`useAuth` hooks, browser Supabase client, client-side auth gate, RLS configured outside the repo | Replaced by SSR auth (`@supabase/ssr` + `proxy.ts`), Server Actions and versioned migrations |
| 3. QuestOS (Days 4–7) | Auth routes, campaigns, guild schema, AI decomposition, RLS recursion fix | Kept; hardened in phase 4 |
| 4. MVP hardening | This document | Role-aware RLS, invites, Oracle service, dashboard, tests |

---

## Roadmap

- An approver page for guild quest completions; boss-set XP per quest
- Email invites, OAuth sign-in, password reset
- Persisted quest ordering within a column; filter, sort and search
- pgTAP or the PGlite suite in CI

---

## Document history

| Date | Summary |
| --- | --- |
| 2026-05-29 | Initial living architecture doc: Phase 1 localStorage → Phase 2 Supabase MVP, gamification math, hook-based data flow, auth guard, schema contract, Phase 3 placeholder. |
| 2026-11-05 | Rewritten for QuestOS MVP: SSR auth + proxy, Server Actions, role-aware RLS (boss/manager/worker), guild invites, AI Oracle service with rate limiting, XP removed, PGlite RLS test suite. Phases 1–2 summarised under *Evolution*. |
| 2026-11-26 | Application code moved under `src/` (app, actions, components, data, lib, types, proxy.ts); config, `supabase/`, `scripts/` and `public/` stay at the root. Added the `data/` read layer to the project layout. |
| 2026-11-27 | Production AI provider decided: OpenAI, already wired into the provider switch, with `gpt-6-luna` as the default model (OpenAI's replacement for `gpt-4o-mini`, which shuts down on Jan 14, 2027). Removed from the roadmap. |
| 2026-11-27 | XP and levels derived in Postgres (`get_my_xp()`): campaign creator earns XP for completed quests, growing level steps. Removed from the roadmap. |
