-- Fix RLS policies by dropping and recreating them with correct auth.uid() syntax
-- This should resolve the 403 Forbidden errors

-- Services policies
DROP POLICY IF EXISTS "Users can insert their own services" ON user_services;
CREATE POLICY "Users can insert their own services" ON user_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own services" ON user_services;
CREATE POLICY "Users can update their own services" ON user_services FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own services" ON user_services;
CREATE POLICY "Users can delete their own services" ON user_services FOR DELETE USING (auth.uid() = user_id);

-- Products policies  
DROP POLICY IF EXISTS "Users can insert their own products" ON user_products;
CREATE POLICY "Users can insert their own products" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own products" ON user_products;
CREATE POLICY "Users can update their own products" ON user_products FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own products" ON user_products;
CREATE POLICY "Users can delete their own products" ON user_products FOR DELETE USING (auth.uid() = user_id);

-- Timeline interactions policies
DROP POLICY IF EXISTS "Users can insert their own interactions" ON timeline_interactions;
CREATE POLICY "Users can insert their own interactions" ON timeline_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interactions" ON timeline_interactions;
CREATE POLICY "Users can delete their own interactions" ON timeline_interactions FOR DELETE USING (auth.uid() = user_id);

-- Timeline events policies
DROP POLICY IF EXISTS "Users can insert their own timeline events" ON timeline_events;
CREATE POLICY "Users can insert their own timeline events" ON timeline_events FOR INSERT WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Users can update their own timeline events" ON timeline_events;
CREATE POLICY "Users can update their own timeline events" ON timeline_events FOR UPDATE USING (auth.uid() = actor_id);

-- Donations policies
DROP POLICY IF EXISTS "Users can insert their own donations" ON donations;
CREATE POLICY "Users can insert their own donations" ON donations FOR INSERT WITH CHECK (auth.uid() = donor_id);

-- Causes policies
DROP POLICY IF EXISTS "Users can insert their own causes" ON user_causes;
CREATE POLICY "Users can insert their own causes" ON user_causes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own causes" ON user_causes;
CREATE POLICY "Users can update their own causes" ON user_causes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own causes" ON user_causes;
CREATE POLICY "Users can delete their own causes" ON user_causes FOR DELETE USING (auth.uid() = user_id);

-- Loans policies
DROP POLICY IF EXISTS "Users can insert their own loans" ON loans;
CREATE POLICY "Users can insert their own loans" ON loans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own loans" ON loans;
CREATE POLICY "Users can update their own loans" ON loans FOR UPDATE USING (auth.uid() = user_id);

SELECT '✅ RLS policies fixed - auth.uid() syntax corrected' as status;
