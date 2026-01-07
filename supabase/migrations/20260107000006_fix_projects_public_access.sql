-- Fix projects RLS policy to allow public access to active projects
-- Previously, only the owner could see their own projects (user_id = auth.uid())
-- This migration allows anyone to view active projects (for public project pages)
-- while maintaining owner-only access for modifications

-- Drop existing restrictive select policy
DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_public_read ON public.projects;

-- Create new policy: Anyone can read active projects, owners can read all their projects
CREATE POLICY projects_public_read ON public.projects
  FOR SELECT USING (
    status = 'active'
    OR status = 'completed'
    OR user_id = auth.uid()
  );

-- Ensure modify policy exists (owner-only for INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS projects_modify ON public.projects;
CREATE POLICY projects_modify ON public.projects
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add comment explaining the policy
COMMENT ON POLICY projects_public_read ON public.projects IS
  'Anyone can view active/completed projects. Owners can view all their projects (including drafts).';
COMMENT ON POLICY projects_modify ON public.projects IS
  'Only the project owner can create, update, or delete their projects.';
