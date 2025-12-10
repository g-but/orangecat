-- ROLLBACK: 20251103000000_sync_project_funding
-- Generated: 2025-12-04T12:37:00.426Z
-- Source: 20251103000000_sync_project_funding.sql

DROP FUNCTION IF EXISTS sync_project_funding;
DROP TRIGGER IF EXISTS transaction_funding_sync ON transactions;

-- Rollback completed: 20251103000000_sync_project_funding