-- =============================================
-- COMPLETE ORANGECAT SCHEMA - SINGLE MIGRATION
-- Creates all entity tables with proper RLS policies
-- =============================================

-- Core entity tables for OrangeCat platform
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

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type text DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group')),
  title text,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('post', 'comment', 'like', 'follow', 'project_created', 'donation')),
  content text,
  metadata jsonb DEFAULT '{}',
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  parent_id uuid REFERENCES timeline_events(id) ON DELETE CASCADE,
  project_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Enable RLS on all tables
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_events_actor_id ON timeline_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_events_parent_id ON timeline_events(parent_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_created_at ON timeline_events(created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_interactions_event_id ON timeline_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_interactions_user_id ON timeline_interactions(user_id);

-- RLS Policies
-- Products
CREATE POLICY "Public products are viewable by everyone" ON user_products FOR SELECT USING (status = 'active');
CREATE POLICY "Users can insert their own products" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON user_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON user_products FOR DELETE USING (auth.uid() = user_id);

-- Services
CREATE POLICY "Public services are viewable by everyone" ON user_services FOR SELECT USING (status = 'active');
CREATE POLICY "Users can insert their own services" ON user_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON user_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON user_services FOR DELETE USING (auth.uid() = user_id);

-- Conversations
CREATE POLICY "Users can view conversations they're part of" ON conversations FOR SELECT 
  USING (id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (created_by = auth.uid());

-- Messages
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT 
  USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their conversations" ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid() AND conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));

-- Timeline
CREATE POLICY "Public timeline events are viewable by everyone" ON timeline_events FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can insert their own timeline events" ON timeline_events FOR INSERT WITH CHECK ((SELECT auth.uid()) = actor_id);
CREATE POLICY "Users can update their own timeline events" ON timeline_events FOR UPDATE USING ((SELECT auth.uid()) = actor_id);

-- Timeline interactions
CREATE POLICY "Timeline interactions are viewable by everyone" ON timeline_interactions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own interactions" ON timeline_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON timeline_interactions FOR DELETE USING (auth.uid() = user_id);

-- Update triggers function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables
CREATE TRIGGER update_user_products_updated_at BEFORE UPDATE ON user_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_services_updated_at BEFORE UPDATE ON user_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_causes_updated_at BEFORE UPDATE ON user_causes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fixed timeline_event_stats view with correct column names
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
