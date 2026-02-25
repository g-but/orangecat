-- Migration: Create entity_wallets junction table for wallet-entity unification
-- Links wallets to any entity type (many-to-many relationship)

-- Add lightning_address to wallets table (currently missing)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS lightning_address text;

-- Junction table: links wallets to any entity
CREATE TABLE IF NOT EXISTS entity_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(wallet_id, entity_type, entity_id)
);

CREATE INDEX idx_entity_wallets_wallet ON entity_wallets(wallet_id);
CREATE INDEX idx_entity_wallets_entity ON entity_wallets(entity_type, entity_id);

ALTER TABLE entity_wallets ENABLE ROW LEVEL SECURITY;

-- Wallet owners can manage their links
CREATE POLICY "Wallet owners can view links" ON entity_wallets
  FOR SELECT USING (wallet_id IN (SELECT id FROM wallets WHERE profile_id = auth.uid()));
CREATE POLICY "Wallet owners can create links" ON entity_wallets
  FOR INSERT WITH CHECK (wallet_id IN (SELECT id FROM wallets WHERE profile_id = auth.uid()));
CREATE POLICY "Wallet owners can delete links" ON entity_wallets
  FOR DELETE USING (wallet_id IN (SELECT id FROM wallets WHERE profile_id = auth.uid()));
-- Link creators can also view (for entity detail pages)
CREATE POLICY "Link creators can view" ON entity_wallets
  FOR SELECT USING (created_by = auth.uid());
