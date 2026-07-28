-- Tips as first-class payment intents.
--
-- A tip is an unconditional, person-to-person Bitcoin gift. Unlike a purchase or
-- support contribution, it targets a PERSON, not an entity — so it carries no
-- entity_type/entity_id. Routing tips through payment_intents (rather than a
-- parallel table) keeps ONE ledger for "Bitcoin received" and reuses the entire
-- hardened settle -> notify -> webhook path: the recipient gets the existing
-- in-app "you got paid" notification for free.
--
-- migration-safety: contract-ok — every statement here EXPANDS: it relaxes two
-- NOT NULL constraints (entity_type/entity_id) and widens a CHECK (adds the
-- 'tip' intent_kind). The previous release only ever inserts non-null entity ids
-- and the kinds 'purchase'/'support', so it keeps working unchanged and rollback
-- stays safe (no tip rows exist under the old code).

ALTER TABLE payment_intents
  ALTER COLUMN entity_type DROP NOT NULL,
  ALTER COLUMN entity_id DROP NOT NULL;

ALTER TABLE payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_intent_kind_check;

ALTER TABLE payment_intents
  ADD CONSTRAINT payment_intents_intent_kind_check
  CHECK (intent_kind IN ('purchase', 'support', 'tip'));

COMMENT ON COLUMN payment_intents.intent_kind IS
  'purchase creates/settles an order; support = voluntary contribution to an entity; tip = unconditional person-to-person Bitcoin gift (entity_type/entity_id are NULL).';
