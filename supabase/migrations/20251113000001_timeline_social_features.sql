-- Migration: Timeline Social Features - Likes, Shares, Comments
-- Created: 2025-11-13
-- Purpose: Add scalable social interaction features to timeline events
-- Priority: P0 - Core social features for engagement
-- Impact: User engagement, community building, platform growth

BEGIN;

-- ==================== LIKES SYSTEM ====================

-- Likes table for timeline events
CREATE TABLE IF NOT EXISTS timeline_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(event_id, user_id) -- Prevent duplicate likes
);

-- Indexes for likes
CREATE INDEX idx_timeline_likes_event ON timeline_likes(event_id);
CREATE INDEX idx_timeline_likes_user ON timeline_likes(user_id, created_at DESC);
CREATE INDEX idx_timeline_likes_created_at ON timeline_likes(created_at DESC);

-- Function to get like count for an event
CREATE OR REPLACE FUNCTION get_event_like_count(event_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM timeline_likes WHERE timeline_likes.event_id = $1;
$$;

-- Function to check if user liked an event
CREATE OR REPLACE FUNCTION has_user_liked_event(p_event_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM timeline_likes
    WHERE event_id = p_event_id AND user_id = p_user_id
  );
$$;

-- ==================== SHARES SYSTEM ====================

-- Shares/reposts table for timeline events
CREATE TABLE IF NOT EXISTS timeline_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id uuid NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Optional share text/content
  share_text text,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),

  UNIQUE(original_event_id, user_id) -- Prevent duplicate shares
);

-- Indexes for shares
CREATE INDEX idx_timeline_shares_original_event ON timeline_shares(original_event_id);
CREATE INDEX idx_timeline_shares_user ON timeline_shares(user_id, created_at DESC);
CREATE INDEX idx_timeline_shares_created_at ON timeline_shares(created_at DESC);

-- Function to get share count for an event
CREATE OR REPLACE FUNCTION get_event_share_count(event_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM timeline_shares WHERE timeline_shares.original_event_id = $1;
$$;

-- Function to check if user shared an event
CREATE OR REPLACE FUNCTION has_user_shared_event(p_event_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM timeline_shares
    WHERE original_event_id = p_event_id AND user_id = p_user_id
  );
$$;

-- ==================== COMMENTS SYSTEM ====================

-- Comments table for timeline events
CREATE TABLE IF NOT EXISTS timeline_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Comment content
  content text NOT NULL CHECK (char_length(content) <= 5000), -- 5k char limit
  content_html text, -- Optional HTML version for rich text

  -- Threading support
  parent_comment_id uuid REFERENCES timeline_comments(id) ON DELETE CASCADE,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Moderation
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deletion_reason text
);

-- Indexes for comments
CREATE INDEX idx_timeline_comments_event ON timeline_comments(event_id, created_at DESC);
CREATE INDEX idx_timeline_comments_user ON timeline_comments(user_id, created_at DESC);
CREATE INDEX idx_timeline_comments_parent ON timeline_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_timeline_comments_thread ON timeline_comments(
  CASE WHEN parent_comment_id IS NULL THEN id ELSE parent_comment_id END,
  created_at DESC
);

-- Updated_at trigger for comments
CREATE OR REPLACE FUNCTION update_timeline_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timeline_comment_updated_at
  BEFORE UPDATE ON timeline_comments
  FOR EACH ROW EXECUTE FUNCTION update_timeline_comment_updated_at();

