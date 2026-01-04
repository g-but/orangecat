-- Add is_public to group_proposals and create contracts table + RLS

-- 1) Add is_public to group_proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_proposals' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE group_proposals ADD COLUMN is_public boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for public proposals
CREATE INDEX IF NOT EXISTS idx_group_proposals_is_public ON group_proposals(is_public) WHERE is_public = true;

-- Allow public read when is_public = true
DO $$
BEGIN
  -- Create or replace a policy that allows public read for public proposals
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'group_proposals' AND policyname = 'Public can view public proposals'
  ) THEN
    CREATE POLICY "Public can view public proposals" ON group_proposals
      FOR SELECT USING (is_public = true);
  END IF;
END $$;

-- 2) Create contracts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contracts'
  ) THEN
    CREATE TABLE contracts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      party_a_actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
      party_b_actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
      contract_type text NOT NULL CHECK (contract_type IN (
        'employment','service','rental','partnership','membership'
      )),
      terms jsonb NOT NULL DEFAULT '{}',
      status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft','proposed','active','completed','terminated','cancelled'
      )),
      proposal_id uuid REFERENCES group_proposals(id) ON DELETE SET NULL,
      created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      activated_at timestamptz,
      completed_at timestamptz,
      terminated_at timestamptz
    );
  END IF;
END $$;

-- Indexes for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_party_a ON contracts(party_a_actor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_party_b ON contracts(party_b_actor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);

-- Enable RLS if not already
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'contracts' AND n.nspname = 'public' AND c.relrowsecurity
  ) THEN
    ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy: Users can view contracts where they or their groups are parties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Users can view their contracts'
  ) THEN
    CREATE POLICY "Users can view their contracts" ON contracts FOR SELECT
    USING (
      party_a_actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()) OR
      party_b_actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()) OR
      party_a_actor_id IN (
        SELECT id FROM actors WHERE group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
      ) OR
      party_b_actor_id IN (
        SELECT id FROM actors WHERE group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- Policy: Users can create contracts they initiate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Users can create contracts'
  ) THEN
    CREATE POLICY "Users can create contracts" ON contracts FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- Policy: Users can update their draft contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Users can update their contracts'
  ) THEN
    CREATE POLICY "Users can update their contracts" ON contracts FOR UPDATE
    USING (created_by = auth.uid() AND status = 'draft');
  END IF;
END $$;
-- Add is_public to group_proposals and create contracts table + RLS

-- 1) Add is_public to group_proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_proposals' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE group_proposals ADD COLUMN is_public boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for public proposals
CREATE INDEX IF NOT EXISTS idx_group_proposals_is_public ON group_proposals(is_public) WHERE is_public = true;

-- Allow public read when is_public = true
DO $$
BEGIN
  -- Create or replace a policy that allows public read for public proposals
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'group_proposals' AND policyname = 'Public can view public proposals'
  ) THEN
    CREATE POLICY "Public can view public proposals" ON group_proposals
      FOR SELECT USING (is_public = true);
  END IF;
END $$;

-- 2) Create contracts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contracts'
  ) THEN
    CREATE TABLE contracts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      party_a_actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
      party_b_actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
      contract_type text NOT NULL CHECK (contract_type IN (
        'employment','service','rental','partnership','membership'
      )),
      terms jsonb NOT NULL DEFAULT '{}',
      status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft','proposed','active','completed','terminated','cancelled'
      )),
      proposal_id uuid REFERENCES group_proposals(id) ON DELETE SET NULL,
      created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      activated_at timestamptz,
      completed_at timestamptz,
      terminated_at timestamptz
    );
  END IF;
END $$;

-- Indexes for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_party_a ON contracts(party_a_actor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_party_b ON contracts(party_b_actor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);

-- Enable RLS if not already
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'contracts' AND n.nspname = 'public' AND c.relrowsecurity
  ) THEN
    ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy: Users can view contracts where they or their groups are parties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Users can view their contracts'
  ) THEN
    CREATE POLICY "Users can view their contracts" ON contracts FOR SELECT
    USING (
      party_a_actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()) OR
      party_b_actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()) OR
      party_a_actor_id IN (
        SELECT id FROM actors WHERE group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
      ) OR
      party_b_actor_id IN (
        SELECT id FROM actors WHERE group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- Policy: Users can create contracts they initiate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Users can create contracts'
  ) THEN
    CREATE POLICY "Users can create contracts" ON contracts FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- Policy: Users can update their draft contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Users can update their contracts'
  ) THEN
    CREATE POLICY "Users can update their contracts" ON contracts FOR UPDATE
    USING (created_by = auth.uid() AND status = 'draft');
  END IF;
END $$;

