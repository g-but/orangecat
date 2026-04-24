-- Consolidate multiple permissive policies - batch 3
-- entity_wallets, events, group_members, groups, investments, loans SELECT

-- entity_wallets SELECT: merge 2 policies
DROP POLICY IF EXISTS "Link creators can view" ON public.entity_wallets;
DROP POLICY IF EXISTS "Wallet owners can view links" ON public.entity_wallets;
CREATE POLICY "Entity wallet links viewable by creator or wallet owner" ON public.entity_wallets
  FOR SELECT
  USING (
    (created_by = (SELECT auth.uid() AS uid))
    OR (wallet_id IN (SELECT wallets.id FROM wallets WHERE (wallets.profile_id = (SELECT auth.uid() AS uid))))
  );

-- events SELECT: merge 2 policies
DROP POLICY IF EXISTS "Public can read published events" ON public.events;
DROP POLICY IF EXISTS "Users can read their own events" ON public.events;
CREATE POLICY "Events viewable if published or owned" ON public.events
  FOR SELECT
  USING (
    (status = ANY (ARRAY['published'::text, 'open'::text, 'full'::text, 'ongoing'::text, 'completed'::text]))
    OR ((SELECT auth.uid() AS uid) = user_id)
  );

-- group_members SELECT: merge remaining 2 policies (subset dropped in batch 1)
DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_members;
CREATE POLICY "Group members viewable by member or public group" ON public.group_members
  FOR SELECT
  USING (
    (user_id = (SELECT auth.uid() AS uid))
    OR (EXISTS (SELECT 1 FROM groups WHERE ((groups.id = group_members.group_id) AND (groups.is_public = true))))
    OR is_group_member(group_id, (SELECT auth.uid() AS uid))
  );

-- groups SELECT: merge 2 policies
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;
CREATE POLICY "Groups viewable if public or member" ON public.groups
  FOR SELECT
  USING (
    (is_public = true)
    OR is_group_member(id, (SELECT auth.uid() AS uid))
  );

-- investments SELECT: merge 2 policies
DROP POLICY IF EXISTS "Anyone can view public investments" ON public.investments;
DROP POLICY IF EXISTS "Owner can view own investments" ON public.investments;
CREATE POLICY "Investments viewable if public or owned" ON public.investments
  FOR SELECT
  USING (
    ((is_public = true) AND (status = ANY (ARRAY['open'::text, 'funded'::text, 'active'::text])))
    OR (actor_id IN (SELECT actors.id FROM actors WHERE (actors.user_id = (SELECT auth.uid() AS uid))))
  );

-- loans SELECT: merge 2 policies
DROP POLICY IF EXISTS "Users can view public loans from others" ON public.loans;
DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
CREATE POLICY "Loans viewable if public or owned" ON public.loans
  FOR SELECT
  USING (
    (is_public = true)
    OR ((SELECT auth.uid() AS uid) = user_id)
  );
