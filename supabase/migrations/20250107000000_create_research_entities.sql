-- Create research entities table for DeSci ecosystem
-- Enables independent research funding and team collaboration

CREATE TABLE IF NOT EXISTS research_entities (
  -- Base entity fields
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
  wallet_address TEXT NOT NULL UNIQUE, -- BTC wallet for this research entity

  -- Team and collaboration
  lead_researcher TEXT NOT NULL,
  team_members JSONB DEFAULT '[]'::jsonb, -- Array of team member objects
  open_collaboration BOOLEAN DEFAULT true,

  -- Resources needed
  resource_needs JSONB DEFAULT '[]'::jsonb, -- Array of resource need objects

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
  impact_areas JSONB DEFAULT '[]'::jsonb, -- Array of impact area objects
  target_audience TEXT[] DEFAULT '{}',
  sdg_alignment JSONB DEFAULT '[]'::jsonb, -- Array of SDG alignment objects

  -- Progress tracking
  progress_updates JSONB DEFAULT '[]'::jsonb, -- Array of progress update objects
  total_votes INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),

  -- Funding history
  contributions JSONB DEFAULT '[]'::jsonb, -- Array of contribution objects
  total_contributors INTEGER DEFAULT 0,

  -- Computed metrics
  completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  days_active INTEGER DEFAULT 0,
  funding_velocity DECIMAL(10,2) DEFAULT 0.00, -- sats per day

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_entities_user_id ON research_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_research_entities_field ON research_entities(field);
CREATE INDEX IF NOT EXISTS idx_research_entities_status ON research_entities(status);
CREATE INDEX IF NOT EXISTS idx_research_entities_is_public ON research_entities(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_research_entities_funding_goal ON research_entities(funding_goal_sats);
CREATE INDEX IF NOT EXISTS idx_research_entities_created_at ON research_entities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_entities_search ON research_entities USING gin(search_vector);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION research_entities_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.expected_outcome, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.lead_researcher, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_research_entities_search
  BEFORE INSERT OR UPDATE ON research_entities
  FOR EACH ROW EXECUTE FUNCTION research_entities_search_trigger();

-- Updated at trigger
CREATE TRIGGER update_research_entities_updated_at
  BEFORE UPDATE ON research_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE research_entities ENABLE ROW LEVEL SECURITY;

-- Public read access for public entities
CREATE POLICY "Public research entities are viewable by everyone"
  ON research_entities FOR SELECT
  USING (is_public = true);

-- Users can view all their own entities
CREATE POLICY "Users can view their own research entities"
  ON research_entities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entities
CREATE POLICY "Users can create research entities"
  ON research_entities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entities
CREATE POLICY "Users can update their own research entities"
  ON research_entities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own entities
CREATE POLICY "Users can delete their own research entities"
  ON research_entities FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE research_entities IS 'Independent research entities for decentralized science funding and collaboration';
COMMENT ON COLUMN research_entities.funding_goal_sats IS 'Funding goal in satoshis for this research project';
COMMENT ON COLUMN research_entities.wallet_address IS 'Unique Bitcoin wallet address for this research entity';
COMMENT ON COLUMN research_entities.team_members IS 'JSON array of team member objects with roles and contribution percentages';
COMMENT ON COLUMN research_entities.open_collaboration IS 'Whether this research accepts new collaborators';
COMMENT ON COLUMN research_entities.voting_enabled IS 'Whether supporters can vote on research direction';
COMMENT ON COLUMN research_entities.completion_percentage IS 'Research completion percentage (0-100)';
COMMENT ON COLUMN research_entities.funding_velocity IS 'Average funding received per day in sats';

-- Research progress updates table
CREATE TABLE IF NOT EXISTS research_progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_entity_id UUID NOT NULL REFERENCES research_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  milestone_achieved BOOLEAN DEFAULT false,
  funding_released BIGINT DEFAULT 0 CHECK (funding_released >= 0), -- sats released from milestone
  attachments TEXT[] DEFAULT '{}', -- URLs to documents, images, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Voting on progress updates
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  total_votes INTEGER GENERATED ALWAYS AS (votes_up + votes_down) STORED
);

-- Research votes table (for community voting on research direction)
CREATE TABLE IF NOT EXISTS research_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_entity_id UUID NOT NULL REFERENCES research_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('direction', 'priority', 'impact', 'continuation')),
  choice TEXT NOT NULL, -- The choice made (could be text or number)
  weight DECIMAL(5,2) DEFAULT 1.00, -- Voting weight based on contribution level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one vote per user per vote type
  UNIQUE(research_entity_id, user_id, vote_type)
);

-- Research contributions table (funding history)
CREATE TABLE IF NOT EXISTS research_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_entity_id UUID NOT NULL REFERENCES research_entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Allow anonymous contributions
  amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
  funding_model TEXT NOT NULL CHECK (funding_model IN ('donation', 'subscription', 'milestone', 'royalty')),
  message TEXT,
  anonymous BOOLEAN DEFAULT false,
  lightning_invoice TEXT,
  onchain_tx TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_progress_entity_id ON research_progress_updates(research_entity_id);
CREATE INDEX IF NOT EXISTS idx_research_progress_created_at ON research_progress_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_votes_entity_id ON research_votes(research_entity_id);
CREATE INDEX IF NOT EXISTS idx_research_votes_user_id ON research_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_research_contributions_entity_id ON research_contributions(research_entity_id);
CREATE INDEX IF NOT EXISTS idx_research_contributions_user_id ON research_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_contributions_status ON research_contributions(status);

