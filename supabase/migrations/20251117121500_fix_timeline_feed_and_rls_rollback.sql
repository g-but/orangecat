-- ROLLBACK: 20251117121500_fix_timeline_feed_and_rls
-- Generated: 2025-12-04T12:37:00.477Z
-- Source: 20251117121500_fix_timeline_feed_and_rls.sql

DROP FUNCTION IF EXISTS get_user_timeline_feed;
DROP FUNCTION IF EXISTS get_enriched_timeline_feed;

-- Rollback completed: 20251117121500_fix_timeline_feed_and_rls