-- Migration: Posts Helper Functions
-- Priority: P0 - CRITICAL
-- Created: 2025-11-19
-- Purpose: Efficient query functions for the new posts architecture
-- Prerequisites: 20251119000002_fix_timeline_architecture.sql

BEGIN;

-- ============================================================================
-- HELPER FUNCTIONS FOR POSTS SYSTEM
-- ============================================================================

-- Function: Get community timeline (deduplicated, one post per entry)
CREATE OR REPLACE FUNCTION get_community_timeline(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'recent' -- 'recent', 'trending', 'popular'
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  content TEXT,
  title TEXT,
  media_urls TEXT[],
  visibility TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  -- Engagement counts
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  -- Cross-post info (where else this post appears)
  cross_posted_to JSONB,
  -- Current user interaction status
  user_liked BOOLEAN,
  user_shared BOOLEAN,
  user_commented BOOLEAN,
  -- Metadata
  tags TEXT[],
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO v_current_user_id
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN QUERY
  SELECT
    p.id AS post_id,
    p.author_id,
    prof.name AS author_name,
    prof.username AS author_username,
    prof.avatar_url AS author_avatar,
    p.content,
    p.title,
    p.media_urls,
    p.visibility,
    p.created_at,
    p.updated_at,
    p.published_at,

    -- Engagement counts
    COALESCE(likes.count, 0)::BIGINT AS like_count,
    COALESCE(comments.count, 0)::BIGINT AS comment_count,
    COALESCE(shares.count, 0)::BIGINT AS share_count,

    -- Cross-post info: array of {type, id, name}
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'timeline_type', pv.timeline_type,
          'timeline_owner_id', pv.timeline_owner_id,
          'timeline_name', CASE
            WHEN pv.timeline_type = 'profile' THEN (SELECT name FROM profiles WHERE id = pv.timeline_owner_id)
            WHEN pv.timeline_type = 'project' THEN (SELECT title FROM projects WHERE id = pv.timeline_owner_id)
            ELSE 'Community'
          END
        )
      ) FILTER (WHERE pv.timeline_type IS NOT NULL AND pv.timeline_type != 'community'),
      '[]'::jsonb
    ) AS cross_posted_to,

    -- User interaction status
    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = v_current_user_id)
    ELSE FALSE END AS user_liked,

    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_shares WHERE post_id = p.id AND user_id = v_current_user_id)
    ELSE FALSE END AS user_shared,

    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_comments WHERE post_id = p.id AND author_id = v_current_user_id AND NOT is_deleted)
    ELSE FALSE END AS user_commented,

    p.tags,
    p.metadata

  FROM posts p
  JOIN profiles prof ON prof.id = p.author_id
  LEFT JOIN post_visibility pv ON pv.post_id = p.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_likes WHERE post_id = p.id
  ) likes ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_comments WHERE post_id = p.id AND NOT is_deleted
  ) comments ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_shares WHERE post_id = p.id
  ) shares ON TRUE

  WHERE
    p.visibility = 'public'
    AND p.published_at IS NOT NULL
    AND NOT p.is_deleted
    -- Must appear in community timeline
    AND EXISTS (
      SELECT 1 FROM post_visibility
      WHERE post_id = p.id AND timeline_type = 'community'
    )

  GROUP BY
    p.id, p.author_id, p.content, p.title, p.media_urls, p.visibility,
    p.created_at, p.updated_at, p.published_at, p.tags, p.metadata,
    prof.name, prof.username, prof.avatar_url,
    likes.count, comments.count, shares.count

  ORDER BY
    CASE
      WHEN p_sort_by = 'trending' THEN
        -- Trending: recent posts with high engagement (time-decayed)
        (COALESCE(likes.count, 0) + COALESCE(shares.count, 0) * 2 + COALESCE(comments.count, 0) * 3) *
        EXP(-EXTRACT(EPOCH FROM (now() - p.published_at))/86400)
      WHEN p_sort_by = 'popular' THEN
        -- Popular: total engagement
        -(COALESCE(likes.count, 0) + COALESCE(shares.count, 0) * 2 + COALESCE(comments.count, 0) * 3)
      ELSE
        -- Recent: chronological (default)
        -EXTRACT(EPOCH FROM p.published_at)
    END,
    p.published_at DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_community_timeline IS 'Get deduplicated community timeline - one post per entry with cross-post info';

-- Function: Get profile timeline
CREATE OR REPLACE FUNCTION get_profile_timeline(
  p_profile_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  content TEXT,
  title TEXT,
  media_urls TEXT[],
  visibility TEXT,
  created_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  cross_posted_to JSONB,
  is_pinned BOOLEAN,
  user_liked BOOLEAN,
  user_shared BOOLEAN,
  user_commented BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  SELECT id INTO v_current_user_id
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN QUERY
  SELECT
    p.id AS post_id,
    p.author_id,
    prof.name AS author_name,
    prof.username AS author_username,
    prof.avatar_url AS author_avatar,
    p.content,
    p.title,
    p.media_urls,
    p.visibility,
    p.created_at,
    p.published_at,
    COALESCE(likes.count, 0)::BIGINT AS like_count,
    COALESCE(comments.count, 0)::BIGINT AS comment_count,
    COALESCE(shares.count, 0)::BIGINT AS share_count,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'timeline_type', pv2.timeline_type,
          'timeline_owner_id', pv2.timeline_owner_id
        )
      ) FILTER (WHERE pv2.timeline_type IS NOT NULL AND pv2.id != pv.id),
      '[]'::jsonb
    ) AS cross_posted_to,
    pv.is_pinned,
    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = v_current_user_id)
    ELSE FALSE END AS user_liked,
    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_shares WHERE post_id = p.id AND user_id = v_current_user_id)
    ELSE FALSE END AS user_shared,
    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_comments WHERE post_id = p.id AND author_id = v_current_user_id AND NOT is_deleted)
    ELSE FALSE END AS user_commented

  FROM posts p
  JOIN profiles prof ON prof.id = p.author_id
  JOIN post_visibility pv ON pv.post_id = p.id
    AND pv.timeline_type = 'profile'
    AND pv.timeline_owner_id = p_profile_id
  LEFT JOIN post_visibility pv2 ON pv2.post_id = p.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_likes WHERE post_id = p.id
  ) likes ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_comments WHERE post_id = p.id AND NOT is_deleted
  ) comments ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_shares WHERE post_id = p.id
  ) shares ON TRUE

  WHERE
    p.published_at IS NOT NULL
    AND NOT p.is_deleted
    AND (p.visibility = 'public' OR p.author_id = p_profile_id)

  GROUP BY
    p.id, p.author_id, p.content, p.title, p.media_urls, p.visibility,
    p.created_at, p.published_at,
    prof.name, prof.username, prof.avatar_url,
    pv.is_pinned, pv.pinned_at,
    likes.count, comments.count, shares.count

  ORDER BY
    pv.is_pinned DESC,
    pv.pinned_at DESC NULLS LAST,
    p.published_at DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_profile_timeline IS 'Get posts visible on a profile timeline';

