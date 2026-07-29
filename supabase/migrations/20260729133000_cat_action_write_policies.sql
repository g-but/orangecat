-- Fix: Cat action audit + confirmations were silently dead due to missing RLS write policies.
--
-- cat_action_log was created with only a SELECT policy. The executor
-- (CatActionExecutor.performAction) INSERTs an 'executing' row and UPDATEs it to
-- completed/failed through the user-scoped client — both writes have been
-- rejected by RLS since launch (0 rows in prod), and the error is logged and
-- swallowed, so the entire "audit trail of all actions executed by My Cat"
-- never recorded anything.
--
-- cat_pending_actions had SELECT + UPDATE but no INSERT policy, so
-- createPendingAction() THREW for every confirmation-required action: any Cat
-- action gated behind "ask me first" failed outright in production.
--
-- Both tables are strictly owner-scoped (user_id = auth.uid()), matching the
-- existing SELECT policies and the platform convention (see cat_memories).

-- Idempotent: at least one of these policies already existed on the box, so the
-- bare CREATE aborted the transaction and blocked EVERY deploy (the migration
-- runner rolls back and refuses to swap the release). Postgres has no
-- CREATE POLICY IF NOT EXISTS, so drop-then-create is the repo convention
-- (see 20260711000000_loan_offers_select_policy_recursion_fix). Safe to
-- re-run, and correct on a fresh database.

DROP POLICY IF EXISTS "Users can insert own cat action log" ON public.cat_action_log;
CREATE POLICY "Users can insert own cat action log" ON public.cat_action_log
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own cat action log" ON public.cat_action_log;
CREATE POLICY "Users can update own cat action log" ON public.cat_action_log
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own pending cat actions" ON public.cat_pending_actions;
CREATE POLICY "Users can insert own pending cat actions" ON public.cat_pending_actions
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
