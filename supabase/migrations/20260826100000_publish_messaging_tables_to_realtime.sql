-- Realtime has never delivered anything on this instance.
--
-- Every live surface in messaging subscribes with `postgres_changes`:
--
--   useConversations.ts      -> conversations, messages, conversation_participants
--   useReadReceipts.ts       -> conversation_participants
--   useTypingSubscription.ts -> typing_indicators
--   usePresence.ts           -> user_presence
--
-- `postgres_changes` can only deliver rows for tables in the `supabase_realtime`
-- publication, and measured against production on 2026-08-26 that publication
-- contained ZERO public tables:
--
--   SELECT pubname, schemaname, tablename FROM pg_publication_tables;
--    supabase_realtime_messages_publication | realtime | messages_2026_08_23
--    ... 6 more, all schema "realtime"
--   public tables in supabase_realtime: 0
--
-- The seven published tables are Realtime's own internal Broadcast partitions in
-- the `realtime` schema — not application data. So not one subscription in the
-- app has ever fired: a new message appears only when the page refetches, and
-- typing and presence never appear at all.
--
-- No migration in this repo has ever referenced a publication, so this was never
-- configured in code. (Whether it was once set by hand elsewhere is unknown and
-- does not matter here.)
--
-- SAFETY. Publishing a table streams its changes to subscribed clients, so the
-- question that matters is whether a subscriber can receive rows it may not
-- read. Supabase Realtime evaluates each subscriber's JWT against the table's
-- RLS SELECT policy before delivering, so this is only safe on tables that have
-- RLS enabled with a correct policy. All five do — verified 2026-08-26:
--
--   messages                   rls_enabled=t  SELECT: sender must share an active
--                                            conversation with the reader
--   conversations              rls_enabled=t  SELECT policy present
--   conversation_participants  rls_enabled=t  SELECT policy present
--   typing_indicators          rls_enabled=t  SELECT: participants only
--   user_presence              rls_enabled=t  SELECT: public (status only — the
--                                            table holds no message content)
--
-- The guard below is belt-and-braces: it refuses to publish any table that does
-- not have RLS enabled, so a future table added to this list cannot leak by
-- being pasted in without a policy.

DO $$
DECLARE
  v_table text;
  v_rls   boolean;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'messages',
    'conversations',
    'conversation_participants',
    'typing_indicators',
    'user_presence'
  ] LOOP
    SELECT c.relrowsecurity INTO v_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_table;

    IF v_rls IS NULL THEN
      RAISE EXCEPTION 'public.% does not exist — refusing to publish', v_table;
    END IF;

    -- Realtime filters by RLS. No RLS means every subscriber sees every row.
    IF NOT v_rls THEN
      RAISE EXCEPTION 'public.% has RLS disabled — refusing to publish it to realtime', v_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
      RAISE NOTICE 'published public.% to supabase_realtime', v_table;
    END IF;
  END LOOP;
END $$;

-- An UPDATE or DELETE event carries only the primary key unless the table has a
-- richer replica identity. The subscribers here need the changed row's identity
-- to refetch, which the default already gives them, so replica identity is left
-- alone deliberately: raising it to FULL would put whole OLD rows — including
-- message bodies — into the WAL and onto the wire for delete events.

NOTIFY pgrst, 'reload schema';
