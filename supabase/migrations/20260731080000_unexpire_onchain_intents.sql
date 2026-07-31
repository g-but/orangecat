-- On-chain payment intents must not carry a deadline.
--
-- `expires_at` answers one question: can a NEW payment still be made? For
-- Lightning that is real — a BOLT11 invoice is cryptographically dead after its
-- expiry. For on-chain it is not: a Bitcoin address never stops accepting
-- money, and money sent to it reaches the recipient whatever this database
-- says.
--
-- The account-free support and tip flows nonetheless stamped every on-chain
-- intent with a one-hour deadline (the authenticated flow did not — the same
-- rail behaved differently depending on who was paying). That fabricated
-- deadline is how on-chain money goes missing: the reconciliation sweep skips
-- terminal rows, so a payment confirming after the hour settles with no record
-- at all — no recipient notification, no contribution row, funding totals
-- frozen at zero. On-chain is the slow rail, so it is the one most likely to
-- confirm late.
--
-- The code now records NULL for on-chain (domain/payments/intentExpiry.ts) and
-- bounds observation in the sweeper instead, where "we stopped asking" stays an
-- operational choice rather than a claim that no money arrived. This corrects
-- the rows written under the old rule.
--
-- Deliberately narrow: `paid_at IS NULL` guarantees no settled payment is ever
-- touched, and only the expiry the old rule invented is undone.

-- migration-safety: data-fix only — no schema change; restores non-terminal
-- state for unpaid on-chain intents and clears an expiry that was never true.

UPDATE payment_intents
SET status = 'invoice_ready',
    expires_at = NULL
WHERE payment_method = 'onchain'
  AND status = 'expired'
  AND paid_at IS NULL;

-- Any surviving on-chain intent (including future ones already created under
-- the old code path) loses the invented deadline too.
UPDATE payment_intents
SET expires_at = NULL
WHERE payment_method = 'onchain'
  AND expires_at IS NOT NULL
  AND paid_at IS NULL;
