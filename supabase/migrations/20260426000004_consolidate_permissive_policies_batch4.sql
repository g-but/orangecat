-- Consolidate multiple permissive policies - batch 4
-- loan_offers UPDATE, orders, payment_intents, research_entities, tasks

-- loan_offers UPDATE: merge 2 policies
-- "Loan owners" has null WITH CHECK (no restriction); combined WITH CHECK is also null
DROP POLICY IF EXISTS "Loan owners can update offer status" ON public.loan_offers;
DROP POLICY IF EXISTS "Offerers can update their own offers" ON public.loan_offers;
CREATE POLICY "Loan offers updatable by loan owner or offerer" ON public.loan_offers
  FOR UPDATE
  USING (
    ((SELECT auth.uid() AS uid) IN (SELECT loans.user_id FROM loans WHERE (loans.id = loan_offers.loan_id)))
    OR ((SELECT auth.uid() AS uid) = offerer_id)
  );

-- orders SELECT: merge 2 policies
DROP POLICY IF EXISTS "Buyers view own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers view incoming orders" ON public.orders;
CREATE POLICY "Orders viewable by buyer or seller" ON public.orders
  FOR SELECT
  USING (
    (buyer_id = (SELECT auth.uid() AS uid))
    OR (seller_id = (SELECT auth.uid() AS uid))
  );

-- orders UPDATE: merge 2 policies
DROP POLICY IF EXISTS "Buyers update own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers update their orders" ON public.orders;
CREATE POLICY "Orders updatable by buyer or seller" ON public.orders
  FOR UPDATE
  USING (
    (buyer_id = (SELECT auth.uid() AS uid))
    OR (seller_id = (SELECT auth.uid() AS uid))
  );

-- payment_intents SELECT: merge 2 policies
DROP POLICY IF EXISTS "Buyers view own payments" ON public.payment_intents;
DROP POLICY IF EXISTS "Sellers view incoming payments" ON public.payment_intents;
CREATE POLICY "Payment intents viewable by buyer or seller" ON public.payment_intents
  FOR SELECT
  USING (
    (buyer_id = (SELECT auth.uid() AS uid))
    OR (seller_id = (SELECT auth.uid() AS uid))
  );

-- research_entities SELECT: merge 2 policies
DROP POLICY IF EXISTS "Public research entities are viewable by everyone" ON public.research_entities;
DROP POLICY IF EXISTS "Users can view their own research entities" ON public.research_entities;
CREATE POLICY "Research entities viewable if public or owned" ON public.research_entities
  FOR SELECT
  USING (
    (is_public = true)
    OR ((SELECT auth.uid() AS uid) = user_id)
  );

-- tasks SELECT: merge 2 policies
DROP POLICY IF EXISTS "tasks_select_active" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_archived_own" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT
  USING (
    ((SELECT auth.uid() AS uid) IS NOT NULL AND (NOT is_archived))
    OR (created_by = (SELECT auth.uid() AS uid) AND is_archived = true)
  );

-- tasks UPDATE: tasks_update_authenticated (auth.uid() IS NOT NULL, no WITH CHECK) subsumes
-- tasks_archive_own (created_by = auth.uid(), WITH CHECK created_by = auth.uid()).
-- Combined permissive behavior: any authenticated user can update, no WITH CHECK restriction.
DROP POLICY IF EXISTS "tasks_archive_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_authenticated" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE
  USING ((SELECT auth.uid() AS uid) IS NOT NULL);
