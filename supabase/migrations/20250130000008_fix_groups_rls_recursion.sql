-- =============================================
-- FIX GROUPS RLS POLICY RECURSION
-- 
-- The policies on groups table were querying group_members,
-- which has RLS enabled, causing infinite recursion (error 42P17).
-- 
-- Fix: Use the security definer functions we created for group_members.
-- =============================================

-- Step 1: Drop the problematic policies on groups
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
DROP POLICY IF EXISTS "Members can update their groups" ON groups;
DROP POLICY IF EXISTS "Founders can delete groups" ON groups;

-- Step 2: Recreate policies using security definer functions

-- Policy: Members can view their groups (using security definer function)
CREATE POLICY "Members can view their groups" ON groups
  FOR SELECT USING (
    is_group_member(groups.id, auth.uid())
  );

-- Policy: Members can update their groups (using security definer functions)
CREATE POLICY "Members can update their groups" ON groups
  FOR UPDATE USING (
    is_group_member(groups.id, auth.uid())
    AND get_user_group_role(groups.id, auth.uid()) IN ('founder', 'admin')
  );

-- Policy: Founders can delete groups (using security definer function)
CREATE POLICY "Founders can delete groups" ON groups
  FOR DELETE USING (
    is_group_member(groups.id, auth.uid())
    AND get_user_group_role(groups.id, auth.uid()) = 'founder'
  );

-- Note: "Public groups are viewable by everyone" policy remains unchanged
-- because it doesn't query group_members, so no recursion.
