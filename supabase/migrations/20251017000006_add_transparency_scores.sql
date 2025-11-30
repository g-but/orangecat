-- Add transparency score system for profiles
-- This migration creates a transparency scoring system to encourage profile completeness

BEGIN;

-- Create transparency scores table
CREATE TABLE IF NOT EXISTS public.transparency_scores (
  id uuid default uuid_generate_v4() primary key,
  entity_type text not null check (entity_type in ('profile', 'organization')),
  entity_id uuid not null,
  score numeric(5,2) not null default 0 check (score >= 0 and score <= 100),
  max_score numeric(5,2) not null default 100,
  factors jsonb not null default '{}',
  calculated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(entity_type, entity_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_transparency_scores_entity ON public.transparency_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_transparency_scores_score ON public.transparency_scores(score DESC);

-- Enable RLS
ALTER TABLE public.transparency_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view transparency scores" ON public.transparency_scores;
DROP POLICY IF EXISTS "System can manage transparency scores" ON public.transparency_scores;

CREATE POLICY "Users can view transparency scores"
ON public.transparency_scores
FOR SELECT
TO public
USING (true);

CREATE POLICY "System can manage transparency scores"
ON public.transparency_scores
FOR ALL
TO service_role
USING (true);

-- Add updated_at trigger
CREATE TRIGGER transparency_scores_updated_at
  BEFORE UPDATE ON public.transparency_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate transparency score for profiles
CREATE OR REPLACE FUNCTION calculate_profile_transparency_score(profile_id uuid)
RETURNS numeric(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score numeric(5,2) := 0;
  max_score numeric(5,2) := 100;
  factors jsonb := '{}';
  profile_data record;
  link_count INTEGER := 0;
BEGIN
  -- Get profile data
  SELECT * INTO profile_data FROM profiles WHERE id = profile_id;

  IF profile_data IS NULL THEN
    RETURN 0;
  END IF;

  -- Base score for having a profile (10 points)
  score := 10;

  -- Username (15 points)
  IF profile_data.username IS NOT NULL AND profile_data.username != '' THEN
    score := score + 15;
    factors := factors || jsonb_build_object('username', 15);
  END IF;

  -- Display name (10 points) - check both name and display_name for backward compatibility
  IF (profile_data.name IS NOT NULL AND profile_data.name != '') OR
     (profile_data.display_name IS NOT NULL AND profile_data.display_name != '') THEN
    score := score + 10;
    factors := factors || jsonb_build_object('name', 10);
  END IF;

  -- Avatar (10 points)
  IF profile_data.avatar_url IS NOT NULL AND profile_data.avatar_url != '' THEN
    score := score + 10;
    factors := factors || jsonb_build_object('avatar', 10);
  END IF;

  -- Bio (15 points)
  IF profile_data.bio IS NOT NULL AND profile_data.bio != '' THEN
    score := score + 15;
    factors := factors || jsonb_build_object('bio', 15);
  END IF;

  -- Bitcoin address (20 points - highest weight for trust)
  IF profile_data.bitcoin_address IS NOT NULL AND profile_data.bitcoin_address != '' THEN
    score := score + 20;
    factors := factors || jsonb_build_object('bitcoin_address', 20);
  END IF;

  -- Lightning address (10 points)
  IF profile_data.lightning_address IS NOT NULL AND profile_data.lightning_address != '' THEN
    score := score + 10;
    factors := factors || jsonb_build_object('lightning_address', 10);
  END IF;

  -- Website (5 points)
  IF profile_data.website IS NOT NULL AND profile_data.website != '' THEN
    score := score + 5;
    factors := factors || jsonb_build_object('website', 5);
  END IF;

  -- Location (5 points) - check structured location fields
  IF (profile_data.location_search IS NOT NULL AND profile_data.location_search != '') OR
     (profile_data.location_country IS NOT NULL AND profile_data.location_country != '') OR
     (profile_data.location IS NOT NULL AND profile_data.location != '') THEN
    score := score + 5;
    factors := factors || jsonb_build_object('location', 5);
  END IF;

  -- Contact Email (5 points) - optional, no penalty if missing
  IF profile_data.contact_email IS NOT NULL AND profile_data.contact_email != '' THEN
    score := score + 5;
    factors := factors || jsonb_build_object('contact_email', 5);
  END IF;

  -- Social Links (track count but no penalty) - weight = 0 for now
  IF profile_data.social_links IS NOT NULL THEN
    -- Count links if structure is { links: [...] }
    IF jsonb_typeof(profile_data.social_links) = 'object' AND profile_data.social_links ? 'links' THEN
      link_count := jsonb_array_length(profile_data.social_links->'links');
    ELSIF jsonb_typeof(profile_data.social_links) = 'array' THEN
      link_count := jsonb_array_length(profile_data.social_links);
    END IF;
    
    -- Track but don't add to score (weight = 0)
    factors := factors || jsonb_build_object('social_links_count', 0, 'social_links_tracked', link_count);
  END IF;

  -- Verification status (10 bonus points for verified profiles)
  IF profile_data.verification_status = 'verified' THEN
    score := score + 10;
    factors := factors || jsonb_build_object('verified', 10);
  END IF;

  -- Cap at max score
  IF score > max_score THEN
    score := max_score;
  END IF;

  -- Update or insert transparency score
  INSERT INTO transparency_scores (entity_type, entity_id, score, max_score, factors, calculated_at)
  VALUES ('profile', profile_id, score, max_score, factors, now())
  ON CONFLICT (entity_type, entity_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    factors = EXCLUDED.factors,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = now();

  RETURN score;
END;
$$;

-- Create function to calculate transparency score for organizations (for future use)
CREATE OR REPLACE FUNCTION calculate_organization_transparency_score(org_id uuid)
RETURNS numeric(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score numeric(5,2) := 0;
  max_score numeric(5,2) := 100;
  factors jsonb := '{}';
  org_data record;
BEGIN
  -- Get organization data
  SELECT * INTO org_data FROM organizations WHERE id = org_id;

  IF org_data IS NULL THEN
    RETURN 0;
  END IF;

  -- Base score for having an organization (10 points)
  score := 10;

  -- Organization name (10 points)
  IF org_data.name IS NOT NULL AND org_data.name != '' THEN
    score := score + 10;
    factors := factors || jsonb_build_object('name', 10);
  END IF;

  -- Description (15 points)
  IF org_data.description IS NOT NULL AND org_data.description != '' THEN
    score := score + 15;
    factors := factors || jsonb_build_object('description', 15);
  END IF;

  -- Logo (10 points)
  IF org_data.logo_url IS NOT NULL AND org_data.logo_url != '' THEN
    score := score + 10;
    factors := factors || jsonb_build_object('logo', 10);
  END IF;

  -- Website (10 points)
  IF org_data.website_url IS NOT NULL AND org_data.website_url != '' THEN
    score := score + 10;
    factors := factors || jsonb_build_object('website', 10);
  END IF;

  -- Mission statement (15 points)
  IF org_data.mission IS NOT NULL AND org_data.mission != '' THEN
    score := score + 15;
    factors := factors || jsonb_build_object('mission', 15);
  END IF;

  -- Governance model (10 points)
  IF org_data.governance_model IS NOT NULL AND org_data.governance_model != '' THEN
    score := score + 10;
    factors := factors || jsonb_build_object('governance', 10);
  END IF;

  -- Bitcoin address (15 points)
  IF org_data.bitcoin_address IS NOT NULL AND org_data.bitcoin_address != '' THEN
    score := score + 15;
    factors := factors || jsonb_build_object('bitcoin_address', 15);
  END IF;

  -- Verification status (15 bonus points for verified orgs)
  IF org_data.is_verified = true THEN
    score := score + 15;
    factors := factors || jsonb_build_object('verified', 15);
  END IF;

  -- Cap at max score
  IF score > max_score THEN
    score := max_score;
  END IF;

  -- Update or insert transparency score
  INSERT INTO transparency_scores (entity_type, entity_id, score, max_score, factors, calculated_at)
  VALUES ('organization', org_id, score, max_score, factors, now())
  ON CONFLICT (entity_type, entity_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    factors = EXCLUDED.factors,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = now();

  RETURN score;
END;
$$;

-- Create trigger to automatically calculate transparency score when profile is updated
CREATE OR REPLACE FUNCTION trigger_calculate_profile_transparency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate transparency score for the updated profile
  PERFORM calculate_profile_transparency_score(NEW.id);

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_profile_transparency_update ON profiles;

-- Create new trigger
CREATE TRIGGER trigger_profile_transparency_update
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_profile_transparency();

-- Calculate transparency scores for all existing profiles
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id FROM profiles LOOP
    PERFORM calculate_profile_transparency_score(profile_record.id);
  END LOOP;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE transparency_scores IS 'Stores transparency scores for profiles and organizations to encourage information disclosure';
COMMENT ON COLUMN transparency_scores.entity_type IS 'Type of entity: profile or organization';
COMMENT ON COLUMN transparency_scores.entity_id IS 'ID of the profile or organization';
COMMENT ON COLUMN transparency_scores.score IS 'Current transparency score (0-100)';
COMMENT ON COLUMN transparency_scores.factors IS 'JSON object showing which factors contributed to the score';
COMMENT ON COLUMN transparency_scores.calculated_at IS 'When the score was last calculated';

COMMENT ON FUNCTION calculate_profile_transparency_score IS 'Calculates transparency score for a profile based on completeness and disclosure';
COMMENT ON FUNCTION calculate_organization_transparency_score IS 'Calculates transparency score for an organization (for future use)';

COMMIT;