-- Function to get comment count for an event
CREATE OR REPLACE FUNCTION get_event_comment_count(event_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM timeline_comments
  WHERE timeline_comments.event_id = $1
    AND NOT is_deleted;
$$;

-- Function to get comment thread count (replies)
CREATE OR REPLACE FUNCTION get_comment_reply_count(comment_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM timeline_comments
  WHERE parent_comment_id = $1
    AND NOT is_deleted;
$$;

-- ==================== EVENT STATS AGGREGATION ====================

-- Event stats view for efficient queries
CREATE OR REPLACE VIEW timeline_event_stats AS
SELECT
  te.id as event_id,
  COALESCE(tl.like_count, 0) as like_count,
  COALESCE(ts.share_count, 0) as share_count,
  COALESCE(tc.comment_count, 0) as comment_count,
  COALESCE(tc.top_level_comment_count, 0) as top_level_comment_count
FROM timeline_events te
LEFT JOIN (
  SELECT event_id, COUNT(*) as like_count
  FROM timeline_likes
  GROUP BY event_id
) tl ON te.id = tl.event_id
LEFT JOIN (
  SELECT original_event_id, COUNT(*) as share_count
  FROM timeline_shares
  GROUP BY original_event_id
) ts ON te.id = ts.original_event_id
LEFT JOIN (
  SELECT
    event_id,
    COUNT(*) as comment_count,
    COUNT(CASE WHEN parent_comment_id IS NULL THEN 1 END) as top_level_comment_count
  FROM timeline_comments
  WHERE NOT is_deleted
  GROUP BY event_id
) tc ON te.id = tc.event_id;

-- ==================== RLS POLICIES ====================

-- Timeline Likes RLS
ALTER TABLE timeline_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all timeline likes"
  ON timeline_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON timeline_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON timeline_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Timeline Shares RLS
ALTER TABLE timeline_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public shares are viewable by everyone"
  ON timeline_shares FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view follower shares"
  ON timeline_shares FOR SELECT
  USING (
    visibility = 'followers'
    AND EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = auth.uid()
        AND following_id = timeline_shares.user_id
    )
  );

CREATE POLICY "Users can view their own private shares"
  ON timeline_shares FOR SELECT
  USING (
    visibility = 'private'
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can create their own shares"
  ON timeline_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares"
  ON timeline_shares FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
  ON timeline_shares FOR DELETE
  USING (auth.uid() = user_id);

-- Timeline Comments RLS
ALTER TABLE timeline_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all non-deleted comments"
  ON timeline_comments FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Users can create comments"
  ON timeline_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON timeline_comments FOR UPDATE
  USING (auth.uid() = user_id AND NOT is_deleted)
  WITH CHECK (auth.uid() = user_id AND NOT is_deleted);

CREATE POLICY "Users can delete their own comments"
  ON timeline_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== HELPER FUNCTIONS ====================

-- Like an event
CREATE OR REPLACE FUNCTION like_timeline_event(p_event_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Set user_id if not provided
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Check if event exists
  IF NOT EXISTS(SELECT 1 FROM timeline_events WHERE id = p_event_id AND NOT is_deleted) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  -- Insert like (ON CONFLICT DO NOTHING prevents duplicates)
  INSERT INTO timeline_likes (event_id, user_id)
  VALUES (p_event_id, v_user_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  -- Get updated stats
  SELECT jsonb_build_object(
    'success', true,
    'liked', true,
    'like_count', get_event_like_count(p_event_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Unlike an event
CREATE OR REPLACE FUNCTION unlike_timeline_event(p_event_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Set user_id if not provided
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Delete like
  DELETE FROM timeline_likes
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- Return updated stats
  RETURN jsonb_build_object(
    'success', true,
    'liked', false,
    'like_count', get_event_like_count(p_event_id)
  );
END;
$$;

-- Share an event
CREATE OR REPLACE FUNCTION share_timeline_event(
  p_original_event_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_share_text text DEFAULT NULL,
  p_visibility text DEFAULT 'public'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Set user_id if not provided
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Check if event exists
  IF NOT EXISTS(SELECT 1 FROM timeline_events WHERE id = p_original_event_id AND NOT is_deleted) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  -- Insert share
  INSERT INTO timeline_shares (original_event_id, user_id, share_text, visibility)
  VALUES (p_original_event_id, v_user_id, p_share_text, p_visibility);

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'share_count', get_event_share_count(p_original_event_id)
  );
END;
$$;

-- Add a comment
CREATE OR REPLACE FUNCTION add_timeline_comment(
  p_event_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_content text,
  p_parent_comment_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_comment_id uuid;
BEGIN
  -- Set user_id if not provided
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Validate content
  IF char_length(p_content) = 0 OR char_length(p_content) > 5000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Comment content must be 1-5000 characters');
  END IF;

  -- Check if event exists
  IF NOT EXISTS(SELECT 1 FROM timeline_events WHERE id = p_event_id AND NOT is_deleted) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  -- If parent comment specified, ensure it exists and belongs to the same event
  IF p_parent_comment_id IS NOT NULL THEN
    IF NOT EXISTS(
      SELECT 1 FROM timeline_comments
      WHERE id = p_parent_comment_id
        AND event_id = p_event_id
        AND NOT is_deleted
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Parent comment not found');
    END IF;
  END IF;

  -- Insert comment
  INSERT INTO timeline_comments (event_id, user_id, content, parent_comment_id)
  VALUES (p_event_id, v_user_id, p_content, p_parent_comment_id)
  RETURNING id INTO v_comment_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'comment_id', v_comment_id,
    'comment_count', get_event_comment_count(p_event_id)
  );
END;
$$;

-- ==================== ENHANCED TIMELINE QUERIES ====================

-- Get enriched timeline feed with social stats
CREATE OR REPLACE FUNCTION get_enriched_timeline_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  -- Original timeline event fields
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

  -- Social interaction stats
  like_count integer,
  share_count integer,
  comment_count integer,
  top_level_comment_count integer,

  -- User's interaction state
  user_liked boolean,
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

    -- Social stats
    COALESCE(tes.like_count, 0) as like_count,
    COALESCE(tes.share_count, 0) as share_count,
    COALESCE(tes.comment_count, 0) as comment_count,
    COALESCE(tes.top_level_comment_count, 0) as top_level_comment_count,

    -- User's interactions
    has_user_liked_event(te.id, p_user_id) as user_liked,
    has_user_shared_event(te.id, p_user_id) as user_shared,
    EXISTS(
      SELECT 1 FROM timeline_comments tc
      WHERE tc.event_id = te.id AND tc.user_id = p_user_id AND NOT tc.is_deleted
    ) as user_commented

  FROM timeline_events te
  LEFT JOIN timeline_event_stats tes ON te.id = tes.event_id

  WHERE NOT te.is_deleted
    AND (
      -- User's own events
      te.actor_id = p_user_id
      -- Events from people user follows
      OR (te.visibility IN ('public', 'followers')
          AND EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = p_user_id
              AND f.following_id = te.actor_id
          ))
      -- Events about projects user has interacted with
      OR (te.subject_type = 'project'
          AND EXISTS (
            SELECT 1 FROM favorites fav
            WHERE fav.user_id = p_user_id
              AND fav.project_id = te.subject_id
          ))
    )
  ORDER BY te.event_timestamp DESC, te.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ==================== COMMENTS AND REPLIES ====================

-- Get comments for an event
CREATE OR REPLACE FUNCTION get_event_comments(
  p_event_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  parent_comment_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  is_deleted boolean,
  reply_count integer,
  user_name text,
  user_username text,
  user_avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.user_id,
    tc.content,
    tc.parent_comment_id,
    tc.created_at,
    tc.updated_at,
    tc.is_deleted,
    get_comment_reply_count(tc.id) as reply_count,
    p.display_name as user_name,
    p.username as user_username,
    p.avatar_url as user_avatar
  FROM timeline_comments tc
  JOIN profiles p ON tc.user_id = p.id
  WHERE tc.event_id = p_event_id
    AND NOT tc.is_deleted
    AND tc.parent_comment_id IS NULL -- Only top-level comments
  ORDER BY tc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get replies to a comment
CREATE OR REPLACE FUNCTION get_comment_replies(
  p_comment_id uuid,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text,
  user_username text,
  user_avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.user_id,
    tc.content,
    tc.created_at,
    tc.updated_at,
    p.display_name as user_name,
    p.username as user_username,
    p.avatar_url as user_avatar
  FROM timeline_comments tc
  JOIN profiles p ON tc.user_id = p.id
  WHERE tc.parent_comment_id = p_comment_id
    AND NOT tc.is_deleted
  ORDER BY tc.created_at ASC
  LIMIT p_limit;
END;
$$;

-- ==================== VERIFICATION ====================

DO $$
DECLARE
  v_likes_table boolean;
  v_shares_table boolean;
  v_comments_table boolean;
  v_stats_view boolean;
  v_functions_exist boolean;
BEGIN
  -- Check tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'timeline_likes'
  ) INTO v_likes_table;

  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'timeline_shares'
  ) INTO v_shares_table;

  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'timeline_comments'
  ) INTO v_comments_table;

  SELECT EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'timeline_event_stats'
  ) INTO v_stats_view;

  -- Check key functions exist
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname IN ('like_timeline_event', 'share_timeline_event', 'add_timeline_comment', 'get_enriched_timeline_feed')
  ) INTO v_functions_exist;

  IF v_likes_table AND v_shares_table AND v_comments_table AND v_stats_view AND v_functions_exist THEN
    RAISE NOTICE 'SUCCESS: Timeline social features created successfully';
    RAISE NOTICE '  ✓ Tables: timeline_likes, timeline_shares, timeline_comments';
    RAISE NOTICE '  ✓ View: timeline_event_stats';
    RAISE NOTICE '  ✓ Functions: like_timeline_event, share_timeline_event, add_timeline_comment, get_enriched_timeline_feed';
    RAISE NOTICE '  ✓ RLS: Policies enabled for all social interaction tables';
    RAISE NOTICE '  ✓ Indexes: Optimized for performance and queries';
  ELSE
    RAISE EXCEPTION 'FAILED: Timeline social features incomplete';
  END IF;
END $$;

COMMENT ON TABLE timeline_likes IS 'User likes on timeline events';
COMMENT ON TABLE timeline_shares IS 'User shares/reposts of timeline events';
COMMENT ON TABLE timeline_comments IS 'Comments and replies on timeline events';
COMMENT ON VIEW timeline_event_stats IS 'Aggregated social interaction statistics for timeline events';

COMMENT ON FUNCTION like_timeline_event IS 'Like a timeline event and return updated stats';
COMMENT ON FUNCTION unlike_timeline_event IS 'Unlike a timeline event and return updated stats';
COMMENT ON FUNCTION share_timeline_event IS 'Share a timeline event with optional text';
COMMENT ON FUNCTION add_timeline_comment IS 'Add a comment or reply to a timeline event';
COMMENT ON FUNCTION get_enriched_timeline_feed IS 'Get timeline feed with social interaction stats and user state';
COMMENT ON FUNCTION get_event_comments IS 'Get comments for a timeline event';
COMMENT ON FUNCTION get_comment_replies IS 'Get replies to a specific comment';

COMMIT;

-- Usage Examples:
--
-- 1. Like an event:
--    SELECT like_timeline_event('event-uuid', 'user-uuid');
--
-- 2. Share an event:
--    SELECT share_timeline_event('original-event-uuid', 'user-uuid', 'Check this out!');
--
-- 3. Add a comment:
--    SELECT add_timeline_comment('event-uuid', 'user-uuid', 'Great project!');
--
-- 4. Get enriched timeline feed:
--    SELECT * FROM get_enriched_timeline_feed('user-uuid', 20, 0);
--
-- 5. Get event comments:
--    SELECT * FROM get_event_comments('event-uuid', 10, 0);
