-- ROLLBACK: 20251013120000_add_profile_associations
-- Generated: 2025-12-04T12:37:00.396Z
-- Source: 20251013120000_add_profile_associations.sql

DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_associations_source_profile;
DROP INDEX IF EXISTS idx_associations_target_entity;
DROP INDEX IF EXISTS idx_associations_relationship_type;
DROP INDEX IF EXISTS idx_associations_status;
DROP INDEX IF EXISTS idx_associations_created_at;
DROP FUNCTION IF EXISTS public;
DROP TRIGGER IF EXISTS on_association_update ON public;

-- Rollback completed: 20251013120000_add_profile_associations