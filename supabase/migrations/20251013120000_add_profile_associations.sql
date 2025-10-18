-- Add profile associations table for entity relationships
-- Created: 2025-10-13
-- Purpose: Enable profiles to have relationships with campaigns, organizations, and other profiles

-- Create profile_associations table
CREATE TABLE IF NOT EXISTS public.profile_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL,
  target_entity_type TEXT NOT NULL CHECK (target_entity_type IN ('profile', 'campaign', 'organization', 'collective', 'project')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('created', 'founded', 'supports', 'collaborates', 'maintains', 'member', 'leader', 'moderator', 'contributor', 'advisor', 'investor', 'sponsor', 'partner', 'beneficiary')),
  role TEXT,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'pending', 'completed', 'suspended', 'disputed')),
  bitcoin_reward_address TEXT,
  reward_percentage NUMERIC DEFAULT 0 NOT NULL CHECK (reward_percentage >= 0 AND reward_percentage <= 100),
  permissions JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  visibility TEXT DEFAULT 'public' NOT NULL CHECK (visibility IN ('public', 'members_only', 'private', 'confidential')),
  starts_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  last_modified_by UUID REFERENCES public.profiles(id),
  
  -- Prevent duplicate associations
  UNIQUE(source_profile_id, target_entity_id, relationship_type, target_entity_type)
);

-- Add indexes for performance
CREATE INDEX idx_associations_source_profile ON public.profile_associations (source_profile_id);
CREATE INDEX idx_associations_target_entity ON public.profile_associations (target_entity_id, target_entity_type);
CREATE INDEX idx_associations_relationship_type ON public.profile_associations (relationship_type);
CREATE INDEX idx_associations_status ON public.profile_associations (status);
CREATE INDEX idx_associations_created_at ON public.profile_associations (created_at);

-- Enable RLS
ALTER TABLE public.profile_associations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public associations are viewable by everyone
CREATE POLICY "Public associations are viewable by everyone"
  ON public.profile_associations FOR SELECT
  USING (visibility = 'public' OR auth.uid() = source_profile_id);

-- Users can create their own associations
CREATE POLICY "Users can create their own associations"
  ON public.profile_associations FOR INSERT
  WITH CHECK (auth.uid() = source_profile_id);

-- Users can update their own associations
CREATE POLICY "Users can update their own associations"
  ON public.profile_associations FOR UPDATE
  USING (auth.uid() = source_profile_id);

-- Users can delete their own associations
CREATE POLICY "Users can delete their own associations"
  ON public.profile_associations FOR DELETE
  USING (auth.uid() = source_profile_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_association_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_association_update ON public.profile_associations;
CREATE TRIGGER on_association_update
  BEFORE UPDATE ON public.profile_associations
  FOR EACH ROW EXECUTE FUNCTION public.update_association_updated_at();

-- Comments
COMMENT ON TABLE public.profile_associations IS 'Relationships between profiles and entities (campaigns, organizations, other profiles)';
COMMENT ON COLUMN public.profile_associations.reward_percentage IS 'Percentage of rewards/donations to distribute to this association (0-100)';
COMMENT ON COLUMN public.profile_associations.bitcoin_reward_address IS 'Bitcoin address for receiving rewards from this association';
COMMENT ON FUNCTION public.update_association_updated_at IS 'Automatically updates the updated_at timestamp';




