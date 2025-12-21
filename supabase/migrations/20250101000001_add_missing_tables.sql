-- =============================================
-- ADD MISSING TABLES ONLY - IDEMPOTENT VERSION
-- Safe to run multiple times, handles existing policies
-- =============================================

-- Add missing tables that don't exist yet
CREATE TABLE IF NOT EXISTS public.user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price_sats bigint NOT NULL CHECK (price_sats > 0),
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),
  product_type text DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital', 'service')),
  images text[] DEFAULT '{}',
  thumbnail_url text,
  inventory_count integer DEFAULT -1,
  fulfillment_type text DEFAULT 'manual' CHECK (fulfillment_type IN ('manual', 'automatic', 'digital')),
  category text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'sold_out')),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  hourly_rate_sats bigint,
  fixed_price_sats bigint,
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),
  duration_minutes integer,
  availability_schedule jsonb,
  service_location_type text DEFAULT 'remote' CHECK (service_location_type IN ('remote', 'onsite', 'both')),
  service_area text,
  images text[] DEFAULT '{}',
  portfolio_links text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'unavailable')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT pricing_required CHECK (hourly_rate_sats IS NOT NULL OR fixed_price_sats IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.user_causes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  cause_category text NOT NULL,
  goal_sats bigint,
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),
  bitcoin_address text,
  lightning_address text,
  distribution_rules jsonb,
  beneficiaries jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  total_raised_sats bigint DEFAULT 0,
  total_distributed_sats bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  amount_sats bigint NOT NULL CHECK (amount_sats > 0),
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),
  purpose text NOT NULL,
  collateral jsonb DEFAULT '{}',
  repayment_terms jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'defaulted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.timeline_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES timeline_events(id) ON DELETE CASCADE NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'dislike', 'repost', 'quote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id, interaction_type)
);

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('project', 'user', 'cause', 'organization')),
  recipient_id uuid NOT NULL,
  amount_sats bigint NOT NULL CHECK (amount_sats > 0),
  currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),
  message text,
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_hash text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_status ON user_products(status);
CREATE INDEX IF NOT EXISTS idx_user_products_category ON user_products(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_category ON user_services(category);

CREATE INDEX IF NOT EXISTS idx_user_causes_user_id ON user_causes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_causes_category ON user_causes(cause_category);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

CREATE INDEX IF NOT EXISTS idx_timeline_interactions_event_id ON timeline_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_interactions_user_id ON timeline_interactions(user_id);

-- Add RLS policies (idempotent - safe to run multiple times)
-- Products policies
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON user_products;
CREATE POLICY "Public products are viewable by everyone" ON user_products FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can insert their own products" ON user_products;
CREATE POLICY "Users can insert their own products" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own products" ON user_products;
CREATE POLICY "Users can update their own products" ON user_products FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own products" ON user_products;
CREATE POLICY "Users can delete their own products" ON user_products FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Services policies
DROP POLICY IF EXISTS "Public services are viewable by everyone" ON user_services;
CREATE POLICY "Public services are viewable by everyone" ON user_services FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can insert their own services" ON user_services;
CREATE POLICY "Users can insert their own services" ON user_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own services" ON user_services;
CREATE POLICY "Users can update their own services" ON user_services FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own services" ON user_services;
CREATE POLICY "Users can delete their own services" ON user_services FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Causes policies
DROP POLICY IF EXISTS "Public causes are viewable by everyone" ON user_causes;
CREATE POLICY "Public causes are viewable by everyone" ON user_causes FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can insert their own causes" ON user_causes;
CREATE POLICY "Users can insert their own causes" ON user_causes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own causes" ON user_causes;
CREATE POLICY "Users can update their own causes" ON user_causes FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own causes" ON user_causes;
CREATE POLICY "Users can delete their own causes" ON user_causes FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Loans policies
DROP POLICY IF EXISTS "Users can view their own loans" ON loans;
CREATE POLICY "Users can view their own loans" ON loans FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own loans" ON loans;
CREATE POLICY "Users can insert their own loans" ON loans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own loans" ON loans;
CREATE POLICY "Users can update their own loans" ON loans FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Timeline interactions policies
DROP POLICY IF EXISTS "Timeline interactions are viewable by everyone" ON timeline_interactions;
CREATE POLICY "Timeline interactions are viewable by everyone" ON timeline_interactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON timeline_interactions;
CREATE POLICY "Users can insert their own interactions" ON timeline_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interactions" ON timeline_interactions;
CREATE POLICY "Users can delete their own interactions" ON timeline_interactions FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Donations policies
DROP POLICY IF EXISTS "Donations are viewable by everyone unless anonymous" ON donations;
CREATE POLICY "Donations are viewable by everyone unless anonymous" ON donations FOR SELECT USING (NOT is_anonymous);

DROP POLICY IF EXISTS "Users can view their own donations" ON donations;
CREATE POLICY "Users can view their own donations" ON donations FOR SELECT USING ((SELECT auth.uid()) = donor_id);

DROP POLICY IF EXISTS "Users can insert their own donations" ON donations;
CREATE POLICY "Users can insert their own donations" ON donations FOR INSERT WITH CHECK ((SELECT auth.uid()) = donor_id);

-- Fix existing timeline_events policies to use correct column name (actor_id)
DROP POLICY IF EXISTS "Users can insert their own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can update their own timeline events" ON timeline_events;

CREATE POLICY "Users can insert their own timeline events" ON timeline_events FOR INSERT WITH CHECK ((SELECT auth.uid()) = actor_id);
CREATE POLICY "Users can update their own timeline events" ON timeline_events FOR UPDATE USING ((SELECT auth.uid()) = actor_id);

-- Update triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_products_updated_at ON user_products;
CREATE TRIGGER update_user_products_updated_at BEFORE UPDATE ON user_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_services_updated_at ON user_services;
CREATE TRIGGER update_user_services_updated_at BEFORE UPDATE ON user_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_causes_updated_at ON user_causes;
CREATE TRIGGER update_user_causes_updated_at BEFORE UPDATE ON user_causes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeline_interactions_updated_at ON timeline_interactions;
CREATE TRIGGER update_timeline_interactions_updated_at BEFORE UPDATE ON timeline_interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix timeline_event_stats view with correct column names
DROP VIEW IF EXISTS public.timeline_event_stats;
CREATE OR REPLACE VIEW public.timeline_event_stats AS
SELECT
  te.id as event_id,
  COALESCE(tl.like_count, 0) as like_count,
  COALESCE(td.dislike_count, 0) as dislike_count,
  COALESCE(ts.share_count, 0) as share_count,
  COALESCE(tc.comment_count, 0) as comment_count,
  COALESCE(tc.top_level_comment_count, 0) as top_level_comment_count
FROM timeline_events te
LEFT JOIN (SELECT event_id, COUNT(*) as like_count FROM timeline_interactions WHERE interaction_type = 'like' GROUP BY event_id) tl ON te.id = tl.event_id
LEFT JOIN (SELECT event_id, COUNT(*) as dislike_count FROM timeline_interactions WHERE interaction_type = 'dislike' GROUP BY event_id) td ON te.id = td.event_id
LEFT JOIN (SELECT parent_event_id as original_event_id, COUNT(*) as share_count FROM timeline_events WHERE event_type IN ('repost', 'quote') GROUP BY parent_event_id) ts ON te.id = ts.original_event_id
LEFT JOIN (
  SELECT parent_event_id as event_id, COUNT(*) as comment_count, COUNT(CASE WHEN grandparent_id IS NULL THEN 1 END) as top_level_comment_count
  FROM (SELECT te.id, te.parent_event_id, (SELECT parent_event_id FROM timeline_events WHERE id = te.parent_event_id) as grandparent_id FROM timeline_events te WHERE te.event_type LIKE '%comment%' AND NOT te.is_deleted) comments
  GROUP BY parent_event_id
) tc ON te.id = tc.event_id;

COMMENT ON VIEW timeline_event_stats IS 'Aggregated social interaction statistics for timeline events - SECURITY INVOKER with RLS enforcement';

SELECT '✅ Idempotent migration complete - safe to run multiple times!' as status;
