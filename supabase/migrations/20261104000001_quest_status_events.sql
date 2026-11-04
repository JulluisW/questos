-- ============================================================================
-- FILE 4: QUEST STATUS EVENT LOG (powers the campaign timeline)
-- ============================================================================
-- Append-only history of every status change a quest goes through.
-- Rows are written ONLY by the trigger below (SECURITY DEFINER), so every
-- write path (drag on the board, AI decomposition, SQL, future APIs) is
-- captured and users cannot forge or edit history.

CREATE TABLE public.quest_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  from_status public.quest_status,            -- NULL = quest was created
  to_status public.quest_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_inferred BOOLEAN NOT NULL DEFAULT FALSE  -- TRUE = reconstructed by backfill, not observed
);

CREATE INDEX idx_quest_status_events_campaign_time
  ON public.quest_status_events (campaign_id, changed_at);
CREATE INDEX idx_quest_status_events_quest_time
  ON public.quest_status_events (quest_id, changed_at);

-- ----------------------------------------------------------------------------
-- Trigger: log creation and every real status transition
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_quest_status_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.quest_status_events (quest_id, campaign_id, from_status, to_status, changed_by, changed_at)
    VALUES (NEW.id, NEW.campaign_id, NULL, COALESCE(NEW.status, 'pending'), auth.uid(), COALESCE(NEW.created_at, NOW()));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.quest_status_events (quest_id, campaign_id, from_status, to_status, changed_by, changed_at)
    VALUES (NEW.id, NEW.campaign_id, OLD.status, COALESCE(NEW.status, 'pending'), auth.uid(), NOW());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quest_status_change
  AFTER INSERT OR UPDATE OF status ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.log_quest_status_event();

-- ----------------------------------------------------------------------------
-- RLS: readable by whoever can read the campaign; no client writes at all
-- ----------------------------------------------------------------------------
ALTER TABLE public.quest_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View quest status events policy"
ON public.quest_status_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = quest_status_events.campaign_id
      AND (
        c.created_by = auth.uid()
        OR (c.guild_id IS NOT NULL AND c.guild_id IN (SELECT public.get_my_guild_ids()))
      )
  )
);

-- ----------------------------------------------------------------------------
-- Backfill existing quests (history before this migration is unknown, so the
-- reconstructed rows are flagged is_inferred = TRUE and labelled in the UI)
-- ----------------------------------------------------------------------------
INSERT INTO public.quest_status_events (quest_id, campaign_id, from_status, to_status, changed_at, is_inferred)
SELECT q.id, q.campaign_id, NULL, 'pending', COALESCE(q.created_at, NOW()), TRUE
FROM public.quests q;

INSERT INTO public.quest_status_events (quest_id, campaign_id, from_status, to_status, changed_at, is_inferred)
SELECT q.id, q.campaign_id, 'pending', q.status,
       COALESCE(q.completed_at, q.created_at, NOW()), TRUE
FROM public.quests q
WHERE q.status IS NOT NULL AND q.status <> 'pending';
