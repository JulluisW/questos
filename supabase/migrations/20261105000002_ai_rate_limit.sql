-- ============================================================================
-- AI RATE LIMIT LEDGER
-- One row per Oracle (AI) generation. The server action counts recent rows
-- before calling the model, so a single user can't burn through model quota.
-- Users can read and append their own rows but never update or delete them.
-- ============================================================================

CREATE TABLE public.ai_generations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_user_time ON public.ai_generations (user_id, created_at DESC);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_generations_select_own"
ON public.ai_generations FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "ai_generations_insert_own"
ON public.ai_generations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

REVOKE UPDATE, DELETE ON public.ai_generations FROM authenticated, anon;
