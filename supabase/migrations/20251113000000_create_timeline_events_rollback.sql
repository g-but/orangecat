-- ROLLBACK: 20251113000000_create_timeline_events
-- Generated: 2025-12-04T12:37:00.467Z
-- Source: 20251113000000_create_timeline_events.sql

DROP TABLE IF EXISTS timeline_events CASCADE;
DROP INDEX IF EXISTS idx_timeline_actor_time;
DROP INDEX IF EXISTS idx_timeline_subject;
DROP INDEX IF EXISTS idx_timeline_target;
DROP INDEX IF EXISTS idx_timeline_event_type;
DROP INDEX IF EXISTS idx_timeline_featured;
DROP INDEX IF EXISTS idx_timeline_visibility;
DROP INDEX IF EXISTS idx_timeline_parent;
DROP INDEX IF EXISTS idx_timeline_thread;
DROP INDEX IF EXISTS idx_timeline_financial;
DROP INDEX IF EXISTS idx_timeline_tags;
DROP INDEX IF EXISTS idx_timeline_metadata;
DROP FUNCTION IF EXISTS update_timeline_event_updated_at;
DROP TRIGGER IF EXISTS trigger_update_timeline_event_updated_at ON timeline_events;
DROP FUNCTION IF EXISTS soft_delete_timeline_event;
DROP FUNCTION IF EXISTS get_user_timeline_feed;
DROP FUNCTION IF EXISTS get_project_timeline;
DROP FUNCTION IF EXISTS create_timeline_event;
-- MANUAL: Review data inserted into timeline_events
DROP FUNCTION IF EXISTS get_community_timeline;

-- Rollback completed: 20251113000000_create_timeline_events