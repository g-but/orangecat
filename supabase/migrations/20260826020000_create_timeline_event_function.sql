-- Replies and reposts call a function that has never existed.
--
-- src/services/timeline/mutations/events-create.ts:createEvent() calls
-- `create_timeline_event`. It appears in no migration, and production returns
-- PGRST202 for it. Every caller of createEvent has therefore been failing:
--
--   * replying to a post   (post-composer.ts — the `parentEventId` branch;
--                           postCardReplyAction.ts)
--   * reposting            (usePostRepost.ts, both simple and quote paths)
--   * project events       (useTimelineEvents.ts)
--   * transaction events   (useTimelineEvents.ts)
--
-- Measured against production 2026-08-26, and the numbers are unambiguous
-- because the sibling path is a natural control: top-level posts go through
-- `create_post_with_visibility`, which DOES exist, and everything else is
-- identical.
--
--   metadata.is_user_post (working RPC)   newest: 2026-08-22   <- 4 days ago
--   metadata.is_reply     (missing RPC)   newest: 2025-12-14   <- 8 months
--   metadata.is_repost    (missing RPC)   newest: 2025-12-07   <- 8 months
--   event_type project_created            rows:   0
--   event_type transaction_completed      rows:   0
--
-- The timeline kept producing events the whole time, so nothing looked broken.
--
-- WHY A NEW FUNCTION RATHER THAN EXTENDING create_post_with_visibility
-- That function currently carries ALL live posting. Extending its signature to
-- take parent/thread/target/content/amount/quantity/tags would put every
-- working post at risk to repair paths that are already 100% broken. A new
-- function cannot regress anything: the only code that calls this name is code
-- that fails today. Consolidating the two afterwards is a safe follow-up; doing
-- it in the same change as the repair is not.
--
-- Behaviour is deliberately copied from create_post_with_visibility so the two
-- cannot drift on the things that matter:
--   * the same 5-posts-per-minute rate limit
--   * the same 5-minute identical-description dedup (skipped for empty bodies,
--     so a repost — which has no text — is never mistaken for a duplicate)
--   * the same title fallback, so a repost with an empty title still gets one
--   * the same profile-timeline visibility row, without which the event is
--     created and then shows up on nobody's timeline
--
-- It does NOT insert notifications, because create_post_with_visibility does
-- not either and handlePostCreationHooks is still a logging placeholder.
-- Notifying a parent author on reply is a product decision, not part of
-- repairing the write path.
--
-- SECURITY. SECURITY DEFINER bypasses RLS, so the policy that normally protects
-- this table ("Users can create timeline events", WITH CHECK auth.uid() =
-- actor_id) does not apply inside the function body. The actor check below
-- re-imposes exactly that rule by hand. Without it, any authenticated caller
-- could post as any other user simply by passing their id.

CREATE OR REPLACE FUNCTION public.create_timeline_event(
  p_event_type      text,
  p_actor_id        uuid    DEFAULT NULL,
  p_actor_type      text    DEFAULT 'user',
  p_subject_type    text    DEFAULT 'profile',
  p_subject_id      uuid    DEFAULT NULL,
  p_event_subtype   text    DEFAULT NULL,
  p_target_type     text    DEFAULT NULL,
  p_target_id       uuid    DEFAULT NULL,
  p_title           text    DEFAULT NULL,
  p_description     text    DEFAULT NULL,
  p_content         jsonb   DEFAULT '{}'::jsonb,
  p_amount_btc      numeric DEFAULT NULL,
  p_quantity        integer DEFAULT NULL,
  p_visibility      text    DEFAULT 'public',
  p_is_featured     boolean DEFAULT false,
  p_metadata        jsonb   DEFAULT '{}'::jsonb,
  p_tags            text[]  DEFAULT '{}'::text[],
  p_parent_event_id uuid    DEFAULT NULL,
  p_thread_id       uuid    DEFAULT NULL
) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_actor_id          uuid;
  v_event_id          uuid;
  v_title             text;
  v_normalized_desc   text;
  v_recent_post_count integer;
  v_parent            record;
  v_thread_id         uuid;
  v_thread_depth      integer := 0;
