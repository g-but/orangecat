-- ROLLBACK: 20251119100002_fix_timeline_architecture_v2
-- Generated: 2025-12-04T12:37:00.486Z
-- Source: 20251119100002_fix_timeline_architecture_v2.sql

DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_posts_author;
DROP INDEX IF EXISTS idx_posts_published;
DROP INDEX IF EXISTS idx_posts_visibility;
DROP INDEX IF EXISTS idx_posts_tags;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_visibility_post;
DROP INDEX IF EXISTS idx_post_visibility_timeline;
DROP INDEX IF EXISTS idx_post_visibility_community;
DROP INDEX IF EXISTS idx_post_visibility_pinned;
DROP FUNCTION IF EXISTS validate_post_visibility;
DROP TRIGGER IF EXISTS validate_post_visibility_trigger ON public;
DROP FUNCTION IF EXISTS cleanup_post_visibility_on_entity_delete;
DROP TRIGGER IF EXISTS cleanup_post_visibility_on_profile_delete ON public;
DROP TRIGGER IF EXISTS cleanup_post_visibility_on_project_delete ON public;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_likes_post;
DROP INDEX IF EXISTS idx_post_likes_user;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_comments_post;
DROP INDEX IF EXISTS idx_post_comments_author;
DROP INDEX IF EXISTS idx_post_comments_parent;
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_comment_likes_comment;
DROP INDEX IF EXISTS idx_post_comment_likes_user;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_shares_post;
DROP INDEX IF EXISTS idx_post_shares_user;
DROP INDEX IF EXISTS idx_post_shares_destination;
DROP FUNCTION IF EXISTS check_post_rate_limit;
DROP TRIGGER IF EXISTS check_post_rate_limit_trigger ON public;

-- Rollback completed: 20251119100002_fix_timeline_architecture_v2