-- Reconciliation scheduling for payment intents.
--
-- OrangeCat is non-custodial, so settlement is observed rather than owned: we
-- learn a payment happened by asking the recipient's rail (LUD-21 verify, an
-- NWC relay, the chain). Until now the only thing that ever asked was the
-- payer's open browser tab — close it after paying and the money arrived while
-- OrangeCat's record stayed at `invoice_ready` forever: no recipient
-- notification, and no contribution row, so funding totals never moved.
--
-- A background sweep fixes that, but it needs fair scheduling. With only a
-- LIMIT, the same oldest intents would be re-polled every tick while newer ones
-- starved (head-of-line blocking) and third-party rails got hammered.
-- `last_polled_at` + `ORDER BY last_polled_at NULLS FIRST` makes selection
-- self-balancing: never-checked intents go first, then least-recently-checked.
--
-- The index is partial and matches the sweep predicate exactly, so it stays
-- tiny — terminal intents (the overwhelming majority over time) are not in it.

ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS last_polled_at timestamptz;

COMMENT ON COLUMN public.payment_intents.last_polled_at IS
  'When a reconciliation sweep last asked the payment rail about this intent. NULL = never asked.';

CREATE INDEX IF NOT EXISTS payment_intents_reconcile_idx
  ON public.payment_intents (last_polled_at ASC NULLS FIRST)
  WHERE status NOT IN ('paid', 'expired', 'failed', 'buyer_confirmed');
