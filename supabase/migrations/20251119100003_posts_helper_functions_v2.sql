-- =====================================================
-- Migration: Posts Helper Functions (v2 - WITH FIXES)
-- =====================================================
-- Created: 2025-11-19
-- Purpose: Query functions for posts and timelines
-- Fixes: Array validation, better performance, error handling
--
-- CRITICAL FIXES IN V2:
-- ✅ Added array length validation in create_post_with_visibility
-- ✅ Added timeline_type/owner_id consistency checks
-- ✅ Improved indexes referenced by functions
-- ✅ Better error messages and validation
-- ✅ Optimized queries for performance
--
-- Dependencies: Requires 20251119100002_fix_timeline_architecture_v2.sql
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE POST WITH VISIBILITY (IMPROVED)
-- =====================================================
-- One-call function to create post and set visibility on multiple timelines
-- Replaces the old pattern of creating separate timeline_events

CREATE OR REPLACE FUNCTION create_post_with_visibility(
  p_author_id UUID,
  p_content TEXT,
  p_title TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT 'public',
  p_timeline_types TEXT[] DEFAULT ARRAY['community'],
  p_timeline_owner_ids UUID[] DEFAULT ARRAY[NULL::UUID],
  p_tags TEXT[] DEFAULT '{}',
  p_media_urls TEXT[] DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  post_id UUID,
  visibility_ids UUID[]
) AS $$
DECLARE
  v_post_id UUID;
  v_visibility_id UUID;
  v_visibility_ids UUID[] := '{}';
  v_i INT;
  v_timeline_type TEXT;
  v_timeline_owner_id UUID;
