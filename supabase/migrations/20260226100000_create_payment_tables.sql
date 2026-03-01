-- Migration: Create payment flow tables
-- Tables: payment_intents, orders, contributions, shipping_addresses
-- Also adds nwc_connection_uri to wallets table
-- NOTE: Written idempotently (was partially applied in earlier runs)

-- =====================================================================
-- ALTER WALLETS TABLE
-- =====================================================================

ALTER TABLE wallets ADD COLUMN IF NOT EXISTS nwc_connection_uri text;

-- =====================================================================
-- SHIPPING ADDRESSES
-- =====================================================================

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  full_name text NOT NULL,
  street text NOT NULL,
  street2 text,
  city text NOT NULL,
  state text,
  postal_code text NOT NULL,
  country_code text NOT NULL DEFAULT 'CH',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user ON shipping_addresses(user_id);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own addresses" ON shipping_addresses
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- PAYMENT INTENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  amount_sats bigint NOT NULL CHECK (amount_sats > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('nwc', 'lightning_address', 'onchain')),
  bolt11 text,
  payment_hash text,
  onchain_address text,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'invoice_ready', 'paid', 'expired', 'failed', 'buyer_confirmed')),
  description text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_buyer ON payment_intents(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_seller ON payment_intents(seller_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_entity ON payment_intents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Buyers view own payments" ON payment_intents
    FOR SELECT USING (buyer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Sellers view incoming payments" ON payment_intents
    FOR SELECT USING (seller_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users create payments" ON payment_intents
    FOR INSERT WITH CHECK (buyer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Buyers update own payments" ON payment_intents
    FOR UPDATE USING (buyer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- ORDERS
-- =====================================================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id uuid NOT NULL REFERENCES payment_intents(id),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  amount_sats bigint NOT NULL,
  entity_title text NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),
  shipping_address_id uuid REFERENCES shipping_addresses(id),
  tracking_number text,
  tracking_url text,
  buyer_note text,
  seller_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_entity ON orders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Buyers view own orders" ON orders
    FOR SELECT USING (buyer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Sellers view incoming orders" ON orders
    FOR SELECT USING (seller_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users create orders" ON orders
    FOR INSERT WITH CHECK (buyer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Buyers update own orders" ON orders
    FOR UPDATE USING (buyer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Sellers update their orders" ON orders
    FOR UPDATE USING (seller_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- CONTRIBUTIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id uuid NOT NULL REFERENCES payment_intents(id),
  contributor_id uuid NOT NULL REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  amount_sats bigint NOT NULL CHECK (amount_sats > 0),
  message text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON contributions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contributions_entity ON contributions(entity_type, entity_id);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Contributors view own" ON contributions
    FOR SELECT USING (contributor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public view non-anonymous" ON contributions
    FOR SELECT USING (is_anonymous = false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users create contributions" ON contributions
    FOR INSERT WITH CHECK (contributor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Entity owners view all contributions" ON contributions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM actors a
        WHERE a.user_id = auth.uid()
        AND (
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- UPDATED_AT TRIGGERS
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_payment_intents_updated_at
    BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_shipping_addresses_updated_at
    BEFORE UPDATE ON shipping_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
