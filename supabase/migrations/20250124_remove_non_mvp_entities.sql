-- MVP Simplification: Remove Organizations, Campaigns, Events, Assets, Associations
-- Keep only: Profiles + Projects + Wallets + Transactions
-- Date: 2025-01-24

-- ======================
-- DROP TABLES (in order - FK dependencies first)
-- ======================

-- Drop dependent tables first
DROP TABLE IF EXISTS organization_votes CASCADE;
DROP TABLE IF EXISTS organization_proposals CASCADE;
DROP TABLE IF EXISTS organization_analytics CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS profile_associations CASCADE;
DROP TABLE IF EXISTS organization_wallets CASCADE;

-- Drop main organization table last
DROP TABLE IF EXISTS organizations CASCADE;

-- ======================
-- DROP ENUMS
-- ======================

DROP TYPE IF EXISTS organization_type_enum CASCADE;
DROP TYPE IF EXISTS membership_role_enum CASCADE;
DROP TYPE IF EXISTS membership_status_enum CASCADE;
DROP TYPE IF EXISTS governance_model_enum CASCADE;

-- ======================
-- MODIFY PROJECTS TABLE
-- ======================

-- Remove organization_id column from projects (projects are now only owned by individual profiles)
ALTER TABLE projects DROP COLUMN IF EXISTS organization_id CASCADE;

-- ======================
-- OPTIONAL: Simplify transaction entity types
-- ======================

-- Note: For now, keeping entity_type flexible for future growth
-- Could restrict to only 'profile' and 'project' in future

-- ======================
-- VERIFICATION
-- ======================

-- Verify tables removed
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations');
  ASSERT NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members');
  ASSERT NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_associations');
  RAISE NOTICE 'MVP simplification migration completed successfully';
END $$;
