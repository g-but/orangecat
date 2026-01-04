-- Migration: Add Project Support System
-- Created: 2025-01-30
-- Purpose: Enable non-monetary support for projects (signatures, messages, reactions)

-- Support types enum
CREATE TYPE support_type AS ENUM (
  'bitcoin_donation',
  'signature',
  'message',
  'reaction'
);

-- Project support table
CREATE TABLE project_support (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Support type
  support_type support_type NOT NULL,
  
  -- Bitcoin donation (if type = 'bitcoin_donation')
  amount_sats bigint,
  transaction_hash text,
  lightning_invoice text,
  
  -- Signature/Message (if type = 'signature' or 'message')
  display_name text, -- User's name or custom name
  message text,
  is_anonymous boolean DEFAULT false,
  
  -- Reaction (if type = 'reaction')
  reaction_emoji text, -- '❤️', '👍', '🔥', '🚀'
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_bitcoin_donation CHECK (
    support_type != 'bitcoin_donation' OR (amount_sats IS NOT NULL AND amount_sats > 0)
  ),
  CONSTRAINT valid_signature CHECK (
    support_type != 'signature' OR display_name IS NOT NULL
  ),
  CONSTRAINT valid_message CHECK (
    support_type != 'message' OR message IS NOT NULL
  ),
  CONSTRAINT valid_reaction CHECK (
    support_type != 'reaction' OR reaction_emoji IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_project_support_project_id ON project_support(project_id);
CREATE INDEX idx_project_support_user_id ON project_support(user_id);
CREATE INDEX idx_project_support_type ON project_support(support_type);
CREATE INDEX idx_project_support_created_at ON project_support(created_at DESC);
CREATE INDEX idx_project_support_project_type ON project_support(project_id, support_type);

-- Aggregated support stats (for quick queries)
CREATE TABLE project_support_stats (
  project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  total_bitcoin_sats bigint DEFAULT 0,
  total_signatures integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  total_reactions integer DEFAULT 0,
  total_supporters integer DEFAULT 0, -- Unique users who supported
  last_support_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to update support stats
CREATE OR REPLACE FUNCTION update_project_support_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_support_stats (project_id, total_bitcoin_sats, total_signatures, total_messages, total_reactions, total_supporters, last_support_at)
  VALUES (
    NEW.project_id,
    CASE WHEN NEW.support_type = 'bitcoin_donation' THEN NEW.amount_sats ELSE 0 END,
    CASE WHEN NEW.support_type = 'signature' THEN 1 ELSE 0 END,
    CASE WHEN NEW.support_type = 'message' THEN 1 ELSE 0 END,
    CASE WHEN NEW.support_type = 'reaction' THEN 1 ELSE 0 END,
    1,
    NEW.created_at
  )
  ON CONFLICT (project_id) DO UPDATE SET
    total_bitcoin_sats = project_support_stats.total_bitcoin_sats + 
      CASE WHEN NEW.support_type = 'bitcoin_donation' THEN NEW.amount_sats ELSE 0 END,
    total_signatures = project_support_stats.total_signatures + 
      CASE WHEN NEW.support_type = 'signature' THEN 1 ELSE 0 END,
    total_messages = project_support_stats.total_messages + 
      CASE WHEN NEW.support_type = 'message' THEN 1 ELSE 0 END,
    total_reactions = project_support_stats.total_reactions + 
      CASE WHEN NEW.support_type = 'reaction' THEN 1 ELSE 0 END,
    total_supporters = (
      SELECT COUNT(DISTINCT user_id) 
      FROM project_support 
      WHERE project_id = NEW.project_id AND user_id IS NOT NULL
    ),
    last_support_at = NEW.created_at,
    updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on insert
CREATE TRIGGER project_support_stats_trigger
AFTER INSERT ON project_support
FOR EACH ROW EXECUTE FUNCTION update_project_support_stats();

-- RLS Policies
ALTER TABLE project_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_support_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public support (non-anonymous)
CREATE POLICY "Public support is viewable by everyone"
  ON project_support FOR SELECT
  USING (is_anonymous = false OR user_id = auth.uid());

-- Policy: Authenticated users can create support
CREATE POLICY "Authenticated users can create support"
  ON project_support FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own support
CREATE POLICY "Users can update their own support"
  ON project_support FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own support
CREATE POLICY "Users can delete their own support"
  ON project_support FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Anyone can read support stats
CREATE POLICY "Support stats are viewable by everyone"
  ON project_support_stats FOR SELECT
  USING (true);

-- Policy: Only system can update stats (via trigger)
CREATE POLICY "Only system can update stats"
  ON project_support_stats FOR UPDATE
  USING (false);


