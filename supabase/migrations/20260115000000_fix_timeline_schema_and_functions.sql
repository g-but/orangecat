-- ============================================================================
-- Fix Timeline Events Schema and Add Posting Functions
--
-- This migration fixes the schema mismatch between the code and database:
-- 1. Adds missing columns to timeline_events table
-- 2. Creates the create_post_with_visibility function
-- 3. Creates the create_timeline_event function
--
-- Created: 2026-01-15
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing columns to timeline_events
-- ============================================================================

-- Rename user_id to actor_id for consistency with actor system
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE timeline_events RENAME COLUMN user_id TO actor_id;
  END IF;
END $$;

-- Add actor_id if it doesn't exist (for fresh installs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add actor_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'actor_type'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN actor_type text DEFAULT 'user';
  END IF;
END $$;

-- Add title column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'title'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN title text;
  END IF;
END $$;

-- Add description column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'description'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN description text;
  END IF;
END $$;

-- Add subject_type and subject_id columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'subject_type'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN subject_type text DEFAULT 'profile';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'subject_id'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN subject_id uuid;
  END IF;
END $$;

-- Add target_type and target_id columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'target_type'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN target_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'target_id'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN target_id uuid;
  END IF;
END $$;

-- Add event_subtype column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'event_subtype'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN event_subtype text;
  END IF;
END $$;

-- Add amount columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'amount_sats'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN amount_sats bigint;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'amount_btc'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN amount_btc numeric(16, 8);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN quantity integer;
  END IF;
END $$;

-- Add location_data and device_info columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'location_data'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN location_data jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'device_info'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN device_info jsonb;
  END IF;
END $$;

-- Add is_featured column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Add event_timestamp column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'event_timestamp'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN event_timestamp timestamptz DEFAULT now();
  END IF;
END $$;

-- Add tags column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'tags'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Rename parent_id to parent_event_id if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'parent_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'parent_event_id'
  ) THEN
    ALTER TABLE timeline_events RENAME COLUMN parent_id TO parent_event_id;
  END IF;
END $$;

-- Add parent_event_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'parent_event_id'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN parent_event_id uuid REFERENCES timeline_events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add thread_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN thread_id uuid;
  END IF;
END $$;

-- Add soft delete columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN deletion_reason text;
  END IF;
END $$;

-- Update content column to JSONB if it's text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events'
    AND column_name = 'content'
    AND data_type = 'text'
  ) THEN
    -- First convert existing data
    ALTER TABLE timeline_events
    ALTER COLUMN content TYPE jsonb
    USING CASE
      WHEN content IS NULL THEN '{}'::jsonb
      WHEN content = '' THEN '{}'::jsonb
      ELSE jsonb_build_object('text', content)
    END;
  END IF;
END $$;

-- Remove old event_type constraint and add new one
DO $$
BEGIN
  -- Try to drop the old constraint
  ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add index on actor_id if not exists
CREATE INDEX IF NOT EXISTS idx_timeline_events_actor_id ON timeline_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_visibility ON timeline_events(visibility);
CREATE INDEX IF NOT EXISTS idx_timeline_events_is_deleted ON timeline_events(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_timeline_events_thread_id ON timeline_events(thread_id) WHERE thread_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Create timeline_event_visibility table for cross-posting
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.timeline_event_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  timeline_type text NOT NULL CHECK (timeline_type IN ('profile', 'project', 'community')),
  timeline_owner_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, timeline_type, timeline_owner_id)
);

-- Enable RLS
ALTER TABLE timeline_event_visibility ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first for idempotency)
DROP POLICY IF EXISTS "Anyone can view timeline event visibility" ON timeline_event_visibility;
CREATE POLICY "Anyone can view timeline event visibility"
  ON timeline_event_visibility FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own event visibility" ON timeline_event_visibility;