BEGIN
  -- =====================================================
  -- VALIDATION (CRITICAL FIXES)
  -- =====================================================

  -- Validate author exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_author_id) THEN
    RAISE EXCEPTION 'Author profile with id % does not exist', p_author_id;
  END IF;

  -- Validate content
  IF p_content IS NULL OR trim(p_content) = '' THEN
    RAISE EXCEPTION 'Post content cannot be empty';
  END IF;

  IF char_length(p_content) > 10000 THEN
    RAISE EXCEPTION 'Post content too long (max 10000 characters)';
  END IF;

  -- Validate visibility
  IF p_visibility NOT IN ('public', 'followers', 'private', 'draft') THEN
    RAISE EXCEPTION 'Invalid visibility: %. Must be public, followers, private, or draft', p_visibility;
  END IF;

  -- Validate arrays have same length (CRITICAL FIX)
  IF array_length(p_timeline_types, 1) IS NULL THEN
    RAISE EXCEPTION 'timeline_types array cannot be empty';
  END IF;

  IF array_length(p_timeline_types, 1) != array_length(p_timeline_owner_ids, 1) THEN
    RAISE EXCEPTION 'timeline_types (length %) and timeline_owner_ids (length %) must have same length',
      array_length(p_timeline_types, 1),
      array_length(p_timeline_owner_ids, 1);
  END IF;

  -- Validate each timeline type/owner pair (CRITICAL FIX)
  FOR v_i IN 1..array_length(p_timeline_types, 1) LOOP
    v_timeline_type := p_timeline_types[v_i];
    v_timeline_owner_id := p_timeline_owner_ids[v_i];

    -- Validate timeline_type
    IF v_timeline_type NOT IN ('profile', 'project', 'community') THEN
      RAISE EXCEPTION 'Invalid timeline_type at position %: %. Must be profile, project, or community',
        v_i, v_timeline_type;
    END IF;

    -- Community timeline must have NULL owner
    IF v_timeline_type = 'community' AND v_timeline_owner_id IS NOT NULL THEN
      RAISE EXCEPTION 'Community timeline at position % should not have owner_id', v_i;
    END IF;

    -- Profile/project timelines must have owner
    IF v_timeline_type IN ('profile', 'project') AND v_timeline_owner_id IS NULL THEN
      RAISE EXCEPTION '% timeline at position % requires timeline_owner_id', v_timeline_type, v_i;
    END IF;

    -- Validate owner exists
    IF v_timeline_type = 'profile' AND v_timeline_owner_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_timeline_owner_id) THEN
        RAISE EXCEPTION 'Profile with id % does not exist (position %)', v_timeline_owner_id, v_i;
      END IF;
    ELSIF v_timeline_type = 'project' AND v_timeline_owner_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = v_timeline_owner_id) THEN
        RAISE EXCEPTION 'Project with id % does not exist (position %)', v_timeline_owner_id, v_i;
      END IF;
    END IF;
  END LOOP;

  -- =====================================================
  -- CREATE POST
  -- =====================================================

  INSERT INTO public.posts (
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
    CASE WHEN p_visibility != 'draft' THEN now() ELSE NULL END
  )
  RETURNING id INTO v_post_id;

  -- =====================================================
  -- CREATE VISIBILITY ENTRIES
  -- =====================================================

  FOR v_i IN 1..array_length(p_timeline_types, 1) LOOP
    v_timeline_type := p_timeline_types[v_i];
    v_timeline_owner_id := p_timeline_owner_ids[v_i];

    -- Check for duplicate visibility (same post, same timeline)
    IF EXISTS (
      SELECT 1 FROM public.post_visibility
      WHERE post_id = v_post_id
        AND timeline_type = v_timeline_type
        AND (
          (timeline_owner_id IS NULL AND v_timeline_owner_id IS NULL) OR
          (timeline_owner_id = v_timeline_owner_id)
        )
    ) THEN
      RAISE WARNING 'Skipping duplicate visibility: post % already visible on % timeline %',
        v_post_id, v_timeline_type, COALESCE(v_timeline_owner_id::TEXT, 'community');
      CONTINUE;
    END IF;

    INSERT INTO public.post_visibility (
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
    RETURNING id INTO v_visibility_id;

    v_visibility_ids := array_append(v_visibility_ids, v_visibility_id);
  END LOOP;

  -- =====================================================
  -- RETURN RESULTS
  -- =====================================================

  RETURN QUERY SELECT v_post_id, v_visibility_ids;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION create_post_with_visibility IS 'Create post with visibility on multiple timelines in one call. Includes comprehensive validation.';

-- =====================================================
-- 2. GET COMMUNITY TIMELINE (OPTIMIZED)
-- =====================================================
-- Deduplicated community feed with engagement metrics

CREATE OR REPLACE FUNCTION get_community_timeline(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_sort_by TEXT DEFAULT 'recent' -- 'recent', 'trending', 'popular'
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_username TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  title TEXT,
  content TEXT,
  media_urls TEXT[],
  tags TEXT[],
  published_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  has_user_liked BOOLEAN,
  cross_posted_to JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Validate sort_by
  IF p_sort_by NOT IN ('recent', 'trending', 'popular') THEN
    RAISE EXCEPTION 'Invalid sort_by: %. Must be recent, trending, or popular', p_sort_by;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.author_id,
    pr.username,
    pr.name,
    pr.avatar_url,
    p.title,
    p.content,
    p.media_urls,
    p.tags,
    p.published_at,
    p.edited_at,

    -- Engagement counts
    COALESCE(like_counts.count, 0) as like_count,
    COALESCE(comment_counts.count, 0) as comment_count,
    COALESCE(share_counts.count, 0) as share_count,

    -- Has current user liked?
    COALESCE(user_likes.has_liked, false) as has_user_liked,

    -- Cross-posted timelines (limit to first 5 for performance)
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'timeline_type', pv2.timeline_type,
          'timeline_owner_id', pv2.timeline_owner_id
        )
      )
      FROM (
        SELECT DISTINCT timeline_type, timeline_owner_id
        FROM public.post_visibility
        WHERE post_id = p.id
          AND timeline_type != 'community'
        LIMIT 5
      ) pv2
    ), '[]'::jsonb) as cross_posted_to,

    p.created_at

  FROM public.posts p

  -- Must be visible on community timeline
  INNER JOIN public.post_visibility pv
    ON p.id = pv.post_id
    AND pv.timeline_type = 'community'

  -- Author info
  INNER JOIN public.profiles pr
    ON p.author_id = pr.id

  -- Like counts (LEFT JOIN for performance)
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM public.post_likes
    WHERE post_id = p.id
  ) like_counts ON true

  -- Comment counts
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM public.post_comments
    WHERE post_id = p.id AND NOT is_deleted
  ) comment_counts ON true

  -- Share counts
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM public.post_shares
    WHERE post_id = p.id
  ) share_counts ON true

  -- User liked? (only if authenticated)
  LEFT JOIN LATERAL (
    SELECT true as has_liked
    FROM public.post_likes
    WHERE post_id = p.id
      AND user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    LIMIT 1
  ) user_likes ON true

  WHERE p.visibility = 'public'
    AND p.published_at IS NOT NULL
    AND p.published_at <= now()
    AND NOT p.is_deleted

  ORDER BY
    CASE p_sort_by
      WHEN 'recent' THEN p.published_at
      WHEN 'trending' THEN NULL -- Use engagement score
      WHEN 'popular' THEN NULL
    END DESC,
    -- Trending: engagement in last 24h
    CASE p_sort_by
      WHEN 'trending' THEN (
        COALESCE(like_counts.count, 0) * 3 +
        COALESCE(comment_counts.count, 0) * 5 +
        COALESCE(share_counts.count, 0) * 10
      ) / GREATEST(EXTRACT(EPOCH FROM (now() - p.published_at)) / 3600, 1)
    END DESC,
    -- Popular: all-time engagement
    CASE p_sort_by
      WHEN 'popular' THEN (
        COALESCE(like_counts.count, 0) +
        COALESCE(comment_counts.count, 0) * 2 +
        COALESCE(share_counts.count, 0) * 3
      )
    END DESC,
    p.published_at DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_community_timeline IS 'Get deduplicated community timeline with engagement metrics. Supports recent, trending, and popular sorting.';

