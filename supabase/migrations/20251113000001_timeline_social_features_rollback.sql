-- ROLLBACK: 20251113000001_timeline_social_features
-- Generated: 2025-12-04T12:37:00.470Z
-- Source: 20251113000001_timeline_social_features.sql

DROP TABLE IF EXISTS timeline_likes CASCADE;
DROP INDEX IF EXISTS idx_timeline_likes_event;
DROP INDEX IF EXISTS idx_timeline_likes_user;
DROP INDEX IF EXISTS idx_timeline_likes_created_at;
DROP FUNCTION IF EXISTS get_event_like_count;
DROP FUNCTION IF EXISTS has_user_liked_event;
DROP TABLE IF EXISTS timeline_dislikes CASCADE;
DROP INDEX IF EXISTS idx_timeline_dislikes_event;
DROP INDEX IF EXISTS idx_timeline_dislikes_user;
DROP INDEX IF EXISTS idx_timeline_dislikes_created_at;
DROP FUNCTION IF EXISTS get_event_dislike_count;
DROP FUNCTION IF EXISTS has_user_disliked_event;
DROP TABLE IF EXISTS timeline_shares CASCADE;
DROP INDEX IF EXISTS idx_timeline_shares_original_event;
DROP INDEX IF EXISTS idx_timeline_shares_user;
DROP INDEX IF EXISTS idx_timeline_shares_created_at;
DROP FUNCTION IF EXISTS get_event_share_count;
DROP FUNCTION IF EXISTS has_user_shared_event;
DROP TABLE IF EXISTS timeline_comments CASCADE;
DROP INDEX IF EXISTS idx_timeline_comments_event;
DROP INDEX IF EXISTS idx_timeline_comments_user;
DROP INDEX IF EXISTS idx_timeline_comments_parent;
DROP INDEX IF EXISTS idx_timeline_comments_thread;
DROP FUNCTION IF EXISTS update_timeline_comment_updated_at;
DROP TRIGGER IF EXISTS trigger_update_timeline_comment_updated_at ON timeline_comments;
DROP FUNCTION IF EXISTS get_event_comment_count;
DROP FUNCTION IF EXISTS get_comment_reply_count;
DROP VIEW IF EXISTS timeline_event_stats;
DROP FUNCTION IF EXISTS like_timeline_event;
-- MANUAL: Review data inserted into timeline_likes
DROP FUNCTION IF EXISTS unlike_timeline_event;
DROP FUNCTION IF EXISTS dislike_timeline_event;
-- MANUAL: Review data inserted into timeline_dislikes
DROP FUNCTION IF EXISTS undislike_timeline_event;
DROP FUNCTION IF EXISTS share_timeline_event;
-- MANUAL: Review data inserted into timeline_shares
DROP FUNCTION IF EXISTS add_timeline_comment;
-- MANUAL: Review data inserted into timeline_comments
DROP FUNCTION IF EXISTS get_enriched_timeline_feed;
DROP FUNCTION IF EXISTS get_event_comments;
DROP FUNCTION IF EXISTS get_comment_replies;

-- Rollback completed: 20251113000001_timeline_social_features