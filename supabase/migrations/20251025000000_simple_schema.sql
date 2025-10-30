-- Simple OrangeCat Schema
-- Only 3 tables: people (profiles), projects, transactions

-- =====================================================================
-- PEOPLE TABLE (profiles)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  website TEXT,
  bitcoin_address TEXT,
  lightning_address TEXT,
  verification_status TEXT DEFAULT 'unverified',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- PROJECTS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_amount NUMERIC(20,8),
  goal_currency TEXT DEFAULT 'BTC',
  funding_purpose TEXT,
  current_amount NUMERIC(20,8) DEFAULT 0,
  currency TEXT DEFAULT 'BTC',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  organization_id UUID,
  bitcoin_address TEXT,
  lightning_address TEXT,
  featured BOOLEAN DEFAULT FALSE,
  start_date TIMESTAMP WITH TIME ZONE,
  target_completion TIMESTAMP WITH TIME ZONE,
  category TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- TRANSACTIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount_sats BIGINT NOT NULL,
  currency TEXT DEFAULT 'BTC',
  from_entity_type TEXT NOT NULL CHECK (from_entity_type IN ('profile', 'project', 'organization')),
  from_entity_id UUID NOT NULL,
  to_entity_type TEXT NOT NULL CHECK (to_entity_type IN ('profile', 'project', 'organization')),
  to_entity_id UUID NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bitcoin', 'lightning')),
  transaction_hash TEXT,
  lightning_payment_hash TEXT,
  payment_proof TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'confirmed')),
  fee_sats BIGINT DEFAULT 0,
  exchange_rate NUMERIC(20,8),
  anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  purpose TEXT,
  tags TEXT[],
  public_visibility BOOLEAN DEFAULT TRUE,
  audit_trail JSONB,
  verification_status TEXT,
  initiated_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_projects_creator ON public.projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON public.transactions(from_entity_id, from_entity_type);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON public.transactions(to_entity_id, to_entity_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Public read access for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Users can manage their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Public read access for projects
CREATE POLICY "Projects are viewable by everyone" ON public.projects
  FOR SELECT USING (true);

-- Users can create their own projects
CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = creator_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = creator_id);

-- Transactions are viewable by creator
CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (
    auth.uid() = from_entity_id::UUID OR 
    auth.uid() = to_entity_id::UUID
  );

-- Users can create transactions
CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = from_entity_id::UUID);

-- =====================================================================
-- AUTO-UPDATE TRIGGERS
-- =====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- INITIAL USER FUNCTION
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

