-- ============================================================
-- Fix auth_rls_initplan (2) and multiple_permissive_policies (144)
-- Root causes:
--   1. Redundant service_role policies (service_role bypasses RLS
--      automatically; calling auth.jwt() per row causes initplan)
--   2. ALL policies overlapping with per-action SELECT policies
-- Fix: drop redundant ALL/service_role, consolidate into per-action
-- ============================================================

-- ============================================================
-- 1. cat_action_log — drop redundant service_role policy
--    (fixes 1 auth_rls_initplan + SELECT overlap)
-- ============================================================
DROP POLICY IF EXISTS "Service role can manage cat action log" ON public.cat_action_log;

-- ============================================================
-- 2. cat_pending_actions — drop redundant service_role policy
--    (fixes 1 auth_rls_initplan + SELECT+UPDATE overlap)
-- ============================================================
DROP POLICY IF EXISTS "Service role can manage pending cat actions" ON public.cat_pending_actions;

-- ============================================================
-- 3. projects — drop ALL policy; per-action policies already cover
--    SELECT (projects_public_read), INSERT, UPDATE, DELETE
-- ============================================================
DROP POLICY IF EXISTS projects_modify ON public.projects;

-- ============================================================
-- 4. timeline_dislikes — drop ALL; specific per-action policies exist
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own dislikes" ON public.timeline_dislikes;

-- ============================================================
-- 5. timeline_likes — drop ALL; specific per-action policies exist
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.timeline_likes;

-- ============================================================
-- 6. timeline_event_visibility — replace ALL with per-action
--    (SELECT "Anyone can view..." already exists and stays)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own event visibility" ON public.timeline_event_visibility;

CREATE POLICY "timeline_event_visibility_insert"
  ON public.timeline_event_visibility FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_events
      WHERE timeline_events.id = timeline_event_visibility.event_id
        AND timeline_events.actor_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "timeline_event_visibility_update"
  ON public.timeline_event_visibility FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM timeline_events
      WHERE timeline_events.id = timeline_event_visibility.event_id
        AND timeline_events.actor_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "timeline_event_visibility_delete"
  ON public.timeline_event_visibility FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM timeline_events
      WHERE timeline_events.id = timeline_event_visibility.event_id
        AND timeline_events.actor_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 7. event_attendees — merge ALL+overlapping into per-action
-- ============================================================
DROP POLICY IF EXISTS "Event organizers can manage attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can read event attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can update their own registration" ON public.event_attendees;

CREATE POLICY "event_attendees_select"
  ON public.event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendees.event_id
        AND (
          events.status = ANY (ARRAY['published','open','full','ongoing','completed'])
          OR events.user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "event_attendees_insert"
  ON public.event_attendees FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendees.event_id
        AND events.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "event_attendees_update"
  ON public.event_attendees FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendees.event_id
        AND events.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "event_attendees_delete"
  ON public.event_attendees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendees.event_id
        AND events.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 8. group_event_rsvps — merge ALL+SELECT into per-action
-- ============================================================
DROP POLICY IF EXISTS "Event attendees can view RSVPs" ON public.group_event_rsvps;
DROP POLICY IF EXISTS "Users can manage their RSVPs" ON public.group_event_rsvps;

CREATE POLICY "group_event_rsvps_select"
  ON public.group_event_rsvps FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM group_events
      WHERE group_events.id = group_event_rsvps.event_id
        AND (
          group_events.is_public = true
          OR EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = group_events.group_id
              AND group_members.user_id = (SELECT auth.uid())
          )
        )
    )
  );

CREATE POLICY "group_event_rsvps_insert"
  ON public.group_event_rsvps FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "group_event_rsvps_update"
  ON public.group_event_rsvps FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "group_event_rsvps_delete"
  ON public.group_event_rsvps FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 9. group_features — merge ALL+SELECT into per-action
-- ============================================================
DROP POLICY IF EXISTS "Founders and admins can manage features" ON public.group_features;
DROP POLICY IF EXISTS "Members can view group features" ON public.group_features;

CREATE POLICY "group_features_select"
  ON public.group_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_features.group_id
        AND group_members.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "group_features_insert"
  ON public.group_features FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_features.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = ANY (ARRAY['founder','admin'])
    )
  );

CREATE POLICY "group_features_update"
  ON public.group_features FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_features.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = ANY (ARRAY['founder','admin'])
    )
  );

CREATE POLICY "group_features_delete"
  ON public.group_features FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_features.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = ANY (ARRAY['founder','admin'])
    )
  );

-- ============================================================
-- 10. group_members — merge ALL+SELECT into per-action
-- ============================================================
DROP POLICY IF EXISTS "Founders and admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group members viewable by member or public group" ON public.group_members;

CREATE POLICY "group_members_select"
  ON public.group_members FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
        AND groups.is_public = true
    )
    OR is_group_member(group_id, (SELECT auth.uid()))
  );

