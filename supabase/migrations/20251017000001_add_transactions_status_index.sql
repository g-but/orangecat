-- Migration: Add index on transactions.status
-- Created: 2025-10-17
-- Priority: P0 - Critical (Quick Win)
-- Impact: 10x faster queries filtering by transaction status
--
-- This index enables fast filtering of transactions by status,
-- which is crucial for:
-- - Admin dashboards (pending transactions view)
-- - Payment processing (finding pending/processing transactions)
-- - Analytics (completed transactions reports)
-- - User transaction history (filtering by status)
--
-- Expected performance improvement:
-- - Query time: ~500ms → ~50ms (10x faster)
-- - Index size: ~100KB for 10K transactions
-- - Write overhead: Negligible (<5ms per insert)

-- Add index on transactions.status column
CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions(status);

-- Add comment for documentation
COMMENT ON INDEX idx_transactions_status IS
'Index for fast filtering transactions by status. Critical for admin dashboards and payment processing.';

-- Verify index creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'transactions'
    AND indexname = 'idx_transactions_status'
  ) THEN
    RAISE NOTICE 'Index idx_transactions_status created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create index idx_transactions_status';
  END IF;
END $$;
