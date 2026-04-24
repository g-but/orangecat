-- Optimize RLS policies (batches 2a-2c/4): replace bare auth.uid() with (SELECT auth.uid())
-- Prevents per-row function evaluation (InitPlan optimization).
-- References: https://supabase.com/docs/guides/database/database-linter?lint=0013_auth_rls_initplan

-- ==========================================================
-- messages
-- ==========================================================
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages" ON public.messages
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) = sender_id) AND (EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = messages.conversation_id) AND (cp.user_id = (SELECT auth.uid())) AND (cp.is_active = true))))));

DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages" ON public.messages
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = messages.conversation_id) AND (cp.user_id = (SELECT auth.uid())) AND (cp.is_active = true)))));

DROP POLICY IF EXISTS "Message senders can update their messages" ON public.messages;
CREATE POLICY "Message senders can update their messages" ON public.messages
  FOR UPDATE
  USING ((((SELECT auth.uid()) = sender_id) AND (EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = messages.conversation_id) AND (cp.user_id = (SELECT auth.uid())) AND (cp.is_active = true))))));


-- ==========================================================
-- notification_email_log
-- ==========================================================
DROP POLICY IF EXISTS "Users can view own email log" ON public.notification_email_log;
CREATE POLICY "Users can view own email log" ON public.notification_email_log
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));


-- ==========================================================
-- notification_preferences
-- ==========================================================
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  FOR INSERT
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));


-- ==========================================================
-- notifications
-- ==========================================================
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));


