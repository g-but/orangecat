-- ROLLBACK: 20251119120000_fix_post_duplication
-- Generated: 2025-12-04T12:37:00.490Z
-- Source: 20251119120000_fix_post_duplication.sql

DROP TABLE IF EXISTS post_visibility CASCADE;
ALTER TABLE timeline_events DROP COLUMN IF EXISTS IF;
DROP FUNCTION IF EXISTS get_timeline_posts;
DROP FUNCTION IF EXISTS create_post_with_visibility;
-- MANUAL: Review data inserted into timeline_events
-- MANUAL: Review data inserted into post_visibility
DROP VIEW IF EXISTS community_timeline_no_duplicates;
-- MANUAL: Review data inserted into post_visibility
-- MANUAL: Review data inserted into post_visibility
-- MANUAL: Review data inserted into post_visibility

-- Rollback completed: 20251119120000_fix_post_duplication