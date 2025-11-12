-- =====================================================================
-- DATA MIGRATION: Move existing data to unified projects table
-- Date: 2025-01-30
-- Purpose: Safely migrate campaigns, funding_pages to projects
-- =====================================================================

-- =====================================================================
-- PHASE 1: MIGRATE FROM CAMPAIGNS TABLE
-- =====================================================================

INSERT INTO projects (
  id,
  user_id,
  title,
  description,
  goal_amount,
  raised_amount,
  bitcoin_address,
  status,
  created_at,
  updated_at,
  project_type,
  privacy_level,
  category_id,
  currency
)
SELECT
  c.id,
  c.user_id,
  c.title,
  c.description,
  c.goal_amount,
  COALESCE(c.raised_amount, 0),
  c.bitcoin_address,
  c.status,
  c.created_at,
  c.updated_at,
  'campaign' as project_type,
  'public' as privacy_level,
  'fundraising' as category_id,
  'BTC' as currency
FROM campaigns c
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.id = c.id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- PHASE 2: MIGRATE FROM FUNDING_PAGES TABLE (if exists)
-- =====================================================================

INSERT INTO projects (
  id,
  user_id,
  title,
  description,
  goal_amount,
  raised_amount,
  bitcoin_address,
  lightning_address,
  website_url,
  status,
  created_at,
  updated_at,
  project_type,
  privacy_level,
  category_id,
  currency,
  tags
)
SELECT
  fp.id,
  fp.user_id,
  fp.title,
  fp.description,
  fp.goal_amount,
  COALESCE(fp.raised_amount, 0),
  fp.bitcoin_address,
  fp.lightning_address,
  fp.website_url,
  fp.status,
  fp.created_at,
  fp.updated_at,
  'campaign' as project_type,
  'public' as privacy_level,
  -- Try to use first category from array, or default to fundraising
  COALESCE(
    CASE
      WHEN array_length(fp.categories, 1) > 0 AND fp.categories[1] IN (
        SELECT id FROM project_categories
      )
      THEN fp.categories[1]
      ELSE 'fundraising'
    END,
    'fundraising'
  ) as category_id,
  COALESCE(fp.currency, 'BTC') as currency,
  COALESCE(fp.categories, '{}') as tags
FROM funding_pages fp
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.id = fp.id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- PHASE 3: UPDATE TRANSACTIONS TO REFERENCE PROJECTS
-- =====================================================================

-- Add project_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update transactions to point to projects instead of funding_pages
UPDATE transactions t
SET project_id = t.funding_page_id
WHERE t.funding_page_id IS NOT NULL
  AND t.project_id IS NULL
  AND EXISTS (SELECT 1 FROM projects p WHERE p.id = t.funding_page_id);

-- Create index on project_id
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);

-- =====================================================================
-- PHASE 4: CALCULATE CONTRIBUTOR COUNTS
-- =====================================================================

-- Update contributor counts from transactions
UPDATE projects p
SET contributor_count = (
  SELECT COUNT(DISTINCT t.user_id)
  FROM transactions t
  WHERE t.project_id = p.id
    AND t.status = 'completed'
)
WHERE EXISTS (
  SELECT 1 FROM transactions t WHERE t.project_id = p.id
);

-- =====================================================================
-- PHASE 5: VERIFICATION & CLEANUP
-- =====================================================================

-- Verify migration counts
DO $$
DECLARE
  campaigns_count INTEGER;
  funding_pages_count INTEGER;
  projects_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO campaigns_count FROM campaigns;

  SELECT COUNT(*) INTO funding_pages_count FROM funding_pages;

  SELECT COUNT(*) INTO projects_count FROM projects;

  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Campaigns: % rows', campaigns_count;
  RAISE NOTICE '  Funding Pages: % rows', funding_pages_count;
  RAISE NOTICE '  Projects: % rows', projects_count;

  IF projects_count < campaigns_count THEN
    RAISE WARNING 'Some campaigns may not have been migrated!';
  END IF;
END $$;

-- =====================================================================
-- PHASE 6: MARK OLD TABLES AS DEPRECATED (Don't drop yet!)
-- =====================================================================

-- Add deprecation notice to old tables
COMMENT ON TABLE campaigns IS 'DEPRECATED: Migrated to projects table. Will be removed in future version.';
COMMENT ON TABLE funding_pages IS 'DEPRECATED: Migrated to projects table. Will be removed in future version.';

-- =====================================================================
-- NOTES FOR FUTURE CLEANUP
-- =====================================================================

-- After verifying everything works in production for a few weeks:
-- 1. Run: DROP TABLE campaigns CASCADE;
-- 2. Run: DROP TABLE funding_pages CASCADE;
-- 3. Remove funding_page_id from transactions table
-- 4. Update all application code to use projects table
