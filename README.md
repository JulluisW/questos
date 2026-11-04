# QuestOS

A medieval-themed task manager built with Next.js 16, React 19, Supabase, and the Vercel AI SDK.

The project is an early MVP: email/password auth, campaign creation, persistent Kanban status changes, and AI quest decomposition are implemented. Dashboard, records, onboarding, and parts of the board UI still need completion. See [project progress](docs/PROJECT_PROGRESS.md) and [architecture and folder conventions](ARCHITECTURE.md).

## Local setup

1. Use Node.js 22.13+ (or a compatible newer LTS). The current environment's Node 22.12 produces an engine warning for an ESLint dependency.
2. Install dependencies with `npm ci`. The current lockfile has missing transitive dependency entries and needs repair if npm rejects a clean install. `npm install --package-lock=false` is a temporary local workaround, not a lockfile repair.
3. Create `.env.local` at the repository root:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   # Optional: if present, selects the OpenAI-backed model
   OPENAI_API_KEY=
   # Otherwise, the model adapter uses Ollama
   OLLAMA_BASE_URL=http://localhost:11434/v1
   OLLAMA_MODEL=llama3.2
   ```

4. Apply the SQL in `supabase/migrations/` in filename order to your development Supabase project. `supabase/seed.sql` contains development fixtures; inspect it before use. This repository does not yet include a Supabase CLI local-stack configuration.
5. Ensure the signed-in user has a guild membership before creating campaigns through the current UI.
6. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

AI generation also requires a reachable provider/model with compatible structured-output support. Google fonts are fetched by `next/font` during builds.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Source map

- `src/app`: routes, layouts, and route-specific `_components`.
- `src/features`: auth, campaign, and quest business logic.
- `src/components/ui`: UI shared across route groups.
- `src/lib`: Supabase/AI adapters, database types, and generic utilities.
- `src/proxy.ts`: Next.js session proxy entry point.
- `supabase`: migrations and development seed data.
- `docs`: progress and historical documentation.

The `@/*` alias resolves to `src/*`. Keep environment/configuration files and `public/` at the root.
