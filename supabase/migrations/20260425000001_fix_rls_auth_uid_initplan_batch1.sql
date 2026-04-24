-- Optimize RLS policies (batch 1/4): replace bare auth.uid() with (SELECT auth.uid())
-- Prevents per-row function evaluation (InitPlan optimization).
-- Tables: actors, ai_assistants, ai_creator_earnings, ai_creator_withdrawals, assets,
--         cat_action_log, cat_conversations, cat_messages, cat_pending_actions,
--         cat_permissions, contributions, conversations, entity_wallets, event_attendees,
--         events, follows, group_activities, group_event_rsvps, group_events,
--         group_features, group_members, group_proposals, group_votes, group_wallets,
--         groups, investments, loan_offers, loan_payments, loans, message_read_receipts
-- References: https://supabase.com/docs/guides/database/database-linter?lint=0013_auth_rls_initplan

-- ==========================================================
-- actors
-- ==========================================================
DROP POLICY IF EXISTS "Group admins can create group actor" ON public.actors;
CREATE POLICY "Group admins can create group actor" ON public.actors
  FOR INSERT
  WITH CHECK (((actor_type = 'group'::text) AND (group_id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE ((group_members.user_id = (SELECT auth.uid())) AND (group_members.role = ANY (ARRAY['founder'::text, 'admin'::text])))))));

DROP POLICY IF EXISTS "Users can create their own actor" ON public.actors;
CREATE POLICY "Users can create their own actor" ON public.actors
  FOR INSERT
  WITH CHECK (((actor_type = 'user'::text) AND (user_id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Users can view their own actor" ON public.actors;
CREATE POLICY "Users can view their own actor" ON public.actors
  FOR SELECT
  USING ((((actor_type = 'user'::text) AND (user_id = (SELECT auth.uid()))) OR ((actor_type = 'group'::text) AND (group_id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE (group_members.user_id = (SELECT auth.uid())))))));

-- ==========================================================
-- ai_assistants
-- ==========================================================
DROP POLICY IF EXISTS "Users can create AI assistants" ON public.ai_assistants;
CREATE POLICY "Users can create AI assistants" ON public.ai_assistants
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own AI assistants" ON public.ai_assistants;
CREATE POLICY "Users can delete their own AI assistants" ON public.ai_assistants
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own AI assistants" ON public.ai_assistants;
CREATE POLICY "Users can update their own AI assistants" ON public.ai_assistants
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their own AI assistants" ON public.ai_assistants;
CREATE POLICY "Users can view their own AI assistants" ON public.ai_assistants
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));

-- ==========================================================
-- ai_creator_earnings
-- ==========================================================
DROP POLICY IF EXISTS "Users can view own earnings" ON public.ai_creator_earnings;
CREATE POLICY "Users can view own earnings" ON public.ai_creator_earnings
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));

-- ==========================================================
-- ai_creator_withdrawals
-- ==========================================================
DROP POLICY IF EXISTS "Users can request withdrawals" ON public.ai_creator_withdrawals;
CREATE POLICY "Users can request withdrawals" ON public.ai_creator_withdrawals
  FOR INSERT
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.ai_creator_withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.ai_creator_withdrawals
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));

-- ==========================================================
-- assets
-- ==========================================================
DROP POLICY IF EXISTS "assets_owner_delete" ON public.assets;
CREATE POLICY "assets_owner_delete" ON public.assets
  FOR DELETE
  USING (((SELECT auth.uid()) = owner_id));

DROP POLICY IF EXISTS "assets_owner_insert" ON public.assets;
CREATE POLICY "assets_owner_insert" ON public.assets
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = owner_id));

DROP POLICY IF EXISTS "assets_owner_select" ON public.assets;
CREATE POLICY "assets_owner_select" ON public.assets
  FOR SELECT
  USING (((SELECT auth.uid()) = owner_id));

DROP POLICY IF EXISTS "assets_owner_update" ON public.assets;
CREATE POLICY "assets_owner_update" ON public.assets
  FOR UPDATE
  USING (((SELECT auth.uid()) = owner_id))
  WITH CHECK (((SELECT auth.uid()) = owner_id));

-- ==========================================================
-- cat_action_log
-- ==========================================================
DROP POLICY IF EXISTS "Users can view own cat action log" ON public.cat_action_log;
CREATE POLICY "Users can view own cat action log" ON public.cat_action_log
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));

