# QuestOS — Architecture

> Living document: scan the implementation before updating this file, preserve accurate history, and add a document-history entry for meaningful changes.

## Product and current stage

QuestOS (originally The Daily Quest) is a medieval-themed, gamified task manager. The repository has progressed from a browser prototype to an early guild/campaign MVP with server-side authentication, persistent quest boards, and AI quest decomposition. Implemented code does not establish that the connected database or AI provider has been deployed or verified.

## Stack

- Next.js **16.2.6** App Router, React **19.2.4**, TypeScript in strict mode.
- Tailwind CSS v4; Lora and Inter through `next/font`.
- Supabase Auth/Postgres with `@supabase/ssr`, cookie-based browser/server clients, and RLS.
- `@dnd-kit` for board interactions.
- Vercel AI SDK with the OpenAI provider and Zod structured-output validation; model configuration also supports a local Ollama endpoint.

## Folder organization

```text
src/
  app/                         # Routes, layouts, global CSS
    (auth)/                    # /login and /signup, with local _components
    (dashboard)/               # Shared authenticated application shell
      board/                   # /board and /board/[campaignId]
        _components/           # Board and campaign/AI dialog UI
      dashboard/               # Placeholder command center
      records/                 # Placeholder records page
  components/
    ui/                        # UI shared across route groups (SubmitButton)
    prototypes/                # Retained, unrouted TavernBoard visual prototype
  features/
    auth/actions.ts            # Login, signup, signout server actions
    campaigns/actions.ts       # Campaign validation and creation
    quests/
      actions.ts               # Quest creation and status persistence
      ai-actions.ts            # Auth/access checks, generation, batch insert
      schemas.ts               # Quest decomposition Zod schemas
      constants.ts             # Column labels and legacy XP constants
      drag.ts                  # Pure drag helpers
      types.ts                 # Existing board-facing Quest contract
  lib/
    ai/models.ts               # Provider and model selection
    supabase/
      client.ts                # Browser client
      server.ts                # Request-scoped server client
      proxy.ts                 # Cookie refresh and session redirects
      database.types.ts        # Generated database schema snapshot
      types.ts                 # Database-derived aliases and query composites
      legacy-domain.types.ts   # Unused older handwritten DB contracts
    utils.ts                   # Shared class-name utility
  proxy.ts                     # Next.js request entry point, beside app/
supabase/
  migrations/                  # Ordered SQL: tables → functions → policies
  seed.sql                     # Development fixtures
public/                        # Served assets
docs/                         # Progress report and historical architecture
```

### Placement rules

1. Keep routes, layouts, and page composition in `src/app`. Route-only UI stays in `_components`; route groups preserve existing URLs.
2. Put business operations, schemas, and domain helpers in the owning `src/features/<feature>` folder. Client components may call exported server actions; retain `'use server'` on action modules.
3. Put provider/database adapters and generic utilities in `src/lib`. Keep secrets and provider calls on the server.
4. Promote UI to `src/components/ui` when it is used across route groups. Features and shared UI should not import another route's private components.
5. Use `@/*` for `src/*` imports and kebab-case file names; React exports stay PascalCase.
6. Keep configuration, `.env.local`, `public`, and Supabase migrations at the repository root. Do not rename historical migrations during application refactors.
7. Keep generated database types separate from handwritten UI contracts. The existing handwritten types assume non-null fields that SQL permits to be null. Regenerate and reconcile these deliberately before switching the board to generated rows or adding typed Supabase clients. The legacy contracts and prototype are retained for reference, not used by current routes.
8. Add tests beside the behavior they cover when introducing meaningful business logic. No test framework currently exists in this repository.

This is a project convention, not a mandatory Next.js architecture. It combines supported `src` organization and route colocation with feature ownership, without adding unused service/repository layers. References: [Next.js project organization](https://nextjs.org/docs/app/getting-started/project-structure), [src conventions](https://nextjs.org/docs/app/api-reference/file-conventions/src-folder). The matching guides bundled in the exact 16.2.6 npm package were read for this restructuring.

## Routes and authentication

| Route | Current behavior |
| --- | --- |
| `/` | Redirects to `/board` |
| `/login`, `/signup` | Server-action forms using React `useActionState` |
| `/board` | Checks user, redirects to their latest created campaign, or shows the create-campaign empty state |
| `/board/[campaignId]` | Server-loads campaign with quests under Supabase access policies |
| `/dashboard` | Placeholder |
| `/records` | Records shell without data |

`src/proxy.ts` delegates to the Supabase session helper. It refreshes session cookies, redirects unauthenticated requests to login, and redirects signed-in users away from auth pages. RLS and mutation checks enforce data access; route redirects alone are not authorization.

## Main data flows

- **Authentication:** form → auth server action → Supabase Auth → redirect. Signup metadata populates profiles through the database trigger.
- **Campaigns:** dialog → validation → authenticated user → first guild membership → campaign insert → redirect to its board. Signup does not create a guild membership; onboarding is unfinished.
- **Board:** Server Component queries campaign and quests → client `QuestBoard` initializes state → optimistic drag → quest status action updates `status` and `completed_at` → failed update rolls the card back.
- **AI decomposition:** dialog directive → server session/access check → AI SDK structured output validated with Zod (1–8 quests) → batch insert → revalidate campaign route. The board currently captures initial props in `useState`; refreshed quest props need deliberate synchronization before generated quests reliably appear in the open board.
- **Manual quest creation:** a server action exists, but the current Post Quest button is not wired to the form.

## Database and security

Five tables model the product: `profiles`, `guilds`, `guild_members`, `campaigns`, and `quests`. Campaigns can be solo or guild-owned in SQL, although the current creation action requires guild membership. Quest states are `pending`, `in-progress`, and `completed`.

Migrations are split into schema/enums/indexes, security functions/profile trigger, and RLS policies. `get_my_guild_ids()` is a `SECURITY DEFINER` helper used to avoid recursive membership-policy evaluation (the latest merged database change addresses PostgreSQL 42P17). Runtime policy behavior still needs verification against a configured Supabase instance.

Role enums exist, but application flows and policies do not yet implement a complete boss/manager/worker permissions model. Campaign creation checks the creator identity in RLS; tighter guild-membership and role checks are a follow-up. `profiles.total_xp` exists, but the quest completion action does not credit XP.

## Current gaps and next priorities

See [the progress report](docs/PROJECT_PROGRESS.md) for implemented features, incomplete flows, and suggested order. Key gaps are unfinished onboarding/navigation, manual creation wiring, hardcoded board/profile/XP displays, stale client board state after AI insert, overlapping type contracts, and missing automated tests.

## History

The [2026-05-29 architecture snapshot](docs/history/architecture-2026-05-29.md) preserves the original localStorage → browser-Supabase design, gamification formulas, and initial AI roadmap. Its file links and implementation descriptions are historical.

| Date | Summary |
| --- | --- |
| 2026-05-29 | Initial architecture: local prototype, browser Supabase, hook-based board, initial AI roadmap. |
| 2026-11-04 | Audited current code and merged work through PR #5; archived the outdated snapshot; documented SSR auth, campaigns, AI, modular SQL/RLS, gaps, and the src/feature folder migration. |
