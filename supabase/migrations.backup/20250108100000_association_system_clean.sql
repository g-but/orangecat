-- =====================================================================
-- ORANGECAT ASSOCIATION SYSTEM - CLEAN DEPLOYMENT
-- =====================================================================
-- Migration: 20250108100000_association_system_clean.sql
-- Created: 2025-01-08  
-- Purpose: Deploy association system foundation cleanly
-- 
-- This migration creates only the NEW tables and functionality needed
-- for the association system without conflicting with existing schema.
-- =====================================================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 🏗️ ENUMS: TYPE-SAFE DOMAIN MODELING
-- =====================================================================

-- Entity types for associations
DO $$ BEGIN
  CREATE TYPE entity_type_enum AS ENUM (
    'profile', 'campaign', 'organization', 'collective', 'project'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Relationship types with semantic meaning
DO $$ BEGIN
  CREATE TYPE relationship_type_enum AS ENUM (
    'created', 'founded', 'supports', 'collaborates', 'maintains',
    'member', 'leader', 'moderator', 'contributor', 'advisor',
    'investor', 'sponsor', 'partner', 'beneficiary'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Association lifecycle status
DO $$ BEGIN
  CREATE TYPE association_status_enum AS ENUM (
    'active', 'inactive', 'pending', 'completed', 'suspended', 'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organization types
DO $$ BEGIN
  CREATE TYPE organization_type_enum AS ENUM (
    'dao', 'company', 'nonprofit', 'community', 'cooperative', 
    'foundation', 'collective', 'guild', 'syndicate'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Governance models
DO $$ BEGIN
  CREATE TYPE governance_model_enum AS ENUM (
    'hierarchical', 'flat', 'democratic', 'consensus', 'liquid_democracy',
    'quadratic_voting', 'stake_weighted', 'reputation_based'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Membership roles
DO $$ BEGIN
  CREATE TYPE membership_role_enum AS ENUM (
    'owner', 'admin', 'moderator', 'member', 'contributor', 
    'observer', 'advisor', 'emeritus'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Membership status
DO $$ BEGIN
  CREATE TYPE membership_status_enum AS ENUM (
    'active', 'inactive', 'pending', 'invited', 'suspended', 
    'banned', 'alumni', 'on_leave'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Visibility levels
DO $$ BEGIN
  CREATE TYPE visibility_enum AS ENUM (
    'public', 'members_only', 'private', 'confidential'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- 🗄️ CORE TABLES: NEW ASSOCIATION SYSTEM
-- =====================================================================

-- 1. Profile Associations - The Heart of Connections
CREATE TABLE IF NOT EXISTS profile_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL,
  target_entity_type entity_type_enum NOT NULL,
  relationship_type relationship_type_enum NOT NULL,
  role VARCHAR(100),
  status association_status_enum DEFAULT 'active' NOT NULL,
  bitcoin_reward_address VARCHAR(255),
  reward_percentage DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  permissions JSONB DEFAULT '{}' NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  visibility visibility_enum DEFAULT 'public' NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  created_by UUID REFERENCES profiles(id),
  last_modified_by UUID REFERENCES profiles(id),
  
  CONSTRAINT unique_association UNIQUE(source_profile_id, target_entity_id, relationship_type),
  CONSTRAINT no_self_association CHECK (target_entity_id != source_profile_id),
  CONSTRAINT valid_reward_percentage CHECK (reward_percentage >= 0 AND reward_percentage <= 100),
  CONSTRAINT valid_version CHECK (version > 0),
  CONSTRAINT valid_time_range CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- 2. Organizations - Collective Entities
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  website_url VARCHAR(500),
  avatar_url VARCHAR(500),
  banner_url VARCHAR(500),
  type organization_type_enum NOT NULL,
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}' NOT NULL,
  governance_model governance_model_enum DEFAULT 'hierarchical' NOT NULL,
  treasury_address VARCHAR(255),
  is_public BOOLEAN DEFAULT true NOT NULL,
  requires_approval BOOLEAN DEFAULT true NOT NULL,
  verification_level INTEGER DEFAULT 0 NOT NULL,
  trust_score DECIMAL(3,2) DEFAULT 0.00 NOT NULL,
  settings JSONB DEFAULT '{}' NOT NULL,
  contact_info JSONB DEFAULT '{}' NOT NULL,
  founded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_trust_score CHECK (trust_score >= 0 AND trust_score <= 1),
  CONSTRAINT valid_verification_level CHECK (verification_level >= 0),
  CONSTRAINT valid_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9\-]*[a-z0-9]$'),
  CONSTRAINT non_empty_name CHECK (LENGTH(TRIM(name)) > 0)
);

-- 3. Memberships - Organization Participation
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role membership_role_enum NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}' NOT NULL,
  title VARCHAR(150),
  status membership_status_enum DEFAULT 'active' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  contribution_address VARCHAR(255),
  total_contributions DECIMAL(20,8) DEFAULT 0 NOT NULL,
  reward_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  invitation_token VARCHAR(255) UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  bio TEXT,
  achievements JSONB DEFAULT '[]' NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_membership UNIQUE(organization_id, profile_id),
  CONSTRAINT valid_reward_percentage CHECK (reward_percentage >= 0 AND reward_percentage <= 100),
  CONSTRAINT valid_contributions CHECK (total_contributions >= 0)
);

-- =====================================================================
-- 🚀 PERFORMANCE INDEXES
-- =====================================================================

-- Profile Associations indexes
CREATE INDEX IF NOT EXISTS idx_profile_associations_source_active 
ON profile_associations(source_profile_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_profile_associations_target_type 
ON profile_associations(target_entity_id, target_entity_type);

CREATE INDEX IF NOT EXISTS idx_profile_associations_relationship 
ON profile_associations(relationship_type, status) WHERE status = 'active';

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_type_public 
ON organizations(type, is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_organizations_slug_lower 
ON organizations(LOWER(slug));

-- Memberships indexes
CREATE INDEX IF NOT EXISTS idx_memberships_org_status 
ON memberships(organization_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_memberships_profile_role 
ON memberships(profile_id, role, status) WHERE status = 'active';

-- =====================================================================
-- 🔒 SECURITY: ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS
ALTER TABLE profile_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Profile Associations Policies
CREATE POLICY "association_select_policy" ON profile_associations
  FOR SELECT USING (
    source_profile_id = auth.uid() OR 
    target_entity_id = auth.uid() OR
    visibility = 'public'
  );

CREATE POLICY "association_insert_policy" ON profile_associations
  FOR INSERT WITH CHECK (source_profile_id = auth.uid());

CREATE POLICY "association_update_policy" ON profile_associations
  FOR UPDATE USING (source_profile_id = auth.uid());

CREATE POLICY "association_delete_policy" ON profile_associations
  FOR DELETE USING (source_profile_id = auth.uid());

-- Organizations Policies
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT USING (
    is_public = true OR
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.organization_id = id 
      AND m.profile_id = auth.uid() 
      AND m.status = 'active'
    )
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.organization_id = id 
      AND m.profile_id = auth.uid() 
      AND m.role IN ('owner', 'admin')
      AND m.status = 'active'
    )
  );

CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE USING (profile_id = auth.uid());

-- Memberships Policies  
CREATE POLICY "memberships_select_policy" ON memberships
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships m2 
      WHERE m2.organization_id = organization_id 
      AND m2.profile_id = auth.uid() 
      AND m2.status = 'active'
    )
  );

CREATE POLICY "memberships_insert_policy" ON memberships
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.organization_id = organization_id 
      AND m.profile_id = auth.uid() 
      AND m.role IN ('owner', 'admin')
      AND m.status = 'active'
    )
  );