-- ==========================================================
-- orders
-- ==========================================================
DROP POLICY IF EXISTS "Authenticated users create orders" ON public.orders;
CREATE POLICY "Authenticated users create orders" ON public.orders
  FOR INSERT
  WITH CHECK ((buyer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Buyers update own orders" ON public.orders;
CREATE POLICY "Buyers update own orders" ON public.orders
  FOR UPDATE
  USING ((buyer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Buyers view own orders" ON public.orders;
CREATE POLICY "Buyers view own orders" ON public.orders
  FOR SELECT
  USING ((buyer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Sellers update their orders" ON public.orders;
CREATE POLICY "Sellers update their orders" ON public.orders
  FOR UPDATE
  USING ((seller_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Sellers view incoming orders" ON public.orders;
CREATE POLICY "Sellers view incoming orders" ON public.orders
  FOR SELECT
  USING ((seller_id = (SELECT auth.uid())));


-- ==========================================================
-- payment_intents
-- ==========================================================
DROP POLICY IF EXISTS "Authenticated users create payments" ON public.payment_intents;
CREATE POLICY "Authenticated users create payments" ON public.payment_intents
  FOR INSERT
  WITH CHECK ((buyer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Buyers update own payments" ON public.payment_intents;
CREATE POLICY "Buyers update own payments" ON public.payment_intents
  FOR UPDATE
  USING ((buyer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Buyers view own payments" ON public.payment_intents;
CREATE POLICY "Buyers view own payments" ON public.payment_intents
  FOR SELECT
  USING ((buyer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Sellers view incoming payments" ON public.payment_intents;
CREATE POLICY "Sellers view incoming payments" ON public.payment_intents
  FOR SELECT
  USING ((seller_id = (SELECT auth.uid())));


-- ==========================================================
-- post_visibility
-- ==========================================================
DROP POLICY IF EXISTS "Users can add visibility to own posts" ON public.post_visibility;
CREATE POLICY "Users can add visibility to own posts" ON public.post_visibility
  FOR INSERT
  WITH CHECK (((added_by_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM timeline_events te
  WHERE ((te.id = post_visibility.post_id) AND (te.actor_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "Users can remove visibility from own posts" ON public.post_visibility;
CREATE POLICY "Users can remove visibility from own posts" ON public.post_visibility
  FOR DELETE
  USING ((added_by_id = (SELECT auth.uid())));


-- ==========================================================
-- project_favorites
-- ==========================================================
DROP POLICY IF EXISTS "project_favorites_delete_own" ON public.project_favorites;
CREATE POLICY "project_favorites_delete_own" ON public.project_favorites
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "project_favorites_insert_own" ON public.project_favorites;
CREATE POLICY "project_favorites_insert_own" ON public.project_favorites
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "project_favorites_select_own" ON public.project_favorites;
CREATE POLICY "project_favorites_select_own" ON public.project_favorites
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));


-- ==========================================================
-- project_media
-- ==========================================================
DROP POLICY IF EXISTS "media_delete_owner" ON public.project_media;
CREATE POLICY "media_delete_owner" ON public.project_media
  FOR DELETE
  USING (((SELECT auth.uid()) = ( SELECT projects.user_id
   FROM projects
  WHERE (projects.id = project_media.project_id))));

DROP POLICY IF EXISTS "media_insert_owner" ON public.project_media;
CREATE POLICY "media_insert_owner" ON public.project_media
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = ( SELECT projects.user_id
   FROM projects
  WHERE (projects.id = project_media.project_id))));

DROP POLICY IF EXISTS "media_update_owner" ON public.project_media;
CREATE POLICY "media_update_owner" ON public.project_media
  FOR UPDATE
  USING (((SELECT auth.uid()) = ( SELECT projects.user_id
   FROM projects
  WHERE (projects.id = project_media.project_id))));


-- ==========================================================
-- projects
-- ==========================================================
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "projects_modify" ON public.projects;
CREATE POLICY "projects_modify" ON public.projects
  FOR ALL
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "projects_public_read" ON public.projects;
CREATE POLICY "projects_public_read" ON public.projects
  FOR SELECT
  USING (((status = 'active'::text) OR (status = 'completed'::text) OR (user_id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id));


-- ==========================================================
-- research_entities
-- ==========================================================
DROP POLICY IF EXISTS "Users can create research entities" ON public.research_entities;
CREATE POLICY "Users can create research entities" ON public.research_entities
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own research entities" ON public.research_entities;
CREATE POLICY "Users can delete their own research entities" ON public.research_entities
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own research entities" ON public.research_entities;
CREATE POLICY "Users can update their own research entities" ON public.research_entities
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their own research entities" ON public.research_entities;
CREATE POLICY "Users can view their own research entities" ON public.research_entities
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));


-- ==========================================================
-- shipping_addresses
-- ==========================================================
DROP POLICY IF EXISTS "Users manage own addresses" ON public.shipping_addresses;
CREATE POLICY "Users manage own addresses" ON public.shipping_addresses
  FOR ALL
  USING ((user_id = (SELECT auth.uid())));


-- ==========================================================
-- task_attention_flags
-- ==========================================================
DROP POLICY IF EXISTS "Staff can create attention flags" ON public.task_attention_flags;
CREATE POLICY "Staff can create attention flags" ON public.task_attention_flags
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) IS NOT NULL) AND (flagged_by = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Staff can update attention flags" ON public.task_attention_flags;
CREATE POLICY "Staff can update attention flags" ON public.task_attention_flags
  FOR UPDATE
  USING (((SELECT auth.uid()) IS NOT NULL));

DROP POLICY IF EXISTS "Staff can view attention flags" ON public.task_attention_flags;
CREATE POLICY "Staff can view attention flags" ON public.task_attention_flags
  FOR SELECT
  USING (((SELECT auth.uid()) IS NOT NULL));


-- ==========================================================
-- task_completions
-- ==========================================================
DROP POLICY IF EXISTS "Staff can create completions" ON public.task_completions;
CREATE POLICY "Staff can create completions" ON public.task_completions
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) IS NOT NULL) AND (completed_by = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Staff can view completions" ON public.task_completions;
CREATE POLICY "Staff can view completions" ON public.task_completions
  FOR SELECT
  USING (((SELECT auth.uid()) IS NOT NULL));


-- ==========================================================
-- task_projects
-- ==========================================================
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.task_projects;
CREATE POLICY "Authenticated users can create projects" ON public.task_projects
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) IS NOT NULL) AND (created_by = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Creator can update projects" ON public.task_projects;
CREATE POLICY "Creator can update projects" ON public.task_projects
  FOR UPDATE
  USING ((created_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Staff can view projects" ON public.task_projects;
CREATE POLICY "Staff can view projects" ON public.task_projects
  FOR SELECT
  USING (((SELECT auth.uid()) IS NOT NULL));


-- ==========================================================
-- task_requests
-- ==========================================================
DROP POLICY IF EXISTS "Staff can create requests" ON public.task_requests;
CREATE POLICY "Staff can create requests" ON public.task_requests
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) IS NOT NULL) AND (requested_by = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Users can respond to requests" ON public.task_requests;
CREATE POLICY "Users can respond to requests" ON public.task_requests
  FOR UPDATE
  USING ((((SELECT auth.uid()) IS NOT NULL) AND ((requested_user_id = (SELECT auth.uid())) OR (requested_user_id IS NULL))));

DROP POLICY IF EXISTS "Users can view their requests" ON public.task_requests;
CREATE POLICY "Users can view their requests" ON public.task_requests
  FOR SELECT
  USING ((((SELECT auth.uid()) IS NOT NULL) AND ((requested_user_id = (SELECT auth.uid())) OR (requested_user_id IS NULL) OR (requested_by = (SELECT auth.uid())))));


-- ==========================================================
-- timeline_comments
-- ==========================================================
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON public.timeline_comments;
CREATE POLICY "Anyone can view non-deleted comments" ON public.timeline_comments
  FOR SELECT
  USING (((is_deleted = false) OR ((SELECT auth.uid()) = user_id)));

DROP POLICY IF EXISTS "Users can create comments" ON public.timeline_comments;
CREATE POLICY "Users can create comments" ON public.timeline_comments
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.timeline_comments;
CREATE POLICY "Users can delete their own comments" ON public.timeline_comments
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own comments" ON public.timeline_comments;
CREATE POLICY "Users can update their own comments" ON public.timeline_comments
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id));


-- ==========================================================
-- timeline_dislikes
-- ==========================================================
DROP POLICY IF EXISTS "Users can create their own dislikes" ON public.timeline_dislikes;
CREATE POLICY "Users can create their own dislikes" ON public.timeline_dislikes
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own dislikes" ON public.timeline_dislikes;
CREATE POLICY "Users can delete their own dislikes" ON public.timeline_dislikes
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage their own dislikes" ON public.timeline_dislikes;
CREATE POLICY "Users can manage their own dislikes" ON public.timeline_dislikes
  FOR ALL
  USING (((SELECT auth.uid()) = user_id));


-- ==========================================================
-- timeline_event_visibility
-- ==========================================================
DROP POLICY IF EXISTS "Users can manage their own event visibility" ON public.timeline_event_visibility;
CREATE POLICY "Users can manage their own event visibility" ON public.timeline_event_visibility
  FOR ALL
  USING ((EXISTS ( SELECT 1
   FROM timeline_events
  WHERE ((timeline_events.id = timeline_event_visibility.event_id) AND (timeline_events.actor_id = (SELECT auth.uid()))))));


-- ==========================================================
-- timeline_events
-- ==========================================================
DROP POLICY IF EXISTS "Users can create timeline events" ON public.timeline_events;
CREATE POLICY "Users can create timeline events" ON public.timeline_events
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) = actor_id) OR (actor_type = 'system'::text)));

DROP POLICY IF EXISTS "Users can delete their own timeline events" ON public.timeline_events;
CREATE POLICY "Users can delete their own timeline events" ON public.timeline_events
  FOR DELETE
  USING (((SELECT auth.uid()) = actor_id));

DROP POLICY IF EXISTS "Users can insert their own timeline events" ON public.timeline_events;
CREATE POLICY "Users can insert their own timeline events" ON public.timeline_events
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = actor_id));

DROP POLICY IF EXISTS "Users can update their own timeline events" ON public.timeline_events;
CREATE POLICY "Users can update their own timeline events" ON public.timeline_events
  FOR UPDATE
  USING (((SELECT auth.uid()) = actor_id));

DROP POLICY IF EXISTS "Users can view follower timeline events" ON public.timeline_events;
CREATE POLICY "Users can view follower timeline events" ON public.timeline_events
  FOR SELECT
  USING (((visibility = 'followers'::text) AND (NOT is_deleted) AND (EXISTS ( SELECT 1
   FROM follows
  WHERE ((follows.follower_id = (SELECT auth.uid())) AND (follows.following_id = timeline_events.actor_id))))));

DROP POLICY IF EXISTS "Users can view their own private timeline events" ON public.timeline_events;
CREATE POLICY "Users can view their own private timeline events" ON public.timeline_events
  FOR SELECT
  USING (((visibility = 'private'::text) AND (NOT is_deleted) AND (actor_id = (SELECT auth.uid()))));


-- ==========================================================
-- timeline_interactions
-- ==========================================================
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.timeline_interactions;
CREATE POLICY "Users can delete their own interactions" ON public.timeline_interactions
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.timeline_interactions;
CREATE POLICY "Users can insert their own interactions" ON public.timeline_interactions
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));


-- ==========================================================
-- timeline_likes
-- ==========================================================
DROP POLICY IF EXISTS "Users can create their own likes" ON public.timeline_likes;
CREATE POLICY "Users can create their own likes" ON public.timeline_likes
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.timeline_likes;
CREATE POLICY "Users can delete their own likes" ON public.timeline_likes
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage their own likes" ON public.timeline_likes;
CREATE POLICY "Users can manage their own likes" ON public.timeline_likes
  FOR ALL
  USING (((SELECT auth.uid()) = user_id));


-- ==========================================================
-- timeline_shares
-- ==========================================================
DROP POLICY IF EXISTS "Users can create their own shares" ON public.timeline_shares;
CREATE POLICY "Users can create their own shares" ON public.timeline_shares
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own shares" ON public.timeline_shares;
CREATE POLICY "Users can delete their own shares" ON public.timeline_shares
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own shares" ON public.timeline_shares;
CREATE POLICY "Users can update their own shares" ON public.timeline_shares
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view follower shares" ON public.timeline_shares;
CREATE POLICY "Users can view follower shares" ON public.timeline_shares
  FOR SELECT
  USING (((visibility = 'followers'::text) AND (EXISTS ( SELECT 1
   FROM follows
  WHERE ((follows.follower_id = (SELECT auth.uid())) AND (follows.following_id = timeline_shares.user_id))))));

DROP POLICY IF EXISTS "Users can view their own private shares" ON public.timeline_shares;
CREATE POLICY "Users can view their own private shares" ON public.timeline_shares
  FOR SELECT
  USING (((visibility = 'private'::text) AND ((SELECT auth.uid()) = user_id)));


-- ==========================================================
-- user_ai_preferences
-- ==========================================================
DROP POLICY IF EXISTS "Users can delete own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can delete own AI preferences" ON public.user_ai_preferences
  FOR DELETE
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can insert own AI preferences" ON public.user_ai_preferences
  FOR INSERT
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can update own AI preferences" ON public.user_ai_preferences
  FOR UPDATE
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can view own AI preferences" ON public.user_ai_preferences
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));


