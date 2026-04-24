-- Add indexes for unindexed foreign key columns.
-- FK columns without indexes cause sequential scans on JOIN operations and
-- ON DELETE CASCADE enforcement. These are low-risk additive changes.

-- conversations: last_message_sender_id referenced on profile lookups
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_sender_id
  ON public.conversations (last_message_sender_id);

-- contributions: payment_intent_id for payment lookup joins
CREATE INDEX IF NOT EXISTS idx_contributions_payment_intent_id
  ON public.contributions (payment_intent_id);

-- investments: wallet_id for wallet join queries
CREATE INDEX IF NOT EXISTS idx_investments_wallet_id
  ON public.investments (wallet_id);

-- orders: shipping_address_id for fulfillment/shipping queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id
  ON public.orders (shipping_address_id);

-- wishlist_items: product_id and service_id for linked entity lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id
  ON public.wishlist_items (product_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_service_id
  ON public.wishlist_items (service_id);
