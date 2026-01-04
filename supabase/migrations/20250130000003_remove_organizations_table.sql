-- =============================================
-- REMOVE ORGANIZATIONS TABLE
-- 
-- This migration removes all legacy organizations tables
-- after data has been migrated to the unified groups system.
--
-- IMPORTANT: Run migrate-organizations-to-groups.sql FIRST
-- and verify all data has been migrated successfully.
-- =============================================

-- Step 1: Drop dependent tables first (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS organization_votes CASCADE;
DROP TABLE IF EXISTS organization_proposals CASCADE;
DROP TABLE IF EXISTS organization_projects CASCADE;
DROP TABLE IF EXISTS organization_invites CASCADE;
DROP TABLE IF EXISTS organization_stakeholders CASCADE;

-- Step 2: Drop organizations table
DROP TABLE IF EXISTS organizations CASCADE;

-- Step 3: Drop related functions (if they exist)
DROP FUNCTION IF EXISTS get_user_voting_power(uuid, uuid);
DROP FUNCTION IF EXISTS get_proposal_results(uuid);
DROP FUNCTION IF EXISTS has_proposal_passed(uuid);
DROP FUNCTION IF EXISTS calculate_organization_transparency_score(uuid);
DROP FUNCTION IF EXISTS update_organization_transparency_score();

-- Step 4: Drop related triggers (if they exist)
DROP TRIGGER IF EXISTS update_organization_transparency_on_stakeholder_change ON organization_stakeholders;
DROP TRIGGER IF EXISTS update_organization_transparency_on_proposal_change ON organization_proposals;
DROP TRIGGER IF EXISTS update_organization_transparency_on_org_change ON organizations;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_organization_proposals_updated_at ON organization_proposals;

-- Note: This migration is irreversible. Make sure you have:
-- 1. Backed up the database
-- 2. Migrated all data to groups tables
-- 3. Verified all applications are using groups API
-- 4. Tested thoroughly in staging environment