-- ==========================================================
-- cat_conversations
-- ==========================================================
DROP POLICY IF EXISTS "cat_conversations_delete" ON public.cat_conversations;
CREATE POLICY "cat_conversations_delete" ON public.cat_conversations
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "cat_conversations_insert" ON public.cat_conversations;
CREATE POLICY "cat_conversations_insert" ON public.cat_conversations
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "cat_conversations_select" ON public.cat_conversations;
CREATE POLICY "cat_conversations_select" ON public.cat_conversations
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "cat_conversations_update" ON public.cat_conversations;
CREATE POLICY "cat_conversations_update" ON public.cat_conversations
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id));

-- ==========================================================
-- cat_messages
-- ==========================================================
DROP POLICY IF EXISTS "cat_messages_insert" ON public.cat_messages;
CREATE POLICY "cat_messages_insert" ON public.cat_messages
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "cat_messages_select" ON public.cat_messages;
CREATE POLICY "cat_messages_select" ON public.cat_messages
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));

-- ==========================================================
-- cat_pending_actions
-- ==========================================================
DROP POLICY IF EXISTS "Users can update own pending cat actions" ON public.cat_pending_actions;
CREATE POLICY "Users can update own pending cat actions" ON public.cat_pending_actions
  FOR UPDATE
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view own pending cat actions" ON public.cat_pending_actions;
CREATE POLICY "Users can view own pending cat actions" ON public.cat_pending_actions
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));

-- ==========================================================
-- cat_permissions
-- ==========================================================
DROP POLICY IF EXISTS "Users can create own cat permissions" ON public.cat_permissions;
CREATE POLICY "Users can create own cat permissions" ON public.cat_permissions
  FOR INSERT
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can delete own cat permissions" ON public.cat_permissions;
CREATE POLICY "Users can delete own cat permissions" ON public.cat_permissions
  FOR DELETE
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update own cat permissions" ON public.cat_permissions;
CREATE POLICY "Users can update own cat permissions" ON public.cat_permissions
  FOR UPDATE
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view own cat permissions" ON public.cat_permissions;
CREATE POLICY "Users can view own cat permissions" ON public.cat_permissions
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));

-- ==========================================================
-- contributions
-- ==========================================================
DROP POLICY IF EXISTS "Authenticated users create contributions" ON public.contributions;
CREATE POLICY "Authenticated users create contributions" ON public.contributions
  FOR INSERT
  WITH CHECK ((contributor_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Contributors view own" ON public.contributions;
CREATE POLICY "Contributors view own" ON public.contributions
  FOR SELECT
  USING ((contributor_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Entity owners view all contributions" ON public.contributions;
CREATE POLICY "Entity owners view all contributions" ON public.contributions
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM actors a
  WHERE ((a.user_id = (SELECT auth.uid())) AND (((contributions.entity_type = 'project'::text) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = contributions.entity_id) AND (projects.actor_id = a.id))))) OR ((contributions.entity_type = 'cause'::text) AND (EXISTS ( SELECT 1
           FROM user_causes
          WHERE ((user_causes.id = contributions.entity_id) AND (user_causes.actor_id = a.id))))) OR ((contributions.entity_type = 'research'::text) AND (EXISTS ( SELECT 1
           FROM research_entities
          WHERE ((research_entities.id = contributions.entity_id) AND (research_entities.user_id = (SELECT auth.uid())))))))))));

-- ==========================================================
-- conversations
-- ==========================================================
DROP POLICY IF EXISTS "Conversation participants can update conversations" ON public.conversations;
CREATE POLICY "Conversation participants can update conversations" ON public.conversations
  FOR UPDATE
  USING ((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = conversations.id) AND (cp.user_id = (SELECT auth.uid())) AND (cp.is_active = true)))));

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = created_by));

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = conversations.id) AND (cp.user_id = (SELECT auth.uid())) AND (cp.is_active = true)))));

