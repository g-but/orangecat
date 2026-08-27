-- The queue is about mentions, not only about the Cat.
--
-- `mention` notifications are defined in config/notification-config.ts, have
-- copy, have a UI case in NotificationItem.tsx and a type in the union — and
-- have NEVER ONCE BEEN CREATED. Mentioning a person on OrangeCat notifies
-- nobody. That is not a Cat problem; it is the social loop missing its most
-- basic feedback, and it has been missing since the type was written.
--
-- Fixing it needs the same machinery the Cat already uses: notice a mention on
-- a post, resolve it properly, act on it, retry if that fails. So rather than
-- build a second pipeline beside the first, the existing one widens by one
-- word — and the name follows the meaning rather than the history.
--
-- The prefilter widens with it. It looked for '@cat'; it now looks for '@' at
-- all, because a post mentioning only @alice has to reach the worker too. That
-- is still a PREFILTER and still deliberately dumb: domain/mentions/parse.ts
-- and services/mentions/resolve.ts remain the single authority on what counts
-- as a mention, and the worker discards whatever this over-selects.

ALTER TABLE IF EXISTS public.cat_mention_queue RENAME TO mention_queue;

ALTER INDEX IF EXISTS idx_cat_mention_queue_pending RENAME TO idx_mention_queue_pending;

COMMENT ON TABLE public.mention_queue IS
  'One row per post or message that may contain mentions. Unique on (source_type, source_id) so an at-least-once producer still yields exactly one round of processing. Widened from cat_mention_queue 2026-08-26: the Cat is one mentioned account among many.';

-- The claim function follows the table. Same body, same SKIP LOCKED guarantee:
-- an inline run and a timer tick must never process the same row twice.
DROP FUNCTION IF EXISTS public.claim_cat_mentions(integer);

CREATE OR REPLACE FUNCTION public.claim_mentions(p_limit integer DEFAULT 5)
RETURNS SETOF public.mention_queue
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  UPDATE mention_queue q
     SET status     = 'running',
         claimed_at = now(),
         attempts   = q.attempts + 1
   WHERE q.id IN (
     SELECT c.id
       FROM mention_queue c
      WHERE c.status = 'pending'
      ORDER BY c.created_at
      FOR UPDATE SKIP LOCKED
      LIMIT GREATEST(p_limit, 1)
   )
  RETURNING q.*;
END;
$$;

COMMENT ON FUNCTION public.claim_mentions IS
  'Atomically claim pending mentions. SKIP LOCKED so an inline run and a timer tick never process the same row twice.';

GRANT EXECUTE ON FUNCTION public.claim_mentions(integer) TO service_role;

-- ---------------------------------------------------------------------------
-- The trigger, widened
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.note_mentions_on_timeline_event()
RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cat_id uuid;
BEGIN
  -- Cheap exit for the overwhelming majority of posts. Anything past here is
  -- resolved properly by the worker, so being generous costs one small row.
  IF POSITION('@' IN COALESCE(NEW.description, '')) = 0
     AND POSITION('@' IN COALESCE(NEW.title, '')) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_cat_id FROM profiles WHERE username = 'cat';

  -- The Cat never processes its own posts: it must not answer itself, and it
  -- must not notify people it named while answering someone else.
  IF v_cat_id IS NOT NULL AND NEW.actor_id = v_cat_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO mention_queue (source_type, source_id, requester_id, parent_event_id)
  VALUES ('timeline_event', NEW.id, NEW.actor_id, NEW.id)
  ON CONFLICT (source_type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.note_mentions_on_timeline_event IS
  'Prefilter only: queues a post that MIGHT contain mentions. services/mentions/resolve.ts is the authority on whether it does.';

DROP TRIGGER IF EXISTS trg_note_cat_mention ON public.timeline_events;
DROP TRIGGER IF EXISTS trg_note_mentions ON public.timeline_events;

CREATE TRIGGER trg_note_mentions
  AFTER INSERT ON public.timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION public.note_mentions_on_timeline_event();

DROP FUNCTION IF EXISTS public.note_cat_mention_on_timeline_event();

NOTIFY pgrst, 'reload schema';
