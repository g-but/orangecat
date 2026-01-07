-- Migration: Add show_on_profile field to entity tables
-- Purpose: Allow users to control which entities appear on their public profile
-- Created: 2026-01-06
--
-- This field is separate from is_public:
-- - is_public: Controls if entity is visible in marketplace/discover
-- - show_on_profile: Controls if entity appears on user's public profile page

-- Add show_on_profile to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN projects.show_on_profile IS 'Whether this project appears on the user''s public profile page';

-- Add show_on_profile to user_products
ALTER TABLE user_products
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN user_products.show_on_profile IS 'Whether this product appears on the user''s public profile page';

-- Add show_on_profile to user_services
ALTER TABLE user_services
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN user_services.show_on_profile IS 'Whether this service appears on the user''s public profile page';

-- Add show_on_profile to user_causes
ALTER TABLE user_causes
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN user_causes.show_on_profile IS 'Whether this cause appears on the user''s public profile page';

-- Add show_on_profile to ai_assistants
ALTER TABLE ai_assistants
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN ai_assistants.show_on_profile IS 'Whether this AI assistant appears on the user''s public profile page';

-- Add show_on_profile to assets (user_assets table)
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN assets.show_on_profile IS 'Whether this asset appears on the user''s public profile page';

-- Add show_on_profile to loans
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN loans.show_on_profile IS 'Whether this loan appears on the user''s public profile page';

-- Add show_on_profile to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

COMMENT ON COLUMN events.show_on_profile IS 'Whether this event appears on the user''s public profile page';

-- Create indexes for efficient profile page queries
CREATE INDEX IF NOT EXISTS idx_projects_show_on_profile ON projects(user_id, show_on_profile) WHERE show_on_profile = true;
CREATE INDEX IF NOT EXISTS idx_user_products_show_on_profile ON user_products(user_id, show_on_profile) WHERE show_on_profile = true;
CREATE INDEX IF NOT EXISTS idx_user_services_show_on_profile ON user_services(user_id, show_on_profile) WHERE show_on_profile = true;
CREATE INDEX IF NOT EXISTS idx_user_causes_show_on_profile ON user_causes(user_id, show_on_profile) WHERE show_on_profile = true;
CREATE INDEX IF NOT EXISTS idx_ai_assistants_show_on_profile ON ai_assistants(user_id, show_on_profile) WHERE show_on_profile = true;
CREATE INDEX IF NOT EXISTS idx_assets_show_on_profile ON assets(owner_id, show_on_profile) WHERE show_on_profile = true;
CREATE INDEX IF NOT EXISTS idx_loans_show_on_profile ON loans(user_id, show_on_profile) WHERE show_on_profile = true;
CREATE INDEX IF NOT EXISTS idx_events_show_on_profile ON events(user_id, show_on_profile) WHERE show_on_profile = true;
