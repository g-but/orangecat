-- ROLLBACK: 20250127180000_fix_migration_conflict_and_add_contact_email
-- Generated: 2025-12-04T12:37:00.334Z
-- Source: 20250127180000_fix_migration_conflict_and_add_contact_email.sql

ALTER TABLE public DROP COLUMN IF EXISTS contact_email;

-- Rollback completed: 20250127180000_fix_migration_conflict_and_add_contact_email