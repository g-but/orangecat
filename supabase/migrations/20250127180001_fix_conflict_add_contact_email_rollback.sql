-- ROLLBACK: 20250127180001_fix_conflict_add_contact_email
-- Generated: 2025-12-04T12:37:00.335Z
-- Source: 20250127180001_fix_conflict_add_contact_email.sql

-- MANUAL: Review data inserted into supabase_migrations
ALTER TABLE public DROP COLUMN IF EXISTS contact_email;

-- Rollback completed: 20250127180001_fix_conflict_add_contact_email