-- Migration: Add Performance Indexes
-- Description: Add indexes for common query patterns to improve performance
-- Created: 2025-02-01

-- ============================================================================
-- PROJECTS TABLE INDEXES
-- ============================================================================

-- Full-text search on project title and description
-- Used in: /api/projects search, discovery page
CREATE INDEX IF NOT EXISTS idx_projects_search
ON projects USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Project status filtering (active projects, drafts, etc.)
-- Used in: Dashboard, public project listings
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects(status)
WHERE status IS NOT NULL;

-- User's projects lookup
-- Used in: /dashboard/projects, user profile
CREATE INDEX IF NOT EXISTS idx_projects_user_id
ON projects(user_id);

-- Project category filtering
-- Used in: Discovery, category pages
CREATE INDEX IF NOT EXISTS idx_projects_category
ON projects(category)
WHERE category IS NOT NULL;

-- Recently created/updated projects
-- Used in: Homepage, discover feed
CREATE INDEX IF NOT EXISTS idx_projects_created_at
ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at
ON projects(updated_at DESC);

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Full-text search on profile location
-- Used in: Location-based discovery, search
CREATE INDEX IF NOT EXISTS idx_profiles_location_search
ON profiles USING gin(
  to_tsvector('english', coalesce(location_search, ''))
) WHERE location_search IS NOT NULL;

-- Profile display name search
-- Used in: User search, mentions
CREATE INDEX IF NOT EXISTS idx_profiles_display_name
ON profiles(display_name)
WHERE display_name IS NOT NULL;

-- Profile username lookup (if you add username field)
-- Partial index for unique constraint
CREATE INDEX IF NOT EXISTS idx_profiles_username
ON profiles(lower(username))
WHERE username IS NOT NULL;

-- Location-based queries
-- Used in: Geographic discovery
CREATE INDEX IF NOT EXISTS idx_profiles_location_coords
ON profiles(location_latitude, location_longitude)
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- ============================================================================
-- WALLETS TABLE INDEXES
-- ============================================================================

-- Wallet lookups by profile_id
-- Used in: /api/wallets?profile_id=xxx, profile pages
CREATE INDEX IF NOT EXISTS idx_wallets_profile_id
ON wallets(profile_id, display_order, created_at DESC)
WHERE profile_id IS NOT NULL AND is_active = true;

-- Wallet lookups by project_id
-- Used in: /api/wallets?project_id=xxx, project pages
CREATE INDEX IF NOT EXISTS idx_wallets_project_id
ON wallets(project_id, display_order, created_at DESC)
WHERE project_id IS NOT NULL AND is_active = true;

-- Primary wallet lookup (fast access to main donation address)
-- Used in: Project donation pages, profile cards
CREATE INDEX IF NOT EXISTS idx_wallets_primary
ON wallets(profile_id, project_id)
WHERE is_primary = true AND is_active = true;

-- User's all wallets (for wallet management dashboard)
-- Used in: /dashboard/wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id
ON wallets(user_id, created_at DESC)
WHERE is_active = true;

-- Wallet address lookup (for duplicate detection)
-- Used in: Wallet creation validation
CREATE INDEX IF NOT EXISTS idx_wallets_address
ON wallets(address_or_xpub)
WHERE is_active = true;

-- ============================================================================
-- SOCIAL/TIMELINE INDEXES (if tables exist)
-- ============================================================================

-- Following relationships
-- Used in: Social graph queries, feed generation
CREATE INDEX IF NOT EXISTS idx_follows_follower_id
ON follows(follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_following_id
ON follows(following_id, created_at DESC);

-- Timeline posts by user
-- Used in: User timelines, profile pages
CREATE INDEX IF NOT EXISTS idx_posts_user_id
ON posts(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Timeline posts visibility
-- Used in: Public timeline, feed generation
CREATE INDEX IF NOT EXISTS idx_posts_visibility
ON posts(visibility, created_at DESC)
WHERE deleted_at IS NULL;

-- Project-related posts
-- Used in: Project activity feeds
CREATE INDEX IF NOT EXISTS idx_posts_project_id
ON posts(project_id, created_at DESC)
WHERE project_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- COMMENTS/INTERACTIONS INDEXES (if tables exist)
-- ============================================================================

-- Comments by post
-- Used in: Post detail pages
CREATE INDEX IF NOT EXISTS idx_comments_post_id
ON comments(post_id, created_at ASC)
WHERE deleted_at IS NULL;

-- Comments by user
-- Used in: User activity pages
CREATE INDEX IF NOT EXISTS idx_comments_user_id
ON comments(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- ============================================================================
-- NOTIFICATIONS INDEXES (if table exists)
-- ============================================================================

-- Unread notifications
-- Used in: Notification bell, notification page
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
ON notifications(recipient_id, read_at, created_at DESC);

-- ============================================================================
-- AUDIT LOG INDEXES (for future use)
-- ============================================================================

-- Audit log by user
-- Used in: Security audit, user activity tracking
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
ON audit_log(user_id, created_at DESC);

-- Audit log by resource
-- Used in: Resource history, compliance
CREATE INDEX IF NOT EXISTS idx_audit_log_resource
ON audit_log(resource_type, resource_id, created_at DESC);

-- ============================================================================
-- NOTES
-- ============================================================================

-- Performance Impact:
-- - Full-text search indexes (GIN): ~2-5% storage overhead, 10-100x query speedup
-- - B-tree indexes: ~10-20% storage overhead, 10-1000x query speedup
-- - Partial indexes (WHERE clause): Smaller size, faster for filtered queries

-- Maintenance:
-- - Indexes are automatically updated on INSERT/UPDATE/DELETE
-- - VACUUM and ANALYZE run automatically via autovacuum
-- - Monitor index usage with: SELECT * FROM pg_stat_user_indexes;

-- Future Optimization:
-- - Add covering indexes if specific queries need all columns
-- - Consider partitioning for very large tables (posts, audit_log)
-- - Use pg_stat_statements to identify slow queries