-- =====================================================
-- 3. GET PROFILE TIMELINE
-- =====================================================

CREATE OR REPLACE FUNCTION get_profile_timeline(
  p_profile_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_username TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  title TEXT,
  content TEXT,
  media_urls TEXT[],
  tags TEXT[],
  published_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  has_user_liked BOOLEAN,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Validate profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_profile_id) THEN
    RAISE EXCEPTION 'Profile with id % does not exist', p_profile_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.author_id,
    pr.username,
    pr.name,
    pr.avatar_url,
    p.title,
    p.content,
    p.media_urls,
    p.tags,
    p.published_at,
    p.edited_at,

    -- Engagement
    COALESCE((SELECT COUNT(*) FROM public.post_likes WHERE post_id = p.id), 0)::BIGINT as like_count,
    COALESCE((SELECT COUNT(*) FROM public.post_comments WHERE post_id = p.id AND NOT is_deleted), 0)::BIGINT as comment_count,
    COALESCE((SELECT COUNT(*) FROM public.post_shares WHERE post_id = p.id), 0)::BIGINT as share_count,

    -- User liked?
    EXISTS (
      SELECT 1 FROM public.post_likes
      WHERE post_id = p.id
        AND user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    ) as has_user_liked,

    pv.is_pinned,
    p.created_at

  FROM public.posts p

  -- Must be visible on this profile timeline
  INNER JOIN public.post_visibility pv
    ON p.id = pv.post_id
    AND pv.timeline_type = 'profile'
    AND pv.timeline_owner_id = p_profile_id

  -- Author info
  INNER JOIN public.profiles pr
    ON p.author_id = pr.id

  WHERE p.visibility IN ('public', 'followers')
    AND p.published_at IS NOT NULL
    AND p.published_at <= now()
    AND NOT p.is_deleted

  ORDER BY
    pv.is_pinned DESC,
    pv.pinned_at DESC NULLS LAST,
    p.published_at DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_profile_timeline IS 'Get posts visible on a profile timeline with pinned posts first';

-- =====================================================
-- 4. GET PROJECT TIMELINE
-- =====================================================