-- RLS for progress updates
ALTER TABLE research_progress_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Research progress updates are viewable by everyone for public entities"
  ON research_progress_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_entities
      WHERE id = research_entity_id AND is_public = true
    )
  );

CREATE POLICY "Users can view progress updates for entities they own"
  ON research_progress_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_entities
      WHERE id = research_entity_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Entity owners can create progress updates"
  ON research_progress_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_entities
      WHERE id = research_entity_id AND user_id = auth.uid()
    )
  );

-- RLS for votes
ALTER TABLE research_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Research votes are viewable by everyone for public entities"
  ON research_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_entities
      WHERE id = research_entity_id AND is_public = true
    )
  );

CREATE POLICY "Authenticated users can vote on public research entities"
  ON research_votes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM research_entities
      WHERE id = research_entity_id AND is_public = true
    )
  );

CREATE POLICY "Users can update their own votes"
  ON research_votes FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS for contributions
ALTER TABLE research_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions are viewable by entity owners and contributors"
  ON research_contributions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM research_entities
      WHERE id = research_entity_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can contribute to public research entities"
  ON research_contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_entities
      WHERE id = research_entity_id AND is_public = true
    )
  );

CREATE POLICY "Contributors can update their own contributions"
  ON research_contributions FOR UPDATE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE research_progress_updates IS 'Progress updates and milestones for research entities';
COMMENT ON TABLE research_votes IS 'Community votes on research direction and priorities';
COMMENT ON TABLE research_contributions IS 'Funding contributions to research entities';
COMMENT ON COLUMN research_contributions.amount_sats IS 'Contribution amount in satoshis';
COMMENT ON COLUMN research_contributions.lightning_invoice IS 'Lightning Network invoice for payment';
COMMENT ON COLUMN research_contributions.onchain_tx IS 'On-chain Bitcoin transaction ID';

-- Database functions for research entity operations

-- Function to update research funding totals
CREATE OR REPLACE FUNCTION update_research_funding(
  research_entity_id UUID,
  amount_sats BIGINT
) RETURNS void AS $$
BEGIN
  UPDATE research_entities
  SET
    funding_raised_sats = funding_raised_sats + amount_sats,
    total_contributors = (
      SELECT COUNT(DISTINCT user_id)
      FROM research_contributions
      WHERE research_entity_id = research_entities.id
      AND user_id IS NOT NULL
      AND anonymous = false
    ),
    funding_velocity = CASE
      WHEN days_active > 0 THEN
        ROUND((funding_raised_sats + amount_sats)::numeric / days_active, 2)
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = research_entity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment research completion percentage
CREATE OR REPLACE FUNCTION increment_research_completion(
  research_entity_id UUID,
  percentage_increase DECIMAL
) RETURNS void AS $$
BEGIN
  UPDATE research_entities
  SET
    completion_percentage = LEAST(completion_percentage + percentage_increase, 100.0),
    updated_at = NOW()
  WHERE id = research_entity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update research activity metrics
CREATE OR REPLACE FUNCTION update_research_activity() RETURNS void AS $$
BEGIN
  UPDATE research_entities
  SET
    days_active = EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400,
    updated_at = NOW()
  WHERE status IN ('active', 'draft');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate research impact score
CREATE OR REPLACE FUNCTION calculate_research_impact(
  research_entity_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  impact_score DECIMAL := 0;
  entity_record RECORD;
  contribution_count INTEGER;
  vote_count INTEGER;
  progress_count INTEGER;
BEGIN
  -- Get entity data
  SELECT * INTO entity_record
  FROM research_entities
  WHERE id = research_entity_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Get counts
  SELECT COUNT(*) INTO contribution_count
  FROM research_contributions
  WHERE research_entity_id = research_entity_id AND status = 'confirmed';

  SELECT COUNT(*) INTO vote_count
  FROM research_votes
  WHERE research_entity_id = research_entity_id;

  SELECT COUNT(*) INTO progress_count
  FROM research_progress_updates
  WHERE research_entity_id = research_entity_id;

  -- Calculate impact score (weighted formula)
  impact_score :=
    (entity_record.funding_raised_sats * 0.3 / 1000000) + -- Funding impact
    (contribution_count * 0.2) +                          -- Community support
    (vote_count * 0.15) +                                 -- Community engagement
    (progress_count * 0.15) +                             -- Research activity
    (entity_record.citation_count * 0.1) +                -- Academic impact
    (CASE WHEN entity_record.is_featured THEN 10 ELSE 0 END) * 0.1; -- Featured bonus

  RETURN ROUND(impact_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a view for research entity statistics
CREATE OR REPLACE VIEW research_entity_stats AS
SELECT
  re.id,
  re.title,
  re.field,
  re.funding_goal_sats,
  re.funding_raised_sats,
  ROUND((re.funding_raised_sats::numeric / NULLIF(re.funding_goal_sats, 0)) * 100, 2) as funding_percentage,
  re.total_contributors,
  re.completion_percentage,
  re.funding_velocity,
  re.follower_count,
  re.share_count,
  re.citation_count,
  calculate_research_impact(re.id) as impact_score,
  re.created_at,
  re.status
FROM research_entities re;

-- Grant permissions
GRANT SELECT ON research_entity_stats TO authenticated;
GRANT SELECT ON research_entity_stats TO anon;