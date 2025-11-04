-- Migration: Automatic Project Funding Sync
-- Created: 2025-11-03
-- Purpose: Auto-update projects.raised_amount and contributor_count when transactions are created/updated
-- This eliminates manual calculations and ensures data consistency

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS transaction_funding_sync ON transactions;
DROP FUNCTION IF EXISTS sync_project_funding();

-- Create function to sync project funding statistics
CREATE OR REPLACE FUNCTION sync_project_funding()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT operations (new transactions)
  IF (TG_OP = 'INSERT') THEN
    -- Only update if transaction is confirmed and goes to a project
    IF NEW.to_entity_type = 'project' AND NEW.status = 'confirmed' THEN
      UPDATE projects
      SET
        raised_amount = COALESCE(raised_amount, 0) + NEW.amount_sats,
        -- Increment contributor_count if from a profile (not from another project)
        contributor_count = CASE
          WHEN NEW.from_entity_type = 'profile' THEN COALESCE(contributor_count, 0) + 1
          ELSE COALESCE(contributor_count, 0)
        END,
        updated_at = NOW()
      WHERE id = NEW.to_entity_id;
    END IF;

    RETURN NEW;
  END IF;

  -- Handle UPDATE operations (status changes)
  IF (TG_OP = 'UPDATE') THEN
    -- Only process if to_entity is a project and status changed
    IF NEW.to_entity_type = 'project' AND OLD.status != NEW.status THEN

      -- Transaction changed FROM confirmed TO something else (refund/failed)
      IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
        UPDATE projects
        SET
          raised_amount = GREATEST(0, COALESCE(raised_amount, 0) - OLD.amount_sats),
          -- Decrement contributor_count if it was from a profile
          contributor_count = CASE
            WHEN OLD.from_entity_type = 'profile' THEN GREATEST(0, COALESCE(contributor_count, 0) - 1)
            ELSE COALESCE(contributor_count, 0)
          END,
          updated_at = NOW()
        WHERE id = OLD.to_entity_id;
      END IF;

      -- Transaction changed TO confirmed FROM something else
      IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE projects
        SET
          raised_amount = COALESCE(raised_amount, 0) + NEW.amount_sats,
          -- Increment contributor_count if from a profile
          contributor_count = CASE
            WHEN NEW.from_entity_type = 'profile' THEN COALESCE(contributor_count, 0) + 1
            ELSE COALESCE(contributor_count, 0)
          END,
          updated_at = NOW()
        WHERE id = NEW.to_entity_id;
      END IF;

      -- Handle amount changes while status remains confirmed
      IF OLD.status = 'confirmed' AND NEW.status = 'confirmed' AND OLD.amount_sats != NEW.amount_sats THEN
        UPDATE projects
        SET
          raised_amount = COALESCE(raised_amount, 0) - OLD.amount_sats + NEW.amount_sats,
          updated_at = NOW()
        WHERE id = NEW.to_entity_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- Handle DELETE operations (transaction deletion)
  IF (TG_OP = 'DELETE') THEN
    -- If deleting a confirmed transaction to a project, reduce the amounts
    IF OLD.to_entity_type = 'project' AND OLD.status = 'confirmed' THEN
      UPDATE projects
      SET
        raised_amount = GREATEST(0, COALESCE(raised_amount, 0) - OLD.amount_sats),
        contributor_count = CASE
          WHEN OLD.from_entity_type = 'profile' THEN GREATEST(0, COALESCE(contributor_count, 0) - 1)
          ELSE COALESCE(contributor_count, 0)
        END,
        updated_at = NOW()
      WHERE id = OLD.to_entity_id;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
CREATE TRIGGER transaction_funding_sync
  AFTER INSERT OR UPDATE OF status, amount_sats OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_funding();

-- One-time backfill: Recalculate raised_amount and contributor_count for all projects
-- This ensures existing data is consistent before the trigger takes over
UPDATE projects p
SET
  raised_amount = COALESCE((
    SELECT SUM(amount_sats)
    FROM transactions
    WHERE to_entity_type = 'project'
      AND to_entity_id = p.id
      AND status = 'confirmed'
  ), 0),
  contributor_count = COALESCE((
    SELECT COUNT(DISTINCT from_entity_id)
    FROM transactions
    WHERE to_entity_type = 'project'
      AND to_entity_id = p.id
      AND status = 'confirmed'
      AND from_entity_type = 'profile'
  ), 0),
  updated_at = NOW();

-- Add helpful comment
COMMENT ON FUNCTION sync_project_funding() IS
  'Automatically maintains projects.raised_amount and contributor_count based on confirmed transactions. Handles INSERT, UPDATE (status changes), and DELETE operations atomically.';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Project funding sync trigger created and existing data backfilled';
END $$;
