-- Fix timeline feed functions to reference project_favorites instead of nonexistent favorites
-- Tighten RLS for likes/comments/dislikes to respect event visibility

BEGIN;

-- Ensure pgcrypto for gen_random_uuid is available (id defaults)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix get_user_timeline_feed favorites reference
CREATE OR REPLACE FUNCTION get_user_timeline_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_subtype text,
  actor_id uuid,
  actor_type text,
  title text,
  description text,
  event_timestamp timestamptz,
  content jsonb,
  amount_sats bigint,
  amount_btc numeric,
  quantity integer,
  metadata jsonb,
  tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.id,
    te.event_type,
    te.event_subtype,
    te.actor_id,
    te.actor_type,
    te.title,
    te.description,
    te.event_timestamp,
    te.content,
    te.amount_sats,
    te.amount_btc,
    te.quantity,
    te.metadata,
    te.tags
  FROM timeline_events te
  WHERE NOT te.is_deleted
    AND (
      te.actor_id = p_user_id
      OR (
        te.subject_type = 'project'
        AND EXISTS (
          SELECT 1 FROM public.project_favorites pf
          WHERE pf.user_id = p_user_id
            AND pf.project_id = te.subject_id
        )
      )
    )
  ORDER BY te.event_timestamp DESC, te.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Fix get_enriched_timeline_feed favorites reference
CREATE OR REPLACE FUNCTION get_enriched_timeline_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_subtype text,
  actor_id uuid,
  actor_type text,
  title text,
  description text,
  event_timestamp timestamptz,
  content jsonb,
  amount_sats bigint,
  amount_btc numeric,
  quantity integer,
  metadata jsonb,
  tags text[],
  like_count integer,
  dislike_count integer,
  share_count integer,
  comment_count integer,
  top_level_comment_count integer,
  user_liked boolean,
  user_disliked boolean,
  user_shared boolean,
  user_commented boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.id,
    te.event_type,
    te.event_subtype,
    te.actor_id,
    te.actor_type,
    te.title,
    te.description,
    te.event_timestamp,
    te.content,
    te.amount_sats,
    te.amount_btc,
    te.quantity,
    te.metadata,
    te.tags,
    COALESCE(tes.like_count, 0) as like_count,
    COALESCE(tes.dislike_count, 0) as dislike_count,
    COALESCE(tes.share_count, 0) as share_count,
    COALESCE(tes.comment_count, 0) as comment_count,
    COALESCE(tes.top_level_comment_count, 0) as top_level_comment_count,
    has_user_liked_event(te.id, p_user_id) as user_liked,
    has_user_disliked_event(te.id, p_user_id) as user_disliked,
    has_user_shared_event(te.id, p_user_id) as user_shared,
    EXISTS(
      SELECT 1 FROM timeline_comments tc
      WHERE tc.event_id = te.id AND tc.user_id = p_user_id AND NOT tc.is_deleted
    ) as user_commented
  FROM timeline_events te
  LEFT JOIN timeline_event_stats tes ON te.id = tes.event_id
  WHERE NOT te.is_deleted
    AND (
      te.actor_id = p_user_id
      OR (
        te.visibility IN ('public', 'followers')
        AND EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_id = p_user_id
            AND f.following_id = te.actor_id
        )
      )
      OR (
        te.subject_type = 'project'
        AND EXISTS (
          SELECT 1 FROM public.project_favorites pf
          WHERE pf.user_id = p_user_id
            AND pf.project_id = te.subject_id
        )
      )
    )
  ORDER BY te.event_timestamp DESC, te.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Tighten RLS for likes/dislikes/comments to match event visibility

-- Likes
DROP POLICY IF EXISTS "Users can view all timeline likes" ON public.timeline_likes;
CREATE POLICY "Users can view likes for visible events"
  ON public.timeline_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.timeline_events te
      WHERE te.id = timeline_likes.event_id
        AND NOT te.is_deleted
        AND (
          te.visibility = 'public'
          OR te.actor_id = auth.uid()
          OR (
            te.visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM public.follows f
              WHERE f.follower_id = auth.uid()
                AND f.following_id = te.actor_id
            )
          )
        )
    )
  );

-- Dislikes
DROP POLICY IF EXISTS "Users can view all timeline dislikes" ON public.timeline_dislikes;
CREATE POLICY "Users can view dislikes for visible events"
  ON public.timeline_dislikes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.timeline_events te
      WHERE te.id = timeline_dislikes.event_id
        AND NOT te.is_deleted
        AND (
          te.visibility = 'public'
          OR te.actor_id = auth.uid()
          OR (
            te.visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM public.follows f
              WHERE f.follower_id = auth.uid()
                AND f.following_id = te.actor_id
            )
          )
        )
    )
  );

-- Comments
DROP POLICY IF EXISTS "Users can view all non-deleted comments" ON public.timeline_comments;
CREATE POLICY "Users can view comments for visible events"
  ON public.timeline_comments FOR SELECT
  USING (
    NOT is_deleted AND EXISTS (
      SELECT 1 FROM public.timeline_events te
      WHERE te.id = timeline_comments.event_id
        AND NOT te.is_deleted
        AND (
          te.visibility = 'public'
          OR te.actor_id = auth.uid()
          OR (
            te.visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM public.follows f
              WHERE f.follower_id = auth.uid()
                AND f.following_id = te.actor_id
            )
          )
        )
    )
  );

COMMIT;

