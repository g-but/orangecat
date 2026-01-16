-- =============================================
-- FIX GROUPS INSERT POLICY
--
-- The original INSERT policy used auth.role() = 'authenticated'
-- which doesn't work reliably with server-side clients using cookies.
--
-- Fix: Use auth.uid() IS NOT NULL which works correctly for
-- both browser and server clients.
-- =============================================

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Recreate with auth.uid() check instead of auth.role()
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