-- Function: Get project timeline
CREATE OR REPLACE FUNCTION get_project_timeline(
  p_project_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  content TEXT,
  title TEXT,
  media_urls TEXT[],
  visibility TEXT,
  created_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  is_pinned BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS post_id,
    p.author_id,
    prof.name AS author_name,
    prof.username AS author_username,
    prof.avatar_url AS author_avatar,
    p.content,
    p.title,
    p.media_urls,
    p.visibility,
    p.created_at,
    p.published_at,
    COALESCE(likes.count, 0)::BIGINT AS like_count,
    COALESCE(comments.count, 0)::BIGINT AS comment_count,
    COALESCE(shares.count, 0)::BIGINT AS share_count,
    pv.is_pinned

  FROM posts p
  JOIN profiles prof ON prof.id = p.author_id
  JOIN post_visibility pv ON pv.post_id = p.id
    AND pv.timeline_type = 'project'
    AND pv.timeline_owner_id = p_project_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_likes WHERE post_id = p.id
  ) likes ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_comments WHERE post_id = p.id AND NOT is_deleted
  ) comments ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count FROM post_shares WHERE post_id = p.id
  ) shares ON TRUE

  WHERE
    p.published_at IS NOT NULL
    AND NOT p.is_deleted
    AND p.visibility = 'public'

  ORDER BY
    pv.is_pinned DESC,
    pv.pinned_at DESC NULLS LAST,
    p.published_at DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_project_timeline IS 'Get posts visible on a project timeline';

-- Function: Create post with visibility (replaces multiple createEvent calls)
CREATE OR REPLACE FUNCTION create_post_with_visibility(
  p_author_id UUID,
  p_content TEXT,
  p_title TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT 'public',
  p_timeline_types TEXT[] DEFAULT ARRAY['community']::TEXT[],
  p_timeline_owner_ids UUID[] DEFAULT ARRAY[]::UUID[],
  p_media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  post_id UUID,
  created_visibility_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_id UUID;
  v_visibility_count INTEGER := 0;
  v_timeline_type TEXT;
  v_timeline_owner_id UUID;
  v_i INTEGER;
BEGIN
  -- Create post
  INSERT INTO posts (
    author_id,
    content,
    title,
    visibility,
    media_urls,
    tags,
    metadata,
    published_at
  ) VALUES (
    p_author_id,
    p_content,
    p_title,
    p_visibility,
    p_media_urls,
    p_tags,
    p_metadata,
    now()
  )
  RETURNING id INTO v_post_id;

  -- Add visibility entries
  FOR v_i IN 1..array_length(p_timeline_types, 1) LOOP
    v_timeline_type := p_timeline_types[v_i];
    v_timeline_owner_id := CASE
      WHEN v_timeline_type = 'community' THEN NULL
      ELSE p_timeline_owner_ids[v_i]
    END;

    INSERT INTO post_visibility (
      post_id,
      timeline_type,
      timeline_owner_id,
      added_by_id
    ) VALUES (
      v_post_id,
      v_timeline_type,
      v_timeline_owner_id,
      p_author_id
    )
    ON CONFLICT (post_id, timeline_type, timeline_owner_id) DO NOTHING;

    v_visibility_count := v_visibility_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_post_id, v_visibility_count;
END;
$$;

COMMENT ON FUNCTION create_post_with_visibility IS 'Create a post and add it to multiple timelines in one transaction';

COMMIT;

-- ============================================================================
-- Usage Examples
-- ============================================================================

-- Example 1: Get community timeline (recent)
-- SELECT * FROM get_community_timeline(20, 0, 'recent');

-- Example 2: Get community timeline (trending)
-- SELECT * FROM get_community_timeline(20, 0, 'trending');

-- Example 3: Get profile timeline
-- SELECT * FROM get_profile_timeline('profile-uuid', 20, 0);

-- Example 4: Get project timeline
-- SELECT * FROM get_project_timeline('project-uuid', 20, 0);

-- Example 5: Create post with cross-posting
-- SELECT * FROM create_post_with_visibility(
--   'author-profile-id',
--   'This is my post content!',
--   'Post Title',
--   'public',
--   ARRAY['profile', 'project', 'community'],
--   ARRAY['my-profile-id', 'my-project-id', NULL],
--   ARRAY[]::TEXT[],
--   ARRAY['announcement', 'update'],
--   '{"mood": "excited"}'::JSONB
-- );
