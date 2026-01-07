-- =============================================================================
-- WISHLIST FULFILLMENT PROOFS TABLE
-- =============================================================================
-- Stores proof of purchase/fulfillment for wishlist items
-- Created: 2026-01-07
-- Last Modified: 2026-01-07
-- Last Modified Summary: Created wishlist fulfillment proofs and feedback tables

CREATE TABLE IF NOT EXISTS wishlist_fulfillment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('receipt', 'screenshot', 'transaction', 'comment')),
  description TEXT NOT NULL,
  image_url TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_proofs_item_id ON wishlist_fulfillment_proofs(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_proofs_user_id ON wishlist_fulfillment_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_proofs_created_at ON wishlist_fulfillment_proofs(created_at DESC);

-- =============================================================================
-- WISHLIST FEEDBACK TABLE
-- =============================================================================
-- Stores like/dislike feedback on wishlist items and proofs
-- Created: 2026-01-07
-- Last Modified: 2026-01-07
-- Last Modified Summary: Created wishlist feedback table

CREATE TABLE IF NOT EXISTS wishlist_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  fulfillment_proof_id UUID REFERENCES wishlist_fulfillment_proofs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (fulfillment_proof_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_feedback_item_id ON wishlist_feedback(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_feedback_proof_id ON wishlist_feedback(fulfillment_proof_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_feedback_user_id ON wishlist_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_feedback_type ON wishlist_feedback(feedback_type);

-- Enable RLS
ALTER TABLE wishlist_fulfillment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist_fulfillment_proofs
-- Anyone can view proofs
CREATE POLICY "Anyone can view wishlist proofs"
  ON wishlist_fulfillment_proofs
  FOR SELECT
  USING (true);

-- Only the creator can insert proofs
CREATE POLICY "Users can create their own proofs"
  ON wishlist_fulfillment_proofs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the creator can update their proofs
CREATE POLICY "Users can update their own proofs"
  ON wishlist_fulfillment_proofs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only the creator can delete their proofs
CREATE POLICY "Users can delete their own proofs"
  ON wishlist_fulfillment_proofs
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wishlist_feedback
-- Anyone can view feedback
CREATE POLICY "Anyone can view wishlist feedback"
  ON wishlist_feedback
  FOR SELECT
  USING (true);

-- Authenticated users can create feedback
CREATE POLICY "Authenticated users can create feedback"
  ON wishlist_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
  ON wishlist_feedback
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback"
  ON wishlist_feedback
  FOR DELETE
  USING (auth.uid() = user_id);
