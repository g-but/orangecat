-- Data-controls P0: memory consent + fix the silent cat_messages delete no-op.
--
-- 1. memory_enabled — the "Remember details from our conversations" consent
--    toggle. Read by the Cat chat orchestrator before extracting/storing
--    memories; default true preserves current behavior for everyone.
--    Lives on user_ai_preferences (the existing per-user AI settings row,
--    own-row RLS already in place).
--
-- 2. cat_messages DELETE policy — cat_messages has RLS enabled but only
--    INSERT/SELECT policies, so every `.delete()` through a user-scoped
--    client silently removes 0 rows. Existing flows only worked because
--    deleting the cat_conversations row cascades (FK ON DELETE CASCADE), and
--    DELETE /api/cat/history's clearDefaultConversation is a silent no-op
--    today. Add the missing own-row DELETE policy to end that failure class.
--
-- Idempotent — safe if a box already has either change.

ALTER TABLE public.user_ai_preferences
  ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_ai_preferences.memory_enabled IS
  'Consent: may Cat extract and store memories from conversations? Gates extractAndStoreMemories in src/services/cat/memory.ts';

DROP POLICY IF EXISTS cat_messages_delete_own ON public.cat_messages;
CREATE POLICY cat_messages_delete_own
  ON public.cat_messages
  FOR DELETE
  USING (user_id = auth.uid());
