-- ROLLBACK: 20251013_create_organization_members
-- Generated: 2025-12-04T12:37:00.402Z
-- Source: 20251013_create_organization_members.sql

DROP TABLE IF EXISTS organization_members CASCADE;
DROP INDEX IF EXISTS idx_org_members_org;
DROP INDEX IF EXISTS idx_org_members_profile;
DROP INDEX IF EXISTS idx_org_members_status;
DROP INDEX IF EXISTS idx_org_members_role;
DROP FUNCTION IF EXISTS update_organization_members_updated_at;
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;

-- Rollback completed: 20251013_create_organization_members