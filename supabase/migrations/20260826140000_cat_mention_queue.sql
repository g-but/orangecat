-- A durable record that the Cat owes somebody an answer.
--
-- Tagging @cat has to survive the request that caused it. The reply needs an
-- LLM round trip, which must not block the sender's POST, and a process that
-- dies mid-answer must not swallow the question — the worst outcome for an
-- assistant is a request that vanishes silently.
--
-- So the write path records the debt and returns; something else pays it. One
-- table serves both surfaces (a private message now, a wall post later), which
-- is what makes idempotency, retries and rate limiting one problem instead of
-- two.
--
-- IDEMPOTENCY is the unique key on (source_type, source_id): one mention owes
-- exactly one reply, no matter how many times the producer fires. That is the
-- property that makes an at-least-once trigger safe.

CREATE TABLE IF NOT EXISTS public.cat_mention_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was written that mentioned the Cat.
  source_type     text NOT NULL CHECK (source_type IN ('message', 'timeline_event')),
  source_id       uuid NOT NULL,

  -- Who tagged the Cat. The reply is on their behalf, and their allowance pays
  -- for it, so this is not merely informational.
  requester_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Where the answer belongs. Exactly one is set, enforced below: the Cat
  -- answers where it was asked, never in a new place.
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  parent_event_id uuid REFERENCES public.timeline_events(id) ON DELETE CASCADE,

  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'running', 'done', 'failed')),
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  claimed_at      timestamptz,
  finished_at     timestamptz,

  CONSTRAINT cat_mention_queue_source_key UNIQUE (source_type, source_id),
  CONSTRAINT cat_mention_queue_one_target CHECK (
    (conversation_id IS NOT NULL AND parent_event_id IS NULL) OR
    (conversation_id IS NULL AND parent_event_id IS NOT NULL)
  )
);

-- The worker's only query: oldest pending first.
CREATE INDEX IF NOT EXISTS idx_cat_mention_queue_pending
  ON public.cat_mention_queue (created_at)
  WHERE status = 'pending';

COMMENT ON TABLE public.cat_mention_queue IS
  'One row per @cat mention that owes a reply. Unique on (source_type, source_id) so an at-least-once producer still yields exactly one answer.';

-- Deny by default. Only the service role touches this table: a queue row says
-- who asked what and where, and nothing in the product needs a client to read
-- or write it. RLS on with no policy is the strongest available statement of
-- that — not an oversight, which is why it is written down here.
ALTER TABLE public.cat_mention_queue ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Claiming
-- ---------------------------------------------------------------------------
-- FOR UPDATE SKIP LOCKED is the whole reason this is a function rather than two
-- statements in the service: select-then-update is a race, and two workers (a
-- timer tick overlapping an inline run) would answer the same mention twice.
-- SKIP LOCKED lets them work the same queue without coordinating.
--
-- Not SECURITY DEFINER: only the service role calls it, and the service role
-- already bypasses RLS. A definer function here would add privilege nobody
-- needs.

CREATE OR REPLACE FUNCTION public.claim_cat_mentions(p_limit integer DEFAULT 5)
RETURNS SETOF public.cat_mention_queue
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  UPDATE cat_mention_queue q
     SET status     = 'running',
         claimed_at = now(),
         attempts   = q.attempts + 1
   WHERE q.id IN (
     SELECT c.id
       FROM cat_mention_queue c
      WHERE c.status = 'pending'
      ORDER BY c.created_at
      FOR UPDATE SKIP LOCKED
      LIMIT GREATEST(p_limit, 1)
   )
  RETURNING q.*;
END;
$$;

COMMENT ON FUNCTION public.claim_cat_mentions IS
  'Atomically claim pending @cat mentions. SKIP LOCKED so an inline run and a timer tick never answer the same mention twice.';

GRANT EXECUTE ON FUNCTION public.claim_cat_mentions(integer) TO service_role;

NOTIFY pgrst, 'reload schema';
