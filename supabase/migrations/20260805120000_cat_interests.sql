-- Cat interests: the opt-in PUBLIC projection of what the Cat knows about you.
--
-- WHY A SEPARATE TABLE (and not a `shared` boolean on cat_memories):
-- cat_memories is private by construction — everything in it is safe only
-- because nothing outside the owner can read it. A visibility flag on that
-- table would mean one bad predicate anywhere leaks private facts. Here the
-- privacy boundary is structural instead: publishing requires deliberately
-- writing a row into a table that is public by design, so the failure mode of
-- a bug is "an interest is missing", never "a private memory leaked".
--
-- WHY IT EXISTS: 148 profiles, 5 bios. People are effectively undiscoverable,
-- so topic search can only find those who already published an entity. An
-- interest is the cheapest possible unit of discoverability — one phrase,
-- captured from a conversation the user was already having.

CREATE TABLE IF NOT EXISTS public.cat_interests (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    -- The user's own words, shown to others verbatim.
    topic text NOT NULL CHECK (char_length(topic) BETWEEN 2 AND 80),
    -- Lowercased/collapsed form, used only for dedupe.
    normalized text NOT NULL,
    embedding printcraft.vector(1536),
    -- 'cat' = proposed by the Cat and confirmed by the user; 'manual' = typed.
    source text DEFAULT 'cat' NOT NULL CHECK (source IN ('cat', 'manual')),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- One row per person per topic: re-publishing is idempotent, not a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS cat_interests_user_topic_key
    ON public.cat_interests (user_id, normalized);
CREATE INDEX IF NOT EXISTS cat_interests_user_idx ON public.cat_interests (user_id);
CREATE INDEX IF NOT EXISTS cat_interests_hnsw
    ON public.cat_interests USING hnsw (embedding printcraft.vector_cosine_ops);

ALTER TABLE public.cat_interests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Readable by any signed-in user: that IS the feature. Discovery happens
  -- inside the Cat, which requires auth, so anon stays excluded.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'cat_interests' AND policyname = 'Interests are publicly readable'
  ) THEN
    CREATE POLICY "Interests are publicly readable" ON public.cat_interests
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'cat_interests' AND policyname = 'Users can insert own interests'
  ) THEN
    CREATE POLICY "Users can insert own interests" ON public.cat_interests
      FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'cat_interests' AND policyname = 'Users can delete own interests'
  ) THEN
    CREATE POLICY "Users can delete own interests" ON public.cat_interests
      FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

GRANT SELECT, INSERT, DELETE ON public.cat_interests TO authenticated;
GRANT ALL ON public.cat_interests TO service_role;

-- Who else is into this? Excludes the caller: discovering yourself is not
-- discovery. STABLE + invoker rights, so the SELECT policy above still applies.
CREATE OR REPLACE FUNCTION public.match_interested_people(
    query_embedding printcraft.vector,
    exclude_user uuid,
    match_count integer DEFAULT 8,
    min_similarity double precision DEFAULT 0.45
) RETURNS TABLE(user_id uuid, topic text, similarity double precision)
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'printcraft'
    AS $$
  select distinct on (i.user_id)
    i.user_id,
    i.topic,
    1 - (i.embedding <=> query_embedding) as similarity
  from public.cat_interests i
  where i.embedding is not null
    and i.user_id <> exclude_user
    and 1 - (i.embedding <=> query_embedding) >= min_similarity
  order by i.user_id, i.embedding <=> query_embedding
  limit match_count;
$$;

GRANT ALL ON FUNCTION public.match_interested_people(printcraft.vector, uuid, integer, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.match_interested_people(printcraft.vector, uuid, integer, double precision) TO service_role;

-- Topic watches: "tell me when someone shows up working on longevity".
-- An empty search today becomes a standing subscription instead of a dead end.
ALTER TABLE public.cat_watches ADD COLUMN IF NOT EXISTS topic text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.cat_watches'::regclass AND conname = 'cat_watches_kind_check'
  ) THEN
    ALTER TABLE public.cat_watches DROP CONSTRAINT cat_watches_kind_check;
  END IF;
  ALTER TABLE public.cat_watches ADD CONSTRAINT cat_watches_kind_check
    CHECK (kind IN ('funding_reached', 'sale_received', 'booking_received', 'topic_match'));
END $$;