-- ==========================================================
-- user_causes
-- ==========================================================
DROP POLICY IF EXISTS "Public causes are viewable by everyone" ON public.user_causes;
CREATE POLICY "Public causes are viewable by everyone" ON public.user_causes
  FOR SELECT
  USING (((status = 'active'::text) OR (actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Users can delete their own causes" ON public.user_causes;
CREATE POLICY "Users can delete their own causes" ON public.user_causes
  FOR DELETE
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Users can insert their own causes" ON public.user_causes;
CREATE POLICY "Users can insert their own causes" ON public.user_causes
  FOR INSERT
  WITH CHECK ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Users can update their own causes" ON public.user_causes;
CREATE POLICY "Users can update their own causes" ON public.user_causes
  FOR UPDATE
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));


-- ==========================================================
-- user_documents
-- ==========================================================
DROP POLICY IF EXISTS "Users can create own documents" ON public.user_documents;
CREATE POLICY "Users can create own documents" ON public.user_documents
  FOR INSERT
  WITH CHECK ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Users can delete own documents" ON public.user_documents;
CREATE POLICY "Users can delete own documents" ON public.user_documents
  FOR DELETE
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Users can update own documents" ON public.user_documents;
CREATE POLICY "Users can update own documents" ON public.user_documents
  FOR UPDATE
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))))
  WITH CHECK ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Users can view own documents" ON public.user_documents;