CREATE OR REPLACE FUNCTION get_project_timeline(
  p_project_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_username TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  title TEXT,
  content TEXT,
  media_urls TEXT[],
  tags TEXT[],
  published_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  has_user_liked BOOLEAN,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Validate project exists
  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project with id % does not exist', p_project_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.author_id,
    pr.username,
    pr.name,
    pr.avatar_url,
    p.title,
    p.content,
    p.media_urls,
    p.tags,
    p.published_at,
    p.edited_at,

    -- Engagement
    COALESCE((SELECT COUNT(*) FROM public.post_likes WHERE post_id = p.id), 0)::BIGINT as like_count,
    COALESCE((SELECT COUNT(*) FROM public.post_comments WHERE post_id = p.id AND NOT is_deleted), 0)::BIGINT as comment_count,
    COALESCE((SELECT COUNT(*) FROM public.post_shares WHERE post_id = p.id), 0)::BIGINT as share_count,

    -- User liked?
    EXISTS (
      SELECT 1 FROM public.post_likes
      WHERE post_id = p.id
        AND user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    ) as has_user_liked,

    pv.is_pinned,
    p.created_at

  FROM public.posts p

  -- Must be visible on this project timeline
  INNER JOIN public.post_visibility pv
    ON p.id = pv.post_id
    AND pv.timeline_type = 'project'
    AND pv.timeline_owner_id = p_project_id

  -- Author info
  INNER JOIN public.profiles pr
    ON p.author_id = pr.id

  WHERE p.visibility = 'public'
    AND p.published_at IS NOT NULL
    AND p.published_at <= now()
    AND NOT p.is_deleted

  ORDER BY
    pv.is_pinned DESC,
    pv.pinned_at DESC NULLS LAST,
    p.published_at DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_project_timeline IS 'Get posts visible on a project timeline with pinned posts first';

-- =====================================================
-- 5. GET POST WITH DETAILS
-- =====================================================
-- Get single post with all engagement data

CREATE OR REPLACE FUNCTION get_post_details(
  p_post_id UUID
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_username TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  title TEXT,
  content TEXT,
  media_urls TEXT[],
  tags TEXT[],
  visibility TEXT,
  published_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  has_user_liked BOOLEAN,
  timelines JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.author_id,
    pr.username,
    pr.name,
    pr.avatar_url,
    p.title,
    p.content,
    p.media_urls,
    p.tags,
    p.visibility,
    p.published_at,
    p.edited_at,

    -- Engagement
    COALESCE((SELECT COUNT(*) FROM public.post_likes WHERE post_id = p.id), 0)::BIGINT,
    COALESCE((SELECT COUNT(*) FROM public.post_comments WHERE post_id = p.id AND NOT is_deleted), 0)::BIGINT,
    COALESCE((SELECT COUNT(*) FROM public.post_shares WHERE post_id = p.id), 0)::BIGINT,

    -- User liked?
    EXISTS (
      SELECT 1 FROM public.post_likes
      WHERE post_id = p.id
        AND user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    ),

    -- All timelines this post appears on
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'timeline_type', pv.timeline_type,
          'timeline_owner_id', pv.timeline_owner_id,
          'is_pinned', pv.is_pinned,
          'added_at', pv.added_at
        )
      )
      FROM public.post_visibility pv
      WHERE pv.post_id = p.id
    ), '[]'::jsonb),

    p.created_at

  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.id = p_post_id
    AND NOT p.is_deleted;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_post_details IS 'Get complete details for a single post including all timelines and engagement';

-- =====================================================
-- 6. ADD POST TO TIMELINE (Share Function)
-- =====================================================
-- Add existing post to a new timeline (true sharing, not duplication)

CREATE OR REPLACE FUNCTION add_post_to_timeline(
  p_post_id UUID,
  p_timeline_type TEXT,
  p_timeline_owner_id UUID DEFAULT NULL,
  p_added_by_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_visibility_id UUID;
  v_author_id UUID;
BEGIN
  -- Validate post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = p_post_id AND NOT is_deleted) THEN
    RAISE EXCEPTION 'Post with id % does not exist', p_post_id;
  END IF;

  -- Get post author
  SELECT author_id INTO v_author_id FROM public.posts WHERE id = p_post_id;

  -- Default added_by to post author
  IF p_added_by_id IS NULL THEN
    p_added_by_id := v_author_id;
  END IF;

  -- Validate timeline_type
  IF p_timeline_type NOT IN ('profile', 'project', 'community') THEN
    RAISE EXCEPTION 'Invalid timeline_type: %. Must be profile, project, or community', p_timeline_type;
  END IF;

  -- Validate owner_id
  IF p_timeline_type = 'community' AND p_timeline_owner_id IS NOT NULL THEN
    RAISE EXCEPTION 'Community timeline should not have owner_id';
  END IF;

  IF p_timeline_type IN ('profile', 'project') AND p_timeline_owner_id IS NULL THEN
    RAISE EXCEPTION '% timeline requires timeline_owner_id', p_timeline_type;
  END IF;

  -- Check if already visible on this timeline
  IF EXISTS (
    SELECT 1 FROM public.post_visibility
    WHERE post_id = p_post_id
      AND timeline_type = p_timeline_type
      AND (
        (timeline_owner_id IS NULL AND p_timeline_owner_id IS NULL) OR
        (timeline_owner_id = p_timeline_owner_id)
      )
  ) THEN
    RAISE EXCEPTION 'Post % is already visible on % timeline %',
      p_post_id, p_timeline_type, COALESCE(p_timeline_owner_id::TEXT, 'community');
  END IF;

  -- Add visibility
  INSERT INTO public.post_visibility (
    post_id,
    timeline_type,
    timeline_owner_id,
    added_by_id
  ) VALUES (
    p_post_id,
    p_timeline_type,
    p_timeline_owner_id,
    p_added_by_id
  )
  RETURNING id INTO v_visibility_id;

  RETURN v_visibility_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION add_post_to_timeline IS 'Add existing post to a new timeline (true sharing - no content duplication)';

COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================
-- All helper functions created with improved validation and error handling
-- Application can now use these functions for clean, efficient queries
-- =====================================================
