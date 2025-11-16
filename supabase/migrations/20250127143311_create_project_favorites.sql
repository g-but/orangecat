-- Migration: Create project_favorites table for user favorites functionality
-- Date: 2025-01-27

BEGIN;

-- Create project_favorites table
CREATE TABLE IF NOT EXISTS public.project_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_favorites_user_id ON public.project_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_project_favorites_project_id ON public.project_favorites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_favorites_created_at ON public.project_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE public.project_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own favorites
CREATE POLICY "project_favorites_select_own"
  ON public.project_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own favorites
CREATE POLICY "project_favorites_insert_own"
  ON public.project_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own favorites
CREATE POLICY "project_favorites_delete_own"
  ON public.project_favorites FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.project_favorites IS 'User favorites/bookmarks for projects';
COMMENT ON COLUMN public.project_favorites.user_id IS 'User who favorited the project';
COMMENT ON COLUMN public.project_favorites.project_id IS 'Project that was favorited';

COMMIT;










