-- ROLLBACK: 20251017000006_add_transparency_scores
-- Generated: 2025-12-04T12:37:00.417Z
-- Source: 20251017000006_add_transparency_scores.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TRIGGER IF EXISTS transparency_scores_updated_at ON public;
DROP FUNCTION IF EXISTS calculate_profile_transparency_score;
-- MANUAL: Review data inserted into transparency_scores
DROP FUNCTION IF EXISTS calculate_organization_transparency_score;
-- MANUAL: Review data inserted into transparency_scores
DROP FUNCTION IF EXISTS trigger_calculate_profile_transparency;
DROP TRIGGER IF EXISTS trigger_profile_transparency_update ON profiles;

-- Rollback completed: 20251017000006_add_transparency_scores