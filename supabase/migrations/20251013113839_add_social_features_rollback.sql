-- ROLLBACK: 20251013113839_add_social_features
-- Generated: 2025-12-04T12:37:00.394Z
-- Source: 20251013113839_add_social_features.sql

DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_follows_follower_id;
DROP INDEX IF EXISTS idx_follows_following_id;
DROP INDEX IF EXISTS idx_follows_created_at;
ALTER TABLE public DROP COLUMN IF EXISTS follower_count;
ALTER TABLE public DROP COLUMN IF EXISTS following_count;
DROP FUNCTION IF EXISTS public;
DROP TRIGGER IF EXISTS on_follow_change ON public;

-- Rollback completed: 20251013113839_add_social_features