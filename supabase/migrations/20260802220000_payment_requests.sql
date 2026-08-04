-- Person-to-person payment requests: "Lena asks Marco for 0.0005 BTC for dinner."
--
-- A request is NOT a payment_intent. An intent carries a live invoice, and a
-- BOLT11 dies in about an hour — a request has to survive until the person
-- actually opens it, which may be tomorrow. So the request records the ASK, and
-- the invoice is minted only when the payer arrives (the same alias-backed rule
-- the public /pay/<username> page follows).
--
-- The link back to payment_intents is filled in AFTER settlement, which is the
-- established direction in this codebase: settlement is observed, never assumed
-- at creation time.

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who gets paid (the asker) and who is being asked. Both are real accounts:
  -- asking a stranger is what the public pay link is for.
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  amount_btc NUMERIC(18, 8) NOT NULL CHECK (amount_btc > 0),
  note TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'declined', 'cancelled')),

  -- Set by the system when a payment lands against this request.
  paid_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Asking yourself for money is always a mistake, never an intent.
  CONSTRAINT payment_requests_distinct_parties CHECK (requester_id <> payer_id)
);

-- Both sides list their own requests, newest first.
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester
  ON payment_requests (requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payer
  ON payment_requests (payer_id, created_at DESC);
-- The payer's badge count reads only what is still outstanding.
CREATE INDEX IF NOT EXISTS idx_payment_requests_pending
  ON payment_requests (payer_id) WHERE status = 'pending';

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Visible to exactly the two people it concerns.
DROP POLICY IF EXISTS payment_requests_select_parties ON payment_requests;
CREATE POLICY payment_requests_select_parties ON payment_requests
  FOR SELECT USING ((SELECT auth.uid()) IN (requester_id, payer_id));

-- You may only ask on your OWN behalf. Without this, anyone could mint a
-- request that appears to come from someone else — a phishing primitive.
DROP POLICY IF EXISTS payment_requests_insert_own ON payment_requests;
CREATE POLICY payment_requests_insert_own ON payment_requests
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = requester_id);

-- Either party may withdraw from a request while it is still open: the asker
-- cancels, the payer declines. Neither may mark it paid — that is a fact about
-- the world, written by the system after observing settlement, never claimed by
-- a party with an interest in the answer.
DROP POLICY IF EXISTS payment_requests_update_parties ON payment_requests;
CREATE POLICY payment_requests_update_parties ON payment_requests
  FOR UPDATE
  USING ((SELECT auth.uid()) IN (requester_id, payer_id) AND status = 'pending')
  WITH CHECK (status IN ('cancelled', 'declined'));

COMMENT ON TABLE payment_requests IS
  'Person-to-person asks for money. Holds the request only — invoices are minted at pay time so a request survives longer than a BOLT11.';
COMMENT ON COLUMN payment_requests.paid_intent_id IS
  'System-written after settlement is observed; never set at creation.';
