-- cat_conversations is the last table in the Cat family with no owner.
--
-- Every sibling already cascades from the account:
--
--   cat_messages.user_id        -> auth.users  ON DELETE CASCADE
--   cat_messages.conversation_id-> cat_conversations ON DELETE CASCADE
--   cat_memories.user_id        -> auth.users  ON DELETE CASCADE
--   cat_pending_actions.user_id -> auth.users  ON DELETE CASCADE
--   wallets.profile_id          -> profiles    ON DELETE CASCADE
--   profiles.id                 -> auth.users  ON DELETE CASCADE   (#637)
--
-- cat_conversations.user_id references NOTHING. So deleting an account removes
-- the profile, the memories, the pending actions and the wallets — and leaves
-- the conversations standing, with their titles, forever. For a real person
-- deleting their account that is not untidiness, it is their private chat with
-- Cat surviving the deletion they asked for.
--
-- Found on 2026-08-07 by an eval harness that deleted 7 throwaway users and
-- left 20 conversations behind while its own cleanup check reported success —
-- the check watched `profiles`, which does cascade. Same shape as #637, one
-- table over, and the reason to close it in the schema rather than in the
-- harness: the harness was only the thing that happened to notice.
--
-- Safe on a 33-row table. The DELETE cannot remove a live user's data — it
-- matches only rows whose auth user no longer exists — and `psql -1` runs the
-- whole file in one transaction, so the constraint can never see a row the
-- DELETE did not. NOT VALID + VALIDATE rather than a plain ADD so that the
-- validation failure, if the assumption is ever wrong, names the constraint.

DELETE FROM public.cat_conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = c.user_id
);

ALTER TABLE public.cat_conversations
  ADD CONSTRAINT cat_conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;

ALTER TABLE public.cat_conversations
  VALIDATE CONSTRAINT cat_conversations_user_id_fkey;
