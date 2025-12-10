-- ROLLBACK: 20250125000000_ensure_contact_email_column
-- Generated: 2025-12-04T12:37:00.330Z
-- Source: 20250125000000_ensure_contact_email_column.sql

ALTER TABLE public DROP COLUMN IF EXISTS contact_email;

-- Rollback completed: 20250125000000_ensure_contact_email_column