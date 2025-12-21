-- =====================================================================
-- BEST PRACTICE INDEXES FOR ORANGECAT DATABASE
-- =====================================================================
-- Idempotent CREATE INDEX statements for optimal query performance
-- Safe to run multiple times; uses IF NOT EXISTS
-- =====================================================================

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Username lookups (case-insensitive for login/search)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
ON profiles (lower(username))
WHERE username IS NOT NULL;

-- Email lookups for password reset and notifications
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles (email)
WHERE email IS NOT NULL;

-- Location-based searches
CREATE INDEX IF NOT EXISTS idx_profiles_location_search
ON profiles USING gin (to_tsvector('english', COALESCE(location_search, '')))
WHERE location_search IS NOT NULL;

-- Geographic queries (latitude/longitude)
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates
ON profiles (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Profile creation/update ordering
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at
ON profiles (updated_at DESC);

-- ============================================================================
-- PROJECTS TABLE INDEXES
-- ============================================================================

-- User's projects lookup (dashboard, profile pages)
CREATE INDEX IF NOT EXISTS idx_projects_user_id
ON projects (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Status-based filtering (active projects, drafts)
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects (status, created_at DESC)
WHERE status IS NOT NULL;

-- Category filtering (discovery, category pages)
CREATE INDEX IF NOT EXISTS idx_projects_category
ON projects (category, created_at DESC)
WHERE category IS NOT NULL;

-- Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_projects_search
ON projects USING gin (to_tsvector('english',
  COALESCE(title, '') || ' ' || COALESCE(description, '')
))
WHERE title IS NOT NULL OR description IS NOT NULL;

-- Recent projects for homepage/discovery
CREATE INDEX IF NOT EXISTS idx_projects_created_at
ON projects (created_at DESC);

-- Project updates tracking
CREATE INDEX IF NOT EXISTS idx_projects_updated_at
ON projects (updated_at DESC);

-- ============================================================================
-- COMMERCE TABLES (user_products, user_services)
-- ============================================================================

-- User's products/services (dashboard, profile)
CREATE INDEX IF NOT EXISTS idx_user_products_user_id
ON user_products (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_services_user_id
ON user_services (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Status filtering (active listings)
CREATE INDEX IF NOT EXISTS idx_user_products_status
ON user_products (status, created_at DESC)
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_services_status
ON user_services (status, created_at DESC)
WHERE status IS NOT NULL;

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_user_products_category
ON user_products (category, created_at DESC)
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_services_category
ON user_services (category, created_at DESC)
WHERE category IS NOT NULL;

-- ============================================================================
-- ASSETS TABLE INDEXES
-- ============================================================================

-- Owner's assets (dashboard, profile)
CREATE INDEX IF NOT EXISTS idx_assets_owner_id
ON assets (owner_id, created_at DESC)
WHERE owner_id IS NOT NULL;

-- Asset type filtering
CREATE INDEX IF NOT EXISTS idx_assets_type
ON assets (type, created_at DESC)
WHERE type IS NOT NULL;

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_assets_status
ON assets (status, created_at DESC)
WHERE status IS NOT NULL;

-- ============================================================================
-- LOANS TABLES INDEXES
-- ============================================================================

-- User's loans (dashboard)
CREATE INDEX IF NOT EXISTS idx_loans_user_id
ON loans (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loans_status
ON loans (status, created_at DESC)
WHERE status IS NOT NULL;

-- Loan offers by loan and offerer
CREATE INDEX IF NOT EXISTS idx_loan_offers_loan_id
ON loan_offers (loan_id, created_at DESC)
WHERE loan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loan_offers_offerer_id
ON loan_offers (offerer_id, created_at DESC)
WHERE offerer_id IS NOT NULL;

-- Loan payments by loan and payer
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id
ON loan_payments (loan_id, created_at DESC)
WHERE loan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loan_payments_payer_id
ON loan_payments (payer_id, created_at DESC)
WHERE payer_id IS NOT NULL;

-- ============================================================================
-- MESSAGING TABLES INDEXES
-- ============================================================================

-- Conversations by creator and creation time
CREATE INDEX IF NOT EXISTS idx_conversations_created_by
ON conversations (created_by, created_at DESC)
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_created_at
ON conversations (created_at DESC);

-- Conversation participants lookup
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
ON conversation_participants (conversation_id, joined_at DESC)
WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
ON conversation_participants (user_id, joined_at DESC)
WHERE user_id IS NOT NULL;

-- Messages by conversation (for pagination)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages (conversation_id, created_at ASC)
WHERE conversation_id IS NOT NULL;

-- Messages by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender
ON messages (sender_id, created_at DESC)
WHERE sender_id IS NOT NULL;

-- ============================================================================
-- ORGANIZATION TABLES INDEXES
-- ============================================================================

-- Organization lookups by slug
CREATE INDEX IF NOT EXISTS idx_organizations_slug
ON organizations (slug)
WHERE slug IS NOT NULL;

-- Organization members lookup
CREATE INDEX IF NOT EXISTS idx_organization_members_org
ON organization_members (organization_id, joined_at DESC)
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_members_user
ON organization_members (user_id, joined_at DESC)
WHERE user_id IS NOT NULL;

-- ============================================================================
-- WALLETS TABLE INDEXES
-- ============================================================================

-- Wallets by profile (user's wallets)
CREATE INDEX IF NOT EXISTS idx_wallets_profile_id
ON wallets (profile_id, created_at DESC)
WHERE profile_id IS NOT NULL;

-- Wallets by project (project donation addresses)
CREATE INDEX IF NOT EXISTS idx_wallets_project_id
ON wallets (project_id, created_at DESC)
WHERE project_id IS NOT NULL;

-- Primary wallet lookups
CREATE INDEX IF NOT EXISTS idx_wallets_primary
ON wallets (profile_id, project_id)
WHERE is_primary = true;

-- ============================================================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Transactions by entity (from/to lookups)
CREATE INDEX IF NOT EXISTS idx_transactions_from_entity
ON transactions (from_entity_type, from_entity_id, created_at DESC)
WHERE from_entity_type IS NOT NULL AND from_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_to_entity
ON transactions (to_entity_type, to_entity_id, created_at DESC)
WHERE to_entity_type IS NOT NULL AND to_entity_id IS NOT NULL;

-- Transaction status filtering
CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions (status, created_at DESC)
WHERE status IS NOT NULL;

-- ============================================================================
-- SOCIAL FEATURES INDEXES (if tables exist)
-- ============================================================================

-- Follows relationships (social graph)
CREATE INDEX IF NOT EXISTS idx_follows_follower
ON follows (follower_id, created_at DESC)
WHERE follower_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_follows_following
ON follows (following_id, created_at DESC)
WHERE following_id IS NOT NULL;

-- ============================================================================
-- AUDIT AND LOGGING INDEXES
-- ============================================================================

-- Audit logs by user and timestamp
CREATE INDEX IF NOT EXISTS idx_audit_log_user
ON audit_log (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Audit logs by resource
CREATE INDEX IF NOT EXISTS idx_audit_log_resource
ON audit_log (resource_type, resource_id, created_at DESC)
WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- Query Pattern Coverage:
-- ✓ User dashboards (user_id + created_at DESC)
-- ✓ Public listings (status = 'active' + created_at DESC)
-- ✓ Search functionality (GIN indexes for text search)
-- ✓ Category/tag filtering (category + created_at DESC)
-- ✓ Geographic queries (PostGIS-ready coordinates)
-- ✓ Social relationships (follower/following lookups)
-- ✓ Messaging (conversation pagination)
-- ✓ Audit trails (user + resource lookups)

-- Index Maintenance:
-- - These indexes are automatically maintained by PostgreSQL
-- - Monitor index usage with: SELECT * FROM pg_stat_user_indexes;
-- - Consider index bloat monitoring for high-traffic tables
-- - Partial indexes reduce size and improve performance for filtered queries











