-- Migration: Bitcoin Balance Tracking + Media Gallery (MVP)
-- Safe additive migration - idempotent and rerunnable
-- Date: 2025-11-04

BEGIN;

-- ============================================================================
-- STEP 1: Add new columns to projects table
-- ============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS bitcoin_balance_btc NUMERIC(20,8) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS bitcoin_balance_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Comments
COMMENT ON COLUMN public.projects.bitcoin_balance_btc IS 'Real-time BTC balance from blockchain (mempool.space)';
COMMENT ON COLUMN public.projects.bitcoin_balance_updated_at IS 'Last blockchain refresh timestamp';
COMMENT ON COLUMN public.projects.website_url IS 'Project website (HTTPS validated in app)';
COMMENT ON COLUMN public.projects.cover_image_url IS 'Cover image URL';

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON public.projects(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_bitcoin_address
  ON public.projects(bitcoin_address)
  WHERE bitcoin_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_balance_updated
  ON public.projects(bitcoin_balance_updated_at)
  WHERE bitcoin_balance_updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_status
  ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_projects_created_at
  ON public.projects(created_at DESC);

-- ============================================================================
-- STEP 3: Create project_media table (3-image gallery)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,  -- Only store path, derive URL at read-time
  position INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT unique_project_media_position UNIQUE(project_id, position),
  CONSTRAINT check_position_range CHECK (position BETWEEN 0 AND 2)
);

CREATE INDEX IF NOT EXISTS idx_project_media_project
  ON public.project_media(project_id, position);

COMMENT ON TABLE public.project_media IS 'Gallery images for projects (max 3)';
COMMENT ON COLUMN public.project_media.storage_path IS 'Storage path (derive public URL at read-time for flexibility)';

-- ============================================================================
-- STEP 4: Enable RLS on projects + Add policies (idempotent)
-- ============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_active" ON public.projects;
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;

CREATE POLICY "projects_select_active"
  ON public.projects FOR SELECT
  USING (status = 'active');

CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: RLS for project_media table (idempotent)
-- ============================================================================

ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select_public" ON public.project_media;
DROP POLICY IF EXISTS "media_insert_owner" ON public.project_media;
DROP POLICY IF EXISTS "media_update_owner" ON public.project_media;
DROP POLICY IF EXISTS "media_delete_owner" ON public.project_media;

CREATE POLICY "media_select_public"
  ON public.project_media FOR SELECT
  USING (true);

CREATE POLICY "media_insert_owner"
  ON public.project_media FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

CREATE POLICY "media_update_owner"
  ON public.project_media FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

CREATE POLICY "media_delete_owner"
  ON public.project_media FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

COMMIT;

-- Migration: Bitcoin Balance Tracking + Media Gallery (MVP)
-- Safe additive migration - idempotent and rerunnable
-- Date: 2025-11-04

BEGIN;

-- ============================================================================
-- STEP 1: Add new columns to projects table
-- ============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS bitcoin_balance_btc NUMERIC(20,8) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS bitcoin_balance_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Do NOT set a new default for currency (keep as-is). Validation in application layer.

-- Comments (best-effort; harmless if repeated)
DO $$ BEGIN
  EXECUTE 'COMMENT ON COLUMN public.projects.bitcoin_balance_btc IS ''Real-time BTC balance from blockchain (mempool.space)''';
  EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  EXECUTE 'COMMENT ON COLUMN public.projects.bitcoin_balance_updated_at IS ''Last blockchain refresh timestamp''';
  EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  EXECUTE 'COMMENT ON COLUMN public.projects.website_url IS ''Project website (HTTPS validated in app)''';
  EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  EXECUTE 'COMMENT ON COLUMN public.projects.cover_image_url IS ''Cover image URL''';
  EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON public.projects(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_bitcoin_address
  ON public.projects(bitcoin_address)
  WHERE bitcoin_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_balance_updated
  ON public.projects(bitcoin_balance_updated_at)
  WHERE bitcoin_balance_updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_status
  ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_projects_created_at
  ON public.projects(created_at DESC);

-- ============================================================================
-- STEP 3: Create project_media table (3-image gallery)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT unique_project_media_position UNIQUE(project_id, position),
  CONSTRAINT check_position_range CHECK (position BETWEEN 0 AND 2)
);

CREATE INDEX IF NOT EXISTS idx_project_media_project
  ON public.project_media(project_id, position);

DO $$ BEGIN
  EXECUTE 'COMMENT ON TABLE public.project_media IS ''Gallery images for projects (max 3)''';
  EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  EXECUTE 'COMMENT ON COLUMN public.project_media.storage_path IS ''Storage path (derive URL at read-time for flexibility)''';
  EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================================
-- STEP 4: Enable RLS on projects + Add policies (idempotent)
-- ============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "projects_select_active" ON public.projects;
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;

-- Public can view active projects
CREATE POLICY "projects_select_active"
  ON public.projects FOR SELECT
  USING (status = 'active');

-- Users can view their own projects (any status)
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: RLS for project_media table (idempotent)
-- ============================================================================

ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select_public" ON public.project_media;
DROP POLICY IF EXISTS "media_insert_owner" ON public.project_media;
DROP POLICY IF EXISTS "media_update_owner" ON public.project_media;
DROP POLICY IF EXISTS "media_delete_owner" ON public.project_media;

-- Anyone can view media (public read for MVP)
CREATE POLICY "media_select_public"
  ON public.project_media FOR SELECT
  USING (true);

-- Only project owner can insert media
CREATE POLICY "media_insert_owner"
  ON public.project_media FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

-- Only project owner can update media
CREATE POLICY "media_update_owner"
  ON public.project_media FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

-- Only project owner can delete media
CREATE POLICY "media_delete_owner"
  ON public.project_media FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

COMMIT;

-- Verification helpers (run separately)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('bitcoin_balance_btc','bitcoin_balance_updated_at','website_url','cover_image_url');
-- SELECT * FROM information_schema.tables WHERE table_name = 'project_media';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('projects','project_media');
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('projects','project_media');