-- ==========================================================
-- entity_wallets
-- ==========================================================
DROP POLICY IF EXISTS "Link creators can view" ON public.entity_wallets;
CREATE POLICY "Link creators can view" ON public.entity_wallets
  FOR SELECT
  USING ((created_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Wallet owners can create links" ON public.entity_wallets;
CREATE POLICY "Wallet owners can create links" ON public.entity_wallets
  FOR INSERT
  WITH CHECK ((wallet_id IN ( SELECT wallets.id
   FROM wallets
  WHERE (wallets.profile_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Wallet owners can delete links" ON public.entity_wallets;
CREATE POLICY "Wallet owners can delete links" ON public.entity_wallets
  FOR DELETE
  USING ((wallet_id IN ( SELECT wallets.id
   FROM wallets
  WHERE (wallets.profile_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Wallet owners can view links" ON public.entity_wallets;
CREATE POLICY "Wallet owners can view links" ON public.entity_wallets
  FOR SELECT
  USING ((wallet_id IN ( SELECT wallets.id
   FROM wallets
  WHERE (wallets.profile_id = (SELECT auth.uid())))));

-- ==========================================================
-- event_attendees
-- ==========================================================
DROP POLICY IF EXISTS "Event organizers can manage attendees" ON public.event_attendees;
CREATE POLICY "Event organizers can manage attendees" ON public.event_attendees
  FOR ALL
  USING ((EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND (events.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Users can read event attendees" ON public.event_attendees;
CREATE POLICY "Users can read event attendees" ON public.event_attendees
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND ((events.status = ANY (ARRAY['published'::text, 'open'::text, 'full'::text, 'ongoing'::text, 'completed'::text])) OR (events.user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "Users can register for events" ON public.event_attendees;
CREATE POLICY "Users can register for events" ON public.event_attendees
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own registration" ON public.event_attendees;
CREATE POLICY "Users can update their own registration" ON public.event_attendees
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id));

-- ==========================================================
-- events
-- ==========================================================
DROP POLICY IF EXISTS "Users can create events" ON public.events;
CREATE POLICY "Users can create events" ON public.events
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own draft events" ON public.events;
CREATE POLICY "Users can delete their own draft events" ON public.events
  FOR DELETE
  USING ((((SELECT auth.uid()) = user_id) AND (status = 'draft'::text)));

DROP POLICY IF EXISTS "Users can read their own events" ON public.events;
CREATE POLICY "Users can read their own events" ON public.events
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id));

-- ==========================================================
-- follows
-- ==========================================================
DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;
CREATE POLICY "Users can create their own follows" ON public.follows
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = follower_id));

DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE
  USING (((SELECT auth.uid()) = follower_id));

-- ==========================================================
-- group_activities
-- ==========================================================
DROP POLICY IF EXISTS "Group members can create activities" ON public.group_activities;
CREATE POLICY "Group members can create activities" ON public.group_activities
  FOR INSERT
  WITH CHECK (((group_id IN ( SELECT gm.group_id
   FROM group_members gm
  WHERE (gm.user_id = (SELECT auth.uid())))) AND (user_id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Group members can view activities" ON public.group_activities;
CREATE POLICY "Group members can view activities" ON public.group_activities
  FOR SELECT
  USING ((group_id IN ( SELECT gm.group_id
   FROM group_members gm
  WHERE (gm.user_id = (SELECT auth.uid())))));

-- ==========================================================
-- group_event_rsvps
-- ==========================================================
DROP POLICY IF EXISTS "Event attendees can view RSVPs" ON public.group_event_rsvps;
CREATE POLICY "Event attendees can view RSVPs" ON public.group_event_rsvps
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM group_events
  WHERE ((group_events.id = group_event_rsvps.event_id) AND ((group_events.is_public = true) OR (EXISTS ( SELECT 1
           FROM group_members
          WHERE ((group_members.group_id = group_events.group_id) AND (group_members.user_id = (SELECT auth.uid()))))))))));

DROP POLICY IF EXISTS "Users can manage their RSVPs" ON public.group_event_rsvps;
CREATE POLICY "Users can manage their RSVPs" ON public.group_event_rsvps
  FOR ALL
  USING ((user_id = (SELECT auth.uid())));

-- ==========================================================
-- group_events
-- ==========================================================
DROP POLICY IF EXISTS "Creators and admins can delete events" ON public.group_events;
CREATE POLICY "Creators and admins can delete events" ON public.group_events
  FOR DELETE
  USING (((creator_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_events.group_id) AND (group_members.user_id = (SELECT auth.uid())) AND (group_members.role = ANY (ARRAY['founder'::text, 'admin'::text])))))));

DROP POLICY IF EXISTS "Creators and admins can update events" ON public.group_events;
CREATE POLICY "Creators and admins can update events" ON public.group_events
  FOR UPDATE
  USING (((creator_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_events.group_id) AND (group_members.user_id = (SELECT auth.uid())) AND (group_members.role = ANY (ARRAY['founder'::text, 'admin'::text])))))));

DROP POLICY IF EXISTS "Members can create events" ON public.group_events;
CREATE POLICY "Members can create events" ON public.group_events
  FOR INSERT
  WITH CHECK ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_events.group_id) AND (group_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Public events are viewable" ON public.group_events;
CREATE POLICY "Public events are viewable" ON public.group_events
  FOR SELECT
  USING (((is_public = true) OR (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_events.group_id) AND (group_members.user_id = (SELECT auth.uid())))))));

