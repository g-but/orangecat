-- ============================================================================
-- FIX POST DUPLICATION ISSUE
-- ============================================================================
-- Problem: Cross-posting creates duplicate timeline events
-- Solution: Single post with multiple visibility contexts
--
-- Created: 2025-11-19
-- ============================================================================

-- Step 1: Create post_visibility table for proper cross-posting
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  timeline_type TEXT NOT NULL CHECK (timeline_type IN ('profile', 'project', 'community')),
  timeline_owner_id UUID,  -- NULL for community timeline, profile_id or project_id for others
  added_by_id UUID NOT NULL REFERENCES auth.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure a post can't be added to the same timeline twice
  UNIQUE(post_id, timeline_type, timeline_owner_id),

  -- Index for efficient timeline queries
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_visibility_timeline_lookup
  ON post_visibility(timeline_type, timeline_owner_id, added_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_visibility_post_id
  ON post_visibility(post_id);

CREATE INDEX IF NOT EXISTS idx_post_visibility_added_by
  ON post_visibility(added_by_id);

-- Step 2: Add is_cross_post_duplicate flag to existing events
-- ============================================================================

ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS is_cross_post_duplicate BOOLEAN DEFAULT false;

-- Mark existing duplicate cross-posts
UPDATE timeline_events
SET is_cross_post_duplicate = true
WHERE metadata ? 'cross_posted_from_main'
  AND metadata->>'cross_posted_from_main' = 'true';

-- Step 3: Create helper function to get timeline posts (no duplicates)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_timeline_posts(
  p_timeline_type TEXT,
  p_timeline_owner_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  actor_id UUID,
  subject_type TEXT,
  subject_id UUID,
  title TEXT,
  description TEXT,
  visibility TEXT,
  event_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  metadata JSONB,
  like_count INT,
  share_count INT,
  comment_count INT,
  actor_data JSONB,
  subject_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (te.id)
    te.id,
    te.event_type,
    te.actor_id,
    te.subject_type,
    te.subject_id,
    te.title,
    te.description,
    te.visibility,
    te.event_timestamp,
    te.created_at,
    te.metadata,
    COALESCE((SELECT COUNT(*)::INT FROM timeline_likes WHERE event_id = te.id), 0) as like_count,
    COALESCE((SELECT COUNT(*)::INT FROM timeline_shares WHERE event_id = te.id), 0) as share_count,
    COALESCE((SELECT COUNT(*)::INT FROM timeline_comments WHERE event_id = te.id), 0) as comment_count,
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url
    ) as actor_data,
    CASE
      WHEN te.subject_type = 'profile' THEN
        jsonb_build_object(
          'id', sp.id,
          'type', 'profile',
          'username', sp.username,
          'display_name', sp.display_name,
          'avatar_url', sp.avatar_url
        )
      WHEN te.subject_type = 'project' THEN
        jsonb_build_object(
          'id', pr.id,
          'type', 'project',
          'title', pr.title,
          'description', pr.description
        )
      ELSE NULL
    END as subject_data
  FROM timeline_events te
  LEFT JOIN post_visibility pv ON pv.post_id = te.id
  LEFT JOIN profiles p ON p.id = te.actor_id
  LEFT JOIN profiles sp ON sp.id = te.subject_id AND te.subject_type = 'profile'
  LEFT JOIN projects pr ON pr.id = te.subject_id AND te.subject_type = 'project'
  WHERE
    te.is_deleted = false
    AND te.visibility = 'public'
    AND te.is_cross_post_duplicate = false  -- Exclude old duplicate posts
    AND (
      -- Match timeline type and owner
      (pv.timeline_type = p_timeline_type AND pv.timeline_owner_id = p_timeline_owner_id)
      OR
      -- For backward compatibility: also show posts where subject matches
      (te.subject_type = p_timeline_type AND te.subject_id = p_timeline_owner_id)
      OR
      -- Community timeline shows all public posts
      (p_timeline_type = 'community')
    )
  ORDER BY te.id, te.event_timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Create function to create post with visibility contexts
-- ============================================================================

CREATE OR REPLACE FUNCTION create_post_with_visibility(
  p_event_type TEXT,
  p_actor_id UUID,
  p_subject_type TEXT,
  p_subject_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT 'public',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_timeline_contexts JSONB DEFAULT '[]'::jsonb  -- Array of {timeline_type, timeline_owner_id}
)
RETURNS JSONB AS $$
DECLARE
  v_post_id UUID;
  v_context JSONB;
  v_result JSONB;
BEGIN
  -- Create the main timeline event (single source of truth)
  INSERT INTO timeline_events (
    event_type,
    actor_id,
    actor_type,
    subject_type,
    subject_id,
    title,
    description,
    visibility,
    metadata,
    is_cross_post_duplicate
  ) VALUES (
    p_event_type,
    p_actor_id,
    'user',
    p_subject_type,
    p_subject_id,
    p_title,
    p_description,
    p_visibility,
    p_metadata,
    false  -- This is the real post, not a duplicate
  )
  RETURNING id INTO v_post_id;

  -- Add visibility contexts (where should this post appear?)
  FOR v_context IN SELECT * FROM jsonb_array_elements(p_timeline_contexts)
  LOOP
    INSERT INTO post_visibility (
      post_id,
      timeline_type,
      timeline_owner_id,
      added_by_id
    ) VALUES (
      v_post_id,
      v_context->>'timeline_type',
      (v_context->>'timeline_owner_id')::UUID,
      p_actor_id
    )
    ON CONFLICT (post_id, timeline_type, timeline_owner_id) DO NOTHING;
  END LOOP;

  -- Return the created post with visibility info
  SELECT jsonb_build_object(
    'success', true,
    'post_id', v_post_id,
    'visibility_count', (SELECT COUNT(*) FROM post_visibility WHERE post_id = v_post_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create view for community timeline (no duplicates)
-- ============================================================================

CREATE OR REPLACE VIEW community_timeline_no_duplicates AS
SELECT DISTINCT ON (te.id)
  te.id,
  te.event_type,
  te.actor_id,
  te.subject_type,
  te.subject_id,
  te.title,
  te.description,
  te.visibility,
  te.event_timestamp,
  te.created_at,
  te.updated_at,
  te.metadata,
  COALESCE((SELECT COUNT(*)::INT FROM timeline_likes WHERE event_id = te.id), 0) as like_count,
  COALESCE((SELECT COUNT(*)::INT FROM timeline_shares WHERE event_id = te.id), 0) as share_count,
  COALESCE((SELECT COUNT(*)::INT FROM timeline_comments WHERE event_id = te.id), 0) as comment_count,
  jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url
  ) as actor_data,
  CASE
    WHEN te.subject_type = 'profile' THEN
      jsonb_build_object(
        'id', sp.id,
        'type', 'profile',
        'username', sp.username,
        'display_name', sp.display_name
      )
    WHEN te.subject_type = 'project' THEN
      jsonb_build_object(
        'id', pr.id,
        'type', 'project',
        'title', pr.title
      )
    ELSE NULL
  END as subject_data
FROM timeline_events te
LEFT JOIN profiles p ON p.id = te.actor_id
LEFT JOIN profiles sp ON sp.id = te.subject_id AND te.subject_type = 'profile'
LEFT JOIN projects pr ON pr.id = te.subject_id AND te.subject_type = 'project'
WHERE
  te.is_deleted = false
  AND te.visibility = 'public'
  AND te.is_cross_post_duplicate = false
  -- For backward compatibility: if metadata has original_post_id, it's a duplicate
  AND NOT (te.metadata ? 'original_post_id')
ORDER BY te.id, te.event_timestamp DESC;

-- Step 6: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE post_visibility ENABLE ROW LEVEL SECURITY;

-- Users can read visibility entries for public posts
CREATE POLICY "Users can read post visibility"
  ON post_visibility FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM timeline_events te
      WHERE te.id = post_id
        AND te.visibility = 'public'
        AND te.is_deleted = false
    )
  );