CREATE POLICY "Users can view own documents" ON public.user_documents
  FOR SELECT
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));


-- ==========================================================
-- wishlist_contributions
-- ==========================================================
DROP POLICY IF EXISTS "wishlist_contributions_view_own" ON public.wishlist_contributions;
CREATE POLICY "wishlist_contributions_view_own" ON public.wishlist_contributions
  FOR SELECT
  USING (((contributor_actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))) OR (wishlist_item_id IN ( SELECT wi.id
   FROM (wishlist_items wi
     JOIN wishlists w ON ((w.id = wi.wishlist_id)))
  WHERE (w.actor_id IN ( SELECT actors.id
           FROM actors
          WHERE (actors.user_id = (SELECT auth.uid()))))))));


-- ==========================================================
-- wishlist_feedback
-- ==========================================================
DROP POLICY IF EXISTS "feedback_create_own" ON public.wishlist_feedback;
CREATE POLICY "feedback_create_own" ON public.wishlist_feedback
  FOR INSERT
  WITH CHECK ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "feedback_delete_own" ON public.wishlist_feedback;
CREATE POLICY "feedback_delete_own" ON public.wishlist_feedback
  FOR DELETE
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));


-- ==========================================================
-- wishlist_fulfillment_proofs
-- ==========================================================
DROP POLICY IF EXISTS "fulfillment_proofs_owner" ON public.wishlist_fulfillment_proofs;
CREATE POLICY "fulfillment_proofs_owner" ON public.wishlist_fulfillment_proofs
  FOR ALL
  USING ((wishlist_item_id IN ( SELECT wi.id
   FROM (wishlist_items wi
     JOIN wishlists w ON ((w.id = wi.wishlist_id)))
  WHERE (w.actor_id IN ( SELECT actors.id
           FROM actors
          WHERE (actors.user_id = (SELECT auth.uid())))))));


-- ==========================================================
-- wishlist_items
-- ==========================================================
DROP POLICY IF EXISTS "wishlist_items_owner" ON public.wishlist_items;
CREATE POLICY "wishlist_items_owner" ON public.wishlist_items
  FOR ALL
  USING ((wishlist_id IN ( SELECT wishlists.id
   FROM wishlists
  WHERE (wishlists.actor_id IN ( SELECT actors.id
           FROM actors
          WHERE (actors.user_id = (SELECT auth.uid())))))));


-- ==========================================================
-- wishlists
-- ==========================================================
DROP POLICY IF EXISTS "wishlist_owner_all" ON public.wishlists;
CREATE POLICY "wishlist_owner_all" ON public.wishlists
  FOR ALL
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