-- ==========================================================
-- group_features
-- ==========================================================
DROP POLICY IF EXISTS "Founders and admins can manage features" ON public.group_features;
CREATE POLICY "Founders and admins can manage features" ON public.group_features
  FOR ALL
  USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_features.group_id) AND (group_members.user_id = (SELECT auth.uid())) AND (group_members.role = ANY (ARRAY['founder'::text, 'admin'::text]))))));

DROP POLICY IF EXISTS "Members can view group features" ON public.group_features;
CREATE POLICY "Members can view group features" ON public.group_features
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_features.group_id) AND (group_members.user_id = (SELECT auth.uid()))))));

-- ==========================================================
-- group_members
-- ==========================================================
DROP POLICY IF EXISTS "Founders and admins can manage members" ON public.group_members;
CREATE POLICY "Founders and admins can manage members" ON public.group_members
  FOR ALL
  USING ((is_group_member(group_id, (SELECT auth.uid())) AND (get_user_group_role(group_id, (SELECT auth.uid())) = ANY (ARRAY['founder'::text, 'admin'::text]))));

DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;
CREATE POLICY "Group members can view other members" ON public.group_members
  FOR SELECT
  USING (((EXISTS ( SELECT 1
   FROM groups
  WHERE ((groups.id = group_members.group_id) AND (groups.is_public = true)))) OR is_group_member(group_id, (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_members;
CREATE POLICY "Users can view their own memberships" ON public.group_members
  FOR SELECT
  USING ((user_id = (SELECT auth.uid())));

-- ==========================================================
-- group_proposals
-- ==========================================================
DROP POLICY IF EXISTS "Members can create proposals" ON public.group_proposals;
CREATE POLICY "Members can create proposals" ON public.group_proposals
  FOR INSERT
  WITH CHECK ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_proposals.group_id) AND (group_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Members can view proposals" ON public.group_proposals;
CREATE POLICY "Members can view proposals" ON public.group_proposals
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_proposals.group_id) AND (group_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Proposers can update their proposals" ON public.group_proposals;
CREATE POLICY "Proposers can update their proposals" ON public.group_proposals
  FOR UPDATE
  USING ((proposer_id = (SELECT auth.uid())));

-- ==========================================================
-- group_votes
-- ==========================================================
DROP POLICY IF EXISTS "Members can view votes" ON public.group_votes;
CREATE POLICY "Members can view votes" ON public.group_votes
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = ( SELECT group_proposals.group_id
           FROM group_proposals
          WHERE (group_proposals.id = group_votes.proposal_id))) AND (group_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Members can vote" ON public.group_votes;
CREATE POLICY "Members can vote" ON public.group_votes
  FOR INSERT
  WITH CHECK ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = ( SELECT group_proposals.group_id
           FROM group_proposals
          WHERE (group_proposals.id = group_votes.proposal_id))) AND (group_members.user_id = (SELECT auth.uid()))))));

-- ==========================================================
-- group_wallets
-- ==========================================================
DROP POLICY IF EXISTS "Founders and admins can manage wallets" ON public.group_wallets;
CREATE POLICY "Founders and admins can manage wallets" ON public.group_wallets
  FOR ALL
  USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_wallets.group_id) AND (group_members.user_id = (SELECT auth.uid())) AND (group_members.role = ANY (ARRAY['founder'::text, 'admin'::text]))))));

DROP POLICY IF EXISTS "Members can view wallets" ON public.group_wallets;
CREATE POLICY "Members can view wallets" ON public.group_wallets
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_wallets.group_id) AND (group_members.user_id = (SELECT auth.uid()))))));

-- ==========================================================
-- groups
-- ==========================================================
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

DROP POLICY IF EXISTS "Founders can delete groups" ON public.groups;
CREATE POLICY "Founders can delete groups" ON public.groups
  FOR DELETE
  USING ((is_group_member(id, (SELECT auth.uid())) AND (get_user_group_role(id, (SELECT auth.uid())) = 'founder'::text)));

DROP POLICY IF EXISTS "Members can update their groups" ON public.groups;
CREATE POLICY "Members can update their groups" ON public.groups
  FOR UPDATE
  USING ((is_group_member(id, (SELECT auth.uid())) AND (get_user_group_role(id, (SELECT auth.uid())) = ANY (ARRAY['founder'::text, 'admin'::text]))));

DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups" ON public.groups
  FOR SELECT
  USING (is_group_member(id, (SELECT auth.uid())));

-- ==========================================================
-- investments
-- ==========================================================
DROP POLICY IF EXISTS "Owner can create investments" ON public.investments;
CREATE POLICY "Owner can create investments" ON public.investments
  FOR INSERT
  WITH CHECK ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Owner can delete draft investments" ON public.investments;
