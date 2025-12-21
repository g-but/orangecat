const { Client } = require('pg');

// Local Supabase database connection
const client = new Client({
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

async function createTablesDirectly() {
  try {
    await client.connect();
    console.log('Connected to local Supabase database');

    // Create loans table first (simplified version)
    console.log('Creating loans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        title text NOT NULL CHECK (char_length(title) <= 200),
        description text CHECK (char_length(description) <= 2000),
        original_amount numeric(15,8) NOT NULL CHECK (original_amount > 0),
        remaining_balance numeric(15,8) NOT NULL CHECK (remaining_balance >= 0),
        interest_rate numeric(5,2) CHECK (interest_rate >= 0 AND interest_rate <= 100),
        monthly_payment numeric(15,8),
        currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'BTC', 'SATS')),
        status text DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'refinanced', 'defaulted', 'cancelled')),
        is_public boolean DEFAULT true,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
      );
    `);

    // Create indexes for loans
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status, created_at DESC);
    `);

    console.log('Loans table created successfully!');

    // Now create assets table
    console.log('Creating assets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.assets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('real_estate', 'business', 'vehicle', 'equipment', 'securities', 'other')),
        title TEXT NOT NULL CHECK (char_length(title) <= 100),
        description TEXT NULL,
        location TEXT NULL,
        estimated_value NUMERIC NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        documents JSONB NULL,
        verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'user_provided', 'third_party_verified')),
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
        public_visibility BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Create loan_collateral table
    console.log('Creating loan_collateral table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.loan_collateral (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
        owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        pledged_value NUMERIC NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'released')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assets_owner ON public.assets(owner_id);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
      CREATE INDEX IF NOT EXISTS idx_assets_visibility ON public.assets(public_visibility);
      CREATE INDEX IF NOT EXISTS idx_loan_collateral_loan ON public.loan_collateral(loan_id);
      CREATE INDEX IF NOT EXISTS idx_loan_collateral_owner ON public.loan_collateral(owner_id);
    `);

    // Enable RLS
    await client.query(`
      ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.loan_collateral ENABLE ROW LEVEL SECURITY;
    `);

    // Create RLS policies
    await client.query(`
      DROP POLICY IF EXISTS assets_owner_select ON public.assets;
      CREATE POLICY assets_owner_select ON public.assets
        FOR SELECT USING (auth.uid() = owner_id);

      DROP POLICY IF EXISTS assets_owner_insert ON public.assets;
      CREATE POLICY assets_owner_insert ON public.assets
        FOR INSERT WITH CHECK (auth.uid() = owner_id);

      DROP POLICY IF EXISTS assets_owner_update ON public.assets;
      CREATE POLICY assets_owner_update ON public.assets
        FOR UPDATE USING (auth.uid() = owner_id)
        WITH CHECK (auth.uid() = owner_id);

      DROP POLICY IF EXISTS assets_owner_delete ON public.assets;
      CREATE POLICY assets_owner_delete ON public.assets
        FOR DELETE USING (auth.uid() = owner_id);

      DROP POLICY IF EXISTS loan_collateral_owner_select ON public.loan_collateral;
      CREATE POLICY loan_collateral_owner_select ON public.loan_collateral
        FOR SELECT USING (auth.uid() = owner_id);

      DROP POLICY IF EXISTS loan_collateral_owner_insert ON public.loan_collateral;
      CREATE POLICY loan_collateral_owner_insert ON public.loan_collateral
        FOR INSERT WITH CHECK (auth.uid() = owner_id);

      DROP POLICY IF EXISTS loan_collateral_owner_delete ON public.loan_collateral;
      CREATE POLICY loan_collateral_owner_delete ON public.loan_collateral
        FOR DELETE USING (auth.uid() = owner_id);
    `);

    console.log('All tables created successfully!');

    // Test the tables
    const assetsResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('assets', 'loans', 'loan_collateral')
    `);

    console.log('Created tables:');
    assetsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

  } catch (error) {
    console.error('Table creation failed:', error);
  } finally {
    await client.end();
  }
}

createTablesDirectly();
































