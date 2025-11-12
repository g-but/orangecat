-- =====================================================================
-- UNIFIED PROJECTS TABLE WITH PRIVACY & AI-READY SCHEMA
-- Date: 2025-01-30
-- Purpose: Create scalable, future-proof database for AI/LLM integration
-- =====================================================================

-- =====================================================================
-- PHASE 1: CREATE CATEGORY SYSTEM
-- =====================================================================

-- Project categories table (flat structure, not hierarchical)
CREATE TABLE IF NOT EXISTS project_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Emoji or icon identifier
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- For future extensibility
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO project_categories (id, name, description, icon, display_order) VALUES
  ('fundraising', 'Fundraising', 'General fundraising campaigns', '💰', 1),
  ('infrastructure', 'Infrastructure', 'Physical and digital infrastructure', '🏗️', 2),
  ('events', 'Events', 'Conferences, meetups, community events', '📅', 3),
  ('education', 'Education', 'Learning resources and educational initiatives', '📚', 4),
  ('development', 'Development', 'Software and product development', '💻', 5),
  ('research', 'Research', 'Research and innovation projects', '🔬', 6),
  ('community', 'Community', 'Community building and engagement', '🤝', 7),
  ('art', 'Art & Culture', 'Creative and cultural projects', '🎨', 8),
  ('health', 'Health', 'Health and wellness initiatives', '🏥', 9),
  ('environment', 'Environment', 'Environmental sustainability projects', '🌍', 10),
  ('emergency', 'Emergency', 'Urgent assistance and disaster relief', '🚨', 11),
  ('open-source', 'Open Source', 'Open source software and tools', '🔓', 12)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- PHASE 2: CREATE UNIFIED PROJECTS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS projects (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE, -- For SEO-friendly URLs, generated from title
  description TEXT,
  short_description TEXT, -- For cards/previews

  -- Media
  cover_image_url TEXT,
  banner_url TEXT,
  media_urls TEXT[] DEFAULT '{}', -- Additional images/videos

  -- Categories & Classification
  category_id TEXT NOT NULL REFERENCES project_categories(id) DEFAULT 'fundraising',
  tags TEXT[] DEFAULT '{}', -- User-defined tags for filtering

  project_type TEXT NOT NULL DEFAULT 'campaign' CHECK (project_type IN (
    'campaign',      -- Standard fundraising
    'event',         -- Time-bound event
    'grant',         -- Grant application
    'bounty',        -- Task/bug bounty
    'scholarship'    -- Educational funding
  )),

  -- Funding
  goal_amount NUMERIC(20,8),
  raised_amount NUMERIC(20,8) DEFAULT 0,
  contributor_count INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'BTC' CHECK (currency IN ('BTC', 'sats', 'CHF', 'USD', 'EUR')),

  -- Payment Addresses
  bitcoin_address TEXT,
  lightning_address TEXT,
  website_url TEXT,

  -- Event/Deadline Support
  event_date TIMESTAMPTZ, -- When does the event happen?
  event_end_date TIMESTAMPTZ, -- Multi-day events
  deadline TIMESTAMPTZ, -- Funding deadline
  timezone TEXT, -- Event timezone (e.g., 'America/New_York')

  -- Privacy Settings
  privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN (
    'public',       -- Anyone can see
    'semi_private', -- Only logged-in users
    'private'       -- Only owner/collaborators
  )),

  -- Field-level privacy (JSONB for flexibility)
  -- Example: {"funding_amount": "private", "contributors": "semi_private"}
  field_visibility JSONB DEFAULT '{}'::jsonb,

  is_searchable BOOLEAN DEFAULT true,
  show_on_discover BOOLEAN DEFAULT true,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',      -- Being created
    'active',     -- Published and accepting contributions
    'paused',     -- Temporarily stopped
    'completed',  -- Goal reached or event finished
    'cancelled',  -- Cancelled by owner
    'expired'     -- Deadline passed
  )),

  -- Location (for events and physical projects)
  location_city TEXT,
  location_country TEXT,
  location_coordinates POINT, -- PostGIS point for map queries

  -- AI/LLM Ready Fields
  -- Structured metadata for AI processing
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Vector embedding for semantic search (future)
  -- embedding VECTOR(1536), -- For OpenAI embeddings

  -- External integrations
  external_links JSONB DEFAULT '{}'::jsonb, -- GitHub, Twitter, etc.

  -- Project-specific settings
  settings JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ, -- When it went live
  completed_at TIMESTAMPTZ, -- When goal reached
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- =====================================================================
-- PHASE 3: ENHANCE PROFILES WITH GRANULAR PRIVACY
-- =====================================================================

