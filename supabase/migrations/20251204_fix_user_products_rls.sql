-- ============================================================================
-- FIX: Add SELECT policy for users to view their own products (any status)
-- ============================================================================
-- Issue: Users can INSERT products but can't SELECT them back after creation
-- because the only SELECT policy allows status='active' for public view.
-- 
-- This migration adds a policy so users can see ALL their own products.
-- ============================================================================

-- Drop existing select policy and recreate with proper rules
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON user_products;
DROP POLICY IF EXISTS "Users can view their own products" ON user_products;

-- Policy 1: Public can view active products from anyone
CREATE POLICY "Public products are viewable by everyone"
  ON user_products FOR SELECT
  USING (status = 'active');

-- Policy 2: Users can view ALL their own products (any status)
CREATE POLICY "Users can view their own products"
  ON user_products FOR SELECT
  USING (auth.uid() = user_id);

-- Same fix for user_services
DROP POLICY IF EXISTS "Public services are viewable by everyone" ON user_services;
DROP POLICY IF EXISTS "Users can view their own services" ON user_services;

CREATE POLICY "Public services are viewable by everyone"
  ON user_services FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view their own services"
  ON user_services FOR SELECT
  USING (auth.uid() = user_id);

-- Same fix for user_causes
DROP POLICY IF EXISTS "Public causes are viewable by everyone" ON user_causes;
DROP POLICY IF EXISTS "Users can view their own causes" ON user_causes;

CREATE POLICY "Public causes are viewable by everyone"
  ON user_causes FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view their own causes"
  ON user_causes FOR SELECT
  USING (auth.uid() = user_id);

