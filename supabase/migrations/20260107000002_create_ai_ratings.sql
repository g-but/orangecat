-- AI Assistant Ratings System
-- Allows users to rate and review AI assistants

-- Ratings table
CREATE TABLE IF NOT EXISTS ai_assistant_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assistant_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_ratings_assistant_id ON ai_assistant_ratings(assistant_id);
CREATE INDEX IF NOT EXISTS idx_ai_ratings_user_id ON ai_assistant_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_ratings_rating ON ai_assistant_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ai_ratings_created_at ON ai_assistant_ratings(created_at DESC);

-- Enable RLS
ALTER TABLE ai_assistant_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view ratings (public)
CREATE POLICY "Anyone can view ratings"
  ON ai_assistant_ratings
  FOR SELECT
  USING (true);

-- Authenticated users can create ratings
CREATE POLICY "Authenticated users can create ratings"
  ON ai_assistant_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON ai_assistant_ratings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON ai_assistant_ratings
  FOR DELETE
  USING (user_id = auth.uid());

-- Add aggregate rating fields to ai_assistants if not exist
DO $$
BEGIN
  -- Add average_rating column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_assistants' AND column_name = 'average_rating') THEN
    ALTER TABLE ai_assistants ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0;
  END IF;

  -- Add total_ratings column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_assistants' AND column_name = 'total_ratings') THEN
    ALTER TABLE ai_assistants ADD COLUMN total_ratings INT DEFAULT 0;
  END IF;
END $$;

-- Function to update assistant rating aggregates
CREATE OR REPLACE FUNCTION update_assistant_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating DECIMAL(2,1);
  v_total_ratings INT;
BEGIN
  -- Calculate new aggregates
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    COUNT(*)
  INTO v_avg_rating, v_total_ratings
  FROM ai_assistant_ratings
  WHERE assistant_id = COALESCE(NEW.assistant_id, OLD.assistant_id);

  -- Update assistant
  UPDATE ai_assistants
  SET
    average_rating = v_avg_rating,
    total_ratings = v_total_ratings,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.assistant_id, OLD.assistant_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS trigger_update_rating_stats_insert ON ai_assistant_ratings;
CREATE TRIGGER trigger_update_rating_stats_insert
  AFTER INSERT ON ai_assistant_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_rating_stats();

DROP TRIGGER IF EXISTS trigger_update_rating_stats_update ON ai_assistant_ratings;
CREATE TRIGGER trigger_update_rating_stats_update
  AFTER UPDATE ON ai_assistant_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_rating_stats();

DROP TRIGGER IF EXISTS trigger_update_rating_stats_delete ON ai_assistant_ratings;
CREATE TRIGGER trigger_update_rating_stats_delete
  AFTER DELETE ON ai_assistant_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_rating_stats();
