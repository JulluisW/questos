# QuestOS project progress

Reviewed **4 November 2026**, against the local repository at `0de1b86` (merged PR #5) and the folder restructuring in this working tree. This is a source-code assessment; live Supabase and AI behavior has not been verified.

## Current stage

An early, cloud-connected guild/campaign MVP. The auth → campaign → board → AI generation path is implemented in code, while onboarding, several user-facing controls, and gamification still need work. A percentage-complete estimate would be misleading without a defined release scope.

| Area | Evidence and status |
| --- | --- |
| Authentication | Dedicated login/signup routes, `useActionState` forms, server actions, cookie-based Supabase SSR clients, and session redirects are implemented. A signout action exists but is not wired into the application shell. |
| Campaign creation | Forge Campaign modal, field validation, authenticated creator/guild lookup, insert, and redirect are implemented. Requires an existing guild membership. |
| Board loading | `/board` finds the user's latest created campaign; campaign route fetches campaign and quests from Supabase. |
| Kanban | Three columns, draggable cards, optimistic status persistence, completion timestamps, and rollback on failure are implemented. |
| AI quests | Auth/access checks, provider selection, Zod structured output, batch insert, and route revalidation are implemented. Needs real-provider validation and client-state refresh work. |
| Database | Five tables, enums/indexes, automatic profile creation, RLS, and seed fixtures are versioned in SQL. Latest merged work addresses membership-policy recursion via a security-definer helper. |
| UI | Tavern/parchment visual shell and auth/campaign/AI dialogs exist. Several labels, profile values, progress metrics, and controls remain static. |
| Gamification | Quest XP rewards and profile total-XP column exist; completion does not currently credit profile XP. Displayed card XP is hardcoded. |
| Dashboard and records | Routes exist as placeholders; dashboard is a single label and records has no loaded data. |
| Quality and setup | Strict TypeScript and ESLint are configured. No automated test suite, CI workflow, or local Supabase CLI configuration was found. The existing lockfile rejects `npm ci` due to missing transitive dependencies. |

## Recent milestones

- PR #2: dedicated auth routes and proxy session gates.
- PR #3: Forge Campaign action/modal and board index redirect.
- PR #4: AI SDK and Zod campaign quest decomposition.
- PR #5: modular database migrations, auth seed updates, and RLS recursion fix.

## Highest-value next work

1. **Make the main journey complete:** add guild onboarding/membership management; connect Post Quest to the existing creation action; expose signout; fix Quest Board navigation (`/quest-board` currently points to a nonexistent route; actual route is `/board`).
2. **Make displayed state accurate:** use real campaign name, quest counts, user/guild information, and `xp_reward`; synchronize board state after AI insert/revalidation. The board initializes `useState(initialQuests)` only once.
3. **Finish access rules:** test isolated users and guild members against actual RLS policies; define and enforce boss/manager/worker permissions. Schema roles alone do not provide this behavior.
4. **Reconcile data contracts:** regenerate database types, handle SQL nullability, type Supabase clients, and retire the older handwritten contracts after consumers migrate.
5. **Implement XP accounting:** decide when XP is earned/reversed and apply it transactionally with completion so repeated moves cannot duplicate rewards.
6. **Establish reproducible checks:** repair the dependency lockfile on a supported Node version, then add focused tests for auth redirects, campaign validation, unauthorized mutations, drag rollback, and AI insertion/refresh.
7. **Expand product surfaces:** campaign listing/switching, dashboard metrics, archive/records, assignment, filtering/sorting, and analytics as release scope requires. Several sidebar destinations currently have no route.

## Folder restructuring in this working tree

- Application code moved to `src/`; `src/proxy.ts` sits beside `src/app` as required for this layout.
- Server actions and quest schemas/helpers grouped under `src/features/auth`, `campaigns`, and `quests`.
- Shared submit button moved to `src/components/ui`, removing the campaign dialog's dependency on auth-route private UI.
- Board-specific UI remains colocated in its route's `_components`; component file names use kebab-case.
- Supabase database contracts grouped beside the adapter; the unused older handwritten contracts are explicitly marked `legacy-domain.types.ts`.
- Unrouted TavernBoard prototype retained under `src/components/prototypes`.
- `@/*` now resolves to `src/*`; static assets, config, environment files, and SQL remain at root.
- Current architecture documented; the original architecture snapshot is retained in `docs/history`.

This refactor changes organization and imports. The incomplete product behavior above is tracked for follow-up rather than silently bundled into the folder migration.

## Restructuring validation

- `npm run lint`: passed with zero errors and five existing unused-variable warnings.
- TypeScript (`tsc --noEmit`): passed.
- `npm run build`: passed after allowing network access for the existing Google Fonts downloads; all seven application routes and the proxy were recognized.
- Active local import paths resolve, and `git diff --check` passes.
- Dependencies were installed using `npm install --package-lock=false` for these checks. `package.json` and `package-lock.json` were not changed, so the existing clean-install/Node-version issues remain follow-up work.
- Authenticated browser flows, AI-provider execution, and RLS behavior were not exercised against live services.
