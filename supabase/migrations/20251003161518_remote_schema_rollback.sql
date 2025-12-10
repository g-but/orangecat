-- ROLLBACK: 20251003161518_remote_schema
-- Generated: 2025-12-04T12:37:00.387Z
-- Source: 20251003161518_remote_schema.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS funding_pages_created_at_idx;
DROP INDEX IF EXISTS funding_pages_user_id_idx;
DROP INDEX IF EXISTS idx_app_questions_organization;
DROP INDEX IF EXISTS idx_notifications_type_created;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_transparency_scores_entity;
DROP INDEX IF EXISTS idx_transparency_scores_score;
DROP INDEX IF EXISTS memberships_invitation_token_key;
DROP INDEX IF EXISTS notifications_pkey;
DROP INDEX IF EXISTS organization_application_questions_pkey;
DROP INDEX IF EXISTS profiles_username_idx;
DROP INDEX IF EXISTS transactions_created_at_idx;
DROP INDEX IF EXISTS transactions_funding_page_id_idx;
DROP INDEX IF EXISTS transparency_scores_pkey;
DROP INDEX IF EXISTS unique_entity_score;
DROP INDEX IF EXISTS unique_membership;
DROP FUNCTION IF EXISTS public;
DROP FUNCTION IF EXISTS public;
-- MANUAL: Review data inserted into public
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public;
DROP TRIGGER IF EXISTS update_organization_application_questions_updated_at ON public;

-- Rollback completed: 20251003161518_remote_schema