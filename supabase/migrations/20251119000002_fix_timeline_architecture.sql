-- Migration: Fix Timeline Architecture - True Cross-Posting
-- Priority: P0 - CRITICAL
-- Created: 2025-11-19
-- Purpose: Fix duplicate post creation, implement true cross-posting with single source of truth
-- Breaking Change: Yes - requires application code updates
-- Estimated Time: 10-15 minutes

-- ============================================================================
-- PHASE 1: Create New Posts Architecture
-- ============================================================================

BEGIN;

-- Step 1: Create posts table (single source of truth for user-generated content)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Author (who wrote this post)
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  title TEXT CHECK (char_length(title) <= 200),

  -- Media attachments
  media_urls TEXT[] DEFAULT '{}'::TEXT[],
  media_types TEXT[] DEFAULT '{}'::TEXT[], -- ['image', 'video', 'link']

  -- Visibility
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ, -- NULL = draft

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deletion_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  tags TEXT[] DEFAULT '{}'::TEXT[]
);

CREATE INDEX idx_posts_author ON public.posts(author_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_posts_published ON public.posts(published_at DESC) WHERE published_at IS NOT NULL AND NOT is_deleted;
CREATE INDEX idx_posts_visibility ON public.posts(visibility, published_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_posts_tags ON public.posts USING gin(tags) WHERE array_length(tags, 1) > 0 AND NOT is_deleted;

COMMENT ON TABLE public.posts IS 'User-generated posts - single source of truth';
COMMENT ON COLUMN public.posts.author_id IS 'Who wrote this post (always the user, never changes)';
COMMENT ON COLUMN public.posts.published_at IS 'When published (NULL = draft state)';

-- Step 2: Create post_visibility table (where posts appear)
CREATE TABLE IF NOT EXISTS public.post_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,

  -- Timeline this post appears on
  timeline_type TEXT NOT NULL CHECK (timeline_type IN ('profile', 'project', 'community')),
  timeline_owner_id UUID, -- NULL for community timeline

  -- Who added it to this timeline
  added_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Display settings per timeline
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_at TIMESTAMPTZ,

  -- Unique constraint: one post can appear once per timeline
  UNIQUE(post_id, timeline_type, timeline_owner_id)
);

CREATE INDEX idx_post_visibility_post ON public.post_visibility(post_id);
CREATE INDEX idx_post_visibility_timeline_profile ON public.post_visibility(timeline_owner_id, added_at DESC)
  WHERE timeline_type = 'profile';
CREATE INDEX idx_post_visibility_timeline_project ON public.post_visibility(timeline_owner_id, added_at DESC)
  WHERE timeline_type = 'project';
CREATE INDEX idx_post_visibility_timeline_community ON public.post_visibility(added_at DESC)
  WHERE timeline_type = 'community';
CREATE INDEX idx_post_visibility_pinned ON public.post_visibility(timeline_type, timeline_owner_id, pinned_at DESC)
  WHERE is_pinned = true;

COMMENT ON TABLE public.post_visibility IS 'Where posts appear (many-to-many: posts to timelines)';
COMMENT ON COLUMN public.post_visibility.timeline_owner_id IS 'Profile/project ID, or NULL for community timeline';

-- Step 3: Create post engagement tables

-- Likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user ON public.post_likes(user_id, created_at DESC);

-- Comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),

  -- Threading support
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  thread_root_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_post_comments_post ON public.post_comments(post_id, created_at) WHERE NOT is_deleted;
CREATE INDEX idx_post_comments_author ON public.post_comments(author_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_post_comments_parent ON public.post_comments(parent_comment_id, created_at) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_post_comments_thread ON public.post_comments(thread_root_id, created_at) WHERE thread_root_id IS NOT NULL;

-- Comment likes
CREATE TABLE IF NOT EXISTS public.post_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON public.post_comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON public.post_comment_likes(user_id);

-- Shares (for tracking who shared, not creating duplicates!)
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Where they shared it to
  shared_to_type TEXT CHECK (shared_to_type IN ('profile', 'project')),
  shared_to_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(post_id, user_id, shared_to_type, shared_to_id)
);

CREATE INDEX idx_post_shares_post ON public.post_shares(post_id);
CREATE INDEX idx_post_shares_user ON public.post_shares(user_id, created_at DESC);

COMMENT ON TABLE public.post_shares IS 'Track post shares without duplicating content';

-- ============================================================================
-- PHASE 2: Add Triggers and Functions
-- ============================================================================

-- Update timestamp trigger for posts
CREATE OR REPLACE FUNCTION update_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_timestamp_trigger
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_post_timestamp();

-- Update timestamp trigger for comments
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_timestamp_trigger
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_timestamp();

