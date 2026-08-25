-- Complete the wishlist item's "internal reference" trio.
--
-- wishlistItemSchema accepts three mutually-exclusive internal references —
-- product_id, service_id, asset_id. Two of them are columns with an index and a
-- FK; asset_id has never existed anywhere: not a column, not an index, not in
-- any migration, and referenced by no code outside that one schema line.
--
-- It is therefore currently a trap rather than a feature: the schema validates
-- it, so a client may legitimately send it, and PostgREST then rejects the whole
-- item payload (42703) rather than just that field.
--
-- Added rather than deleted from the schema because the sibling columns settle
-- the intent — an item can point at a product or a service, and an asset is the
-- third thing this platform sells. Mirrors product_id/service_id exactly:
-- nullable uuid, ON DELETE SET NULL (a deleted asset must not delete someone's
-- wishlist item), and the matching index, since these columns exist to be
-- looked up by.

ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS asset_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_items_asset_id_fkey'
  ) THEN
    ALTER TABLE ONLY public.wishlist_items
      ADD CONSTRAINT wishlist_items_asset_id_fkey
      FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wishlist_items_asset_id
  ON public.wishlist_items USING btree (asset_id);

COMMENT ON COLUMN public.wishlist_items.asset_id IS
  'Optional internal reference to an asset, mutually exclusive with product_id/service_id. Completes the trio wishlistItemSchema has always accepted.';
