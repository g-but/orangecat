-- ============================================================================
-- PERSONAL ECONOMY FEATURES MIGRATION - December 2025
-- ============================================================================
-- This migration adds tables for the personal economy vision:
-- 1. user_products - For selling physical/digital goods (My Store)
-- 2. user_services - For offering professional services (My Services)
-- 3. user_causes - For charity fundraising (My Causes)
-- 4. user_ai_assistants - For AI digital twins (My Cat)
-- ============================================================================

-- ============================================================================
-- 1. USER PRODUCTS TABLE (My Store/My Products)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Product details
  title text NOT NULL,
  description text,
  price_sats bigint NOT NULL CHECK (price_sats > 0),
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),

  -- Product type (physical/digital/service)
  product_type text DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital', 'service')),

  -- Media
  images text[] DEFAULT '{}', -- Array of image URLs
  thumbnail_url text,

  -- Inventory & fulfillment
  inventory_count integer DEFAULT -1, -- -1 = unlimited digital
  fulfillment_type text DEFAULT 'manual' CHECK (fulfillment_type IN ('manual', 'automatic', 'digital')),

  -- Categories & tags
  category text,
  tags text[] DEFAULT '{}',

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'sold_out')),
  is_featured boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. USER SERVICES TABLE (My Services)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Service details
  title text NOT NULL,
  description text,
  category text NOT NULL, -- "massage_therapy", "handyman", "consulting", etc.

  -- Pricing
  hourly_rate_sats bigint,
  fixed_price_sats bigint,
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),

  -- Scheduling
  duration_minutes integer, -- Typical session length
  availability_schedule jsonb, -- Complex availability rules

  -- Location & delivery
  service_location_type text DEFAULT 'remote' CHECK (service_location_type IN ('remote', 'onsite', 'both')),
  service_area text, -- Geographic coverage

  -- Media & portfolio
  images text[] DEFAULT '{}',
  portfolio_links text[] DEFAULT '{}',

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'unavailable')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure at least one pricing method is set
  CONSTRAINT pricing_required CHECK (
    hourly_rate_sats IS NOT NULL OR fixed_price_sats IS NOT NULL
  )
);

-- ============================================================================
-- 3. USER CAUSES TABLE (My Causes - Enhanced Projects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_causes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Cause details
  title text NOT NULL,
  description text,
  cause_category text NOT NULL, -- "animal_shelters", "environment", "education", etc.

  -- Fundraising goal
  goal_sats bigint,
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),

  -- Wallet (inherits from user but can be cause-specific)
  bitcoin_address text,
  lightning_address text,

  -- Distribution rules
  distribution_rules jsonb, -- How funds are distributed to beneficiaries

  -- Beneficiaries
  beneficiaries jsonb DEFAULT '[]', -- Array of {name, percentage, wallet_address}

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),

  -- Transparency
  total_raised_sats bigint DEFAULT 0,
  total_distributed_sats bigint DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. USER AI ASSISTANTS TABLE (My Cat - Coming Soon)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_ai_assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- AI Configuration
  assistant_name text DEFAULT 'My Cat',
  personality_prompt text,
  training_data jsonb DEFAULT '{}', -- User preferences, conversation history

  -- Status
  status text DEFAULT 'coming_soon' CHECK (status IN ('coming_soon', 'training', 'active', 'paused')),
  is_enabled boolean DEFAULT false,

  -- Settings
  response_style text DEFAULT 'friendly',
  allowed_topics text[] DEFAULT '{}',
  blocked_topics text[] DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_status ON user_products(status);
CREATE INDEX IF NOT EXISTS idx_user_products_category ON user_products(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_products_featured ON user_products(is_featured) WHERE is_featured = true;

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_category ON user_services(category);
CREATE INDEX IF NOT EXISTS idx_user_services_status ON user_services(status);
CREATE INDEX IF NOT EXISTS idx_user_services_location_type ON user_services(service_location_type);

-- Causes indexes
CREATE INDEX IF NOT EXISTS idx_user_causes_user_id ON user_causes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_causes_category ON user_causes(cause_category);
CREATE INDEX IF NOT EXISTS idx_user_causes_status ON user_causes(status);

-- AI Assistants indexes
CREATE INDEX IF NOT EXISTS idx_user_ai_assistants_user_id ON user_ai_assistants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_assistants_status ON user_ai_assistants(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_assistants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

-- Anyone can view active products
CREATE POLICY "Public products are viewable by everyone"
  ON user_products FOR SELECT
  USING (status = 'active');

-- Users can manage their own products
CREATE POLICY "Users can insert their own products"
  ON user_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON user_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON user_products FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SERVICES POLICIES
-- ============================================================================

-- Anyone can view active services
CREATE POLICY "Public services are viewable by everyone"
  ON user_services FOR SELECT
  USING (status = 'active');

-- Users can manage their own services
CREATE POLICY "Users can insert their own services"
  ON user_services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON user_services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON user_services FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CAUSES POLICIES
-- ============================================================================

-- Anyone can view active causes
CREATE POLICY "Public causes are viewable by everyone"
  ON user_causes FOR SELECT
  USING (status = 'active');

-- Users can manage their own causes
CREATE POLICY "Users can insert their own causes"
  ON user_causes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own causes"
  ON user_causes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own causes"
  ON user_causes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI ASSISTANTS POLICIES
-- ============================================================================

-- Users can only manage their own AI assistants
CREATE POLICY "Users can view their own AI assistants"
  ON user_ai_assistants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI assistants"
  ON user_ai_assistants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI assistants"
  ON user_ai_assistants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI assistants"
  ON user_ai_assistants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_products_updated_at
  BEFORE UPDATE ON user_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_services_updated_at
  BEFORE UPDATE ON user_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_causes_updated_at
  BEFORE UPDATE ON user_causes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_assistants_updated_at
  BEFORE UPDATE ON user_ai_assistants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of new tables:
-- ✅ user_products - Complete product catalog with inventory and fulfillment
-- ✅ user_services - Service offerings with scheduling and pricing
-- ✅ user_causes - Charity fundraising with beneficiary management
-- ✅ user_ai_assistants - AI assistant configuration (coming soon)
-- ✅ RLS policies for proper access control
-- ✅ Performance indexes for efficient queries
-- ✅ Automatic timestamp updates




