BEGIN
  v_actor_id := COALESCE(p_actor_id, auth.uid());

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- See the SECURITY note above: this stands in for the RLS policy that
  -- SECURITY DEFINER suspends.
  IF v_actor_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Actor mismatch';
  END IF;

  -- Same limit as create_post_with_visibility. Replies and reposts are posts.
  SELECT COUNT(*) INTO v_recent_post_count
  FROM timeline_events
  WHERE actor_id = v_actor_id
    AND event_timestamp > now() - interval '1 minute'
    AND NOT COALESCE(is_deleted, false);

  IF v_recent_post_count >= 5 THEN
    RAISE EXCEPTION 'You are posting too quickly. Wait a moment and try again.';
  END IF;

  -- Dedup on identical text within 5 minutes. Empty bodies are skipped, which
  -- is what keeps reposts (no description) working.
  v_normalized_desc := NULLIF(TRIM(p_description), '');
  IF v_normalized_desc IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM timeline_events
      WHERE actor_id = v_actor_id
        AND TRIM(description) = v_normalized_desc
        AND event_timestamp > now() - interval '5 minutes'
        AND NOT COALESCE(is_deleted, false)
    ) THEN
      RAISE EXCEPTION 'You just posted this. Edit it or wait a few minutes before reposting.';
    END IF;
  END IF;

  -- A reply must point at something real, and inherits its parent's thread so
  -- the conversation stays one thread rather than starting a new one per reply.
  IF p_parent_event_id IS NOT NULL THEN
    SELECT id, thread_id, COALESCE(thread_depth, 0) AS thread_depth
      INTO v_parent
    FROM timeline_events
    WHERE id = p_parent_event_id
      AND NOT COALESCE(is_deleted, false);

    IF v_parent.id IS NULL THEN
      RAISE EXCEPTION 'Parent event not found';
    END IF;

    v_thread_id    := COALESCE(p_thread_id, v_parent.thread_id, v_parent.id);
    v_thread_depth := v_parent.thread_depth + 1;
  ELSE
    v_thread_id := p_thread_id;
  END IF;

  v_title := COALESCE(
    NULLIF(TRIM(p_title), ''),
    NULLIF(LEFT(TRIM(p_description), 140), ''),
    'Update'
  );

  INSERT INTO timeline_events (
    event_type, event_subtype, actor_id, actor_type,
    subject_type, subject_id, target_type, target_id,
    title, description, content, amount_btc, quantity,
    visibility, is_featured, metadata, tags,
    parent_event_id, thread_id, thread_depth,
    event_timestamp, created_at, updated_at
  ) VALUES (
    p_event_type, p_event_subtype, v_actor_id, COALESCE(p_actor_type, 'user'),
    p_subject_type, p_subject_id, p_target_type, p_target_id,
    v_title, p_description, COALESCE(p_content, '{}'::jsonb), p_amount_btc, p_quantity,
    COALESCE(p_visibility, 'public'), COALESCE(p_is_featured, false),
    COALESCE(p_metadata, '{}'::jsonb), COALESCE(p_tags, '{}'::text[]),
    p_parent_event_id, v_thread_id, v_thread_depth,
    now(), now(), now()
  )
  RETURNING id INTO v_event_id;

  -- Without this row the event exists and appears on no timeline.
  INSERT INTO timeline_event_visibility (event_id, timeline_type, timeline_owner_id)
  VALUES (v_event_id, 'profile', v_actor_id)
  ON CONFLICT (event_id, timeline_type, timeline_owner_id) DO NOTHING;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION public.create_timeline_event IS
  'General timeline-event writer used by replies, reposts, project events and transaction events. Mirrors create_post_with_visibility''s rate limit, dedup and title rules; re-imposes the RLS actor check that SECURITY DEFINER suspends.';

-- anon is deliberately omitted: an unauthenticated caller has no auth.uid() and
-- could only ever hit the "Authentication required" branch.
GRANT EXECUTE ON FUNCTION public.create_timeline_event(
  text, uuid, text, text, uuid, text, text, uuid, text, text, jsonb, numeric,
  integer, text, boolean, jsonb, text[], uuid, uuid
) TO authenticated, service_role;

-- PostgREST answers from a cached schema, so a function it has not reloaded is
-- still PGRST202 to the app — the migration would apply and the feature would
-- stay just as dead. This database does have `pgrst_ddl_watch` enabled (checked
-- 2026-08-26), which fires this same NOTIFY on any DDL, so this line is
-- belt-and-braces rather than load-bearing. It costs nothing and it removes the
-- dependency on an event trigger nobody in this repo owns.
NOTIFY pgrst, 'reload schema';
