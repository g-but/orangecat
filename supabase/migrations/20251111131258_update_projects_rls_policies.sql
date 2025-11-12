-- Migration: Update RLS policies to allow viewing paused/completed/cancelled projects
-- Public can view paused/completed/cancelled projects via direct link (for transparency)
-- But search/listing only shows active projects
-- Date: 2025-11-11

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "projects_select_active" ON public.projects;
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;

-- Policy: Public can view active projects (for search/listing)
CREATE POLICY "projects_select_active"
  ON public.projects FOR SELECT
  USING (status = 'active');

-- Policy: Public can view paused/completed/cancelled projects (for transparency via direct link)
CREATE POLICY "projects_select_published"
  ON public.projects FOR SELECT
  USING (status IN ('paused', 'completed', 'cancelled'));

-- Policy: Authors can view all their own projects (any status)
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "projects_select_active" ON public.projects IS 
  'Public can view active projects (for search results and listings)';

COMMENT ON POLICY "projects_select_published" ON public.projects IS 
  'Public can view paused/completed/cancelled projects via direct link (for transparency)';

COMMENT ON POLICY "projects_select_own" ON public.projects IS 
  'Authors can view all their own projects regardless of status';

COMMIT;