-- Users can add visibility contexts to their own posts
CREATE POLICY "Users can add visibility to own posts"
  ON post_visibility FOR INSERT
  WITH CHECK (
    added_by_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM timeline_events te
      WHERE te.id = post_id
        AND te.actor_id = auth.uid()
    )
  );

-- Users can remove visibility contexts from their own posts
CREATE POLICY "Users can remove visibility from own posts"
  ON post_visibility FOR DELETE
  USING (
    added_by_id = auth.uid()
  );

-- Step 7: Migration helper - migrate existing cross-posts to visibility table
-- ============================================================================

-- For existing posts with cross_posted_projects metadata, create visibility entries
INSERT INTO post_visibility (post_id, timeline_type, timeline_owner_id, added_by_id)
SELECT DISTINCT
  te.id as post_id,
  'project' as timeline_type,
  (jsonb_array_elements_text(te.metadata->'cross_posted_projects'))::UUID as timeline_owner_id,
  te.actor_id as added_by_id
FROM timeline_events te
WHERE
  te.metadata ? 'cross_posted_projects'
  AND jsonb_typeof(te.metadata->'cross_posted_projects') = 'array'
  AND jsonb_array_length(te.metadata->'cross_posted_projects') > 0
  AND NOT te.is_cross_post_duplicate  -- Only migrate main posts, not duplicates
