-- =============================================
-- FIX GROUP_MEMBERS RLS POLICY RECURSION
-- 
-- The original policies on group_members were querying
-- group_members itself, causing infinite recursion (error 42P17).
-- 
-- Fix: Use security definer functions to break the recursion.
-- =============================================

-- Step 1: Drop existing policies that depend on functions first
DROP POLICY IF EXISTS "Group members can view other members" ON group_members;
DROP POLICY IF EXISTS "Founders and admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
DROP POLICY IF EXISTS "Members can update their groups" ON groups;
DROP POLICY IF EXISTS "Founders can delete groups" ON groups;

-- Step 2: Drop existing functions if they exist (to handle parameter changes)
DROP FUNCTION IF EXISTS is_group_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_group_role(uuid, uuid) CASCADE;

-- Step 3: Create security definer functions that bypass RLS
-- These functions can query group_members without triggering RLS policies

CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION get_user_group_role(p_group_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM group_members
  WHERE group_id = p_group_id
  AND user_id = p_user_id
  LIMIT 1;
$$;

-- Step 4: Drop remaining problematic policies (if any)
DROP POLICY IF EXISTS "Members can view group members" ON group_members;

-- Step 5: Create new policies using the security definer functions

-- Policy 1: Users can always see their own membership records
-- This avoids recursion because it doesn't query group_members
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
CREATE POLICY "Users can view their own memberships" ON group_members
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Group members can view other members
-- Uses security definer function to avoid recursion
DROP POLICY IF EXISTS "Group members can view other members" ON group_members;
CREATE POLICY "Group members can view other members" ON group_members
  FOR SELECT USING (
    -- Public groups: anyone can see members
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.is_public = true
    )
    OR
    -- Private groups: only if user is a member (using security definer function)
    is_group_member(group_members.group_id, auth.uid())
  );

-- Policy 3: Founders and admins can manage members
-- Uses security definer functions to avoid recursion
DROP POLICY IF EXISTS "Founders and admins can manage members" ON group_members;
CREATE POLICY "Founders and admins can manage members" ON group_members
  FOR ALL USING (
    is_group_member(group_members.group_id, auth.uid())
    AND get_user_group_role(group_members.group_id, auth.uid()) IN ('founder', 'admin')
  );

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_group_role(uuid, uuid) TO authenticated;

-- Step 7: Fix groups table policies (using the same security definer functions)
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
DROP POLICY IF EXISTS "Members can update their groups" ON groups;
DROP POLICY IF EXISTS "Founders can delete groups" ON groups;

CREATE POLICY "Members can view their groups" ON groups
  FOR SELECT USING (
    is_group_member(groups.id, auth.uid())
  );

CREATE POLICY "Members can update their groups" ON groups
  FOR UPDATE USING (
    is_group_member(groups.id, auth.uid())
    AND get_user_group_role(groups.id, auth.uid()) IN ('founder', 'admin')
  );

CREATE POLICY "Founders can delete groups" ON groups
  FOR DELETE USING (
    is_group_member(groups.id, auth.uid())
    AND get_user_group_role(groups.id, auth.uid()) = 'founder'
  );

-- Note: The "Public group members are viewable" and "Public groups are viewable by everyone" 
-- policies remain unchanged because they only query the groups table, not group_members, so no recursion.
