-- =============================================
-- ADD ACTOR_ID TO ENTITY TABLES
-- 
-- Adds actor_id column to all entity tables that can be owned.
-- This enables unified ownership checks.
-- =============================================

-- Add actor_id to all entity tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
ALTER TABLE user_products ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
ALTER TABLE user_services ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
ALTER TABLE user_causes ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
-- Events table may not exist, handle gracefully
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
    ALTER TABLE events ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
  END IF;
END $$;
-- AI assistants table may not exist, handle gracefully
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_assistants') THEN
    ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_actor_id ON projects(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_products_actor_id ON user_products(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_services_actor_id ON user_services(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_causes_actor_id ON user_causes(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loans_actor_id ON loans(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_actor_id ON assets(actor_id) WHERE actor_id IS NOT NULL;
-- Events index (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
    CREATE INDEX IF NOT EXISTS idx_events_actor_id ON events(actor_id) WHERE actor_id IS NOT NULL;
  END IF;
END $$;
-- AI assistants index (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_assistants') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_assistants_actor_id ON ai_assistants(actor_id) WHERE actor_id IS NOT NULL;
  END IF;
END $$;

