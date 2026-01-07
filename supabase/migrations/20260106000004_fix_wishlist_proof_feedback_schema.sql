-- Migration: Fix Wishlist Proof and Feedback Schema
-- Created: 2026-01-06
-- Description: Add missing user_id fields and fix feedback constraints
--
-- Issues fixed:
-- 1. Add user_id to wishlist_fulfillment_proofs table
-- 2. Change actor_id to user_id in wishlist_feedback table
-- 3. Update unique constraint for feedback table
-- 4. Add proper RLS policies for user_id based access

-- =============================================================================
-- FIX WISHLIST FULFILLMENT PROOFS TABLE
-- =============================================================================

-- Add user_id column to wishlist_fulfillment_proofs
ALTER TABLE wishlist_fulfillment_proofs
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set user_id for existing records (if any) - this will need to be done manually
-- UPDATE wishlist_fulfillment_proofs SET user_id = (SELECT actor_id FROM wishlists WHERE id = wishlist_item_id);

-- Make user_id NOT NULL after data migration
ALTER TABLE wishlist_fulfillment_proofs
ALTER COLUMN user_id SET NOT NULL;

-- Add index on user_id
CREATE INDEX idx_wishlist_fulfillment_proofs_user ON wishlist_fulfillment_proofs(user_id);

-- =============================================================================
-- FIX WISHLIST FEEDBACK TABLE
-- =============================================================================

-- Add user_id column to wishlist_feedback
ALTER TABLE wishlist_feedback
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Copy data from actor_id to user_id (assuming actors.user_id relationship)
UPDATE wishlist_feedback
SET user_id = actors.user_id
FROM actors
WHERE wishlist_feedback.actor_id = actors.id;

-- Make user_id NOT NULL
ALTER TABLE wishlist_feedback
ALTER COLUMN user_id SET NOT NULL;

-- Drop old unique constraint
DROP CONSTRAINT IF EXISTS wishlist_feedback_wishlist_item_id_actor_id_key;

-- Add new unique constraint using user_id and fulfillment_proof_id
ALTER TABLE wishlist_feedback
ADD CONSTRAINT wishlist_feedback_unique_user_proof UNIQUE (fulfillment_proof_id, user_id);

-- Add indexes
CREATE INDEX idx_wishlist_feedback_user ON wishlist_feedback(user_id);
CREATE INDEX idx_wishlist_feedback_proof_user ON wishlist_feedback(fulfillment_proof_id, user_id);

-- Drop old actor_id column
ALTER TABLE wishlist_feedback
DROP COLUMN actor_id;

-- Update RLS policies to use user_id instead of actor_id
DROP POLICY IF EXISTS "feedback_create_own" ON wishlist_feedback;
DROP POLICY IF EXISTS "feedback_delete_own" ON wishlist_feedback;

CREATE POLICY "feedback_create_own" ON wishlist_feedback
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "feedback_delete_own" ON wishlist_feedback
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- =============================================================================
-- UPDATE CONSTRAINTS
-- =============================================================================

-- Update feedback constraint to reference user_id instead of actor_id
ALTER TABLE wishlist_feedback
DROP CONSTRAINT IF EXISTS wishlist_feedback_actor_id_fkey,
ADD CONSTRAINT wishlist_feedback_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================================================
-- UPDATE VIEWS
-- =============================================================================

-- Update wishlist_item_with_stats view to use user_id
CREATE OR REPLACE VIEW wishlist_item_with_stats AS
SELECT
  wi.*,
  COUNT(DISTINCT wc.id) as contribution_count,
  COUNT(DISTINCT wc.contributor_actor_id) as contributor_count,
  COUNT(DISTINCT wf.id) FILTER (WHERE wf.feedback_type = 'like') as like_count,
  COUNT(DISTINCT wf.id) FILTER (WHERE wf.feedback_type = 'dislike') as dislike_count
FROM wishlist_items wi
LEFT JOIN wishlist_contributions wc ON wc.wishlist_item_id = wi.id AND wc.payment_status = 'completed'
LEFT JOIN wishlist_feedback wf ON wf.wishlist_item_id = wi.id
GROUP BY wi.id;