CREATE POLICY "memberships_update_policy" ON memberships
  FOR UPDATE USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.organization_id = organization_id 
      AND m.profile_id = auth.uid() 
      AND m.role IN ('owner', 'admin')
      AND m.status = 'active'
    )
  );

CREATE POLICY "memberships_delete_policy" ON memberships
  FOR DELETE USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.organization_id = organization_id 
      AND m.profile_id = auth.uid() 
      AND m.role IN ('owner', 'admin')
      AND m.status = 'active'
    )
  );

-- =====================================================================
-- 🔧 BUSINESS LOGIC: TRIGGERS & FUNCTIONS
-- =====================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_profile_associations_updated_at
  BEFORE UPDATE ON profile_associations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- 🔄 MIGRATION: BACKWARD COMPATIBILITY
-- =====================================================================

-- Migration function to populate associations from existing data
CREATE OR REPLACE FUNCTION migrate_existing_associations()
RETURNS VOID AS $$
DECLARE
  migration_count INTEGER;
BEGIN
  -- Create associations for existing campaign creators
  INSERT INTO profile_associations (
    source_profile_id,
    target_entity_id,
    target_entity_type,
    relationship_type,
    role,
    status,
    created_at,
    updated_at,
    created_by
  )
  SELECT 
    fp.user_id,
    fp.id,
    'campaign'::entity_type_enum,
    'created'::relationship_type_enum,
    'Creator',
    CASE WHEN fp.is_active THEN 'active'::association_status_enum 
         ELSE 'inactive'::association_status_enum END,
    fp.created_at,
    fp.updated_at,
    fp.user_id
  FROM funding_pages fp
  WHERE fp.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profile_associations pa 
    WHERE pa.source_profile_id = fp.user_id 
    AND pa.target_entity_id = fp.id 
    AND pa.target_entity_type = 'campaign'
  );
  
  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Successfully migrated % existing campaign associations', migration_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 🚀 FINALIZATION
-- =====================================================================

-- Create helpful view for common queries
CREATE OR REPLACE VIEW user_associations AS
SELECT 
  pa.*,
  CASE 
    WHEN pa.target_entity_type = 'profile' THEN p.display_name
    WHEN pa.target_entity_type = 'campaign' THEN fp.title
    WHEN pa.target_entity_type = 'organization' THEN o.name
    ELSE 'Unknown Entity'
  END as target_entity_name
FROM profile_associations pa
LEFT JOIN profiles p ON pa.target_entity_id = p.id AND pa.target_entity_type = 'profile'
LEFT JOIN funding_pages fp ON pa.target_entity_id = fp.id AND pa.target_entity_type = 'campaign'
LEFT JOIN organizations o ON pa.target_entity_id = o.id AND pa.target_entity_type = 'organization'
WHERE pa.status = 'active';

-- Grant permissions
GRANT SELECT ON user_associations TO authenticated;

-- Log successful deployment
DO $$
BEGIN
  RAISE NOTICE '🎯 ASSOCIATION SYSTEM FOUNDATION DEPLOYED! 🎯';
  RAISE NOTICE 'Core tables: profile_associations, organizations, memberships';
  RAISE NOTICE 'Security: Row Level Security enabled on all tables';
  RAISE NOTICE 'Performance: Optimized indexes created';
  RAISE NOTICE 'Ready for Bitcoin-native social networking! 🚀';
END $$;