-- Cat watches: standing conditions the Cat monitors for the user.
--
-- WHY: "tell me when funding reaches 0.05 BTC" / "when someone books me" is a
-- reminder with a CONDITION instead of a date. Rows are created from chat via
-- the create_watch action (user-scoped client → RLS INSERT policy required,
-- see 20260729133000_cat_action_write_policies.sql for the failure mode) and
-- evaluated by the cat-watches cron (service role), which fires a notification
-- and flips status to 'fired'.

CREATE TABLE IF NOT EXISTS public.cat_watches (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    kind text NOT NULL CHECK (kind IN ('funding_reached', 'sale_received', 'booking_received')),
    -- What to tell the user when it fires (their own words where possible).
    label text NOT NULL,
    entity_type text,
    entity_id uuid,
    -- funding_reached: absolute BTC target (SSOT rule: BTC, NUMERIC(18,8)).
    target_btc numeric(18, 8),
    status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'fired', 'cancelled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    fired_at timestamptz
);

CREATE INDEX IF NOT EXISTS cat_watches_active_idx
    ON public.cat_watches (status, created_at)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS cat_watches_user_idx ON public.cat_watches (user_id);

ALTER TABLE public.cat_watches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cat_watches'
      AND policyname = 'Users can view own watches'
  ) THEN
    CREATE POLICY "Users can view own watches" ON public.cat_watches
      FOR SELECT USING (user_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cat_watches'
      AND policyname = 'Users can insert own watches'
  ) THEN
    CREATE POLICY "Users can insert own watches" ON public.cat_watches
      FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cat_watches'
      AND policyname = 'Users can update own watches'
  ) THEN
    CREATE POLICY "Users can update own watches" ON public.cat_watches
      FOR UPDATE USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.cat_watches TO authenticated;
GRANT ALL ON public.cat_watches TO service_role;
