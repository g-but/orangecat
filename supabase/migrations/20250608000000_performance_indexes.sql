-- PERFORMANCE OPTIMIZATION: Database Indexes for OrangeCat
-- Created: 2025-06-08
-- Purpose: Optimize search and query performance based on service testing results

-- ==================== SEARCH PERFORMANCE INDEXES ====================

-- 1. PROFILES TABLE SEARCH OPTIMIZATION
-- Index for username searches (most common search pattern)
CREATE INDEX IF NOT EXISTS idx_profiles_username_search 
ON public.profiles USING gin (username gin_trgm_ops)
WHERE username IS NOT NULL;

-- Index for display_name searches
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_search 
ON public.profiles USING gin (display_name gin_trgm_ops)
WHERE display_name IS NOT NULL;

-- Index for bio text searches
CREATE INDEX IF NOT EXISTS idx_profiles_bio_search 
ON public.profiles USING gin (bio gin_trgm_ops)
WHERE bio IS NOT NULL;

-- Composite index for profile listing with creation date (most common query)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc 
ON public.profiles (created_at DESC)
WHERE username IS NOT NULL;

-- Index for profiles with avatars (complete profiles get priority)
CREATE INDEX IF NOT EXISTS idx_profiles_with_avatar 
ON public.profiles (created_at DESC)
WHERE avatar_url IS NOT NULL;

-- ==================== FUNDING PAGES SEARCH OPTIMIZATION ====================

-- 2. FUNDING PAGES TABLE SEARCH OPTIMIZATION
-- Composite index for public active campaigns (most selective filters first)
CREATE INDEX IF NOT EXISTS idx_funding_pages_public_active 
ON public.funding_pages (is_public, is_active, created_at DESC)
WHERE is_public = true AND is_active = true;

-- Index for title searches with GIN trigram
CREATE INDEX IF NOT EXISTS idx_funding_pages_title_search 
ON public.funding_pages USING gin (title gin_trgm_ops)
WHERE is_public = true;

-- Index for description searches
CREATE INDEX IF NOT EXISTS idx_funding_pages_description_search 
ON public.funding_pages USING gin (description gin_trgm_ops)
WHERE is_public = true AND description IS NOT NULL;

-- Index for category filtering and searches
CREATE INDEX IF NOT EXISTS idx_funding_pages_category 
ON public.funding_pages (category, created_at DESC)
WHERE is_public = true AND category IS NOT NULL;

-- Index for funding-based sorting (popular campaigns)
CREATE INDEX IF NOT EXISTS idx_funding_pages_by_funding 
ON public.funding_pages (total_funding DESC, created_at DESC)
WHERE is_public = true AND is_active = true;

-- Index for contributor-based sorting (trending campaigns)
CREATE INDEX IF NOT EXISTS idx_funding_pages_by_contributors 
ON public.funding_pages (contributor_count DESC, created_at DESC)
WHERE is_public = true AND is_active = true;

-- Index for goal amount filtering
CREATE INDEX IF NOT EXISTS idx_funding_pages_goal_amount 
ON public.funding_pages (goal_amount, created_at DESC)
WHERE is_public = true AND goal_amount IS NOT NULL;

-- Index for funding range queries
CREATE INDEX IF NOT EXISTS idx_funding_pages_funding_range 
ON public.funding_pages (total_funding, created_at DESC)
WHERE is_public = true;

-- ==================== FEATURED CONTENT OPTIMIZATION ====================

-- 3. FEATURED CAMPAIGNS TABLE OPTIMIZATION
-- Index for featured content by type and priority
CREATE INDEX IF NOT EXISTS idx_featured_campaigns_type_priority 
ON public.featured_campaigns (featured_type, featured_priority, created_at DESC)
WHERE featured_until IS NULL OR featured_until > NOW();

-- Index for active featured campaigns
CREATE INDEX IF NOT EXISTS idx_featured_campaigns_active 
ON public.featured_campaigns (created_at DESC)
WHERE featured_until IS NULL OR featured_until > NOW();

-- Index for campaign ID lookups in featured table
CREATE INDEX IF NOT EXISTS idx_featured_campaigns_campaign_id 
ON public.featured_campaigns (campaign_id, featured_type);

