-- Consolidate multiple permissive policies - batch 5
-- timeline_comments, timeline_events SELECT, timeline_shares, user_documents, wallets, wishlists

-- timeline_comments SELECT: merge 2 policies
-- "Anyone can view non-deleted comments" (is_deleted=false OR user_id=auth.uid()) is broader;
-- the OR with "Users can view all non-deleted comments" (NOT is_deleted) resolves to the broader one
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON public.timeline_comments;
DROP POLICY IF EXISTS "Users can view all non-deleted comments" ON public.timeline_comments;
CREATE POLICY "Timeline comments viewable if not deleted or own" ON public.timeline_comments
  FOR SELECT
  USING (
    (is_deleted = false)
    OR ((SELECT auth.uid() AS uid) = user_id)
  );

-- timeline_events SELECT: merge 3 policies (public, followers, private visibility)
DROP POLICY IF EXISTS "Public timeline events are viewable by everyone" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can view follower timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can view their own private timeline events" ON public.timeline_events;
CREATE POLICY "Timeline events viewable by visibility rules" ON public.timeline_events
  FOR SELECT
  USING (
    (NOT is_deleted) AND (
      (visibility = 'public'::text)
      OR (visibility = 'followers'::text AND EXISTS (
        SELECT 1 FROM follows
        WHERE ((follows.follower_id = (SELECT auth.uid() AS uid)) AND (follows.following_id = timeline_events.actor_id))
      ))
      OR (visibility = 'private'::text AND actor_id = (SELECT auth.uid() AS uid))
    )
  );

-- timeline_shares SELECT: merge 3 policies
DROP POLICY IF EXISTS "Public shares are viewable by everyone" ON public.timeline_shares;
DROP POLICY IF EXISTS "Users can view follower shares" ON public.timeline_shares;
DROP POLICY IF EXISTS "Users can view their own private shares" ON public.timeline_shares;
CREATE POLICY "Timeline shares viewable by visibility rules" ON public.timeline_shares
  FOR SELECT
  USING (
    (visibility = 'public'::text)
    OR (visibility = 'followers'::text AND EXISTS (
      SELECT 1 FROM follows
      WHERE ((follows.follower_id = (SELECT auth.uid() AS uid)) AND (follows.following_id = timeline_shares.user_id))
    ))
    OR (visibility = 'private'::text AND (SELECT auth.uid() AS uid) = user_id)
  );

-- user_documents SELECT: merge 2 policies
DROP POLICY IF EXISTS "Public documents are viewable by anyone" ON public.user_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.user_documents;
CREATE POLICY "Documents viewable if public or owned" ON public.user_documents
  FOR SELECT
  USING (
    (visibility = 'public'::document_visibility)
    OR (actor_id IN (SELECT actors.id FROM actors WHERE (actors.user_id = (SELECT auth.uid() AS uid))))
  );

-- wallets SELECT: merge 2 policies
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select_public" ON public.wallets;
CREATE POLICY "wallets_select" ON public.wallets
  FOR SELECT
  USING (
    ((SELECT auth.uid() AS uid) = user_id)
    OR (is_active = true AND (
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM projects WHERE ((projects.id = wallets.project_id) AND (projects.status = 'active'::text))
      ))
      OR (profile_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles WHERE (profiles.id = wallets.profile_id)
      ))
    ))
  );

-- wishlists SELECT: merge 2 policies (public + unlisted both require is_active=true)
DROP POLICY IF EXISTS "wishlist_public_view" ON public.wishlists;
DROP POLICY IF EXISTS "wishlist_unlisted_view" ON public.wishlists;
CREATE POLICY "wishlists_select_public_or_unlisted" ON public.wishlists
  FOR SELECT
  USING (
    (visibility = ANY (ARRAY['public'::text, 'unlisted'::text]))
    AND (is_active = true)
  );
