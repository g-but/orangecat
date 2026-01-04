-- Add full-text search indexes for profiles and projects
-- These indexes enable fast text search using PostgreSQL's tsvector

-- Full-text search index for profiles
-- Searches across username, name, and bio
CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON profiles USING gin(
  to_tsvector('english',
    coalesce(username, '') || ' ' ||
    coalesce(name, '') || ' ' ||
    coalesce(bio, '')
  )
);

-- Full-text search index for projects
-- Searches across title and description
CREATE INDEX IF NOT EXISTS idx_projects_search 
ON projects USING gin(
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(description, '')
  )
);

-- Add comments for documentation
COMMENT ON INDEX idx_profiles_search IS 'Full-text search index for profiles (username, name, bio)';
COMMENT ON INDEX idx_projects_search IS 'Full-text search index for projects (title, description)';

-- =============================================================================
-- RPC Functions for Full-Text Search
-- =============================================================================

-- Function to search profiles using full-text search
CREATE OR REPLACE FUNCTION search_profiles_fts(
  p_query text,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  username text,
  name text,
  bio text,
  avatar_url text,
  created_at timestamptz,
  location_country text,
  location_city text,
  location_zip text,
  latitude double precision,
  longitude double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.name,
    p.bio,
    p.avatar_url,
    p.created_at,
    p.location_country,
    p.location_city,
    p.location_zip,
    p.latitude,
    p.longitude
  FROM profiles p
  WHERE to_tsvector('english',
    coalesce(p.username, '') || ' ' ||
    coalesce(p.name, '') || ' ' ||
    coalesce(p.bio, '')
  ) @@ plainto_tsquery('english', p_query)
  ORDER BY 
    ts_rank(
      to_tsvector('english',
        coalesce(p.username, '') || ' ' ||
        coalesce(p.name, '') || ' ' ||
        coalesce(p.bio, '')
      ),
      plainto_tsquery('english', p_query)
    ) DESC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search projects using full-text search
CREATE OR REPLACE FUNCTION search_projects_fts(
  p_query text,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  bitcoin_address text,
  created_at timestamptz,
  updated_at timestamptz,
  category text,
  status text,
  goal_amount numeric,
  currency text,
  raised_amount numeric,
  cover_image_url text,
  location_city text,
  location_country text,
  location_coordinates point
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.user_id,
    pr.title,
    pr.description,
    pr.bitcoin_address,
    pr.created_at,
    pr.updated_at,
    pr.category,
    pr.status,
    pr.goal_amount,
    pr.currency,
    pr.raised_amount,
    pr.cover_image_url,
    pr.location_city,
    pr.location_country,
    pr.location_coordinates
  FROM projects pr
  WHERE to_tsvector('english',
    coalesce(pr.title, '') || ' ' ||
    coalesce(pr.description, '')
  ) @@ plainto_tsquery('english', p_query)
  ORDER BY 
    ts_rank(
      to_tsvector('english',
        coalesce(pr.title, '') || ' ' ||
        coalesce(pr.description, '')
      ),
      plainto_tsquery('english', p_query)
    ) DESC,
    pr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION search_profiles_fts IS 'Full-text search for profiles using tsvector indexes';
COMMENT ON FUNCTION search_projects_fts IS 'Full-text search for projects using tsvector indexes';