-- ==================== AUTHENTICATION & PROFILES OPTIMIZATION ====================

-- 4. AUTH-RELATED PERFORMANCE INDEXES
-- Index for user profile lookups (auth.uid() = profiles.id)
CREATE INDEX IF NOT EXISTS idx_profiles_auth_lookup 
ON public.profiles (id)
WHERE username IS NOT NULL;

-- Index for username uniqueness checks (faster constraint validation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique_lower 
ON public.profiles (LOWER(username))
WHERE username IS NOT NULL;

-- ==================== ANALYTICS & TRENDING OPTIMIZATION ====================

-- 5. ANALYTICS PERFORMANCE INDEXES
-- Index for recent activity tracking
CREATE INDEX IF NOT EXISTS idx_funding_pages_recent_activity 
ON public.funding_pages (updated_at DESC, is_active)
WHERE is_public = true;

-- Index for campaign success metrics (funding percentage calculation)
CREATE INDEX IF NOT EXISTS idx_funding_pages_success_metrics 
ON public.funding_pages (
  CASE 
    WHEN goal_amount > 0 
    THEN (total_funding::float / goal_amount::float) 
    ELSE 0 
  END DESC,
  created_at DESC
)
WHERE is_public = true AND is_active = true AND goal_amount > 0;

-- ==================== ENABLE EXTENSIONS FOR SEARCH ====================

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable btree_gin for composite GIN indexes (if not already enabled)
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ==================== FULL-TEXT SEARCH OPTIMIZATION ====================

-- 6. FULL-TEXT SEARCH IMPLEMENTATION
-- Add tsvector columns for better full-text search performance
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(display_name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(bio, '')), 'C')
) STORED;

ALTER TABLE public.funding_pages 
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C')
) STORED;

-- Create GIN indexes on tsvector columns for fast full-text search
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector 
ON public.profiles USING gin (search_vector);

CREATE INDEX IF NOT EXISTS idx_funding_pages_search_vector 
ON public.funding_pages USING gin (search_vector)
WHERE is_public = true;

-- ==================== MAINTENANCE & MONITORING ====================

-- 7. INDEX MAINTENANCE FUNCTIONS
-- Function to monitor index usage and performance
CREATE OR REPLACE FUNCTION public.get_index_usage_stats()
RETURNS TABLE (
  schemaname text,
  tablename text,
  indexname text,
  idx_tup_read bigint,
  idx_tup_fetch bigint,
  idx_scan bigint
) 
LANGUAGE SQL 
AS $$
  SELECT 
    schemaname::text,
    tablename::text,
    indexname::text,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
$$;

-- Function to get table and index sizes
CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE (
  table_name text,
  table_size text,
  index_size text,
  total_size text
)
LANGUAGE SQL
AS $$
  SELECT 
    tablename::text,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
$$;

-- ==================== QUERY OPTIMIZATION HINTS ====================

-- Comments for developers on optimal query patterns:

/*
OPTIMAL SEARCH PATTERNS:

1. Profile Search:
   - Use search_vector for full-text: WHERE search_vector @@ plainto_tsquery('english', 'query')
   - Use trigram for fuzzy: WHERE username % 'query'
   - Always include WHERE username IS NOT NULL for index usage

2. Campaign Search:
   - Always filter by is_public = true first (most selective)
   - Use is_active = true for better performance
   - Use search_vector for full-text search
   - Order by created_at DESC for index optimization

3. Featured Content:
   - Filter by featured_until IS NULL OR featured_until > NOW()
   - Order by featured_priority, created_at DESC
   - Use specific featured_type for better selectivity

4. Trending Queries:
   - Use contributor_count DESC for popular content
   - Use total_funding DESC for well-funded content
   - Always include is_public = true AND is_active = true

5. Cache Strategy:
   - Cache search results for 5 minutes
   - Cache facets for 10 minutes
   - Use ETags for conditional requests
   - Implement pagination cursors for large result sets
*/

-- Performance monitoring query for developers
-- Run this to check search performance:
/*
SELECT 
  calls,
  total_time,
  mean_time,
  query
FROM pg_stat_statements 
WHERE query ILIKE '%profiles%' OR query ILIKE '%funding_pages%'
ORDER BY mean_time DESC
LIMIT 10;
*/ 