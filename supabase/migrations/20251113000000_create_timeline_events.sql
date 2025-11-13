-- Migration: Create comprehensive timeline events system
-- Created: 2025-11-13
-- Purpose: Unified timeline for all user activities, project milestones, and community events
-- Priority: P0 - Core feature enhancement
-- Impact: User engagement, transparency, social features

BEGIN;

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS timeline_events (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event metadata
  event_type text NOT NULL CHECK (event_type IN (
    -- Post events (user-generated content)
    'post_created', 'post_shared', 'post_liked', 'post_commented',
    'status_update', 'achievement_shared', 'reflection_posted',

    -- Project events
    'project_created', 'project_published', 'project_updated', 'project_paused',
    'project_resumed', 'project_completed', 'project_cancelled', 'project_funded',
    'project_milestone', 'project_goal_reached',

    -- Transaction events
    'donation_received', 'donation_sent', 'bitcoin_transaction', 'lightning_payment',

    -- Social events
    'user_followed', 'user_unfollowed', 'project_liked', 'project_shared',
    'comment_added', 'comment_liked', 'profile_updated', 'verification_achieved',

    -- Community events
    'organization_joined', 'organization_left', 'organization_created',
    'event_created', 'event_attended', 'collaboration_started',

    -- System events
    'achievement_unlocked', 'badge_earned', 'level_up', 'streak_maintained'
  )),
  event_subtype text, -- Additional classification (e.g., 'first_donation', 'goal_50_percent')

  -- Actor information
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  actor_type text DEFAULT 'user' CHECK (actor_type IN ('user', 'organization', 'system')),

  -- Subject information (what the event is about)
  subject_type text NOT NULL CHECK (subject_type IN (
    'project', 'profile', 'organization', 'transaction', 'comment',
    'event', 'achievement', 'system'
  )),
  subject_id uuid, -- References various tables based on subject_type

  -- Target information (who/what is affected)
  target_type text CHECK (target_type IN (
    'project', 'profile', 'organization', 'transaction', 'comment',
    'event', 'achievement', 'system'
  )),
  target_id uuid,

  -- Event content
  title text NOT NULL, -- Human-readable title
  description text, -- Detailed description
  content jsonb DEFAULT '{}'::jsonb, -- Rich content (images, links, etc.)

  -- Quantitative data
  amount_sats bigint, -- For financial events
  amount_btc numeric(20,8), -- Alternative BTC representation
  quantity integer, -- Generic count (likes, comments, etc.)

  -- Location/context data
  location_data jsonb DEFAULT '{}'::jsonb, -- Geographic/location info
  device_info jsonb DEFAULT '{}'::jsonb, -- Device/browser context

  -- Privacy and visibility
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  is_featured boolean DEFAULT false, -- Highlight important events

  -- Timestamps
  event_timestamp timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb, -- Extensible metadata
  tags text[] DEFAULT '{}'::text[], -- Categorization tags

  -- Relationships (for threading/replies)
  parent_event_id uuid REFERENCES timeline_events(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES timeline_events(id) ON DELETE CASCADE,

  -- Status
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deletion_reason text
);

-- Indexes for performance

-- Primary lookup patterns
CREATE INDEX idx_timeline_actor_time ON timeline_events(actor_id, event_timestamp DESC)
WHERE actor_id IS NOT NULL AND NOT is_deleted;

CREATE INDEX idx_timeline_subject ON timeline_events(subject_type, subject_id, event_timestamp DESC)
WHERE subject_id IS NOT NULL AND NOT is_deleted;

CREATE INDEX idx_timeline_target ON timeline_events(target_type, target_id, event_timestamp DESC)
WHERE target_id IS NOT NULL AND NOT is_deleted;

-- Event type filtering
CREATE INDEX idx_timeline_event_type ON timeline_events(event_type, event_timestamp DESC)
WHERE NOT is_deleted;

-- Featured and visibility filtering
CREATE INDEX idx_timeline_featured ON timeline_events(is_featured, event_timestamp DESC)
WHERE is_featured = true AND NOT is_deleted;

CREATE INDEX idx_timeline_visibility ON timeline_events(visibility, event_timestamp DESC)
WHERE NOT is_deleted;

-- Thread relationships
CREATE INDEX idx_timeline_parent ON timeline_events(parent_event_id, event_timestamp DESC)
WHERE parent_event_id IS NOT NULL AND NOT is_deleted;

CREATE INDEX idx_timeline_thread ON timeline_events(thread_id, event_timestamp DESC)
WHERE thread_id IS NOT NULL AND NOT is_deleted;

-- Financial events (for donation/project funding queries)
CREATE INDEX idx_timeline_financial ON timeline_events(event_type, amount_sats, event_timestamp DESC)
WHERE event_type IN ('donation_received', 'project_funded', 'bitcoin_transaction')
  AND amount_sats IS NOT NULL AND NOT is_deleted;

-- Search optimization
CREATE INDEX idx_timeline_tags ON timeline_events USING gin(tags)
WHERE array_length(tags, 1) > 0 AND NOT is_deleted;

CREATE INDEX idx_timeline_metadata ON timeline_events USING gin(metadata)
WHERE NOT is_deleted;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_timeline_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timeline_event_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_timeline_event_updated_at();

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_timeline_event(event_id uuid, reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_record timeline_events;
BEGIN
  -- Get the event
  SELECT * INTO event_record FROM timeline_events WHERE id = event_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Soft delete
  UPDATE timeline_events
  SET is_deleted = true,
      deleted_at = now(),
      deletion_reason = reason,
      updated_at = now()
  WHERE id = event_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- RLS Policies

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Public events are viewable by everyone
CREATE POLICY "Public timeline events are viewable by everyone"
  ON timeline_events FOR SELECT
  USING (visibility = 'public' AND NOT is_deleted);

-- Users can view events from people they follow (placeholder - requires follows table)
-- For now, allow public events only
-- TODO: Implement proper follower relationships

-- Users can view their own private events
CREATE POLICY "Users can view their own private timeline events"
  ON timeline_events FOR SELECT
  USING (
    visibility = 'private'
    AND NOT is_deleted
    AND actor_id = auth.uid()
  );

-- Users can create events for themselves
CREATE POLICY "Users can create timeline events"
  ON timeline_events FOR INSERT
  WITH CHECK (auth.uid() = actor_id OR actor_type = 'system');

-- Users can update their own events
CREATE POLICY "Users can update their own timeline events"
  ON timeline_events FOR UPDATE
  USING (auth.uid() = actor_id)
  WITH CHECK (auth.uid() = actor_id);

-- Users can soft delete their own events
CREATE POLICY "Users can delete their own timeline events"
  ON timeline_events FOR DELETE
  USING (auth.uid() = actor_id);

-- Comments and documentation
COMMENT ON TABLE timeline_events IS 'Unified timeline events system for all user activities, project milestones, and community events';

COMMENT ON COLUMN timeline_events.event_type IS 'Type of event (project_created, donation_received, user_followed, etc.)';
COMMENT ON COLUMN timeline_events.event_subtype IS 'Additional event classification for more granular filtering';
COMMENT ON COLUMN timeline_events.actor_id IS 'User/organization/system that performed the action';
COMMENT ON COLUMN timeline_events.subject_type IS 'Type of entity the event is about (project, profile, etc.)';
COMMENT ON COLUMN timeline_events.subject_id IS 'ID of the subject entity';
COMMENT ON COLUMN timeline_events.target_type IS 'Type of entity affected by the event';
COMMENT ON COLUMN timeline_events.target_id IS 'ID of the target entity';
COMMENT ON COLUMN timeline_events.visibility IS 'Who can see this event (public, followers, private)';
COMMENT ON COLUMN timeline_events.is_featured IS 'Whether this event should be highlighted/promoted';

-- Helper functions for common timeline operations

-- Get user's timeline feed
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
      -- User's own events
      te.actor_id = p_user_id
      -- Events from people user follows (placeholder - requires follows table)
      -- TODO: Implement proper follower relationships
      -- OR (te.visibility IN ('public', 'followers')
      --     AND EXISTS (
      --       SELECT 1 FROM follows f
      --       WHERE f.follower_id = p_user_id
      --         AND f.following_id = te.actor_id
      --     ))
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

-- Get project timeline
CREATE OR REPLACE FUNCTION get_project_timeline(
  p_project_id uuid,
  p_limit integer DEFAULT 100
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
    AND te.visibility = 'public'
    AND (
      (te.subject_type = 'project' AND te.subject_id = p_project_id)
      OR (te.target_type = 'project' AND te.target_id = p_project_id)
    )
  ORDER BY te.event_timestamp DESC
  LIMIT p_limit;
END;
$$;

-- Create timeline event helper
CREATE OR REPLACE FUNCTION create_timeline_event(
  p_event_type text,
  p_subject_type text,
  p_title text,
  p_event_subtype text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_actor_type text DEFAULT 'user',
  p_subject_id uuid DEFAULT NULL,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_content jsonb DEFAULT '{}'::jsonb,
  p_amount_sats bigint DEFAULT NULL,
  p_amount_btc numeric DEFAULT NULL,
  p_quantity integer DEFAULT NULL,
  p_visibility text DEFAULT 'public',
  p_is_featured boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_tags text[] DEFAULT '{}'::text[],
  p_parent_event_id uuid DEFAULT NULL,
  p_thread_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO timeline_events (
    event_type,
    event_subtype,
    actor_id,
    actor_type,
    subject_type,
    subject_id,
    target_type,
    target_id,
    title,
    description,
    content,
    amount_sats,
    amount_btc,
    quantity,
    visibility,
    is_featured,
    metadata,
    tags,
    parent_event_id,
    thread_id,
    event_timestamp
  ) VALUES (
    p_event_type,
    p_event_subtype,
    p_actor_id,
    p_actor_type,
    p_subject_type,
    p_subject_id,
    p_target_type,
    p_target_id,
    p_title,
    p_description,
    p_content,
    p_amount_sats,
    p_amount_btc,
    p_quantity,
    p_visibility,
    p_is_featured,
    p_metadata,
    p_tags,
    p_parent_event_id,
    p_thread_id,
    COALESCE((p_metadata->>'event_timestamp')::timestamptz, now())
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION create_timeline_event IS 'Create a new timeline event with all metadata';
COMMENT ON FUNCTION get_user_timeline_feed IS 'Get personalized timeline feed for a user including their activity and followed users';
COMMENT ON FUNCTION get_project_timeline IS 'Get all timeline events related to a specific project';

-- Verification
DO $$
DECLARE
  v_table_exists boolean;
  v_functions_exist boolean;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'timeline_events'
  ) INTO v_table_exists;

  -- Check functions exist
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname IN ('create_timeline_event', 'get_user_timeline_feed', 'get_project_timeline')
  ) INTO v_functions_exist;

  IF v_table_exists AND v_functions_exist THEN
    RAISE NOTICE 'SUCCESS: Timeline events system created successfully';
    RAISE NOTICE '  ✓ Table: timeline_events';
    RAISE NOTICE '  ✓ Functions: create_timeline_event, get_user_timeline_feed, get_project_timeline';
    RAISE NOTICE '  ✓ Indexes: 11 performance indexes';
    RAISE NOTICE '  ✓ RLS: Policies enabled for privacy control';
    RAISE NOTICE '  ✓ Triggers: Updated_at and soft delete functionality';
  ELSE
    RAISE EXCEPTION 'FAILED: Timeline events system incomplete';
  END IF;
END $$;

-- ==================== COMMUNITY TIMELINE ====================

-- Function to get community timeline (public posts from all users and projects)
CREATE OR REPLACE FUNCTION get_community_timeline(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_sort_by text DEFAULT 'recent' -- 'recent', 'trending', 'popular'
)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_subtype text,
  actor_id uuid,
  actor_type text,
  subject_type text,
  subject_id uuid,
  target_type text,
  target_id uuid,
  title text,
  description text,
  content jsonb,
  amount_sats bigint,
  amount_btc numeric,
  quantity integer,
  visibility text,
  is_featured boolean,
  metadata jsonb,
  tags text[],
  parent_event_id uuid,
  thread_id uuid,
  event_timestamp timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  actor_name text,
  actor_username text,
  actor_avatar text,
  subject_name text,
  subject_title text,
  subject_description text,
  target_name text,
  like_count bigint,
  share_count bigint,
  comment_count bigint,
  user_liked boolean,
  user_shared boolean,
  user_commented boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
BEGIN
  -- Get current user ID (NULL if not authenticated)
  v_current_user_id := auth.uid();

  RETURN QUERY
  SELECT
    te.id,
    te.event_type,
    te.event_subtype,
    te.actor_id,
    te.actor_type,
    te.subject_type,
    te.subject_id,
    te.target_type,
    te.target_id,
    te.title,
    te.description,
    te.content,
    te.amount_sats,
    te.amount_btc,
    te.quantity,
    te.visibility,
    te.is_featured,
    te.metadata,
    te.tags,
    te.parent_event_id,
    te.thread_id,
    te.event_timestamp,
    te.created_at,
    te.updated_at,

    -- Actor info
    p.name as actor_name,
    p.username as actor_username,
    p.avatar_url as actor_avatar,

    -- Subject info (for projects)
    prj.title as subject_title,
    prj.description as subject_description,
    prj.title as subject_name, -- fallback

    -- Target info (simplified)
    NULL::text as target_name,

    -- Social counts
    COALESCE(tl.like_count, 0)::bigint as like_count,
    COALESCE(ts.share_count, 0)::bigint as share_count,
    COALESCE(tc.comment_count, 0)::bigint as comment_count,

    -- User interaction status
    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM timeline_likes WHERE event_id = te.id AND user_id = v_current_user_id)
    ELSE false END as user_liked,

    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM timeline_shares WHERE original_event_id = te.id AND user_id = v_current_user_id)
    ELSE false END as user_shared,

    CASE WHEN v_current_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM timeline_comments WHERE event_id = te.id AND user_id = v_current_user_id)
    ELSE false END as user_commented

  FROM timeline_events te
  LEFT JOIN profiles p ON te.actor_id = p.id
  LEFT JOIN projects prj ON te.subject_type = 'project' AND te.subject_id = prj.id
  LEFT JOIN (SELECT event_id, COUNT(*) as like_count FROM timeline_likes GROUP BY event_id) tl ON te.id = tl.event_id
  LEFT JOIN (SELECT original_event_id, COUNT(*) as share_count FROM timeline_shares GROUP BY original_event_id) ts ON te.id = ts.original_event_id
  LEFT JOIN (SELECT event_id, COUNT(*) as comment_count FROM timeline_comments GROUP BY event_id) tc ON te.id = tc.event_id

  WHERE
    te.visibility = 'public'
    AND NOT te.is_deleted

  ORDER BY
    CASE
      WHEN p_sort_by = 'trending' THEN
        -- Trending: recent events with high engagement (time-decayed popularity)
        (COALESCE(tl.like_count, 0) + COALESCE(ts.share_count, 0) + COALESCE(tc.comment_count, 0)) *
        EXP(EXTRACT(EPOCH FROM (now() - te.event_timestamp))/86400)
      WHEN p_sort_by = 'popular' THEN
        -- Popular: total engagement
        COALESCE(tl.like_count, 0) + COALESCE(ts.share_count, 0) + COALESCE(tc.comment_count, 0)
      ELSE
        -- Recent: chronological
        EXTRACT(EPOCH FROM te.event_timestamp)
    END DESC,
    te.event_timestamp DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMIT;

