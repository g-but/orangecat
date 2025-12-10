-- ROLLBACK: 20250101000000_create_organizations
-- Generated: 2025-12-04T12:37:00.323Z
-- Source: 20250101000000_create_organizations.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP FUNCTION IF EXISTS public;
DROP TRIGGER IF EXISTS update_organization_member_count_trigger ON public;
DROP FUNCTION IF EXISTS public;
DROP TRIGGER IF EXISTS update_organization_trust_score_trigger ON public;
DROP TRIGGER IF EXISTS update_organization_trust_score_proposals_trigger ON public;
-- MANUAL: Review data inserted into public

-- Rollback completed: 20250101000000_create_organizations