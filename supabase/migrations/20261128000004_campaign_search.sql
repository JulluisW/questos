-- ============================================================================
-- CAMPAIGN SEARCH (build-plan item 21)
--   One lowercased column covering name and goal, so the Campaigns page can
--   search both with a single plain `ilike` filter. User text then never has
--   to go inside a PostgREST `or(...)` string. Generated: no client can
--   write it.
-- ============================================================================

ALTER TABLE public.campaigns
  ADD COLUMN search_text TEXT GENERATED ALWAYS AS (lower(name || ' ' || COALESCE(ultimate_goal, ''))) STORED;
