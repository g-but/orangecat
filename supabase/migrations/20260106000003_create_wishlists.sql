-- Migration: Create Wishlists System
-- Created: 2026-01-06
-- Description: Wishlist/registry system for crowdfunding personal wants
--
-- Features:
-- - Users can create wishlists (birthday, wedding, personal, etc.)
-- - Items can reference internal entities OR external URLs
-- - Flexible wallet routing (dedicated or user's existing wallet)
-- - Proof/receipt system for transparency
-- - Like/dislike feedback with required comments on dislikes

-- =============================================================================
-- WISHLISTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'general', -- birthday, wedding, baby_shower, graduation, personal, general

  -- Visibility
  visibility TEXT NOT NULL DEFAULT 'public', -- public, unlisted (link-only), private
  is_active BOOLEAN DEFAULT true,

  -- Optional event date (e.g., wedding date, birthday)
  event_date TIMESTAMPTZ,

  -- Cover image
  cover_image_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WISHLIST ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,

  -- Item details
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Internal reference (if item is from OrangeCat)
  -- Only ONE of these should be set, or none for external items
  product_id UUID REFERENCES user_products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES user_services(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES user_assets(id) ON DELETE SET NULL,

  -- External reference (if item is from outside OrangeCat)
  external_url TEXT,
  external_source TEXT, -- amazon, etsy, custom URL, etc.

  -- Target amount
  target_amount_sats BIGINT NOT NULL,
  currency TEXT DEFAULT 'SATS', -- Original currency for display
  original_amount NUMERIC, -- Amount in original currency

  -- Funding status
  funded_amount_sats BIGINT DEFAULT 0,
  is_fully_funded BOOLEAN DEFAULT false,
  is_fulfilled BOOLEAN DEFAULT false, -- User marked as purchased

  -- Wallet routing
  -- If NULL, contributions go to user's default wallet
  dedicated_wallet_address TEXT,
  use_dedicated_wallet BOOLEAN DEFAULT false,

  -- Priority (for sorting)
  priority INTEGER DEFAULT 0, -- Higher = more wanted

  -- Allow partial contributions
  allow_partial_funding BOOLEAN DEFAULT true,

  -- Quantity (for items where you might want multiples)
  quantity_wanted INTEGER DEFAULT 1,
  quantity_received INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WISHLIST CONTRIBUTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS wishlist_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  contributor_actor_id UUID REFERENCES actors(id) ON DELETE SET NULL, -- NULL for anonymous

  -- Contribution details
  amount_sats BIGINT NOT NULL,
  message TEXT, -- Optional message from contributor
  is_anonymous BOOLEAN DEFAULT false,

  -- Payment tracking
  payment_hash TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- =============================================================================
-- WISHLIST FULFILLMENT PROOFS TABLE
-- =============================================================================
-- When a user fulfills (purchases) a wishlist item, they post proof
CREATE TABLE IF NOT EXISTS wishlist_fulfillment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,

  -- Proof type
  proof_type TEXT NOT NULL, -- receipt, screenshot, transaction, comment

  -- Content
  description TEXT NOT NULL, -- User's explanation
  image_url TEXT, -- Receipt image, screenshot
  transaction_id TEXT, -- BTC transaction ID if relevant

  -- Verification
  is_verified BOOLEAN DEFAULT false, -- Community/admin verified

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WISHLIST FEEDBACK TABLE
-- =============================================================================
-- Community feedback on fulfillment (trust/transparency scoring)
CREATE TABLE IF NOT EXISTS wishlist_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  fulfillment_proof_id UUID REFERENCES wishlist_fulfillment_proofs(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,

  -- Feedback type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike')),

  -- Comment (REQUIRED for dislikes)
  comment TEXT,

  -- Constraints
  CONSTRAINT dislike_requires_comment CHECK (
    feedback_type != 'dislike' OR comment IS NOT NULL AND length(comment) >= 10
  ),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One feedback per user per item
  UNIQUE (wishlist_item_id, actor_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_wishlists_actor_id ON wishlists(actor_id);
CREATE INDEX idx_wishlists_visibility ON wishlists(visibility) WHERE is_active = true;
CREATE INDEX idx_wishlists_type ON wishlists(type);
CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_funded ON wishlist_items(is_fully_funded, is_fulfilled);
CREATE INDEX idx_wishlist_contributions_item_id ON wishlist_contributions(wishlist_item_id);
CREATE INDEX idx_wishlist_contributions_contributor ON wishlist_contributions(contributor_actor_id);
CREATE INDEX idx_wishlist_fulfillment_proofs_item ON wishlist_fulfillment_proofs(wishlist_item_id);
CREATE INDEX idx_wishlist_feedback_item ON wishlist_feedback(wishlist_item_id);
CREATE INDEX idx_wishlist_feedback_actor ON wishlist_feedback(actor_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_fulfillment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_feedback ENABLE ROW LEVEL SECURITY;

-- Wishlists: Owner can do anything, public can view public wishlists
CREATE POLICY "wishlist_owner_all" ON wishlists
  FOR ALL USING (
    actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
  );

CREATE POLICY "wishlist_public_view" ON wishlists
  FOR SELECT USING (
    visibility = 'public' AND is_active = true
  );

CREATE POLICY "wishlist_unlisted_view" ON wishlists
  FOR SELECT USING (
    visibility = 'unlisted' AND is_active = true
  );

-- Wishlist Items: Based on parent wishlist visibility
CREATE POLICY "wishlist_items_owner" ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (
      SELECT id FROM wishlists
      WHERE actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "wishlist_items_public_view" ON wishlist_items
  FOR SELECT USING (
    wishlist_id IN (
      SELECT id FROM wishlists
      WHERE (visibility = 'public' OR visibility = 'unlisted') AND is_active = true
    )
  );

-- Contributions: Anyone can contribute to visible wishlists
CREATE POLICY "wishlist_contributions_insert" ON wishlist_contributions
  FOR INSERT WITH CHECK (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE (w.visibility = 'public' OR w.visibility = 'unlisted') AND w.is_active = true
    )
  );

CREATE POLICY "wishlist_contributions_view_own" ON wishlist_contributions
  FOR SELECT USING (
    contributor_actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
    OR wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE w.actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
    )
  );

-- Fulfillment Proofs: Owner can create, public can view
CREATE POLICY "fulfillment_proofs_owner" ON wishlist_fulfillment_proofs
  FOR ALL USING (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE w.actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "fulfillment_proofs_public_view" ON wishlist_fulfillment_proofs
  FOR SELECT USING (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE (w.visibility = 'public' OR w.visibility = 'unlisted') AND w.is_active = true
    )
  );

-- Feedback: Users can create feedback, can view all on visible wishlists
CREATE POLICY "feedback_create_own" ON wishlist_feedback
  FOR INSERT WITH CHECK (
    actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
  );

CREATE POLICY "feedback_view" ON wishlist_feedback
  FOR SELECT USING (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE (w.visibility = 'public' OR w.visibility = 'unlisted') AND w.is_active = true
    )
  );

CREATE POLICY "feedback_delete_own" ON wishlist_feedback
  FOR DELETE USING (
    actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update wishlist timestamp when modified
CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wishlists SET updated_at = NOW() WHERE id = NEW.wishlist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wishlist_item_update
  AFTER INSERT OR UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_updated_at();

-- Update funded amount when contribution is added
CREATE OR REPLACE FUNCTION update_wishlist_item_funding()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'completed' THEN
    UPDATE wishlist_items
    SET
      funded_amount_sats = funded_amount_sats + NEW.amount_sats,
      is_fully_funded = (funded_amount_sats + NEW.amount_sats >= target_amount_sats),
      updated_at = NOW()
    WHERE id = NEW.wishlist_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contribution_funding
  AFTER INSERT ON wishlist_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_item_funding();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View: Wishlist with stats
CREATE OR REPLACE VIEW wishlist_with_stats AS
SELECT
  w.*,
  COUNT(DISTINCT wi.id) as item_count,
  COUNT(DISTINCT wi.id) FILTER (WHERE wi.is_fully_funded) as funded_item_count,
  COUNT(DISTINCT wi.id) FILTER (WHERE wi.is_fulfilled) as fulfilled_item_count,
  COALESCE(SUM(wi.target_amount_sats), 0) as total_target_sats,
  COALESCE(SUM(wi.funded_amount_sats), 0) as total_funded_sats
FROM wishlists w
LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
GROUP BY w.id;

-- View: Wishlist item with contribution stats
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

COMMENT ON TABLE wishlists IS 'Personal registries/wishlists for crowdfunding wants';
COMMENT ON TABLE wishlist_items IS 'Items on a wishlist - can be internal or external';
COMMENT ON TABLE wishlist_contributions IS 'Contributions/funding toward wishlist items';
COMMENT ON TABLE wishlist_fulfillment_proofs IS 'Proof that wishlist items were purchased as promised';
COMMENT ON TABLE wishlist_feedback IS 'Community feedback on fulfillment - likes increase trust, dislikes require explanation';
