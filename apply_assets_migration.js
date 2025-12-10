const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAssetsMigration() {
  try {
    console.log('Applying assets migration...');

    // SQL for creating assets table
    const assetsSQL = `
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
    `;

    // SQL for creating loan_collateral table
    const collateralSQL = `
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
    `;

    // Apply assets table
    console.log('Creating assets table...');
    const { error: assetsError } = await supabase.rpc('exec_sql', { sql: assetsSQL });
    if (assetsError) {
      console.error('Assets table error:', assetsError);
    } else {
      console.log('Assets table created successfully');
    }

    // Apply collateral table
    console.log('Creating loan_collateral table...');
    const { error: collateralError } = await supabase.rpc('exec_sql', { sql: collateralSQL });
    if (collateralError) {
      console.error('Collateral table error:', collateralError);
    } else {
      console.log('Loan collateral table created successfully');
    }

    // Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_assets_owner ON public.assets(owner_id);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
      CREATE INDEX IF NOT EXISTS idx_assets_visibility ON public.assets(public_visibility);
      CREATE INDEX IF NOT EXISTS idx_loan_collateral_loan ON public.loan_collateral(loan_id);
      CREATE INDEX IF NOT EXISTS idx_loan_collateral_owner ON public.loan_collateral(owner_id);
    `;

    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    if (indexError) {
      console.error('Index creation error:', indexError);
    } else {
      console.log('Indexes created successfully');
    }

    console.log('Migration completed!');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

applyAssetsMigration();















