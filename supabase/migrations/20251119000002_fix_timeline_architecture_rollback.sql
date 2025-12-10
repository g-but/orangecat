-- ROLLBACK: 20251119000002_fix_timeline_architecture
-- Generated: 2025-12-04T12:37:00.481Z
-- Source: 20251119000002_fix_timeline_architecture.sql

DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_posts_author;
DROP INDEX IF EXISTS idx_posts_published;
DROP INDEX IF EXISTS idx_posts_visibility;
DROP INDEX IF EXISTS idx_posts_tags;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_visibility_post;
DROP INDEX IF EXISTS idx_post_visibility_timeline_profile;
DROP INDEX IF EXISTS idx_post_visibility_timeline_project;
DROP INDEX IF EXISTS idx_post_visibility_timeline_community;
DROP INDEX IF EXISTS idx_post_visibility_pinned;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_likes_post;
DROP INDEX IF EXISTS idx_post_likes_user;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_comments_post;
DROP INDEX IF EXISTS idx_post_comments_author;
DROP INDEX IF EXISTS idx_post_comments_parent;
DROP INDEX IF EXISTS idx_post_comments_thread;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_comment_likes_comment;
DROP INDEX IF EXISTS idx_comment_likes_user;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_post_shares_post;
DROP INDEX IF EXISTS idx_post_shares_user;
DROP FUNCTION IF EXISTS update_post_timestamp;
DROP TRIGGER IF EXISTS update_post_timestamp_trigger ON public;
DROP FUNCTION IF EXISTS update_comment_timestamp;
DROP TRIGGER IF EXISTS update_comment_timestamp_trigger ON public;
DROP FUNCTION IF EXISTS auto_add_community_visibility;
-- MANUAL: Review data inserted into post_visibility
DROP TRIGGER IF EXISTS auto_add_community_visibility_trigger ON public;

-- Rollback completed: 20251119000002_fix_timeline_architecture