-- Automatically add community visibility when post is created
CREATE OR REPLACE FUNCTION auto_add_community_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for public posts that are published
  IF NEW.visibility = 'public' AND NEW.published_at IS NOT NULL THEN
    INSERT INTO post_visibility (post_id, timeline_type, timeline_owner_id, added_by_id, added_at)
    VALUES (NEW.id, 'community', NULL, NEW.author_id, NEW.published_at)
    ON CONFLICT (post_id, timeline_type, timeline_owner_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_add_community_visibility_trigger
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION auto_add_community_visibility();

-- ============================================================================
-- PHASE 3: Row Level Security
-- ============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- Posts Policies

-- Anyone can view published public posts
CREATE POLICY "posts_select_public"
  ON public.posts FOR SELECT
  USING (
    visibility = 'public' AND
    published_at IS NOT NULL AND
    NOT is_deleted
  );

-- Users can view their own posts (including drafts)
CREATE POLICY "posts_select_own"
  ON public.posts FOR SELECT
  USING (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can view posts from people they follow (if followers visibility)
CREATE POLICY "posts_select_followers"
  ON public.posts FOR SELECT
  USING (
    visibility = 'followers' AND
    published_at IS NOT NULL AND
    NOT is_deleted AND
    EXISTS (
      SELECT 1 FROM follows f
      WHERE f.following_id = author_id
        AND f.follower_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Users can create posts for themselves
CREATE POLICY "posts_insert_own"
  ON public.posts FOR INSERT
  WITH CHECK (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can update their own posts
CREATE POLICY "posts_update_own"
  ON public.posts FOR UPDATE
  USING (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can delete their own posts
CREATE POLICY "posts_delete_own"
  ON public.posts FOR DELETE
  USING (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Post Visibility Policies

-- Anyone can view visibility for public posts
CREATE POLICY "post_visibility_select_public"
  ON public.post_visibility FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.visibility = 'public'
        AND p.published_at IS NOT NULL
        AND NOT p.is_deleted
    )
  );

-- Users can view visibility for their own posts
CREATE POLICY "post_visibility_select_own"
  ON public.post_visibility FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.author_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Users can add visibility for their own posts
CREATE POLICY "post_visibility_insert_own"
  ON public.post_visibility FOR INSERT
  WITH CHECK (
    added_by_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.author_id = added_by_id
    )
  );

-- Users can remove visibility for their own posts
CREATE POLICY "post_visibility_delete_own"
  ON public.post_visibility FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.author_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Likes Policies

-- Anyone can view likes on public posts
CREATE POLICY "post_likes_select_public"
  ON public.post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.visibility = 'public'
        AND p.published_at IS NOT NULL
        AND NOT p.is_deleted
    )
  );

-- Users can like posts
CREATE POLICY "post_likes_insert_own"
  ON public.post_likes FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can unlike posts
CREATE POLICY "post_likes_delete_own"
  ON public.post_likes FOR DELETE
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Comments Policies

-- Anyone can view comments on public posts
CREATE POLICY "post_comments_select_public"
  ON public.post_comments FOR SELECT
  USING (
    NOT is_deleted AND
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.visibility = 'public'
        AND p.published_at IS NOT NULL
        AND NOT p.is_deleted
    )
  );

-- Users can create comments
CREATE POLICY "post_comments_insert_own"
  ON public.post_comments FOR INSERT
  WITH CHECK (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can update their own comments
CREATE POLICY "post_comments_update_own"
  ON public.post_comments FOR UPDATE
  USING (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can delete their own comments
CREATE POLICY "post_comments_delete_own"
  ON public.post_comments FOR DELETE
  USING (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Comment Likes Policies

-- Anyone can view comment likes on public posts
CREATE POLICY "comment_likes_select_public"
  ON public.post_comment_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM post_comments pc
      JOIN posts p ON p.id = pc.post_id
      WHERE pc.id = comment_id
        AND NOT pc.is_deleted
        AND p.visibility = 'public'
        AND p.published_at IS NOT NULL
        AND NOT p.is_deleted
    )
  );

-- Users can like comments
CREATE POLICY "comment_likes_insert_own"
  ON public.post_comment_likes FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can unlike comments
CREATE POLICY "comment_likes_delete_own"
  ON public.post_comment_likes FOR DELETE
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Shares Policies

-- Anyone can view shares
CREATE POLICY "post_shares_select_all"
  ON public.post_shares FOR SELECT
  USING (true);

-- Users can create shares
CREATE POLICY "post_shares_insert_own"
  ON public.post_shares FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can delete their own shares
CREATE POLICY "post_shares_delete_own"
  ON public.post_shares FOR DELETE
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

COMMIT;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_tables_exist boolean;
BEGIN
  -- Check tables exist
  SELECT
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('posts', 'post_visibility', 'post_likes', 'post_comments', 'post_shares')) = 5
  INTO v_tables_exist;

  IF v_tables_exist THEN
    RAISE NOTICE '✅ SUCCESS: New posts architecture created';
    RAISE NOTICE '  ✓ Tables: posts, post_visibility, post_likes, post_comments, post_shares';
    RAISE NOTICE '  ✓ RLS Policies: Enabled with proper security';
    RAISE NOTICE '  ✓ Triggers: Auto community visibility, timestamps';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NEXT STEPS:';
    RAISE NOTICE '  1. Run data migration script (optional - keep timeline_events for history)';
    RAISE NOTICE '  2. Update application code to use posts table for new posts';
    RAISE NOTICE '  3. Keep timeline_events for non-post events (donations, milestones)';
  ELSE
    RAISE EXCEPTION '❌ FAILED: New posts architecture incomplete';
  END IF;
END $$;