CREATE POLICY "Users can manage their own event visibility"
  ON timeline_event_visibility FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM timeline_events
      WHERE timeline_events.id = event_id
      AND timeline_events.actor_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_timeline_event_visibility_event_id
  ON timeline_event_visibility(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_visibility_type_owner
  ON timeline_event_visibility(timeline_type, timeline_owner_id);

-- ============================================================================
-- STEP 2b: Create missing social tables (likes, dislikes, comments)
-- ============================================================================

-- Timeline Likes table
CREATE TABLE IF NOT EXISTS public.timeline_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE timeline_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON timeline_likes;
CREATE POLICY "Anyone can view likes"
  ON timeline_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own likes" ON timeline_likes;
CREATE POLICY "Users can manage their own likes"
  ON timeline_likes FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timeline_likes_event_id ON timeline_likes(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_likes_user_id ON timeline_likes(user_id);

-- Timeline Dislikes table
CREATE TABLE IF NOT EXISTS public.timeline_dislikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE timeline_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view dislikes" ON timeline_dislikes;
CREATE POLICY "Anyone can view dislikes"
  ON timeline_dislikes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own dislikes" ON timeline_dislikes;
CREATE POLICY "Users can manage their own dislikes"
  ON timeline_dislikes FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timeline_dislikes_event_id ON timeline_dislikes(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_dislikes_user_id ON timeline_dislikes(user_id);

-- Timeline Comments table
CREATE TABLE IF NOT EXISTS public.timeline_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES timeline_comments(id) ON DELETE CASCADE,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON timeline_comments;
CREATE POLICY "Anyone can view non-deleted comments"
  ON timeline_comments FOR SELECT
  USING (is_deleted = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create comments" ON timeline_comments;
CREATE POLICY "Users can create comments"
  ON timeline_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON timeline_comments;
CREATE POLICY "Users can update their own comments"
  ON timeline_comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON timeline_comments;
CREATE POLICY "Users can delete their own comments"
  ON timeline_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timeline_comments_event_id ON timeline_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_comments_user_id ON timeline_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_comments_parent_id ON timeline_comments(parent_comment_id);

-- Timeline Event Stats table (for cached counts)
-- Drop view if it exists (was previously created as a view)
DROP VIEW IF EXISTS public.timeline_event_stats CASCADE;

CREATE TABLE IF NOT EXISTS public.timeline_event_stats (
  event_id uuid PRIMARY KEY REFERENCES timeline_events(id) ON DELETE CASCADE,
  like_count integer DEFAULT 0,
  dislike_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS only if it's a table (not a view)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_event_stats') THEN
    ALTER TABLE timeline_event_stats ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can view event stats" ON timeline_event_stats;
CREATE POLICY "Anyone can view event stats"
  ON timeline_event_stats FOR SELECT
  USING (true);

-- ============================================================================
-- STEP 3: Create the create_timeline_event function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_timeline_event(
  p_event_type text,
  p_subject_type text DEFAULT 'profile',
  p_title text DEFAULT NULL,
  p_event_subtype text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_actor_type text DEFAULT 'user',
  p_subject_id uuid DEFAULT NULL,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_content jsonb DEFAULT '{}',
  p_amount_sats bigint DEFAULT NULL,
  p_amount_btc numeric DEFAULT NULL,
  p_quantity integer DEFAULT NULL,
  p_visibility text DEFAULT 'public',
  p_is_featured boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}',
  p_tags text[] DEFAULT '{}',
  p_parent_event_id uuid DEFAULT NULL,
  p_thread_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid;
  v_event_id uuid;
  v_title text;
BEGIN
  -- Use provided actor_id or fall back to auth.uid()
  v_actor_id := COALESCE(p_actor_id, auth.uid());

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Ensure title is not null (use description or default)
  v_title := COALESCE(
    NULLIF(TRIM(p_title), ''),
    NULLIF(LEFT(TRIM(p_description), 140), ''),
    'Update'
  );

  -- Insert the event
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
    event_timestamp,
    created_at,
    updated_at
  ) VALUES (
    p_event_type,
    p_event_subtype,
    v_actor_id,
    p_actor_type,
    p_subject_type,
    p_subject_id,
    p_target_type,
    p_target_id,
    v_title,
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
    now(),
    now(),
    now()
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- STEP 4: Create the create_post_with_visibility function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_post_with_visibility(
  p_event_type text,
  p_actor_id uuid,
  p_subject_type text DEFAULT 'profile',
  p_subject_id uuid DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_visibility text DEFAULT 'public',
  p_metadata jsonb DEFAULT '{}',
  p_timeline_contexts jsonb DEFAULT '[]'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid;
  v_event_id uuid;
  v_title text;
  v_context jsonb;
  v_visibility_count integer := 0;
BEGIN
  -- Use provided actor_id or fall back to auth.uid()
  v_actor_id := COALESCE(p_actor_id, auth.uid());

  IF v_actor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  -- Ensure title is not null (use description or default)
  v_title := COALESCE(
    NULLIF(TRIM(p_title), ''),
    NULLIF(LEFT(TRIM(p_description), 140), ''),
    'Update'
  );

  -- Insert the main event
  INSERT INTO timeline_events (
    event_type,
    actor_id,
    actor_type,
    subject_type,
    subject_id,
    title,
    description,
    content,
    visibility,
    metadata,
    event_timestamp,
    created_at,
    updated_at
  ) VALUES (
    p_event_type,
    v_actor_id,
    'user',
    p_subject_type,
    p_subject_id,
    v_title,
    p_description,
    jsonb_build_object('text', COALESCE(p_description, '')),
    p_visibility,
    p_metadata,
    now(),
    now(),
    now()
  )
  RETURNING id INTO v_event_id;

  -- Insert visibility contexts
  IF p_timeline_contexts IS NOT NULL AND jsonb_array_length(p_timeline_contexts) > 0 THEN
    FOR v_context IN SELECT * FROM jsonb_array_elements(p_timeline_contexts)
    LOOP
      INSERT INTO timeline_event_visibility (
        event_id,
        timeline_type,
        timeline_owner_id
      ) VALUES (
        v_event_id,
        v_context->>'timeline_type',
        (v_context->>'timeline_owner_id')::uuid
      )
      ON CONFLICT (event_id, timeline_type, timeline_owner_id) DO NOTHING;

      v_visibility_count := v_visibility_count + 1;
    END LOOP;
  END IF;

  -- Also add default profile visibility
  INSERT INTO timeline_event_visibility (
    event_id,
    timeline_type,
    timeline_owner_id
  ) VALUES (
    v_event_id,
    'profile',
    v_actor_id
  )
  ON CONFLICT (event_id, timeline_type, timeline_owner_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'post_id', v_event_id,
    'visibility_count', v_visibility_count + 1
  );
END;
$$;

-- ============================================================================
-- STEP 5: Update RLS policies for timeline_events
-- ============================================================================

-- Drop old policies that might reference user_id
DROP POLICY IF EXISTS "Users can insert their own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can update their own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can delete their own timeline events" ON timeline_events;

-- Create new policies using actor_id
CREATE POLICY "Users can insert their own timeline events"
  ON timeline_events FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can update their own timeline events"
  ON timeline_events FOR UPDATE
  USING (auth.uid() = actor_id);

CREATE POLICY "Users can delete their own timeline events"
  ON timeline_events FOR DELETE
  USING (auth.uid() = actor_id);

-- ============================================================================
-- Additional Functions: soft_delete_timeline_event and create_quote_reply
-- ============================================================================

-- Function to soft delete a timeline event
CREATE OR REPLACE FUNCTION public.soft_delete_timeline_event(
  event_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_deleted BOOLEAN := FALSE;
BEGIN
  -- Get the current user's ID
  v_actor_id := auth.uid();

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user owns this event (or is admin)
  IF NOT EXISTS (
    SELECT 1 FROM timeline_events
    WHERE id = event_id
    AND (actor_id = v_actor_id OR v_actor_id IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    ))
  ) THEN
    RAISE EXCEPTION 'Event not found or access denied';
  END IF;

  -- Soft delete by setting deleted_at and optionally storing reason
  UPDATE timeline_events
  SET
    deleted_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) ||
      CASE WHEN reason IS NOT NULL
        THEN jsonb_build_object('deletion_reason', reason)
        ELSE '{}'::jsonb
      END
  WHERE id = event_id
  AND deleted_at IS NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Update engagement counts on parent if this was a reply
  UPDATE timeline_events parent
  SET reply_count = GREATEST(0, COALESCE(reply_count, 0) - 1)
  WHERE parent.id = (
    SELECT parent_event_id FROM timeline_events WHERE id = event_id
  )
  AND parent.id IS NOT NULL;

  RETURN v_deleted > 0;
END;
$$;

-- Function to create a quote reply (quote tweet style)
CREATE OR REPLACE FUNCTION public.create_quote_reply(
  p_parent_event_id UUID,
  p_actor_id UUID,
  p_content TEXT,
  p_quoted_content TEXT,
  p_visibility TEXT DEFAULT 'public'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_event_id UUID;
  v_parent_actor_id UUID;
BEGIN
  -- Validate actor owns this request
  IF auth.uid() != p_actor_id THEN
    RAISE EXCEPTION 'Actor mismatch';
  END IF;

  -- Get parent event details
  SELECT actor_id INTO v_parent_actor_id
  FROM timeline_events
  WHERE id = p_parent_event_id
  AND deleted_at IS NULL;

  IF v_parent_actor_id IS NULL THEN
    RAISE EXCEPTION 'Parent event not found';
  END IF;

  -- Create the quote reply event
  INSERT INTO timeline_events (
    event_type,
    actor_id,
    content,
    parent_event_id,
    visibility,
    metadata,
    created_at
  ) VALUES (
    'quote_reply',
    p_actor_id,
    p_content,
    p_parent_event_id,
    p_visibility,
    jsonb_build_object(
      'quoted_content', p_quoted_content,
      'quoted_actor_id', v_parent_actor_id
    ),
    NOW()
  )
  RETURNING id INTO v_new_event_id;

  -- Update quote count on parent event
  UPDATE timeline_events
  SET quote_count = COALESCE(quote_count, 0) + 1
  WHERE id = p_parent_event_id;

  -- Create notification for parent event owner
  IF v_parent_actor_id != p_actor_id THEN
    INSERT INTO notifications (
      user_id,
      actor_id,
      type,
      title,
      message,
      data,
      created_at
    ) VALUES (
      v_parent_actor_id,
      p_actor_id,
      'quote_reply',
      'Someone quoted your post',
      LEFT(p_content, 100),
      jsonb_build_object(
        'event_id', v_new_event_id,
        'parent_event_id', p_parent_event_id
      ),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_new_event_id;
END;
$$;

-- ============================================================================
-- Social Interaction Functions: Like, Unlike, Dislike, Comment
-- ============================================================================

-- Drop ALL versions of social interaction functions dynamically
DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Drop all versions of social interaction functions
  FOR func_record IN
    SELECT p.oid::regprocedure::text AS func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'like_timeline_event', 'unlike_timeline_event',
        'dislike_timeline_event', 'undislike_timeline_event',
        'add_timeline_comment', 'update_timeline_comment', 'delete_timeline_comment',
        'get_event_comments', 'get_comment_replies'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
  END LOOP;
END $$;

-- Like a timeline event
CREATE OR REPLACE FUNCTION public.like_timeline_event(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TABLE(like_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert the like (ignore if already exists)
  INSERT INTO timeline_likes (event_id, user_id)
  VALUES (p_event_id, p_user_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  -- Remove any existing dislike
  DELETE FROM timeline_dislikes
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- Get the updated count
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM timeline_likes WHERE event_id = p_event_id;

  -- Update cached stats
  INSERT INTO timeline_event_stats (event_id, like_count, updated_at)
  VALUES (p_event_id, v_count, NOW())
  ON CONFLICT (event_id) DO UPDATE SET like_count = v_count, updated_at = NOW();

  -- Update timeline_events.like_count if column exists
  UPDATE timeline_events SET like_count = v_count WHERE id = p_event_id;

  RETURN QUERY SELECT v_count;
END;
$$;

-- Unlike a timeline event
CREATE OR REPLACE FUNCTION public.unlike_timeline_event(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TABLE(like_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Remove the like
  DELETE FROM timeline_likes
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- Get the updated count
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM timeline_likes WHERE event_id = p_event_id;

  -- Update cached stats
  INSERT INTO timeline_event_stats (event_id, like_count, updated_at)
  VALUES (p_event_id, v_count, NOW())
  ON CONFLICT (event_id) DO UPDATE SET like_count = v_count, updated_at = NOW();

  -- Update timeline_events.like_count if column exists
  UPDATE timeline_events SET like_count = v_count WHERE id = p_event_id;

  RETURN QUERY SELECT v_count;
END;
$$;

-- Dislike a timeline event
CREATE OR REPLACE FUNCTION public.dislike_timeline_event(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TABLE(dislike_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert the dislike (ignore if already exists)
  INSERT INTO timeline_dislikes (event_id, user_id)
  VALUES (p_event_id, p_user_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  -- Remove any existing like
  DELETE FROM timeline_likes
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- Get the updated count
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM timeline_dislikes WHERE event_id = p_event_id;

  -- Update cached stats
  INSERT INTO timeline_event_stats (event_id, dislike_count, updated_at)
  VALUES (p_event_id, v_count, NOW())
  ON CONFLICT (event_id) DO UPDATE SET dislike_count = v_count, updated_at = NOW();

  -- Update timeline_events.dislike_count if column exists
  UPDATE timeline_events SET dislike_count = v_count WHERE id = p_event_id;

  RETURN QUERY SELECT v_count;
END;
$$;

-- Undislike a timeline event
CREATE OR REPLACE FUNCTION public.undislike_timeline_event(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TABLE(dislike_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Remove the dislike
  DELETE FROM timeline_dislikes
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- Get the updated count
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM timeline_dislikes WHERE event_id = p_event_id;

  -- Update cached stats
  INSERT INTO timeline_event_stats (event_id, dislike_count, updated_at)
  VALUES (p_event_id, v_count, NOW())
  ON CONFLICT (event_id) DO UPDATE SET dislike_count = v_count, updated_at = NOW();

  -- Update timeline_events.dislike_count if column exists
  UPDATE timeline_events SET dislike_count = v_count WHERE id = p_event_id;

  RETURN QUERY SELECT v_count;
END;
$$;

-- Add a comment to an event
CREATE OR REPLACE FUNCTION public.add_timeline_comment(
  p_event_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_parent_comment_id UUID DEFAULT NULL
)
RETURNS TABLE(comment_id UUID, comment_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_id UUID;
  v_count INTEGER;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert the comment
  INSERT INTO timeline_comments (event_id, user_id, content, parent_comment_id)
  VALUES (p_event_id, p_user_id, p_content, p_parent_comment_id)
  RETURNING id INTO v_comment_id;

  -- Get the updated count (only top-level comments)
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM timeline_comments
  WHERE event_id = p_event_id AND is_deleted = false AND parent_comment_id IS NULL;

  -- Update cached stats
  INSERT INTO timeline_event_stats (event_id, comment_count, updated_at)
  VALUES (p_event_id, v_count, NOW())
  ON CONFLICT (event_id) DO UPDATE SET comment_count = v_count, updated_at = NOW();

  -- Update timeline_events.reply_count if column exists
  UPDATE timeline_events SET reply_count = v_count WHERE id = p_event_id;

  RETURN QUERY SELECT v_comment_id, v_count;
END;
$$;

-- Update a comment
CREATE OR REPLACE FUNCTION public.update_timeline_comment(
  p_comment_id UUID,
  p_user_id UUID,
  p_content TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user is authenticated
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update the comment (only if user owns it)
  UPDATE timeline_comments
  SET content = p_content, updated_at = NOW()
  WHERE id = p_comment_id AND user_id = p_user_id AND is_deleted = false;

  RETURN FOUND;
END;
$$;

-- Delete a comment (soft delete)
CREATE OR REPLACE FUNCTION public.delete_timeline_comment(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_count INTEGER;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get event_id before deleting
  SELECT event_id INTO v_event_id
  FROM timeline_comments WHERE id = p_comment_id AND user_id = p_user_id;

  IF v_event_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Soft delete the comment
  UPDATE timeline_comments
  SET is_deleted = true, deleted_at = NOW()
  WHERE id = p_comment_id AND user_id = p_user_id;

  -- Update count
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM timeline_comments
  WHERE event_id = v_event_id AND is_deleted = false AND parent_comment_id IS NULL;

  -- Update cached stats
  UPDATE timeline_event_stats SET comment_count = v_count, updated_at = NOW()
  WHERE event_id = v_event_id;

  -- Update timeline_events.reply_count if column exists
  UPDATE timeline_events SET reply_count = v_count WHERE id = v_event_id;

  RETURN TRUE;
END;
$$;

-- Get comments for an event
CREATE OR REPLACE FUNCTION public.get_event_comments(
  p_event_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  event_id UUID,
  user_id UUID,
  content TEXT,
  parent_comment_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.event_id,
    c.user_id,
    c.content,
    c.parent_comment_id,
    c.created_at,
    c.updated_at
  FROM timeline_comments c
  WHERE c.event_id = p_event_id
    AND c.is_deleted = false
    AND c.parent_comment_id IS NULL
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Get replies to a comment
CREATE OR REPLACE FUNCTION public.get_comment_replies(
  p_comment_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  event_id UUID,
  user_id UUID,
  content TEXT,
  parent_comment_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.event_id,
    c.user_id,
    c.content,
    c.parent_comment_id,
    c.created_at,
    c.updated_at
  FROM timeline_comments c
  WHERE c.parent_comment_id = p_comment_id
    AND c.is_deleted = false
  ORDER BY c.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Drop existing feed/thread functions if they have different signatures
DROP FUNCTION IF EXISTS public.get_thread_posts(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_user_timeline_feed(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_user_timeline_feed(uuid, integer, integer, text);
DROP FUNCTION IF EXISTS public.get_enriched_timeline_feed(uuid, integer, integer);

-- Get thread posts (for threaded conversations)
CREATE OR REPLACE FUNCTION public.get_thread_posts(
  p_thread_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF timeline_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM timeline_events
  WHERE (thread_id = p_thread_id OR id = p_thread_id)
    AND (deleted_at IS NULL OR is_deleted = false)
  ORDER BY created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Get user timeline feed
CREATE OR REPLACE FUNCTION public.get_user_timeline_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF timeline_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.*
  FROM timeline_events e
  WHERE (
    -- Own posts
    e.actor_id = p_user_id
    OR
    -- Posts from people user follows
    e.actor_id IN (
      SELECT followed_id FROM user_follows WHERE follower_id = p_user_id
      UNION
      SELECT followed_id FROM follows WHERE follower_id = p_user_id
    )
    OR
    -- Public posts
    e.visibility = 'public'
  )
  AND (e.deleted_at IS NULL OR e.is_deleted = false)
  AND e.parent_event_id IS NULL  -- Only top-level posts
  ORDER BY e.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Get enriched user timeline feed (with counts and user interaction status)
CREATE OR REPLACE FUNCTION public.get_enriched_timeline_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  event_type TEXT,
  actor_id UUID,
  content JSONB,
  visibility TEXT,
  created_at TIMESTAMPTZ,
  like_count INTEGER,
  share_count INTEGER,
  comment_count INTEGER,
  user_liked BOOLEAN,
  user_shared BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.actor_id,
    e.content,
    e.visibility,
    e.created_at,
    COALESCE(s.like_count, e.like_count, 0)::INTEGER as like_count,
    COALESCE(s.share_count, e.share_count, 0)::INTEGER as share_count,
    COALESCE(s.comment_count, e.reply_count, 0)::INTEGER as comment_count,
    EXISTS(SELECT 1 FROM timeline_likes WHERE event_id = e.id AND user_id = p_user_id) as user_liked,
    FALSE as user_shared  -- Can be implemented later with shares table
  FROM timeline_events e
  LEFT JOIN timeline_event_stats s ON e.id = s.event_id
  WHERE (
    -- Own posts
    e.actor_id = p_user_id
    OR
    -- Posts from people user follows
    e.actor_id IN (
      SELECT followed_id FROM user_follows WHERE follower_id = p_user_id
      UNION
      SELECT followed_id FROM follows WHERE follower_id = p_user_id
    )
    OR
    -- Public posts
    e.visibility = 'public'
  )
  AND (e.deleted_at IS NULL OR e.is_deleted = false)
  AND e.parent_event_id IS NULL  -- Only top-level posts
  ORDER BY e.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_timeline_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_post_with_visibility TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_timeline_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_quote_reply TO authenticated;
GRANT EXECUTE ON FUNCTION public.like_timeline_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlike_timeline_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.dislike_timeline_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.undislike_timeline_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_timeline_comment TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_timeline_comment TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_timeline_comment TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_comments TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_comment_replies TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread_posts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_timeline_feed TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enriched_timeline_feed TO authenticated;

-- ============================================================================
-- Done!
-- ============================================================================
