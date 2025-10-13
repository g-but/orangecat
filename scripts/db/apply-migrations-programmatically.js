const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('🔧 Applying database migrations programmatically...');
  
  try {
    // Apply migration: Add missing profile columns
    console.log('📝 Step 1: Adding missing profile columns...');
    
    const addColumnsSql = `
      -- Add missing columns to profiles table
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bitcoin_address text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lightning_address text;
    `;
    
    const { error: columnsError } = await supabase.rpc('exec_sql', { sql: addColumnsSql });
    if (columnsError) {
      console.error('❌ Error adding columns:', columnsError.message);
      return;
    }
    console.log('✅ Profile columns added successfully');
    
    // Apply migration: Setup storage buckets
    console.log('📝 Step 2: Setting up storage buckets...');
    
    const storageSql = `
      -- Create avatars bucket if it doesn't exist
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('avatars', 'avatars', true)
      ON CONFLICT (id) DO NOTHING;
      
      -- Create banners bucket if it doesn't exist
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('banners', 'banners', true)
      ON CONFLICT (id) DO NOTHING;
      
      -- Enable RLS on storage.objects
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: storageError } = await supabase.rpc('exec_sql', { sql: storageSql });
    if (storageError) {
      console.error('❌ Error setting up storage:', storageError.message);
      return;
    }
    console.log('✅ Storage buckets configured successfully');
    
    // Apply migration: Update handle_new_user function
    console.log('📝 Step 3: Updating handle_new_user function...');
    
    const functionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
        VALUES (
          new.id,
          split_part(new.email, '@', 1),
          split_part(new.email, '@', 1),
          NOW(),
          NOW()
        );
        RETURN new;
      EXCEPTION
        WHEN others THEN
          RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
          RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionSql });
    if (functionError) {
      console.error('❌ Error updating function:', functionError.message);
      return;
    }
    console.log('✅ handle_new_user function updated successfully');
    
    // Apply migration: Create organizations table if it doesn't exist
    console.log('📝 Step 4: Creating organizations table...');
    
    const organizationsSql = `
      -- Create organizations table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.organizations (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        description text,
        website_url text,
        avatar_url text,
        banner_url text,
        type text NOT NULL DEFAULT 'community',
        category text,
        tags text[] DEFAULT '{}',
        governance_model text NOT NULL DEFAULT 'hierarchical',
        treasury_address text,
        is_public boolean DEFAULT true,
        requires_approval boolean DEFAULT true,
        verification_level integer DEFAULT 0,
        trust_score integer DEFAULT 0,
        settings jsonb DEFAULT '{}',
        contact_info jsonb DEFAULT '{}',
        founded_at timestamp with time zone DEFAULT NOW(),
        created_at timestamp with time zone DEFAULT NOW(),
        updated_at timestamp with time zone DEFAULT NOW()
      );
      
      -- Create memberships table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.memberships (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        role text NOT NULL DEFAULT 'member',
        permissions jsonb DEFAULT '{}',
        title text,
        status text NOT NULL DEFAULT 'active',
        joined_at timestamp with time zone DEFAULT NOW(),
        last_active_at timestamp with time zone DEFAULT NOW(),
        contribution_address text,
        total_contributions integer DEFAULT 0,
        reward_percentage integer DEFAULT 0,
        invited_by uuid REFERENCES public.profiles(id),
        invitation_token text,
        invitation_expires_at timestamp with time zone,
        bio text,
        achievements jsonb DEFAULT '[]',
        metadata jsonb DEFAULT '{}',
        created_at timestamp with time zone DEFAULT NOW(),
        updated_at timestamp with time zone DEFAULT NOW(),
        UNIQUE(organization_id, profile_id)
      );
      
      -- Create RLS policies for organizations
      ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
        FOR SELECT USING (true);
      
      CREATE POLICY "Users can create organizations" ON public.organizations
        FOR INSERT WITH CHECK (auth.uid() = profile_id);
      
      CREATE POLICY "Users can update their own organizations" ON public.organizations
        FOR UPDATE USING (auth.uid() = profile_id);
      
      CREATE POLICY "Users can delete their own organizations" ON public.organizations
        FOR DELETE USING (auth.uid() = profile_id);
      
      -- Create RLS policies for memberships
      ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Memberships are viewable by members" ON public.memberships
        FOR SELECT USING (
          auth.uid() = profile_id OR 
          EXISTS (
            SELECT 1 FROM public.memberships m 
            WHERE m.organization_id = memberships.organization_id 
            AND m.profile_id = auth.uid()
          )
        );
      
      CREATE POLICY "Organization owners can manage memberships" ON public.memberships
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.memberships m 
            WHERE m.organization_id = memberships.organization_id 
            AND m.profile_id = auth.uid() 
            AND m.role IN ('owner', 'admin')
          )
        );
    `;
    
    const { error: orgsError } = await supabase.rpc('exec_sql', { sql: organizationsSql });
    if (orgsError) {
      console.error('❌ Error creating organizations tables:', orgsError.message);
      return;
    }
    console.log('✅ Organizations and memberships tables created successfully');
    
    console.log('🎉 All migrations applied successfully!');
    
  } catch (err) {
    console.error('💥 Migration failed:', err);
  }
}

applyMigrations();