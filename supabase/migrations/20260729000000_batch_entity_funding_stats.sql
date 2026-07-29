-- Batch variant of get_entity_funding_stats (20260723000000): settled funding
-- totals for MANY entities in one call, so list surfaces (search cards,
-- trending, profile tabs, favorites) can show honest ledger-derived figures
-- without an N+1 RPC per card.
--
-- Identical visibility semantics to the single-entity function: an entity
-- contributes rows ONLY if its primary wallet link exists and is not private
-- (the scalar subquery yields NULL when there is no primary link, and
-- NULL <> 'private' is NULL, which excludes the row). Totals come exclusively
-- from the settled `contributions` ledger — never from cached balances.

CREATE OR REPLACE FUNCTION get_entities_funding_stats(
  p_entity_type text,
  p_entity_ids uuid[]
)
RETURNS TABLE (
  entity_id uuid,
  total_btc numeric,
  contributor_count bigint,
  named_supporter_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.entity_id,
    COALESCE(SUM(c.amount_btc), 0)::numeric AS total_btc,
    COUNT(*)::bigint AS contributor_count,
    COUNT(*) FILTER (WHERE c.is_anonymous = false)::bigint AS named_supporter_count
  FROM contributions c
  JOIN payment_intents pi ON pi.id = c.payment_intent_id
  WHERE c.entity_type = p_entity_type
    AND c.entity_id = ANY(p_entity_ids)
    AND pi.status = 'paid'
    AND (
      SELECT ew.visibility
      FROM entity_wallets ew
      WHERE ew.entity_type = c.entity_type
        AND ew.entity_id = c.entity_id
        AND ew.is_primary = true
      ORDER BY ew.created_at
      LIMIT 1
    ) <> 'private'
  GROUP BY c.entity_id;
$$;

GRANT EXECUTE ON FUNCTION get_entities_funding_stats(text, uuid[]) TO anon, authenticated;