-- Add privacy columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'public'
  CHECK (privacy_level IN ('public', 'semi_private', 'private'));

-- Field-level visibility for profiles
-- Example: {"email": "private", "bitcoin_address": "semi_private", "bio": "public"}
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field_visibility JSONB DEFAULT '{}'::jsonb;

-- Search preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_searchable BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_on_discover BOOLEAN DEFAULT true;

-- AI/LLM ready fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- =====================================================================
-- PHASE 4: PERFORMANCE INDEXES
-- =====================================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_privacy ON projects(privacy_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE status IN ('active', 'draft') AND deleted_at IS NULL;

-- Composite index for discover page (status + created_at + privacy)
CREATE INDEX IF NOT EXISTS idx_projects_discover ON projects(status, privacy_level, created_at DESC)
  WHERE status = 'active' AND deleted_at IS NULL;

-- GIN indexes for array fields (fast containment queries)
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_media ON projects USING GIN(media_urls) WHERE deleted_at IS NULL;

-- JSONB indexes for metadata queries (AI/LLM use cases)
CREATE INDEX IF NOT EXISTS idx_projects_metadata ON projects USING GIN(metadata) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_field_visibility ON projects USING GIN(field_visibility);

-- Event-specific indexes
CREATE INDEX IF NOT EXISTS idx_projects_events ON projects(event_date)
  WHERE project_type = 'event' AND event_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline)
  WHERE deadline IS NOT NULL AND status = 'active' AND deleted_at IS NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING GIN(
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(short_description, '')
  )
) WHERE deleted_at IS NULL;

-- Geospatial index (for location-based queries)
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects USING GIST(location_coordinates)
  WHERE location_coordinates IS NOT NULL AND deleted_at IS NULL;

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_privacy ON profiles(privacy_level);
CREATE INDEX IF NOT EXISTS idx_profiles_searchable ON profiles(is_searchable) WHERE is_searchable = true;
CREATE INDEX IF NOT EXISTS idx_profiles_metadata ON profiles USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_profiles_field_visibility ON profiles USING GIN(field_visibility);

-- Full-text search for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(username, '') || ' ' ||
    COALESCE(bio, '')
  )
);

-- =====================================================================
-- PHASE 5: PRIVACY-AWARE RLS POLICIES
-- =====================================================================

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "projects_select_public" ON projects;
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON projects;

-- New privacy-aware SELECT policy
CREATE POLICY "projects_select_by_privacy" ON projects FOR SELECT USING (
  deleted_at IS NULL AND
  CASE privacy_level
    WHEN 'public' THEN true
    WHEN 'semi_private' THEN auth.uid() IS NOT NULL
    WHEN 'private' THEN auth.uid() = user_id
    ELSE false
  END
);

-- INSERT policy
CREATE POLICY "projects_insert_own" ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "projects_update_own" ON projects FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- DELETE policy (soft delete)
CREATE POLICY "projects_delete_own" ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Update profile RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;

CREATE POLICY "profiles_select_by_privacy" ON profiles FOR SELECT USING (
  CASE privacy_level
    WHEN 'public' THEN true
    WHEN 'semi_private' THEN auth.uid() IS NOT NULL
    WHEN 'private' THEN auth.uid() = id
    ELSE false
  END
);

-- =====================================================================
-- PHASE 6: HELPER FUNCTIONS
-- =====================================================================

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT, project_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert title to slug format
  base_slug := lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  base_slug := substring(base_slug, 1, 50); -- Limit length

  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM projects WHERE slug = final_slug AND id != project_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to check field visibility
