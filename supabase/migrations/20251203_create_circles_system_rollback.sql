-- ROLLBACK: 20251203_create_circles_system
-- Generated: 2025-12-04T12:37:00.497Z
-- Source: 20251203_create_circles_system.sql

DROP TABLE IF EXISTS circles CASCADE;
DROP INDEX IF EXISTS idx_circles_created_by;
DROP INDEX IF EXISTS idx_circles_public;
DROP INDEX IF EXISTS idx_circles_category;
DROP INDEX IF EXISTS idx_circles_member_count;
DROP INDEX IF EXISTS idx_circles_created_at;
DROP FUNCTION IF EXISTS update_circles_updated_at;
DROP TRIGGER IF EXISTS trigger_update_circles_updated_at ON circles;
DROP TABLE IF EXISTS circle_members CASCADE;
DROP INDEX IF EXISTS idx_circle_members_circle;
DROP INDEX IF EXISTS idx_circle_members_user;
DROP INDEX IF EXISTS idx_circle_members_role;
DROP INDEX IF EXISTS idx_circle_members_status;
DROP INDEX IF EXISTS idx_circle_members_activity;
DROP TABLE IF EXISTS circle_wallets CASCADE;
DROP INDEX IF EXISTS idx_circle_wallets_circle;
DROP INDEX IF EXISTS idx_circle_wallets_active;
DROP INDEX IF EXISTS idx_circle_wallets_purpose;
DROP TABLE IF EXISTS circle_invitations CASCADE;
DROP INDEX IF EXISTS idx_circle_invitations_circle;
DROP INDEX IF EXISTS idx_circle_invitations_invited_user;
DROP INDEX IF EXISTS idx_circle_invitations_status;
DROP INDEX IF EXISTS idx_circle_invitations_expires;
DROP TABLE IF EXISTS circle_activities CASCADE;
DROP INDEX IF EXISTS idx_circle_activities_circle;
DROP INDEX IF EXISTS idx_circle_activities_user;
DROP INDEX IF EXISTS idx_circle_activities_type;
DROP FUNCTION IF EXISTS get_user_circles;
DROP FUNCTION IF EXISTS get_circle_members;
DROP FUNCTION IF EXISTS get_circle_wallets;
DROP FUNCTION IF EXISTS create_circle;
-- MANUAL: Review data inserted into circles
-- MANUAL: Review data inserted into circle_members
-- MANUAL: Review data inserted into circle_activities
DROP FUNCTION IF EXISTS update_circle_member_count;
DROP TRIGGER IF EXISTS trigger_update_circle_member_count ON circle_members;

-- Rollback completed: 20251203_create_circles_system