-- Migration: Create payment flow tables
-- Tables: payment_intents, orders, contributions, shipping_addresses
-- Also adds nwc_connection_uri to wallets table

-- =====================================================================
-- ALTER WALLETS TABLE
-- =====================================================================

-- Encrypted NWC connection URI (AES-256-GCM encrypted at app layer)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS nwc_connection_uri text;

-- =====================================================================
-- SHIPPING ADDRESSES
-- =====================================================================

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text, -- e.g. "Home", "Office"
  full_name text NOT NULL,
  street text NOT NULL,
  street2 text,
  city text NOT NULL,
  state text,
  postal_code text NOT NULL,
  country_code text NOT NULL DEFAULT 'CH', -- ISO 3166-1 alpha-2
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses" ON shipping_addresses
  FOR ALL USING (user_id = auth.uid());

-- =====================================================================
-- PAYMENT INTENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),

  -- What is being paid for
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,

  -- Amount
  amount_sats bigint NOT NULL CHECK (amount_sats > 0),

  -- Payment method resolved at creation
  payment_method text NOT NULL CHECK (payment_method IN ('nwc', 'lightning_address', 'onchain')),

  -- Invoice data (populated after creation)
  bolt11 text,           -- Lightning invoice string
  payment_hash text,     -- Lightning payment hash (for NWC lookup)
  onchain_address text,  -- BTC address for on-chain

  -- Lifecycle
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'invoice_ready', 'paid', 'expired', 'failed', 'buyer_confirmed')),

  -- Metadata
  description text,
  expires_at timestamptz,
  paid_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payment_intents_buyer ON payment_intents(buyer_id);
CREATE INDEX idx_payment_intents_seller ON payment_intents(seller_id);
CREATE INDEX idx_payment_intents_entity ON payment_intents(entity_type, entity_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Buyers see their own payments
CREATE POLICY "Buyers view own payments" ON payment_intents
  FOR SELECT USING (buyer_id = auth.uid());

-- Sellers see payments for their entities
CREATE POLICY "Sellers view incoming payments" ON payment_intents
  FOR SELECT USING (seller_id = auth.uid());

-- Only server (service role) creates payment intents via API
-- Authenticated users can create via API route (which validates)
CREATE POLICY "Authenticated users create payments" ON payment_intents
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Status updates happen server-side, but allow buyer to update their own
CREATE POLICY "Buyers update own payments" ON payment_intents
  FOR UPDATE USING (buyer_id = auth.uid());

-- =====================================================================
-- ORDERS (for fixed-price purchases: products, services, events)
-- =====================================================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to payment
  payment_intent_id uuid NOT NULL REFERENCES payment_intents(id),

  -- Parties (denormalized for query performance)
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),

  -- What was purchased
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,

  -- Snapshot at time of purchase (prices can change)
  amount_sats bigint NOT NULL,
  entity_title text NOT NULL,

  -- Fulfillment
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),

  -- Shipping (null for digital/services)
  shipping_address_id uuid REFERENCES shipping_addresses(id),
  tracking_number text,
  tracking_url text,

  -- Notes
  buyer_note text,
  seller_note text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_payment ON orders(payment_intent_id);
CREATE INDEX idx_orders_entity ON orders(entity_type, entity_id);
CREATE INDEX idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own orders" ON orders
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Sellers view incoming orders" ON orders
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Authenticated users create orders" ON orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Buyers can update (confirm receipt), sellers can update (mark shipped)
CREATE POLICY "Buyers update own orders" ON orders
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "Sellers update their orders" ON orders
  FOR UPDATE USING (seller_id = auth.uid());

-- =====================================================================
-- CONTRIBUTIONS (for variable-amount support: projects, causes, research)
-- =====================================================================

CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to payment
  payment_intent_id uuid NOT NULL REFERENCES payment_intents(id),

  -- Supporter
  contributor_id uuid NOT NULL REFERENCES auth.users(id),

  -- What is being supported (generic: works with any entity type)
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,

  -- Amount
  amount_sats bigint NOT NULL CHECK (amount_sats > 0),

  -- Display
  message text,
  is_anonymous boolean DEFAULT false,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_contributions_contributor ON contributions(contributor_id);
CREATE INDEX idx_contributions_entity ON contributions(entity_type, entity_id);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Contributors see their own contributions
CREATE POLICY "Contributors view own" ON contributions
  FOR SELECT USING (contributor_id = auth.uid());

-- Public can see non-anonymous contributions on any entity
CREATE POLICY "Public view non-anonymous" ON contributions
  FOR SELECT USING (is_anonymous = false);

-- Authenticated users can create contributions
CREATE POLICY "Authenticated users create contributions" ON contributions
  FOR INSERT WITH CHECK (contributor_id = auth.uid());

-- Entity owners can see all contributions (including anonymous, for accounting)
-- This uses a subquery to check entity ownership via actors
CREATE POLICY "Entity owners view all contributions" ON contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM actors a
      WHERE a.user_id = auth.uid()
      AND (
        -- Check each entity table for ownership
        (contributions.entity_type = 'project' AND EXISTS (
          SELECT 1 FROM projects WHERE id = contributions.entity_id AND actor_id = a.id
        ))
        OR (contributions.entity_type = 'cause' AND EXISTS (
          SELECT 1 FROM user_causes WHERE id = contributions.entity_id AND actor_id = a.id
        ))
        OR (contributions.entity_type = 'research' AND EXISTS (
          SELECT 1 FROM research_entities WHERE id = contributions.entity_id AND user_id = auth.uid()
        ))
      )
    )
  );

-- =====================================================================
-- UPDATED_AT TRIGGERS
-- =====================================================================

-- Reusable trigger function (may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payment_intents_updated_at
  BEFORE UPDATE ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