CREATE POLICY "group_members_insert"
  ON public.group_members FOR INSERT
  WITH CHECK (
    is_group_member(group_id, (SELECT auth.uid()))
    AND get_user_group_role(group_id, (SELECT auth.uid())) = ANY (ARRAY['founder','admin'])
  );

CREATE POLICY "group_members_update"
  ON public.group_members FOR UPDATE
  USING (
    is_group_member(group_id, (SELECT auth.uid()))
    AND get_user_group_role(group_id, (SELECT auth.uid())) = ANY (ARRAY['founder','admin'])
  );

CREATE POLICY "group_members_delete"
  ON public.group_members FOR DELETE
  USING (
    is_group_member(group_id, (SELECT auth.uid()))
    AND get_user_group_role(group_id, (SELECT auth.uid())) = ANY (ARRAY['founder','admin'])
  );

-- ============================================================
-- 11. group_wallets — merge ALL+SELECT into per-action
-- ============================================================
DROP POLICY IF EXISTS "Founders and admins can manage wallets" ON public.group_wallets;
DROP POLICY IF EXISTS "Members can view wallets" ON public.group_wallets;

CREATE POLICY "group_wallets_select"
  ON public.group_wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_wallets.group_id
        AND group_members.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "group_wallets_insert"
  ON public.group_wallets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_wallets.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = ANY (ARRAY['founder','admin'])
    )
  );

CREATE POLICY "group_wallets_update"
  ON public.group_wallets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_wallets.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = ANY (ARRAY['founder','admin'])
    )
  );

CREATE POLICY "group_wallets_delete"
  ON public.group_wallets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_wallets.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = ANY (ARRAY['founder','admin'])
    )
  );

-- ============================================================
-- 12. wishlist_fulfillment_proofs — merge owner ALL + public SELECT
-- ============================================================
DROP POLICY IF EXISTS fulfillment_proofs_owner ON public.wishlist_fulfillment_proofs;
DROP POLICY IF EXISTS fulfillment_proofs_public_view ON public.wishlist_fulfillment_proofs;

CREATE POLICY "fulfillment_proofs_select"
  ON public.wishlist_fulfillment_proofs FOR SELECT
  USING (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE w.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
    OR wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE (w.visibility = 'public' OR w.visibility = 'unlisted')
        AND w.is_active = true
    )
  );

CREATE POLICY "fulfillment_proofs_insert"
  ON public.wishlist_fulfillment_proofs FOR INSERT
  WITH CHECK (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE w.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "fulfillment_proofs_update"
  ON public.wishlist_fulfillment_proofs FOR UPDATE
  USING (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE w.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "fulfillment_proofs_delete"
  ON public.wishlist_fulfillment_proofs FOR DELETE
  USING (
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE w.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
  );

-- ============================================================
-- 13. wishlist_items — merge owner ALL + public SELECT
-- ============================================================
DROP POLICY IF EXISTS wishlist_items_owner ON public.wishlist_items;
DROP POLICY IF EXISTS wishlist_items_public_view ON public.wishlist_items;

CREATE POLICY "wishlist_items_select"
  ON public.wishlist_items FOR SELECT
  USING (
    wishlist_id IN (
      SELECT wishlists.id FROM wishlists
      WHERE wishlists.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
    OR wishlist_id IN (
      SELECT wishlists.id FROM wishlists
      WHERE (wishlists.visibility = 'public' OR wishlists.visibility = 'unlisted')
        AND wishlists.is_active = true
    )
  );

CREATE POLICY "wishlist_items_insert"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT wishlists.id FROM wishlists
      WHERE wishlists.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "wishlist_items_update"
  ON public.wishlist_items FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT wishlists.id FROM wishlists
      WHERE wishlists.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "wishlist_items_delete"
  ON public.wishlist_items FOR DELETE
  USING (
    wishlist_id IN (
      SELECT wishlists.id FROM wishlists
      WHERE wishlists.actor_id IN (
        SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
      )
    )
  );

-- ============================================================
-- 14. wishlists — merge owner ALL + public SELECT
-- ============================================================
DROP POLICY IF EXISTS wishlist_owner_all ON public.wishlists;
DROP POLICY IF EXISTS wishlists_select_public_or_unlisted ON public.wishlists;

CREATE POLICY "wishlists_select"
  ON public.wishlists FOR SELECT
  USING (
    actor_id IN (
      SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
    )
    OR (visibility = ANY (ARRAY['public','unlisted']) AND is_active = true)
  );

CREATE POLICY "wishlists_insert"
  ON public.wishlists FOR INSERT
  WITH CHECK (
    actor_id IN (
      SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "wishlists_update"
  ON public.wishlists FOR UPDATE
  USING (
    actor_id IN (
      SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "wishlists_delete"
  ON public.wishlists FOR DELETE
  USING (
    actor_id IN (
      SELECT actors.id FROM actors WHERE actors.user_id = (SELECT auth.uid())
    )
  );
