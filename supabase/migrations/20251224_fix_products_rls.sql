-- Fix RLS policies for user_products
-- Issue: Users cannot see their own draft products
-- The current SELECT policy only allows viewing 'active' products
-- We need to also allow users to view their own products regardless of status

-- Drop the restrictive public-only policy
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON user_products;

-- Create a proper SELECT policy that:
-- 1. Allows anyone to view active products (public listing)
-- 2. Allows users to view ALL their own products (including drafts)
CREATE POLICY "user_products_select_policy" ON user_products
  FOR SELECT USING (
    status = 'active'
    OR auth.uid() = user_id
  );

-- Similarly fix user_services if it has the same issue
DROP POLICY IF EXISTS "Public services are viewable by everyone" ON user_services;

CREATE POLICY "user_services_select_policy" ON user_services
  FOR SELECT USING (
    status = 'active'
    OR auth.uid() = user_id
  );
