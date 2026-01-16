-- Standalone migration: Create research_entities table
-- This is a fresh migration to create the table that was missing

-- Create the research_entities table if it doesn't exist
CREATE TABLE IF NOT EXISTS research_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic research information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  field TEXT NOT NULL CHECK (field IN (
    'fundamental_physics', 'mathematics', 'computer_science', 'biology',
    'chemistry', 'neuroscience', 'psychology', 'economics', 'philosophy',
    'engineering', 'medicine', 'environmental_science', 'social_science',
    'artificial_intelligence', 'blockchain_cryptography', 'other'
  )),
  methodology TEXT NOT NULL CHECK (methodology IN (
    'theoretical', 'experimental', 'computational', 'empirical', 'qualitative',
    'mixed_methods', 'meta_analysis', 'survey', 'case_study', 'action_research'
  )),
  expected_outcome TEXT NOT NULL,
  timeline TEXT NOT NULL CHECK (timeline IN (
    'short_term', 'medium_term', 'long_term', 'ongoing', 'indefinite'
  )),
  
  -- Funding and wallet
  funding_goal_sats BIGINT NOT NULL CHECK (funding_goal_sats >= 1000),
  funding_raised_sats BIGINT DEFAULT 0 CHECK (funding_raised_sats >= 0),
  funding_model TEXT NOT NULL CHECK (funding_model IN (
    'donation', 'subscription', 'milestone', 'royalty', 'hybrid'
  )),
  wallet_address TEXT NOT NULL UNIQUE,
  
  -- Team and collaboration
  lead_researcher TEXT NOT NULL,
  team_members JSONB DEFAULT '[]'::jsonb,
  open_collaboration BOOLEAN DEFAULT true,
  
  -- Resources needed
  resource_needs JSONB DEFAULT '[]'::jsonb,
  
  -- Progress and transparency
  progress_frequency TEXT NOT NULL CHECK (progress_frequency IN (
    'weekly', 'biweekly', 'monthly', 'milestone', 'as_needed'
  )),
  transparency_level TEXT NOT NULL CHECK (transparency_level IN (
    'full', 'progress', 'milestone', 'minimal'
  )),
  voting_enabled BOOLEAN DEFAULT true,
  current_milestone TEXT,
  next_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Impact and alignment
  impact_areas JSONB DEFAULT '[]'::jsonb,
  target_audience TEXT[] DEFAULT '{}',
  sdg_alignment JSONB DEFAULT '[]'::jsonb,
  
  -- Progress tracking
  progress_updates JSONB DEFAULT '[]'::jsonb,
  total_votes INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  
  -- Funding history
  contributions JSONB DEFAULT '[]'::jsonb,
  total_contributors INTEGER DEFAULT 0,
  
  -- Computed metrics
  completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  days_active INTEGER DEFAULT 0,
  funding_velocity DECIMAL(10,2) DEFAULT 0.00,
  
  -- Social metrics
  follower_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  
  -- Entity status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused', 'cancelled')),
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Search and indexing
  search_vector TSVECTOR,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_entities_user_id ON research_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_research_entities_field ON research_entities(field);
CREATE INDEX IF NOT EXISTS idx_research_entities_status ON research_entities(status);
CREATE INDEX IF NOT EXISTS idx_research_entities_is_public ON research_entities(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_research_entities_funding_goal ON research_entities(funding_goal_sats);
CREATE INDEX IF NOT EXISTS idx_research_entities_created_at ON research_entities(created_at DESC);

-- RLS
ALTER TABLE research_entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public research entities are viewable by everyone"
  ON research_entities FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own research entities"
  ON research_entities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create research entities"
  ON research_entities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research entities"
  ON research_entities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own research entities"
  ON research_entities FOR DELETE
  USING (auth.uid() = user_id);
