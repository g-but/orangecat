-- Cat forgotten-facts suppression list.
--
-- WHY: forget_memories deletes rows from cat_memories, but the passive
-- extractor (extractAndStoreMemories) re-reads conversation context after
-- every exchange — so a fact the user explicitly disowned ("I don't speak
-- French") could be quietly RE-LEARNED from an old message or page excerpt.
-- This table remembers what was forgotten (content + embedding, NOT shown in
-- "What Cat remembers") so extraction can skip matching candidates.
-- An explicit remember_fact by the user clears matching suppressions —
-- a deliberate statement always outranks a past deletion.
--
-- Conventions copied from cat_memories (baseline): printcraft.vector(1536),
-- hnsw cosine index, owner-scoped RLS, match_* RPC granted to client roles.
-- Replay-idempotent throughout.

CREATE TABLE IF NOT EXISTS public.cat_forgotten_facts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    content text NOT NULL,
    embedding printcraft.vector(1536),
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS cat_forgotten_facts_user_idx
    ON public.cat_forgotten_facts (user_id);
CREATE INDEX IF NOT EXISTS cat_forgotten_facts_hnsw
    ON public.cat_forgotten_facts USING hnsw (embedding printcraft.vector_cosine_ops);

ALTER TABLE public.cat_forgotten_facts ENABLE ROW LEVEL SECURITY;

-- Owner-scoped RLS: the Cat writes through the user's own client (see
-- 20260729133000_cat_action_write_policies.sql for why INSERT policies must
-- exist explicitly — a missing one fails silently under PostgREST).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cat_forgotten_facts'
      AND policyname = 'Users can view own forgotten facts'
  ) THEN
    CREATE POLICY "Users can view own forgotten facts" ON public.cat_forgotten_facts
      FOR SELECT USING (user_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cat_forgotten_facts'
      AND policyname = 'Users can insert own forgotten facts'
  ) THEN
    CREATE POLICY "Users can insert own forgotten facts" ON public.cat_forgotten_facts
      FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cat_forgotten_facts'
      AND policyname = 'Users can delete own forgotten facts'
  ) THEN
    CREATE POLICY "Users can delete own forgotten facts" ON public.cat_forgotten_facts
      FOR DELETE USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

GRANT SELECT, INSERT, DELETE ON public.cat_forgotten_facts TO authenticated;
GRANT ALL ON public.cat_forgotten_facts TO service_role;

-- Semantic lookup, mirroring match_cat_memories.
CREATE OR REPLACE FUNCTION public.match_cat_forgotten_facts(
    p_user_id uuid,
    query_embedding printcraft.vector,
    match_count integer DEFAULT 3,
    min_similarity double precision DEFAULT 0.6
) RETURNS TABLE(id uuid, content text, similarity double precision, created_at timestamptz)
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'printcraft'
    AS $$
  select
    ff.id,
    ff.content,
    1 - (ff.embedding <=> query_embedding) as similarity,
    ff.created_at
  from public.cat_forgotten_facts ff
  where ff.user_id = p_user_id
    and ff.embedding is not null
    and 1 - (ff.embedding <=> query_embedding) >= min_similarity
  order by ff.embedding <=> query_embedding
  limit match_count;
$$;

GRANT ALL ON FUNCTION public.match_cat_forgotten_facts(uuid, printcraft.vector, integer, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.match_cat_forgotten_facts(uuid, printcraft.vector, integer, double precision) TO service_role;
