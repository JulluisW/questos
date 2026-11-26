# AGENTS.md

Instructions for AI coding agents working in this project.

AI tools must not add AI attribution to commits or pull requests, including AI
`Co-Authored-By` trailers or generated-by signatures. Preserve genuine human
attribution.

## What this is

**QuestOS** is a medieval-themed planner: forge a campaign around a goal, let
the AI Oracle break it into quests, and run them on a parchment Kanban board.
It is solo-first, with guilds as a thin team layer (boss, manager, worker). It
is a portfolio showcase built on Next.js 16, Supabase (Auth, Postgres, RLS) and
the Vercel AI SDK. See `README.md` and `ARCHITECTURE.md`.

**This is NOT the Next.js you know.** Next.js 16 has breaking changes: APIs,
conventions and file structure may all differ from your training data. Read
the relevant guide in `node_modules/next/dist/docs/` before writing code, and
heed deprecation notices.

## Proportional engineering

Build for established requirements, not hypothetical scale, threats, or future
flexibility. Reuse existing code, the standard library, native platform features,
and installed dependencies before adding machinery.

- Unknown scale or extensibility defaults to the smaller reversible design. Do
  not infer enterprise, multi-tenant, hostile-user, or compliance requirements.
- Derive trust and data-integrity boundaries from actual reachability: untrusted
  input, auth/session/ownership, shared persisted data, destructive operations,
  payments, secrets, and sensitive data.
- Ask only when an unknown materially changes behavior, architecture, persisted
  data, interoperability, a real security boundary, or cost. Otherwise choose the
  simplest repository-native implementation.
- Add an abstraction, dependency, service, configuration surface, compatibility
  layer, or security mechanism only for a current requirement.
- Simplicity never removes real trust-boundary validation, data-loss prevention,
  accessibility, explicit security requirements, configured tests, or project rules.
- Stack-specific template standards apply only when the project uses that stack.

## Conventions

- Application code lives in `src/`; config, `supabase/`, `scripts/` and
  `public/` stay at the root.
- Authorization lives in Postgres RLS, policies and triggers, never in the UI.
  Do not use a service-role key in a request path.
- Reads go in `src/data/` (server-only, return a `Result`); writes go in
  Server Actions in `src/actions/`, validated with Zod from
  `src/lib/validation.ts`.
- Never send raw database errors to the browser; map them with
  `src/lib/db-errors.ts`.
- Migrations in `supabase/migrations/` are append-only. Add a `test:db` case for
  every new policy or trigger.
- Prettier (`.prettierrc`) and ESLint (`eslint-config-next`) define formatting.

## Commands

Package manager: npm.

- Dev server: `npm run dev` (http://localhost:3000)
- Build: `npm run build`
- Production server: `npm run start`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- DB tests: `npm run test:db` (applies all migrations and the seed to an
  in-memory Postgres and tests the RLS and trigger rules; no Docker needed)
- Local database: `supabase start`, then `supabase db reset` to apply
  migrations and the seed

There is no unit test runner and no `test` command yet, so the unit-test gate is
off. Run `DB tests` for any change under `supabase/`. There is no combined
`Verify` command.