ON CONFLICT (post_id, timeline_type, timeline_owner_id) DO NOTHING;

-- Add visibility for the post's own timeline (profile or project)
INSERT INTO post_visibility (post_id, timeline_type, timeline_owner_id, added_by_id)
SELECT DISTINCT
  te.id as post_id,
  te.subject_type as timeline_type,
  te.subject_id as timeline_owner_id,
  te.actor_id as added_by_id
FROM timeline_events te
WHERE
  te.subject_id IS NOT NULL
  AND te.is_cross_post_duplicate = false
  AND NOT EXISTS (
    SELECT 1 FROM post_visibility pv
    WHERE pv.post_id = te.id
      AND pv.timeline_type = te.subject_type
      AND pv.timeline_owner_id = te.subject_id
  )
ON CONFLICT (post_id, timeline_type, timeline_owner_id) DO NOTHING;

-- Add community visibility for all public posts
INSERT INTO post_visibility (post_id, timeline_type, timeline_owner_id, added_by_id)
SELECT DISTINCT
  te.id as post_id,
  'community' as timeline_type,
  NULL as timeline_owner_id,
  te.actor_id as added_by_id
FROM timeline_events te
WHERE
  te.visibility = 'public'
  AND te.is_cross_post_duplicate = false
  AND NOT EXISTS (
    SELECT 1 FROM post_visibility pv
    WHERE pv.post_id = te.id
      AND pv.timeline_type = 'community'
      AND pv.timeline_owner_id IS NULL
  )
ON CONFLICT (post_id, timeline_type, timeline_owner_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE post_visibility IS 'Tracks where a post should appear (profile, project, or community timeline). Replaces duplicate post creation.';
COMMENT ON COLUMN post_visibility.timeline_type IS 'Type of timeline: profile, project, or community';
COMMENT ON COLUMN post_visibility.timeline_owner_id IS 'ID of the profile or project that owns the timeline. NULL for community timeline.';
COMMENT ON FUNCTION create_post_with_visibility IS 'Creates a single post with multiple visibility contexts instead of creating duplicate posts';
COMMENT ON FUNCTION get_timeline_posts IS 'Retrieves posts for a specific timeline without duplicates';
COMMENT ON VIEW community_timeline_no_duplicates IS 'Community timeline view that excludes duplicate cross-posts';
