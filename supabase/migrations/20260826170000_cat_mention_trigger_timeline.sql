-- Notice when a post or reply tags the Cat.
--
-- Private messages are written through an API route, so there is a server seam
-- to notice a mention in. Wall posts are not: post-composer.ts calls a Postgres
-- function straight from the BROWSER. There is nowhere in the app to hook, so
-- the notice has to happen in the database.
--
-- A trigger is also the stronger choice on its own merits: it cannot be skipped
-- by a client that forgets to call an endpoint, or by a second client written
-- later, and it costs one small insert on a table that is already being written.
--
-- THIS TRIGGER IS A PREFILTER, NOT THE RULE.
-- Mention detection has ONE implementation — domain/mentions/parse.ts plus
-- services/mentions/resolve.ts — and it stays there, because getting `@cat.` and
-- `@catalog` and `bob@example.com` right is not something to write twice in two
-- languages and hope they agree. So this asks only the cheap, permissive
-- question "does this text contain @cat at all?" and the worker decides for
-- real. It may over-select (a post about `@catalogue` is queued and then
-- discarded); it must never under-select, which is why the pattern is a plain
-- case-insensitive substring rather than a clever one.

CREATE OR REPLACE FUNCTION public.note_cat_mention_on_timeline_event()
RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cat_id uuid;
BEGIN
  -- Nothing to do for the overwhelming majority of posts.
  IF COALESCE(NEW.description, '') !~* '@cat'
     AND COALESCE(NEW.title, '') !~* '@cat' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_cat_id FROM profiles WHERE username = 'cat';

  -- No Cat account yet: nothing can be owed to a sender that does not exist.
  IF v_cat_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- The Cat never answers itself. Without this, a reply of its own that quoted
  -- the handle would queue another reply, forever.
  IF NEW.actor_id = v_cat_id THEN
    RETURN NEW;
  END IF;

  -- ON CONFLICT DO NOTHING is what makes the trigger safe to fire more than
  -- once: the unique key on (source_type, source_id) means one post owes one
  -- reply however many times this runs.
  INSERT INTO cat_mention_queue (source_type, source_id, requester_id, parent_event_id)
  VALUES ('timeline_event', NEW.id, NEW.actor_id, NEW.id)
  ON CONFLICT (source_type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.note_cat_mention_on_timeline_event IS
  'Prefilter only: queues a post that MIGHT tag the Cat. services/mentions/resolve.ts is the authority on whether it actually does.';

DROP TRIGGER IF EXISTS trg_note_cat_mention ON public.timeline_events;

-- AFTER INSERT: the post is already stored, so a fault here can never cost
-- somebody their words. The trigger is not deferrable for the same reason —
-- queueing late is fine, losing the post is not.
CREATE TRIGGER trg_note_cat_mention
  AFTER INSERT ON public.timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION public.note_cat_mention_on_timeline_event();

NOTIFY pgrst, 'reload schema';
