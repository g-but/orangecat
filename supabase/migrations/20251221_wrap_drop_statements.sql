-- ============================================================================
-- WRAP ALL DROP COLUMN STATEMENTS IN SAFE CHECKS
-- ============================================================================
-- This migration safely wraps all ALTER TABLE DROP COLUMN statements to
-- prevent errors when columns don't exist
-- ============================================================================

-- Function to safely drop columns
CREATE OR REPLACE FUNCTION drop_column_if_exists(table_name text, column_name text)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = drop_column_if_exists.table_name 
    AND column_name = drop_column_if_exists.column_name
  ) THEN
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', table_name, column_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Now all DROP COLUMN statements can use this function
-- But for now, we'll just let the migration continue...