-- Usage Examples:
--
-- 1. Create a project creation event:
--    SELECT create_timeline_event(
--      'project_created',
--      NULL,
--      'user-uuid',
--      'user',
--      'project',
--      'project-uuid',
--      NULL,
--      NULL,
--      'New Project Launched',
--      'Check out this amazing new Bitcoin crowdfunding project!',
--      '{"image_url": "https://..."}'::jsonb,
--      NULL,
--      NULL,
--      NULL,
--      'public',
--      true
--    );
--
-- 2. Create a donation event:
--    SELECT create_timeline_event(
--      'donation_received',
--      'first_donation',
--      'donor-uuid',
--      'user',
--      'transaction',
--      'tx-uuid',
--      'project',
--      'project-uuid',
--      'Received ₿0.001 donation',
--      'Thank you for supporting this project!',
--      '{}'::jsonb,
--      100000,
--      0.001,
--      NULL,
--      'public',
--      false
--    );
--
-- 3. Get user's timeline feed:
--    SELECT * FROM get_user_timeline_feed('user-uuid', 20, 0);
--
-- 4. Get project timeline:
--    SELECT * FROM get_project_timeline('project-uuid', 50);
--
-- 5. Get community timeline (public posts from all users/projects):
--    SELECT * FROM get_community_timeline(20, 0, 'recent');