CREATE POLICY "Owner can delete draft investments" ON public.investments
  FOR DELETE
  USING (((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))) AND (status = 'draft'::text)));

DROP POLICY IF EXISTS "Owner can update own investments" ON public.investments;
CREATE POLICY "Owner can update own investments" ON public.investments
  FOR UPDATE
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Owner can view own investments" ON public.investments;
CREATE POLICY "Owner can view own investments" ON public.investments
  FOR SELECT
  USING ((actor_id IN ( SELECT actors.id
   FROM actors
  WHERE (actors.user_id = (SELECT auth.uid())))));

-- ==========================================================
-- loan_offers
-- ==========================================================
DROP POLICY IF EXISTS "Loan owners and offerers can view offers" ON public.loan_offers;
CREATE POLICY "Loan owners and offerers can view offers" ON public.loan_offers
  FOR SELECT
  USING (((SELECT auth.uid()) IN ( SELECT loans.user_id
   FROM loans
  WHERE (loans.id = loan_offers.loan_id)
UNION
 SELECT loan_offers_1.offerer_id
   FROM loan_offers loan_offers_1
  WHERE (loan_offers_1.id = loan_offers_1.id))));

DROP POLICY IF EXISTS "Loan owners can update offer status" ON public.loan_offers;
CREATE POLICY "Loan owners can update offer status" ON public.loan_offers
  FOR UPDATE
  USING (((SELECT auth.uid()) IN ( SELECT loans.user_id
   FROM loans
  WHERE (loans.id = loan_offers.loan_id))));

DROP POLICY IF EXISTS "Offerers can update their own offers" ON public.loan_offers;
CREATE POLICY "Offerers can update their own offers" ON public.loan_offers
  FOR UPDATE
  USING (((SELECT auth.uid()) = offerer_id))
  WITH CHECK (((SELECT auth.uid()) = offerer_id));

DROP POLICY IF EXISTS "Users can create offers on public loans" ON public.loan_offers;
CREATE POLICY "Users can create offers on public loans" ON public.loan_offers
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) = offerer_id) AND (EXISTS ( SELECT 1
   FROM loans
  WHERE ((loans.id = loan_offers.loan_id) AND (loans.is_public = true) AND (loans.status = 'active'::text) AND (loans.user_id <> (SELECT auth.uid())))))));

-- ==========================================================
-- loan_payments
-- ==========================================================
DROP POLICY IF EXISTS "Payment parties can view payments" ON public.loan_payments;
CREATE POLICY "Payment parties can view payments" ON public.loan_payments
  FOR SELECT
  USING ((((SELECT auth.uid()) = payer_id) OR ((SELECT auth.uid()) = recipient_id)));

DROP POLICY IF EXISTS "Users can create payments they are involved in" ON public.loan_payments;
CREATE POLICY "Users can create payments they are involved in" ON public.loan_payments
  FOR INSERT
  WITH CHECK ((((SELECT auth.uid()) = payer_id) OR ((SELECT auth.uid()) = recipient_id)));

-- ==========================================================
-- loans
-- ==========================================================
DROP POLICY IF EXISTS "Users can create their own loans" ON public.loans;
CREATE POLICY "Users can create their own loans" ON public.loans
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own loans" ON public.loans;
CREATE POLICY "Users can delete their own loans" ON public.loans
  FOR DELETE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert their own loans" ON public.loans;
CREATE POLICY "Users can insert their own loans" ON public.loans
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own loans" ON public.loans;
CREATE POLICY "Users can update their own loans" ON public.loans
  FOR UPDATE
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
CREATE POLICY "Users can view their own loans" ON public.loans
  FOR SELECT
  USING (((SELECT auth.uid()) = user_id));

-- ==========================================================
-- message_read_receipts
-- ==========================================================
DROP POLICY IF EXISTS "Conversation participants can view read receipts" ON public.message_read_receipts;
CREATE POLICY "Conversation participants can view read receipts" ON public.message_read_receipts
  FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = ( SELECT m.conversation_id
           FROM messages m
          WHERE (m.id = message_read_receipts.message_id))) AND (cp.user_id = (SELECT auth.uid())) AND (cp.is_active = true)))));

DROP POLICY IF EXISTS "Users can create read receipts for themselves" ON public.message_read_receipts;
CREATE POLICY "Users can create read receipts for themselves" ON public.message_read_receipts
  FOR INSERT
  WITH CHECK (((SELECT auth.uid()) = user_id));
