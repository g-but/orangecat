-- ROLLBACK: 20251113070000_fix_coalesce_type_mismatch
-- Generated: 2025-12-04T12:37:00.471Z
-- Source: 20251113070000_fix_coalesce_type_mismatch.sql

DROP FUNCTION IF EXISTS create_timeline_event;
-- MANUAL: Review data inserted into timeline_events

-- Rollback completed: 20251113070000_fix_coalesce_type_mismatch