-- ROLLBACK: 20251020120000_add_org_wallets
-- Generated: 2025-12-04T12:37:00.420Z
-- Source: 20251020120000_add_org_wallets.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP FUNCTION IF EXISTS public;
DROP TRIGGER IF EXISTS set_wallets_updated_at ON public;

-- Rollback completed: 20251020120000_add_org_wallets