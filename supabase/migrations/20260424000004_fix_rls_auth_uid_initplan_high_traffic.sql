-- Optimize RLS policies on high-traffic tables:
-- Replace auth.uid() with (SELECT auth.uid()) to prevent per-row function evaluation.
-- Also remove confirmed duplicate policies on `profiles`.
--
-- References: https://supabase.com/docs/guides/database/database-linter?lint=0013_auth_rls_initplan

-- ============================================================
-- profiles
-- ============================================================
-- Two identical INSERT policies and two identical UPDATE policies.
-- Deduplicate and apply auth.uid() subquery optimization.

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING ((SELECT auth.uid()) = id);

-- ============================================================
-- wallets
-- ============================================================
DROP POLICY IF EXISTS "wallets_delete_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;

-- wallet ownership uses profile_id (not user_id) for insert; user_id for select/update/delete
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "wallets_insert_own" ON public.wallets
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = profile_id OR
    (SELECT auth.uid()) = (SELECT projects.user_id FROM projects WHERE projects.id = wallets.project_id)
  );

CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "wallets_delete_own" ON public.wallets
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- user_products
-- ============================================================
DROP POLICY IF EXISTS "Users can delete their own products" ON public.user_products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.user_products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.user_products;
DROP POLICY IF EXISTS "user_products_select_policy" ON public.user_products;

CREATE POLICY "user_products_select_policy" ON public.user_products
  FOR SELECT USING (status = 'active' OR (SELECT auth.uid()) = user_id);

CREATE POLICY "user_products_insert_own" ON public.user_products
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_products_update_own" ON public.user_products
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_products_delete_own" ON public.user_products
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- user_services
-- ============================================================
DROP POLICY IF EXISTS "Users can delete their own services" ON public.user_services;
DROP POLICY IF EXISTS "Users can insert their own services" ON public.user_services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.user_services;
DROP POLICY IF EXISTS "user_services_select_policy" ON public.user_services;

CREATE POLICY "user_services_select_policy" ON public.user_services
  FOR SELECT USING (status = 'active' OR (SELECT auth.uid()) = user_id);

CREATE POLICY "user_services_insert_own" ON public.user_services
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_services_update_own" ON public.user_services
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_services_delete_own" ON public.user_services
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- tasks
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Creator can archive tasks" ON public.tasks;
DROP POLICY IF EXISTS "Creator can view archived tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can view tasks" ON public.tasks;

-- Consolidate: non-archived visible to authenticated; archived visible only to creator
CREATE POLICY "tasks_select_active" ON public.tasks
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL AND NOT is_archived);

CREATE POLICY "tasks_select_archived_own" ON public.tasks
  FOR SELECT USING (created_by = (SELECT auth.uid()) AND is_archived = true);

CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    created_by = (SELECT auth.uid())
  );

CREATE POLICY "tasks_update_authenticated" ON public.tasks
  FOR UPDATE USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "tasks_archive_own" ON public.tasks
  FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- ============================================================
-- conversation_participants
-- ============================================================
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversation_participants;

CREATE POLICY "conv_participants_select_own" ON public.conversation_participants
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "conv_participants_insert_own" ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "conv_participants_update_own" ON public.conversation_participants
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "conv_participants_delete_own" ON public.conversation_participants
  FOR DELETE USING (user_id = (SELECT auth.uid()));
