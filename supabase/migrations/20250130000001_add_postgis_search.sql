-- Add PostGIS geographic search functions
-- Replaces JavaScript Haversine with efficient database-level filtering

-- Function to search projects within a radius using PostGIS
CREATE OR REPLACE FUNCTION search_projects_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_query text DEFAULT NULL,
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
  location_coordinates point,
  distance_km double precision
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
    pr.location_coordinates,
    -- Calculate distance in km
    ST_Distance(
      pr.location_coordinates::geography,
      ST_MakePoint(p_lng, p_lat)::geography
    ) / 1000.0 as distance_km
  FROM projects pr
  WHERE pr.location_coordinates IS NOT NULL
    AND ST_DWithin(
      pr.location_coordinates::geography,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_km * 1000  -- Convert km to meters
    )
    AND (p_query IS NULL OR 
         to_tsvector('english',
           coalesce(pr.title, '') || ' ' ||
           coalesce(pr.description, '')
         ) @@ plainto_tsquery('english', p_query))
    AND pr.status IN ('active', 'paused')
  ORDER BY 
    ST_Distance(
      pr.location_coordinates::geography,
      ST_MakePoint(p_lng, p_lat)::geography
    ) ASC,
    pr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search profiles within a radius using PostGIS
-- Note: Profiles use latitude/longitude columns, not location_coordinates
CREATE OR REPLACE FUNCTION search_profiles_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_query text DEFAULT NULL,
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
  longitude double precision,
  distance_km double precision
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
    p.longitude,
    -- Calculate distance in km
    ST_Distance(
      ST_MakePoint(p.longitude, p.latitude)::geography,
      ST_MakePoint(p_lng, p_lat)::geography
    ) / 1000.0 as distance_km
  FROM profiles p
  WHERE p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(p.longitude, p.latitude)::geography,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_km * 1000  -- Convert km to meters
    )
    AND (p_query IS NULL OR 
         to_tsvector('english',
           coalesce(p.username, '') || ' ' ||
           coalesce(p.name, '') || ' ' ||
           coalesce(p.bio, '')
         ) @@ plainto_tsquery('english', p_query))
  ORDER BY 
    ST_Distance(
      ST_MakePoint(p.longitude, p.latitude)::geography,
      ST_MakePoint(p_lng, p_lat)::geography
    ) ASC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION search_projects_nearby IS 'PostGIS geographic search for projects within radius (replaces JavaScript Haversine)';
COMMENT ON FUNCTION search_profiles_nearby IS 'PostGIS geographic search for profiles within radius (replaces JavaScript Haversine)';