CREATE OR REPLACE FUNCTION can_view_field(
  privacy_level TEXT,
  field_visibility JSONB,
  field_name TEXT,
  owner_id UUID,
  viewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  field_privacy TEXT;
BEGIN
  -- Get field-specific privacy, or default to profile privacy
  field_privacy := COALESCE(
    field_visibility->>field_name,
    privacy_level
  );

  RETURN CASE field_privacy
    WHEN 'public' THEN true
    WHEN 'semi_private' THEN viewer_id IS NOT NULL
    WHEN 'private' THEN viewer_id = owner_id
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

-- Function to auto-expire events
CREATE OR REPLACE FUNCTION expire_past_events()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE projects
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    project_type = 'event'
    AND event_date < NOW()
    AND status = 'active'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION projects_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON projects
  FOR EACH ROW
  EXECUTE FUNCTION projects_generate_slug();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================================
-- PHASE 7: PRIVACY-AWARE SEARCH FUNCTION
-- =====================================================================

CREATE OR REPLACE FUNCTION search_projects(
  search_query TEXT DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  filter_status TEXT DEFAULT 'active',
  filter_type TEXT DEFAULT NULL,
  requesting_user_id UUID DEFAULT auth.uid(),
  page_size INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  title TEXT,
  short_description TEXT,
  category_id TEXT,
  category_name TEXT,
  privacy_level TEXT,
  status TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.short_description,
    p.category_id,
    pc.name as category_name,
    p.privacy_level,
    p.status,
    p.cover_image_url,
    p.created_at,
    CASE
      WHEN search_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', p.title || ' ' || COALESCE(p.description, '')),
          plainto_tsquery('english', search_query)
        )
      ELSE 0
    END as rank
  FROM projects p
  JOIN project_categories pc ON p.category_id = pc.id
  WHERE
    -- Soft delete check
    p.deleted_at IS NULL
    -- Privacy check
    AND (
      (p.privacy_level = 'public') OR
      (p.privacy_level = 'semi_private' AND requesting_user_id IS NOT NULL) OR
      (p.privacy_level = 'private' AND p.user_id = requesting_user_id)
    )
    -- Searchable check
    AND (p.is_searchable = true OR p.user_id = requesting_user_id)
    -- Status filter
    AND (filter_status IS NULL OR p.status = filter_status)
    -- Category filter
    AND (filter_category IS NULL OR p.category_id = filter_category)
    -- Type filter
    AND (filter_type IS NULL OR p.project_type = filter_type)
    -- Search query
    AND (
      search_query IS NULL OR
      to_tsvector('english', p.title || ' ' || COALESCE(p.description, ''))
      @@ plainto_tsquery('english', search_query)
    )
  ORDER BY
    CASE WHEN search_query IS NOT NULL THEN rank ELSE 0 END DESC,
    p.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- PHASE 8: ANALYTICS VIEWS (AI/LLM READY)
-- =====================================================================

-- View for project analytics
CREATE OR REPLACE VIEW project_analytics AS
SELECT
  p.id,
  p.user_id,
  p.category_id,
  p.privacy_level,
  p.status,
  p.raised_amount,
  p.goal_amount,
  CASE
    WHEN p.goal_amount > 0 THEN (p.raised_amount / p.goal_amount * 100)
    ELSE 0
  END as funding_percentage,
  p.contributor_count,
  EXTRACT(DAY FROM NOW() - p.created_at) as days_active,
  EXTRACT(DAY FROM p.deadline - NOW()) as days_remaining,
  p.metadata
FROM projects p
WHERE p.deleted_at IS NULL AND p.status = 'active';

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Check projects table
-- SELECT COUNT(*) as project_count, status, privacy_level
-- FROM projects GROUP BY status, privacy_level;

-- Check categories
-- SELECT * FROM project_categories ORDER BY display_order;

-- Test search function
-- SELECT * FROM search_projects('bitcoin', NULL, 'active');

-- Test field visibility
-- SELECT can_view_field('public', '{"email": "private"}'::jsonb, 'email',
--   'user-uuid'::uuid, 'viewer-uuid'::uuid);
